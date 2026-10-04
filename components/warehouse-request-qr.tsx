"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, QrCode } from "lucide-react";
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
  const [checking, setChecking] = useState(false);
  const handled = useRef(false);
  useDialogAccessibility(scannerOpen, () => setScannerOpen(false));

  async function openRequest(value: string) {
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
        return;
      }
      throw new ApiError("QR Code inválido ou requisição já concluída.", 404);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível validar o código.");
    } finally {
      setChecking(false);
    }
  }

  const openRequestEvent = useEffectEvent(openRequest);

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
          void openRequestEvent(value).then(() => setScannerOpen(false)).finally(() => { handled.current = false; });
        },
        () => undefined,
      ).catch((cause: unknown) => {
        if (disposed) return;
        const name = cause instanceof Error ? cause.name : "";
        setError(name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "Permita o acesso à câmera no navegador para ler o QR Code."
          : name === "NotFoundError" || name === "DevicesNotFoundError"
            ? "Nenhuma câmera foi encontrada. Digite o número da requisição."
            : "Não foi possível iniciar a câmera. Confira a permissão ou informe o código manualmente.");
      });
    }).catch(() => {
      if (!disposed) setError("Não foi possível carregar o leitor. Digite o código manualmente.");
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
        <div className="flex flex-col gap-2 sm:flex-row"><Button type="submit" loading={checking} disabled={checking}>Abrir detalhe</Button><Button type="button" variant="secondary" onClick={() => { handled.current = false; setError(""); setScannerOpen(true); }}><QrCode size={16}/>Ler com a câmera</Button></div>
      </form>
      {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs leading-5 text-rose-800"><AlertTriangle size={15} className="mt-0.5 shrink-0"/>{error}</p>}
    </section>
    {scannerOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setScannerOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="warehouse-qr-title" className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="warehouse-qr-title" className="text-lg font-bold text-slate-900">Ler QR da requisição</h2><p className="mt-1 text-sm text-slate-500">Aponte a câmera para o código da requisição.</p></div><button type="button" aria-label="Fechar leitor" onClick={() => setScannerOpen(false)} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Fechar</button></div><div id="warehouse-request-qr-reader" className="mt-5 min-h-64 overflow-hidden rounded-lg bg-slate-950"/><p className="mt-3 text-center text-xs text-slate-500">A câmera pode exigir acesso por HTTPS.</p></section></div>}
  </>;
}
