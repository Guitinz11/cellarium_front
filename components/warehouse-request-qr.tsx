"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, Camera, Check, QrCode, X } from "lucide-react";
import { Button, PageHeading } from "@/components/ui";
import { useDialogAccessibility } from "@/components/use-dialog-accessibility";
import {
  ApiError,
  getAccessToken,
  getRequestDetail,
  resolveRequestId,
} from "@/lib/warehouse-api";
import type { Html5Qrcode } from "html5-qrcode";

function candidatesFromCode(value: string) {
  const candidates = [value.trim()];
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      const object = parsed as Record<string, unknown>;
      for (const key of ["request", "requestId", "id", "code", "codigo"]) {
        if (typeof object[key] === "string" || typeof object[key] === "number") candidates.push(String(object[key]));
      }
    }
  } catch {
    // O QR pode conter apenas o número da requisição.
  }
  try {
    const url = new URL(value);
    for (const key of ["request", "requestId", "id", "code", "codigo"]) {
      const parameter = url.searchParams.get(key);
      if (parameter) candidates.push(parameter);
    }
    const lastPath = url.pathname.split("/").filter(Boolean).at(-1);
    if (lastPath) candidates.push(decodeURIComponent(lastPath));
  } catch {
    // O valor também pode ser um código simples, sem URL.
  }
  return [...new Set(candidates.filter(Boolean))];
}

