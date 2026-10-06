export type RequestRecord = {
  id: string;
  order: string;
  requester: string;
  sector: string;
  date: string;
  status: string;
  items: string;
  employeeCode?: string;
  shift?: string;
  notes?: string;
  deliveryConfirmed?: boolean;
};

export function getAllRequests(): RequestRecord[] {
  return [];
}

export function getServerRequests(): RequestRecord[] {
  return [];
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
  void request;
}
export function updateRequestStatus(id: string, status: string, leftovers?: string) {
  void id;
  void status;
  void leftovers;
}

export function confirmRequestDelivery(id: string) {
  void id;
  return false;
}
