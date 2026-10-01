import { stock } from "@/lib/mock-data";

export type InventoryItem = (typeof stock)[number];

type InventoryState = {
  items: InventoryItem[];
  receivedBatchIds: string[];
};

type ReceivedPurchaseItem = {
  code: string;
  material: string;
  quantity: number;
  unit: string;
};

const inventoryStorageKey = "cellarium-inventory-state";

function parseInventoryState(snapshot: string): InventoryState {
  if (!snapshot) return { items: stock, receivedBatchIds: [] };
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (typeof parsed !== "object" || parsed === null || !("items" in parsed) || !Array.isArray(parsed.items)) {
      return { items: stock, receivedBatchIds: [] };
    }
    const items = parsed.items.filter((item): item is InventoryItem =>
      typeof item === "object" && item !== null &&
      "name" in item && typeof item.name === "string" &&
      "code" in item && typeof item.code === "string" &&
      "quantity" in item && typeof item.quantity === "number" &&
      "minimum" in item && typeof item.minimum === "number" &&
      "unit" in item && typeof item.unit === "string" &&
      "category" in item && typeof item.category === "string" &&
      "specification" in item && typeof item.specification === "string",
    );
    const receivedBatchIds = "receivedBatchIds" in parsed && Array.isArray(parsed.receivedBatchIds)
      ? parsed.receivedBatchIds.filter((id): id is string => typeof id === "string")
      : [];
    return { items, receivedBatchIds };
  } catch {
    return { items: stock, receivedBatchIds: [] };
  }
}

function readInventoryState() {
  return parseInventoryState(window.localStorage.getItem(inventoryStorageKey) ?? "");
}

export function getInventoryItems() {
  return readInventoryState().items;
}

export function subscribeToInventory(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("cellarium-inventory-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cellarium-inventory-updated", callback);
  };
}

export function receiveInventoryPurchase(batchId: string, purchases: ReceivedPurchaseItem[]) {
  const state = readInventoryState();
  if (state.receivedBatchIds.includes(batchId)) return;

  const items = state.items.map((item) => ({ ...item }));
  for (const purchase of purchases) {
    const code = purchase.code.trim();
    const matchIndex = items.findIndex((item) =>
      (code && item.code === code) || item.name.toLocaleLowerCase("pt-BR") === purchase.material.toLocaleLowerCase("pt-BR"),
    );
    if (matchIndex >= 0) {
      items[matchIndex] = { ...items[matchIndex], quantity: items[matchIndex].quantity + purchase.quantity };
      continue;
    }
    items.push({
      name: purchase.material,
      code: code || `COMP-${batchId}-${items.length + 1}`,
      quantity: purchase.quantity,
      minimum: 1,
      unit: purchase.unit,
      category: "Compras recebidas",
      specification: `Recebido no pedido ${batchId}`,
    });
  }

  window.localStorage.setItem(inventoryStorageKey, JSON.stringify({
    items,
    receivedBatchIds: [...state.receivedBatchIds, batchId],
  }));
  window.dispatchEvent(new Event("cellarium-inventory-updated"));
}