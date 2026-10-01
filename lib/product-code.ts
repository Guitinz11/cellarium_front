import { materialsCatalog } from "@/lib/mock-data";

function normalizeCode(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function findScannedMaterial(rawValue: string) {
  const candidates = [rawValue.trim()];
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (typeof parsed === "object" && parsed !== null) {
      for (const key of ["code", "codigo", "productCode", "materialCode", "material"]) {
        const value = (parsed as Record<string, unknown>)[key];
        if (typeof value === "string") candidates.push(value);
        if (typeof value === "number" && Number.isFinite(value)) candidates.push(String(value));
      }
    }
  } catch {
    // QR contents can be a plain product code or URL.
  }
  try {
    const url = new URL(rawValue);
    for (const key of ["code", "codigo", "productCode", "materialCode", "material"]) {
      const value = url.searchParams.get(key);
      if (value) candidates.push(value);
    }
    const pathCode = url.pathname.split("/").filter(Boolean).at(-1);
    if (pathCode) candidates.push(decodeURIComponent(pathCode));
  } catch {
    // The scanned value is not a URL.
  }
  const normalizedCandidates = candidates.map(normalizeCode);
  return materialsCatalog.find((item) => normalizedCandidates.includes(normalizeCode(item.code)) || normalizedCandidates.includes(normalizeCode(item.name)));
}