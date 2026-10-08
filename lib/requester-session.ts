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
  return window.sessionStorage.getItem(employeeCodeKey) ?? "";
}

export function getRequesterSector(): string {
  return window.sessionStorage.getItem(employeeSectorKey) ?? "";
}

export function getUserRole(): string {
  return window.sessionStorage.getItem("cellarium-user-role") ?? "";
}

export function getServerRequesterValue(): string {
  return "";
}
