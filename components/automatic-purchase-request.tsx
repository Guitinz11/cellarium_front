"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QrCode, ShoppingCart, X } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { materialsCatalog } from "@/lib/mock-data";
import { createPurchaseRequestBatch, findPurchaseBatchForRequestItem } from "@/lib/purchase-storage";
import { findScannedMaterial } from "@/lib/product-code";
import { getAllRequests } from "@/lib/request-storage";
import { useDialogAccessibility } from "@/components/use-dialog-accessibility";

interface AutomaticPurchaseRequestProps {
  requestId: string;
  sector?: string;
}

function parseItems(items: string) {
  return items.split(/;\s*/).filter(Boolean).map((entry) => {
    const match = entry.match(/^(.*?)\s*·\s*(\d+(?:[,.]\d+)?)\s*(.*)$/);
    const material = match?.[1]?.trim() ?? entry.trim();
    const catalogItem = materialsCatalog.find((item) => item.name.toLocaleLowerCase("pt-BR") === material.toLocaleLowerCase("pt-BR"));
    return {
      material,
      code: catalogItem?.code ?? "",
      quantity: Number(match?.[2]?.replace(",", ".") ?? 1),
      unit: match?.[3]?.trim() || catalogItem?.unit || "un.",
    };
  });
}

export default function AutomaticPurchaseRequest({ requestId, sector }: AutomaticPurchaseRequestProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [productCode, setProductCode] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanStatus, setScanStatus] = useState("Aponte a câmera para o QR Code do produto.");
  const [purchase, setPurchase] = useState<{ material: string; quantity: number; unit: string; batchId: string; alreadyRequested: boolean } | null>(null);
  const handledScan = useRef(false);
  useDialogAccessibility(scannerOpen, () => setScannerOpen(false));
  useDialogAccessibility(Boolean(purchase), () => setPurchase(null));
  const processCodeRef = useRef<(value: string) => void>(() => {});

  const processProductCode = useCallback((value: string) => {
    if (handledScan.current) return;
    const material = findScannedMaterial(value);
    if (!material) {
      setScanError(`O código "${value.trim()}" não corresponde a um produto do catálogo.`);
      return;
    }
    const request = getAllRequests().find((item) => item.id === requestId);
    if (!request) {
      setScanError("Não foi possível localizar a requisição selecionada.");
      return;
    }

    handledScan.current = true;
    const requestedLine = parseItems(request.items).find((item) => item.code === material.code);
    const quantity = requestedLine?.quantity ?? Math.max(material.minimum - material.quantity, 1);
    const existingBatch = findPurchaseBatchForRequestItem(requestId, material.code);
    const batchId = existingBatch ?? createPurchaseRequestBatch({
      items: [{ material: material.name, code: material.code, quantity, unit: requestedLine?.unit ?? material.unit }],
      requestId,
      order: request.order,
      sector: sector ?? request.sector,
      requester: request.requester,
      reason: "Reposição de estoque solicitada pela leitura do QR Code do produto.",
    });
    setPurchase({ material: material.name, quantity, unit: requestedLine?.unit ?? material.unit, batchId, alreadyRequested: Boolean(existingBatch) });
    setScannerOpen(false);
  }, [requestId, sector]);

  useEffect(() => {
    processCodeRef.current = processProductCode;
  }, [processProductCode]);

  useEffect(() => {
    if (!scannerOpen) return;
    let disposed = false;
    let scanner: Html5Qrcode | undefined;

    void import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (disposed) return;
      scanner = new Html5Qrcode("purchase-product-qr-reader");
      return scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decodedText) => processCodeRef.current(decodedText),
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
  }, [scannerOpen]);

  function openScanner() {
    handledScan.current = false;
    setPurchase(null);
    setProductCode("");
    setScanError("");
    setScanStatus("Aponte a câmera para o QR Code do produto.");
    setScannerOpen(true);
  }
  function processProductCodeInput(value: string) {
    processCodeRef.current(value);
  }

  return <>
    <button type="button" onClick={openScanner} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong"><QrCode size={16}/>Solicitar via QR</button>
    {scannerOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setScannerOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="product-scanner-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Separação · {requestId}</p><h2 id="product-scanner-title" className="mt-1 text-lg font-bold text-slate-900">Escanear produto</h2><p className="mt-1 text-xs leading-5 text-slate-500">A leitura do código cadastrado envia automaticamente o produto para Compras.</p></div><button type="button" aria-label="Fechar leitor" onClick={() => setScannerOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div><div id="purchase-product-qr-reader" className="mt-5 min-h-64 overflow-hidden rounded-lg bg-slate-950"/><p className="mt-3 text-center text-xs text-slate-500">{scanStatus}</p>{scanError && <p role="alert" className="mt-2 rounded-md bg-rose-50 p-3 text-xs leading-5 text-rose-800">{scanError}</p>}<form onSubmit={(event) => { event.preventDefault(); processProductCodeInput(productCode); }} className="mt-4 border-t border-slate-100 pt-4"><label className="mb-2 block text-xs font-semibold text-slate-700" htmlFor="manual-product-code">Ou informe o código do produto</label><div className="flex gap-2"><input id="manual-product-code" value={productCode} onChange={(event) => { setProductCode(event.target.value); setScanError(""); }} placeholder="Ex.: CS-012" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-800"/><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"><ShoppingCart size={15}/>Pedir</button></div></form></section></div>}
    {purchase && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4"><section role="dialog" aria-modal="true" aria-labelledby="purchase-confirmation-title" className="w-full max-w-md rounded-xl border border-emerald-200 bg-white p-6 text-center shadow-2xl"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><ShoppingCart size={20}/></span><p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-emerald-700">Setor de Compras</p><h2 id="purchase-confirmation-title" className="mt-1 text-lg font-bold text-slate-900">{purchase.alreadyRequested ? "Produto já solicitado" : "Produto enviado para Compras"}</h2><p className="mt-2 text-sm font-semibold text-slate-800">{purchase.material}</p><p className="mt-1 text-xs text-slate-500">Quantidade: {purchase.quantity} {purchase.unit} · {requestId}</p><p className="mt-4 font-mono text-xs text-slate-500">Pedido {purchase.batchId}</p><button type="button" onClick={() => setPurchase(null)} className="mt-5 min-h-10 w-full rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">Concluir</button></section></div>}
  </>;
}

