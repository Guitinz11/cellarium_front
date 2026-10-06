import { materialsCatalog } from "@/lib/mock-data";

function normalizeCode(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function findScannedMaterial(rawValue: string) {
  const raw = rawValue.trim();
  if (!raw) return undefined;
  const candidates = [raw];
  const codeKeys = new Set(["code", "codigo", "productcode", "materialcode", "material", "sku", "id", "codigoproduto", "codigomaterial"]);
  const addValue = (value: unknown) => {
    if (typeof value === "string" || (typeof value === "number" && Number.isFinite(value))) candidates.push(String(value));
  };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      for (const [key, value] of Object.entries(parsed)) {
        if (codeKeys.has(normalizeCode(key).replace(/[^a-z0-9]/g, ""))) addValue(value);
      }
    }
  } catch {
    // QR contents can be a plain product code or URL.
  }
  try {
    const url = new URL(raw);
    url.searchParams.forEach((value, key) => {
      if (codeKeys.has(normalizeCode(key).replace(/[^a-z0-9]/g, ""))) candidates.push(value);
    });
    for (const segment of url.pathname.split("/").filter(Boolean)) {
      try { candidates.push(decodeURIComponent(segment)); } catch { candidates.push(segment); }
    }
  } catch {
    // The scanned value is not a URL.
  }
  // Labels often wrap the product code in descriptive text. Match whole tokens only.
  for (const candidate of [...candidates]) {
    candidates.push(...candidate.split(/[^\p{L}\p{N}-]+/u).filter(Boolean));
  }
  const normalizedCandidates = new Set(candidates.map(normalizeCode));
  return materialsCatalog.find((item) => normalizedCandidates.has(normalizeCode(item.code)) || normalizedCandidates.has(normalizeCode(item.name)));
}
