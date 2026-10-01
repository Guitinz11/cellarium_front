import { requests } from "@/lib/mock-data";

export type RequestRecord = (typeof requests)[number] & {
  employeeCode?: string;
  shift?: string;
  notes?: string;
  deliveryConfirmed?: boolean;
};

const submittedRequestsKey = "cellarium-submitted-requests";
let cachedSignature = "";
let cachedRequests: RequestRecord[] = requests;

function readSubmittedRequests(): RequestRecord[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(submittedRequestsKey) ?? "[]");
    if (!Array.isArray(stored)) return [];

    return stored.filter((item): item is RequestRecord =>
      typeof item === "object" && item !== null &&
      typeof item.id === "string" &&
      typeof item.order === "string" &&
      typeof item.requester === "string" &&
      typeof item.sector === "string" &&
      typeof item.date === "string" &&
      typeof item.status === "string" &&
      typeof item.items === "string",
    );
  } catch {
    return [];
  }
}

export function getAllRequests(): RequestRecord[] {
  const submittedRequests = readSubmittedRequests();
  const signature = JSON.stringify(submittedRequests);
  if (signature !== cachedSignature) {
    cachedSignature = signature;
    const submittedIds = new Set(submittedRequests.map((request) => request.id));
    cachedRequests = [...submittedRequests, ...requests.filter((request) => !submittedIds.has(request.id))];
  }
  return cachedRequests;
}

export function getServerRequests(): RequestRecord[] {
  return requests;
}

export function subscribeToRequests(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("cellarium-requests-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cellarium-requests-updated", callback);
  };
}

export function saveSubmittedRequest(request: RequestRecord) {
  window.localStorage.setItem(submittedRequestsKey, JSON.stringify([request, ...readSubmittedRequests()]));
  getAllRequests();
  window.dispatchEvent(new Event("cellarium-requests-updated"));
}
export function updateRequestStatus(id: string, status: string, leftovers?: string) {
  const current = readSubmittedRequests();
  const target = getAllRequests().find((request) => request.id === id);
  const exists = current.some((request) => request.id === id);
  const updated = current.map((request) => request.id === id ? { ...request, status, leftovers } : request);
  if (!exists && target) updated.unshift({ ...target, status, leftovers });
  window.localStorage.setItem(submittedRequestsKey, JSON.stringify(updated));
  cachedSignature = "";
  getAllRequests();
  window.dispatchEvent(new Event("cellarium-requests-updated"));
}

export function confirmRequestDelivery(id: string) {
  const current = readSubmittedRequests();
  const target = getAllRequests().find((request) => request.id === id);
  if (!target) return false;

  const exists = current.some((request) => request.id === id);
  const updated = exists
    ? current.map((request) => request.id === id ? { ...request, deliveryConfirmed: true } : request)
    : [{ ...target, deliveryConfirmed: true }, ...current];
  window.localStorage.setItem(submittedRequestsKey, JSON.stringify(updated));
  cachedSignature = "";
  getAllRequests();
  window.dispatchEvent(new Event("cellarium-requests-updated"));
  return true;
}
