"use client";

import { useEffect, useRef, useState } from "react";
import { Check, QrCode, X } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { useDialogAccessibility } from "@/components/use-dialog-accessibility";
import { findScannedApiMaterial } from "@/lib/product-code";
import type { ApiMaterial } from "@/lib/warehouse-api";

type MaterialWithStock = ApiMaterial & { saldo: number; unidade: string };

export default function ApiProductQrPicker({
  materials,
  onSelect,
}: {
  materials: MaterialWithStock[];
  onSelect: (material: MaterialWithStock) => void;
}) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [productCode, setProductCode] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanStatus, setScanStatus] = useState("Aponte a câmera para o QR Code do produto.");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithStock | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const handledScan = useRef(false);
  const materialsRef = useRef(materials);
  const onSelectRef = useRef(onSelect);
  const processCodeRef = useRef<(value: string) => void>(() => undefined);

  useDialogAccessibility(scannerOpen, () => setScannerOpen(false));
  useDialogAccessibility(Boolean(selectedMaterial), () => setSelectedMaterial(null));

  useEffect(() => {
    materialsRef.current = materials;
    onSelectRef.current = onSelect;
  }, [materials, onSelect]);

  function processCode(value: string) {
    if (handledScan.current) return;
    const material = findScannedApiMaterial(value, materialsRef.current);
    if (!material) {
      setScanError(`O código "${value.trim()}" não corresponde a um material cadastrado. Confira o código ou peça o cadastro do produto.`);
      return;
    }
    const materialWithStock = materialsRef.current.find((item) => item.id === material.id);
    if (!materialWithStock) return;

    handledScan.current = true;
    onSelectRef.current(materialWithStock);
    setSelectedMaterial(materialWithStock);
    setScanError("");
    setScannerOpen(false);
  }

  useEffect(() => {
    processCodeRef.current = processCode;
  });

  useEffect(() => {
    if (!scannerOpen) return;
    let disposed = false;
    let scanner: Html5Qrcode | undefined;

    void (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (disposed) return;
        const reader = document.getElementById("api-product-qr-reader");
        if (!reader) return;
        scanner = new Html5Qrcode(reader.id);
        const config = { fps: 12, qrbox: { width: 240, height: 240 } };
        const onDecoded = (value: string) => processCodeRef.current(value);
        try {
          await scanner.start({ facingMode: "environment" }, config, onDecoded, () => undefined);
        } catch (cameraError) {
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras.length) throw cameraError;
          const rearCamera = [...cameras].reverse().find((camera) => /back|rear|environment|traseira|posterior/i.test(camera.label));
          await scanner.start(rearCamera?.id ?? cameras[cameras.length - 1].id, config, onDecoded, () => undefined);
        }
        if (disposed) {
          if (scanner.isScanning) await scanner.stop();
          return;
        }
        setCameraError(false);
        setScanStatus("Câmera ativa. Aponte para o QR Code do produto.");
      } catch {
        if (disposed) return;
        setCameraError(true);
        setScanStatus("Câmera indisponível. Digite o código impresso na etiqueta.");
      }
    })();

    return () => {
      disposed = true;
      if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
    };
  }, [scannerOpen]);

  function openScanner() {
    handledScan.current = false;
    setSelectedMaterial(null);
    setProductCode("");
    setScanError("");
    setCameraError(false);
    setScanStatus("Aponte a câmera para o QR Code do produto.");
    setScannerOpen(true);
  }

  return <>
    <button type="button" onClick={openScanner} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <QrCode size={16} />Solicitar via QR Code
    </button>
    {scannerOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setScannerOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="api-product-scanner-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-wide text-blue-800">Solicitação de materiais</p><h2 id="api-product-scanner-title" className="mt-1 text-lg font-bold text-slate-900">Ler produto</h2><p className="mt-1 text-xs leading-5 text-slate-500">Escaneie o QR Code ou digite o código impresso na etiqueta.</p></div><button type="button" aria-label="Fechar leitor" onClick={() => setScannerOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div>
        <div id="api-product-qr-reader" className="mt-5 min-h-64 overflow-hidden rounded-lg bg-slate-950"/>
        <p className="mt-3 text-center text-xs text-slate-500" aria-live="polite">{scanStatus}</p>
        {cameraError && <p role="status" className="mt-2 rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-900">Permita o acesso à câmera ou informe o código manualmente.</p>}
        {scanError && <p role="alert" className="mt-2 rounded-md bg-rose-50 p-3 text-xs leading-5 text-rose-800">{scanError}</p>}
        <form onSubmit={(event) => { event.preventDefault(); processCode(productCode); }} className="mt-4 border-t border-slate-100 pt-4"><label className="mb-2 block text-xs font-semibold text-slate-700" htmlFor="api-manual-product-code">Código do produto</label><div className="flex gap-2"><input id="api-manual-product-code" value={productCode} onChange={(event) => { setProductCode(event.target.value); setScanError(""); }} placeholder="Ex.: 6687" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-800"/><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-800 px-3 text-sm font-semibold text-white hover:bg-blue-900"><Check size={15}/>Adicionar</button></div></form>
      </section>
    </div>}
    {selectedMaterial && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4"><section role="dialog" aria-modal="true" aria-labelledby="api-product-added-title" className={`w-full max-w-md rounded-lg border bg-white p-6 shadow-2xl ${selectedMaterial.saldo > 0 ? "border-emerald-200" : "border-amber-200"}`}><span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${selectedMaterial.saldo > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}><Check size={22}/></span><h2 id="api-product-added-title" className="mt-4 text-center text-lg font-bold text-slate-900">{selectedMaterial.saldo > 0 ? "Produto adicionado" : "Produto encontrado sem saldo"}</h2><p className="mt-2 text-center text-sm font-semibold text-slate-800">{selectedMaterial.descricao}</p><p className="mt-1 text-center font-mono text-xs text-slate-500">{selectedMaterial.codigo}</p><p className="mt-3 text-center text-xs leading-5 text-slate-600">{selectedMaterial.saldo > 0 ? `Saldo disponível: ${selectedMaterial.saldo} ${selectedMaterial.unidade}. Informe a quantidade no catálogo.` : "O produto foi localizado e aberto no catálogo, mas não pode ser requisitado enquanto estiver sem saldo."}</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={openScanner} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white hover:bg-blue-900"><QrCode size={16}/>Ler outro produto</button><button type="button" onClick={() => setSelectedMaterial(null)} className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Voltar ao catálogo</button></div></section></div>}
  </>;
}