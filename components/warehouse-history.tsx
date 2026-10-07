"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { CalendarClock, Download, FileText, Package, RefreshCw, Search, UserRound } from "lucide-react";
import { Button, PageHeading } from "@/components/ui";
import {
  ApiError,
  getAccessToken,
  listAllMovements,
  type ApiMovement,
} from "@/lib/warehouse-api";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function movementType(value: string) {
  if (value === "SAIDA") return "Saída";
  if (value === "ENTRADA") return "Entrada";
  if (value === "DEVOLUCAO") return "Devolução";
  return "Ajuste";
}

type MovementEntry = { key: string; isRequest: boolean; movements: ApiMovement[] };
type ItemTotal = { material: string; quantity: number; unit: string };

function groupMovements(movements: ApiMovement[]): MovementEntry[] {
  const entries: MovementEntry[] = [];
  const requests = new Map<number, MovementEntry>();
  for (const movement of movements) {
    if (movement.tipo === "SAIDA" && movement.requisicao_id !== null) {
      const existing = requests.get(movement.requisicao_id);
      if (existing) existing.movements.push(movement);
      else {
        const entry = { key: `requisicao-${movement.requisicao_id}`, isRequest: true, movements: [movement] };
        requests.set(movement.requisicao_id, entry);
        entries.push(entry);
      }
    } else {
      entries.push({ key: `movimento-${movement.id}`, isRequest: false, movements: [movement] });
    }
  }
  return entries;
}

function totalItems(movements: ApiMovement[]): ItemTotal[] {
  const totals = new Map<string, ItemTotal>();
  for (const movement of movements) {
    const unit = movement.unidade?.trim() ?? "";
    const key = `${movement.material_id}:${unit}`;
    const current = totals.get(key);
    if (current) current.quantity += movement.quantidade;
    else totals.set(key, { material: movement.material, quantity: movement.quantidade, unit });
  }
  return [...totals.values()];
}

function fileSafeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);
}

