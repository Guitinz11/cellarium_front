export type SectorNotice = {
  id: string;
  code: string;
  itemName: string;
  sector: string;
  text: string;
  createdAt: number;
};

const sectorStockStorageKey = "marcon-sector-stock-v2";
const initialNotices: SectorNotice[] = [
  {
    id: "notice-initial",
    code: "CS-001",
    itemName: "Arame de Solda MIG/MAG Solid ER70S-6 - 1.2mm",
    sector: "Montagem e Pintura",
    text: "O material já está disponível no estoque do seu setor.",
    createdAt: new Date("2026-09-25T11:30:00.000Z").getTime(),
  },
];

function isSectorNotice(value: unknown): value is SectorNotice {
  return typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "string" &&
    "code" in value && typeof value.code === "string" &&
    "itemName" in value && typeof value.itemName === "string" &&
    "sector" in value && typeof value.sector === "string" &&
    "text" in value && typeof value.text === "string" &&
    "createdAt" in value && typeof value.createdAt === "number";
}

export function getSectorNoticesSnapshot() {
  return localStorage.getItem(sectorStockStorageKey) ?? "";
}

export function getServerSectorNoticesSnapshot() {
  return "";
}

export function subscribeToSectorNotices(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("marcon-sector-stock-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("marcon-sector-stock-change", callback);
  };
}

export function parseSectorNotices(snapshot: string) {
  if (!snapshot) return initialNotices;
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (typeof parsed !== "object" || parsed === null || !("messages" in parsed) || !Array.isArray(parsed.messages)) return [];
    return parsed.messages.filter(isSectorNotice);
  } catch {
    return [];
  }
}

function getReadKey(scope: string) {
  return `cellarium-read-notifications:${scope}`;
}

export function getReadNotificationsSnapshot(scope: string) {
  return localStorage.getItem(getReadKey(scope)) ?? "[]";
}

export function getServerReadNotificationsSnapshot() {
  return "[]";
}

export function parseReadNotificationIds(snapshot: string) {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function subscribeToReadNotifications(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("cellarium-notifications-read", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cellarium-notifications-read", callback);
  };
}

export function markNotificationAsRead(scope: string, id: string) {
  const key = getReadKey(scope);
  const current = parseReadNotificationIds(localStorage.getItem(key) ?? "[]");
  if (current.includes(id)) return;
  localStorage.setItem(key, JSON.stringify([...current, id]));
  window.dispatchEvent(new Event("cellarium-notifications-read"));
}