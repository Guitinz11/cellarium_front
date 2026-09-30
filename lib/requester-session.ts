const employeeCodeKey = "cellarium-requester-code";
const employeeSectorKey = "cellarium-requester-sector";

export function subscribeToRequesterSession(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("cellarium-requester-profile-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cellarium-requester-profile-updated", callback);
  };
}

export function getRequesterCode(): string {
  return window.localStorage.getItem(employeeCodeKey) ?? "";
}

export function getRequesterSector(): string {
  return window.localStorage.getItem(employeeSectorKey) ?? "";
}

export function getServerRequesterValue(): string {
  return "";
}