export default function WarehouseHistory() {
  const [movements, setMovements] = useState<ApiMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [exportPeriod, setExportPeriod] = useState("30");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportNotice, setExportNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingPdfId, setExportingPdfId] = useState<number | null>(null);

  async function reload() {
    setLoading(true);
    setError("");
    try {
      if (!getAccessToken()) throw new ApiError("Entre no sistema para consultar movimentações do banco.", 401);
      const result = await listAllMovements();
      setMovements(result.dados);
    } catch (cause) {
      setMovements([]);
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as movimentações.");
    } finally {
      setLoading(false);
    }
  }

  const initialize = useEffectEvent(reload);

  useEffect(() => {
    const timer = window.setTimeout(() => void initialize(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return movements.filter((movement) => [
      movement.material,
      movement.usuario,
      movement.solicitante ?? "",
      movement.separador ?? "",
      movement.setor ?? "",
      movement.tipo,
      movement.requisicao_id ? `req-${movement.requisicao_id}` : "",
      movement.requisicao_numero ?? "",
    ].join(" ").toLocaleLowerCase("pt-BR").includes(query));
  }, [movements, search]);
  const entries = useMemo(() => groupMovements(filtered), [filtered]);

  const exportMovements = useMemo(() => {
    if (exportPeriod === "all") return filtered;
    let start: Date;
    let end: Date;
    if (exportPeriod === "custom") {
      if (!customStartDate || !customEndDate) return [];
      start = new Date(`${customStartDate}T00:00:00`);
      end = new Date(`${customEndDate}T23:59:59.999`);
    } else {
      const days = Number(exportPeriod);
      if (![15, 30, 45, 60].includes(days)) return filtered;
      end = new Date();
      start = new Date(end);
      start.setDate(start.getDate() - (days - 1));
      start.setHours(0, 0, 0, 0);
    }
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
    return filtered.filter((movement) => {
      const date = new Date(movement.data);
      return !Number.isNaN(date.getTime()) && date >= start && date <= end;
    });
  }, [filtered, exportPeriod, customStartDate, customEndDate]);

  async function exportSpreadsheet() {
    if (!exportMovements.length) return;
    setExporting(true);
    setExportError("");
    setExportNotice("");
    try {
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      workbook.creator = "Cellarium";
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet("Histórico", { views: [{ state: "frozen", ySplit: 1 }] });
      const columns = [
        { header: "Data", key: "date", width: 22 },
        { header: "Requisição", key: "request", width: 22 },
        { header: "Movimento", key: "type", width: 20 },
        { header: "Setor", key: "sector", width: 28 },
        { header: "Material", key: "material", width: 42 },
        { header: "Quantidade", key: "quantity", width: 16 },
        { header: "Unidade", key: "unit", width: 14 },
        { header: "Solicitante", key: "requester", width: 24 },
        { header: "Separador", key: "operator", width: 24 },
        { header: "Usuário", key: "user", width: 24 },
        { header: "Saldo anterior", key: "before", width: 18 },
        { header: "Saldo posterior", key: "after", width: 18 },
        { header: "Observação", key: "note", width: 42 },
      ];
      worksheet.columns = columns;
      worksheet.addRows(exportMovements.map((movement) => ({
        date: new Date(movement.data),
        request: movement.requisicao_numero ?? (movement.requisicao_id ? `REQ-${movement.requisicao_id}` : "Movimentação avulsa"),
        type: movementType(movement.tipo),
        sector: movement.setor ?? "",
        material: movement.material,
        quantity: movement.quantidade,
        unit: movement.unidade ?? "",
        requester: movement.solicitante ?? "",
        operator: movement.separador ?? "",
        user: movement.usuario,
        before: movement.estoque_anterior,
        after: movement.estoque_posterior,
        note: movement.observacao ?? "",
      })));
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF23466B" } };
      worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: exportMovements.length + 1, column: columns.length } };
      worksheet.getColumn("date").numFmt = "dd/mm/yyyy hh:mm";
      worksheet.getColumn("quantity").numFmt = "#,##0.###";
      worksheet.getColumn("before").numFmt = "#,##0.###";
      worksheet.getColumn("after").numFmt = "#,##0.###";

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `historico_movimentacoes_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportNotice(`${exportMovements.length} movimentações exportadas para Excel.`);
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : "Não foi possível gerar a planilha.");
    } finally {
      setExporting(false);
    }
  }

  async function exportRequestPdf(entry: MovementEntry) {
    const primary = entry.movements[0];
    if (!entry.isRequest || !primary.requisicao_id) return;
    setExportingPdfId(primary.requisicao_id);
    setExportError("");
    setExportNotice("");
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 18;
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 22;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      pdf.text("Comprovante de requisição", margin, y);
      y += 10;
      pdf.setFontSize(11);
      pdf.text(primary.requisicao_numero ?? `REQ-${primary.requisicao_id}`, margin, y);
      y += 9;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const metadata = [
        `Setor: ${primary.setor ?? "Não informado"}`,
        `Data: ${formatDate(primary.requisicao_data || primary.data)}`,
        `Solicitante: ${primary.solicitante || primary.usuario}`,
        `Separador: ${primary.separador || "Não informado"}`,
      ];
      for (const line of metadata) {
        pdf.text(line, margin, y);
        y += 7;
      }
      y += 5;
      pdf.setFont("helvetica", "bold");
      pdf.text("Materiais", margin, y);
      y += 7;
      pdf.setFont("helvetica", "normal");
      for (const item of totalItems(entry.movements)) {
        const lines = pdf.splitTextToSize(`${item.material} · ${formatQuantity(item.quantity)}${item.unit ? ` ${item.unit}` : ""}`, pageWidth - margin * 2 - 4) as string[];
        if (y + lines.length * 6 > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(lines, margin, y);
        y += lines.length * 6;
      }
      y += 5;
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(`Documento gerado pelo Cellarium em ${formatDate(new Date().toISOString())}`, margin, y);
      pdf.save(`${fileSafeName(primary.requisicao_numero ?? `requisicao_${primary.requisicao_id}`)}.pdf`);
      setExportNotice(`PDF da ${primary.requisicao_numero ?? `REQ-${primary.requisicao_id}`} baixado.`);
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : "Não foi possível gerar o PDF da requisição.");
    } finally {
      setExportingPdfId(null);
    }
  }

  return <>
    <PageHeading eyebrow="Operação · Auditoria" title="Histórico de movimentações" description="Saídas e ajustes registrados, com responsável, setor e saldo do estoque." />
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><Button variant="secondary" onClick={() => void reload()}><RefreshCw size={15}/>Tentar novamente</Button></div>}
    {exportError && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{exportError}</p>}
    {exportNotice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{exportNotice}</p>}
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold text-slate-900">Movimentações registradas</h2><p className="mt-1 text-xs text-slate-500">{entries.length} registros · {filtered.length} linhas de item</p></div><div className="flex flex-wrap gap-2"><label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar movimentação" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs text-slate-700 outline-none sm:w-52" placeholder="Material, pessoa ou setor"/></label><label className="sr-only" htmlFor="excel-period">Período da exportação</label><select id="excel-period" aria-label="Período da exportação Excel" value={exportPeriod} onChange={(event) => setExportPeriod(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="15">Últimos 15 dias</option><option value="30">Últimos 30 dias</option><option value="45">Últimos 45 dias</option><option value="60">Últimos 60 dias</option><option value="custom">Personalizado</option><option value="all">Todo o histórico</option></select>{exportPeriod === "custom" && <div className="flex items-center gap-2"><label className="sr-only" htmlFor="excel-start">Data inicial</label><input id="excel-start" type="date" aria-label="Data inicial do Excel" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"/><span className="text-xs text-slate-500">até</span><label className="sr-only" htmlFor="excel-end">Data final</label><input id="excel-end" type="date" aria-label="Data final do Excel" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"/></div>}<Button variant="secondary" onClick={() => void exportSpreadsheet()} loading={exporting} disabled={exporting || loading || exportMovements.length === 0}><Download size={15}/>Baixar Excel{exportMovements.length > 0 ? ` (${exportMovements.length})` : ""}</Button><Button variant="secondary" aria-label="Atualizar histórico" title="Atualizar histórico" onClick={() => void reload()}><RefreshCw size={15}/></Button></div></div>
      {loading ? <p role="status" className="border-t border-slate-100 p-6 text-sm text-slate-500">Carregando histórico…</p> : entries.length ? <ul className="movement-history-list">{entries.map((entry) => {
        const primary = entry.movements[0];
        const items = totalItems(entry.movements);
        const employee = primary.solicitante || primary.usuario;
        const requestDate = entry.isRequest ? primary.requisicao_data || primary.data : primary.data;
        const requestNumber = primary.requisicao_numero || (primary.requisicao_id ? `REQ-${primary.requisicao_id}` : "Movimentação avulsa");
        return <li key={entry.key} className="movement-history-entry">
          <header className="movement-history-heading">
            <div className="min-w-0"><span className="movement-history-kind">{entry.isRequest ? "Retirada por requisição" : movementType(primary.tipo)}</span><h3>{requestNumber}</h3><p>{primary.setor ?? "Setor não informado"}</p></div>
            <div className="flex flex-wrap items-center gap-3"><time className="movement-history-date" dateTime={requestDate}><CalendarClock size={16} aria-hidden="true"/><span><small>{entry.isRequest ? "Requisitada em" : "Registrada em"}</small><strong>{formatDate(requestDate)}</strong></span></time>{entry.isRequest && <Button variant="secondary" onClick={() => void exportRequestPdf(entry)} loading={exportingPdfId === primary.requisicao_id} disabled={exportingPdfId !== null}><FileText size={15}/>Baixar PDF</Button>}</div>
          </header>
          <div className="movement-history-details">
            <div className="movement-history-employee"><UserRound size={16} aria-hidden="true"/><span><small>Funcionário</small><strong>{employee}</strong></span></div>
            {entry.isRequest && primary.separador && primary.separador !== employee && <p className="movement-history-operator">Separado por {primary.separador}</p>}
            <div className="movement-history-items"><div className="movement-history-items-title"><Package size={16} aria-hidden="true"/><strong>{items.length} {items.length === 1 ? "material retirado" : "materiais retirados"}</strong></div><ul>{items.map((item) => <li key={`${item.material}:${item.unit}`}><span>{item.material}</span><strong>{formatQuantity(item.quantity)}{item.unit ? ` ${item.unit}` : ""}</strong></li>)}</ul></div>
          </div>
        </li>;
      })}</ul> : <p className="border-t border-slate-100 px-5 py-12 text-center text-sm text-slate-500">Nenhuma movimentação encontrada.</p>}
    </section>
  </>;
}
