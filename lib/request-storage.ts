import { requests } from "@/lib/mock-data";

export type RequestRecord = (typeof requests)[number] & {
  employeeCode?: string;
  shift?: string;
  notes?: string;
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
    cachedRequests = [...submittedRequests, ...requests];
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