export default function WarehouseRequestQr() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scannerStatus, setScannerStatus] = useState("Preparando a câmera…");
  const [scannerReady, setScannerReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const handled = useRef(false);
  useDialogAccessibility(scannerOpen, () => setScannerOpen(false));

  async function openRequest(value: string): Promise<boolean> {
    setChecking(true);
    setError("");
    try {
      if (!getAccessToken()) {
        throw new ApiError("Entre no sistema para consultar requisições do banco.", 401);
      }
      for (const candidate of candidatesFromCode(value)) {
        const id = await resolveRequestId(candidate);
        if (id === null) continue;
        const request = await getRequestDetail(String(id));
        if (["ATENDIDA", "CANCELADA"].includes(request.status)) continue;
        router.push(`/separacao?request=${encodeURIComponent(request.id)}`);
        return true;
      }
      throw new ApiError("QR Code inválido ou requisição já concluída.", 404);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Não foi possível validar o código.";
      setError(message);
      if (scannerOpen) setScannerError(message);
      return false;
    } finally {
      setChecking(false);
    }
  }

  const openRequestEvent = useEffectEvent(openRequest);

  function openScanner() {
    handled.current = false;
    setScannerReady(false);
    setScannerError("");
    setScannerStatus("Solicitando acesso à câmera…");
    setError("");
    setScannerOpen(true);
  }

  useEffect(() => {
    if (!scannerOpen) return;
    let disposed = false;
    let scanner: Html5Qrcode | undefined;
    void import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (disposed) return;
      scanner = new Html5Qrcode("warehouse-request-qr-reader");
      return scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (value) => {
          if (handled.current) return;
          handled.current = true;
          setScannerStatus("Código identificado. Validando requisição…");
          void openRequestEvent(value).then((opened) => {
            if (opened) setScannerOpen(false);
            else setScannerStatus("Não foi possível abrir. Tente outro código.");
          }).finally(() => { handled.current = false; });
        },
        () => undefined,
      ).then(() => {
        if (disposed) {
          if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
          return;
        }
        setScannerReady(true);
        setScannerStatus("Câmera ativa · enquadre o QR Code dentro da área.");
      }).catch((cause: unknown) => {
        if (disposed) return;
        const name = cause instanceof Error ? cause.name : "";
        const message = name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "Permita o acesso à câmera no navegador para ler o QR Code."
          : name === "NotFoundError" || name === "DevicesNotFoundError"
            ? "Nenhuma câmera foi encontrada. Digite o número da requisição."
            : "Não foi possível iniciar a câmera. Confira a permissão ou informe o código manualmente.";
        setScannerError(message);
        setScannerStatus("Leitor indisponível");
      });
    }).catch(() => {
      if (!disposed) {
        setScannerError("Não foi possível carregar o leitor. Informe o código manualmente.");
        setScannerStatus("Leitor indisponível");
      }
    });
    return () => {
      disposed = true;
      if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
    };
  }, [scannerOpen]);

  return <>
    <PageHeading eyebrow="Operação · Almoxarifado" title="Abrir requisição por QR Code" description="Leia o código da requisição ou informe o número para abrir o detalhe de separação." />
    <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-800"><QrCode size={19}/></div>
      <h2 className="mt-4 text-base font-semibold text-slate-900">Validar requisição</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">O QR pode conter o ID, o número (por exemplo, REQ-2045) ou um link direto para a requisição.</p>
      <form className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); void openRequest(code); }}>
        <label htmlFor="warehouse-request-code" className="block text-xs font-semibold text-slate-700">Código da requisição</label>
        <input id="warehouse-request-code" value={code} onChange={(event) => { setCode(event.target.value); setError(""); }} placeholder="Ex.: REQ-2045" className="h-12 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required />
        <div className="flex flex-col gap-2 sm:flex-row"><Button type="submit" loading={checking} disabled={checking}>Abrir detalhe</Button><Button type="button" variant="secondary" onClick={openScanner}><QrCode size={16}/>Ler com a câmera</Button></div>
      </form>
      {!scannerOpen && error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs leading-5 text-rose-800"><AlertTriangle size={15} className="mt-0.5 shrink-0"/>{error}</p>}
    </section>
    {scannerOpen && createPortal(<div className="warehouse-qr-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setScannerOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="warehouse-qr-title" className="warehouse-qr-dialog">
        <header className="warehouse-qr-header">
          <div className="warehouse-qr-heading">
            <span className="warehouse-qr-icon"><QrCode size={17}/></span>
            <div><p className="warehouse-qr-eyebrow">Leitor de requisição</p><h2 id="warehouse-qr-title">Escanear código</h2><p>Aponte a câmera para o QR Code da requisição.</p></div>
          </div>
          <button type="button" aria-label="Fechar leitor" onClick={() => setScannerOpen(false)} className="warehouse-qr-close"><X size={17}/><span>Fechar</span></button>
        </header>
        <div className={`warehouse-qr-frame ${scannerReady ? "is-ready" : ""}`}>
          <div id="warehouse-request-qr-reader" className="warehouse-qr-reader"/>
          {!scannerReady && <div className={`warehouse-qr-placeholder ${scannerError ? "has-error" : ""}`} role="status" aria-live="polite">
            {scannerError ? <Camera size={25}/> : <span className="warehouse-qr-spinner" aria-hidden="true"/>}
            <strong>{scannerError ? "Câmera indisponível" : "Conectando à câmera"}</strong>
            <span>{scannerError || scannerStatus}</span>
          </div>}
          {scannerReady && <span className="warehouse-qr-guide" aria-hidden="true"/>}
        </div>
        <div className="warehouse-qr-status" aria-live="polite"><span className={scannerReady ? "is-active" : ""}/>{scannerStatus}</div>
        {scannerError && <p role="alert" className="warehouse-qr-error"><AlertTriangle size={16}/>{scannerError}</p>}
        <form className="warehouse-qr-manual" onSubmit={(event) => { event.preventDefault(); setScannerOpen(false); void openRequest(code); }}>
          <label htmlFor="warehouse-qr-manual-code">Prefere digitar o código?</label>
          <div><input id="warehouse-qr-manual-code" value={code} onChange={(event) => { setCode(event.target.value); setError(""); }} placeholder="Ex.: REQ-2045"/><Button type="submit" loading={checking} disabled={checking || !code.trim()}><Check size={15}/>Abrir requisição</Button></div>
        </form>
        <p className="warehouse-qr-hint">O acesso à câmera requer permissão do navegador e conexão HTTPS.</p>
      </section>
    </div>, document.body)}
  </>;
}
