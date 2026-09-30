export interface PurchaseItemInput {
  material: string;
  code: string;
  quantity: number;
  unit: string;
}

export interface PurchaseRequestRecord extends PurchaseItemInput {
  id: string;
  batchId: string;
  requestId?: string;
  order?: string;
  sector?: string;
  requester?: string;
  reason: string;
  createdAt: string;
  status: string;
}

interface PurchaseBatchInput {
  items: PurchaseItemInput[];
  requestId?: string;
  order?: string;
  sector?: string;
  requester?: string;
  reason: string;
}

const purchaseRequestsKey = "cellarium-purchase-requests";

export function getPurchaseRequests(): PurchaseRequestRecord[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(purchaseRequestsKey) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((item): PurchaseRequestRecord[] => {
      if (typeof item !== "object" || item === null ||
        typeof item.id !== "string" || typeof item.batchId !== "string" ||
        typeof item.material !== "string" || typeof item.quantity !== "number" && typeof item.quantity !== "string" ||
        typeof item.unit !== "string" || typeof item.reason !== "string" ||
        typeof item.createdAt !== "string" || typeof item.status !== "string") return [];
      const quantity = Number(item.quantity);
      return Number.isFinite(quantity) ? [{ ...item, quantity } as PurchaseRequestRecord] : [];
    });
  } catch {
    return [];
  }
}

export function createPurchaseRequestBatch(input: PurchaseBatchInput): string {
  const saved = getPurchaseRequests();
  const batchId = `COMP-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const newRequests: PurchaseRequestRecord[] = input.items.map((item, index) => ({
    ...item,
    id: `${batchId}-${index + 1}`,
    batchId,
    ...(input.requestId ? { requestId: input.requestId } : {}),
    ...(input.order ? { order: input.order } : {}),
    ...(input.sector ? { sector: input.sector } : {}),
    ...(input.requester ? { requester: input.requester } : {}),
    reason: input.reason,
    createdAt,
    status: "Pendente",
  }));

  window.localStorage.setItem(purchaseRequestsKey, JSON.stringify([...newRequests, ...saved]));
  window.dispatchEvent(new Event("cellarium-purchase-requests-updated"));
  return batchId;
}

export function findPurchaseBatchForRequestItem(requestId: string, code: string): string | undefined {
  return getPurchaseRequests().find((request) => request.requestId === requestId && request.code === code)?.batchId;
}