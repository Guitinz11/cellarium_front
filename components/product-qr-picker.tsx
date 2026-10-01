"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, QrCode, X } from "lucide-react";
import type { materialsCatalog } from "@/lib/mock-data";
import { findScannedMaterial } from "@/lib/product-code";

type CatalogMaterial = (typeof materialsCatalog)[number];
type ProductQrPickerProps = {
  onSelect: (material: CatalogMaterial) => void;
  purpose?: "requisition" | "purchase";
};

export default function ProductQrPicker({ onSelect, purpose = "requisition" }: ProductQrPickerProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [productCode, setProductCode] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanStatus, setScanStatus] = useState("Aponte a câmera para o QR Code do produto.");
  const [selectedMaterial, setSelectedMaterial] = useState<CatalogMaterial | null>(null);
  const handledScan = useRef(false);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const selectProduct = useCallback((rawValue: string) => {
    if (handledScan.current) return;
    const material = findScannedMaterial(rawValue);
    if (!material) {
      setScanError(`O código "${rawValue.trim()}" não corresponde a um produto cadastrado.`);
      return;
    }
    if (purpose === "requisition" && material.quantity <= 0) {
      setScanError(`${material.name} está indisponível no estoque e não pode ser adicionado à requisição.`);
      return;
    }
    handledScan.current = true;
    onSelectRef.current(material);
    setScannerOpen(false);
    if (purpose === "requisition") setSelectedMaterial(material);
  }, [purpose]);

  useEffect(() => {
    if (!scannerOpen) return;
    let disposed = false;
    let scanner: import("html5-qrcode").Html5Qrcode | undefined;

    void import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (disposed) return;
      scanner = new Html5Qrcode("employee-product-qr-reader");
      return scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decodedText) => selectProduct(decodedText),
        () => undefined,
      ).then(() => setScanStatus("Aponte a câmera para o QR Code do produto."));
    }).catch((error: unknown) => {
      setScanError(error instanceof Error ? error.message : "Não foi possível iniciar a câmera.");
      setScanStatus("Digite o código do produto se a câmera não estiver disponível.");
    });

    return () => {
      disposed = true;
      if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
    };
  }, [scannerOpen, selectProduct]);

  function openScanner() {
    handledScan.current = false;
    setSelectedMaterial(null);
    setProductCode("");
    setScanError("");
    setScanStatus("Aponte a câmera para o QR Code do produto.");
    setScannerOpen(true);
  }

  return <>
    <button type="button" onClick={openScanner} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-[#0B57D0] shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><QrCode size={16}/>Solicitar via QR</button>
    {scannerOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setScannerOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="employee-product-scanner-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wide text-[#0B57D0]">{purpose === "purchase" ? "Reposição de estoque" : "Solicitação de materiais"}</p><h2 id="employee-product-scanner-title" className="mt-1 text-lg font-bold text-slate-900">Escanear produto</h2><p className="mt-1 text-xs leading-5 text-slate-500">{purpose === "purchase" ? "O produto lido será enviado ao setor de Compras." : "O produto lido será adicionado à sua requisição."}</p></div><button type="button" aria-label="Fechar leitor" onClick={() => setScannerOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div><div id="employee-product-qr-reader" className="mt-5 min-h-64 overflow-hidden rounded-lg bg-slate-950"/><p className="mt-3 text-center text-xs text-slate-500">{scanStatus}</p>{scanError && <p role="alert" className="mt-2 rounded-md bg-rose-50 p-3 text-xs leading-5 text-rose-800">{scanError}</p>}<form onSubmit={(event) => { event.preventDefault(); selectProduct(productCode); }} className="mt-4 border-t border-slate-100 pt-4"><label className="mb-2 block text-xs font-semibold text-slate-700" htmlFor="employee-manual-product-code">Ou informe o código do produto</label><div className="flex gap-2"><input id="employee-manual-product-code" value={productCode} onChange={(event) => { setProductCode(event.target.value); setScanError(""); }} placeholder="Ex.: 6687" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-800"/><button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0B57D0] px-4 text-sm font-semibold text-white transition hover:bg-blue-800">Adicionar</button></div></form></section></div>}
    {selectedMaterial && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4"><section role="dialog" aria-modal="true" aria-labelledby="product-added-title" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Check size={22}/></span><h2 id="product-added-title" className="mt-4 text-center text-lg font-bold text-slate-900">Produto adicionado</h2><p className="mt-2 text-center text-sm font-semibold text-slate-800">{selectedMaterial.name}</p><p className="mt-1 text-center font-mono text-xs text-slate-500">{selectedMaterial.code}</p><p className="mt-5 text-center text-sm text-slate-700">Escanear outro produto?</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={openScanner} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0B57D0] px-4 text-sm font-semibold text-white transition hover:bg-blue-800"><QrCode size={16}/>Escanear outro produto</button><button type="button" onClick={() => setSelectedMaterial(null)} className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Continuar solicitação</button></div></section></div>}
  </>;
}