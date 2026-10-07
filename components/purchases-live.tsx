"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, PackageSearch, RefreshCw } from "lucide-react";
import { Button, Card, EmptyState, PageHeading } from "@/components/ui";
import { ApiError, ApiUnavailableError, listStock, type ApiStockItem } from "@/lib/warehouse-api";

type PurchaseStatus = "Crítico" | "Estoque baixo";
type NoticeTone = "success" | "warning" | "error";

type PurchaseItem = {
  stock: ApiStockItem;
  status: PurchaseStatus;
  suggestedQuantity: number;
  minimumRatio: number;
};

const columns = [
  { header: "Código", key: "code", width: 17 },
  { header: "Descrição", key: "description", width: 38 },
  { header: "Setor/Categoria", key: "category", width: 32 },
  { header: "Unidade", key: "unit", width: 17 },
  { header: "Estoque Atual", key: "current", width: 19 },
  { header: "Estoque Mínimo", key: "minimum", width: 20 },
  { header: "Status", key: "status", width: 20 },
  { header: "Quantidade Sugerida", key: "suggested", width: 29 },
  { header: "Observação", key: "observation", width: 38 },
] as const;

function normalizeStatus(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleUpperCase("pt-BR");
}

function toPurchaseItem(stock: ApiStockItem): PurchaseItem | null {
  const apiStatus = normalizeStatus(stock.situacao);
  const status: PurchaseStatus | null =
    stock.estoque_atual <= 0 || apiStatus.includes("CRITICO") || apiStatus.includes("SEM_ESTOQUE")
      ? "Crítico"
      : stock.estoque_atual <= stock.estoque_minimo || apiStatus.includes("BAIXO")
        ? "Estoque baixo"
        : null;

  if (!status) return null;

  const target = stock.estoque_maximo ?? stock.estoque_minimo * 2;
  return {
    stock,
    status,
    suggestedQuantity: Math.max(0, target - stock.estoque_atual),
    minimumRatio: stock.estoque_minimo > 0
      ? stock.estoque_atual / stock.estoque_minimo
      : stock.estoque_atual <= 0 ? 0 : Number.POSITIVE_INFINITY,
  };
}

function localDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PurchasesLive() {
  const [stock, setStock] = useState<ApiStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("success");

  const loadStock = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const firstPage = await listStock({ page: 1, limit: 100 });
      const pageCount = Math.ceil(firstPage.total / firstPage.limit);
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
          listStock({ page: index + 2, limit: firstPage.limit }),
        ),
      );
      setStock([...firstPage.dados, ...remainingPages.flatMap((page) => page.dados)]);
    } catch (cause) {
      setStock([]);
      setError(
        cause instanceof ApiError || cause instanceof ApiUnavailableError
          ? cause.message
          : "Não foi possível carregar os materiais. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStock(), 0);
    return () => window.clearTimeout(timer);
  }, [loadStock]);

  const purchaseItems = useMemo(() => stock
    .map(toPurchaseItem)
    .filter((item): item is PurchaseItem => item !== null)
    .sort((left, right) => {
      const statusOrder = (left.status === "Crítico" ? 0 : 1) - (right.status === "Crítico" ? 0 : 1);
      return statusOrder || left.minimumRatio - right.minimumRatio;
    }), [stock]);

  const criticalCount = purchaseItems.filter((item) => item.status === "Crítico").length;
  const lowCount = purchaseItems.length - criticalCount;

  async function exportSpreadsheet() {
    setNotice("");
    if (purchaseItems.length === 0) {
      setNotice("Nenhum item em nível crítico ou baixo");
      setNoticeTone("warning");
      return;
    }

    setExporting(true);
    try {
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      workbook.creator = "Cellarium";
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet("Lista de compras", {
        views: [{ state: "frozen", ySplit: 1 }],
      });

      worksheet.columns = columns.map((column) => ({ ...column }));
      worksheet.addRows(purchaseItems.map(({ stock: item, status, suggestedQuantity }) => ({
        code: item.codigo,
        description: item.material,
        category: item.categoria,
        unit: item.unidade_sigla || item.unidade,
        current: item.estoque_atual,
        minimum: item.estoque_minimo,
        status,
        suggested: suggestedQuantity,
        observation: "",
      })));

      const header = worksheet.getRow(1);
      header.height = 36;
      header.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF23466B" } };
        cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true, indent: 1 };
        cell.border = {
          bottom: { style: "medium", color: { argb: "FF183653" } },
          right: { style: "thin", color: { argb: "FF5B7896" } },
        };
      });

      purchaseItems.forEach(({ status }, index) => {
        const row = worksheet.getRow(index + 2);
        row.height = 25;
        const fillColor = status === "Crítico" ? "FFF4B7B2" : "FFFFF4CC";
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
          cell.alignment = {
            horizontal: [5, 6, 8].includes(cell.fullAddress.col) ? "right" : [4, 7].includes(cell.fullAddress.col) ? "center" : "left",
            vertical: "middle",
            wrapText: true,
            indent: 1,
          };
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFD8DEE7" } },
            right: { style: "hair", color: { argb: "FFE2E8F0" } },
          };
        });
      });

      worksheet.columns.forEach((column, columnIndex) => {
        const configuredWidth = columns[columnIndex].width;
        const longestValue = Math.max(
          columns[columnIndex].header.length,
          ...purchaseItems.map(({ stock: item, status, suggestedQuantity }) => {
            const values = [item.codigo, item.material, item.categoria, item.unidade_sigla || item.unidade,
              String(item.estoque_atual), String(item.estoque_minimo), status, String(suggestedQuantity), ""];
            return String(values[columnIndex] ?? "").length;
          }),
        );
        column.width = Math.min(Math.max(configuredWidth, longestValue + 5), 56);
      });

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: purchaseItems.length + 1, column: columns.length },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `lista_compras_${localDateStamp()}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(`${purchaseItems.length} itens exportados: ${criticalCount} críticos e ${lowCount} com estoque baixo`);
      setNoticeTone("success");
    } catch {
      setNotice("Não foi possível gerar a planilha. Tente novamente.");
      setNoticeTone("error");
    } finally {
      setExporting(false);
    }
  }

  return <>
    <PageHeading
      eyebrow="Suprimentos"
      title="Compras de Materiais"
      description="Priorize a reposição dos materiais com saldo crítico ou abaixo do mínimo."
      action={<Button onClick={() => void exportSpreadsheet()} loading={exporting} disabled={loading || Boolean(error)}>
        <Download size={16} aria-hidden="true"/>Gerar planilha de compras
      </Button>}
    />

    {notice && <p role={noticeTone === "error" ? "alert" : "status"} aria-live="polite" className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${noticeTone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : noticeTone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{notice}</p>}

    <Card className="overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Materiais para reposição</h2>
          <p className="mt-1 text-xs text-slate-500">{loading ? "Carregando saldos do banco…" : `${purchaseItems.length} materiais em nível crítico ou baixo`}</p>
        </div>
        {!loading && !error && <p className="text-xs text-slate-500"><span className="font-semibold text-rose-700">{criticalCount} críticos</span><span className="mx-2 text-slate-300">·</span><span className="font-semibold text-amber-700">{lowCount} com estoque baixo</span></p>}
      </div>

      {loading ? <p role="status" className="px-5 py-12 text-center text-sm text-slate-500">Carregando materiais…</p>
        : error ? <div className="px-5 py-8 text-center">
          <AlertCircle size={22} className="mx-auto text-rose-600" aria-hidden="true"/>
          <p role="alert" className="mt-3 text-sm text-slate-700">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void loadStock()}><RefreshCw size={15} aria-hidden="true"/>Tentar novamente</Button>
        </div>
          : purchaseItems.length === 0 ? <EmptyState title="Tudo dentro do nível de estoque" description="Não há materiais críticos ou abaixo do mínimo para incluir na lista de compras." icon={<PackageSearch size={24}/>}/>
            : <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead><tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Material</th><th className="px-4 py-3">Código</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Estoque</th><th className="px-4 py-3">Mínimo</th><th className="px-5 py-3">Status</th>
                </tr></thead>
                <tbody>{purchaseItems.map(({ stock: item, status }) => <tr key={item.estoque_id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">{item.material}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{item.codigo}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{item.categoria}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-800">{item.estoque_atual} {item.unidade_sigla}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{item.estoque_minimo} {item.unidade_sigla}</td>
                  <td className="px-5 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${status === "Crítico" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>{status}</span></td>
                </tr>)}</tbody>
              </table>
            </div>}
    </Card>
  </>;
}
