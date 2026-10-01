"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Activity, ArrowRight, Boxes, Building2, Check, CheckSquare, ChevronDown, ClipboardList, Eye, FileSpreadsheet, FileText, Package, Plus, QrCode, Search, ShieldCheck, SlidersHorizontal, Truck, UserRound, X } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import InventoryScreen from "@/components/inventory-page";
import RequestChat from "@/components/request-chat";
import PurchaseRequest from "@/components/purchase-request";
import PurchaseCart from "@/components/purchase-cart";
import RequestSubmissionForm from "@/components/request-form";
import RequestSearch from "@/components/request-search";
import EmployeeNotifications from "@/components/employee-notifications";
import ProductQrPicker from "@/components/product-qr-picker";
import SectorStockPage from "@/components/sector-stock";
import WarehouseProfileScreen from "@/components/warehouse-profile";
import WarehouseQueue from "@/components/warehouse-queue";
import { materialsCatalog, requests, sectors, stock } from "@/lib/mock-data";
import { confirmRequestDelivery, getAllRequests, getServerRequests, subscribeToRequests, type RequestRecord } from "@/lib/request-storage";
import { createPurchaseRequestBatch } from "@/lib/purchase-storage";
import ThemeToggle from "@/components/theme-toggle";
import { Button, Card, EmptyState, PageHeading, StatusBadge } from "@/components/ui";
import { Sidebar, Topbar, RequesterLayout } from "@/components/product-shell";
import OperationsDashboard from "@/components/operations-dashboard";
import CountUp from "@/components/count-up";
import { useInventoryItems } from "@/components/use-inventory-items";
import { useDialogAccessibility } from "@/components/use-dialog-accessibility";
import type { Html5Qrcode } from "html5-qrcode";

function KpiCard({ label, value, note, icon: Icon, accent, trend }: { label: string; value: string; note: string; icon: typeof Package; accent: string; trend?: string }) {
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-[13px] font-medium text-slate-500">{label}</p><p className="mt-4 text-[32px] font-semibold leading-none tracking-[-.04em] text-slate-900"><CountUp value={Number(value) || 0}/></p></div><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}><Icon size={19}/></span></div><div className="mt-4 flex items-center gap-1.5 text-xs"><span className="font-semibold text-emerald-700">{trend}</span><span className="text-slate-400">{note}</span></div></Card>;
}

function DemandAnalytics() {
  const requests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const sectorCounts = requests.reduce<Record<string, number>>((counts, request) => {
    counts[request.sector] = (counts[request.sector] ?? 0) + 1;
    return counts;
  }, {});
  const sectorsByDemand = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);
  const materialCounts = requests.reduce<Record<string, number>>((counts, request) => {
    request.items.split(";").forEach((line) => {
      const match = line.trim().match(/^(.*?)\s*·\s*(\d+(?:[,.]\d+)?)\s*(.*)$/);
      const material = match?.[1]?.trim() ?? line.trim();
      counts[material] = (counts[material] ?? 0) + Number(match?.[2]?.replace(",", ".") ?? 1);
    });
    return counts;
  }, {});
  const materialsByDemand = Object.entries(materialCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxSector = Math.max(...sectorsByDemand.map(([, count]) => count), 1);
  const maxMaterial = Math.max(...materialsByDemand.map(([, count]) => count), 1);

  return <div data-reveal-group className="mt-5 grid gap-5 xl:grid-cols-2">
    <Card className="p-5 sm:p-6"><div className="mb-5"><h2 className="text-sm font-bold text-slate-900">Solicitações por setor</h2><p className="mt-1 text-xs text-slate-500">Setores com maior volume de requisições</p></div><div className="space-y-4" role="img" aria-label="Gráfico de solicitações agrupadas por setor">{sectorsByDemand.map(([sector, count]) => <div key={sector}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-slate-700">{sector}</span><span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${(count / maxSector) * 100}%` }}/></div></div>)}</div><p className="mt-5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">Registros neste navegador · {requests.length} requisições</p></Card>
    <Card className="p-5 sm:p-6"><div className="mb-5"><h2 className="text-sm font-bold text-slate-900">Materiais mais solicitados</h2><p className="mt-1 text-xs text-slate-500">Quantidade total nas requisições registradas</p></div><div className="space-y-4" role="img" aria-label="Gráfico dos materiais mais solicitados">{materialsByDemand.map(([material, count]) => <div key={material}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-slate-700">{material}</span><span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600">{count} {materialsCatalog.find((item) => item.name === material)?.unit ?? "un."}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500 transition-[width] duration-500" style={{ width: `${(count / maxMaterial) * 100}%` }}/></div></div>)}</div><p className="mt-5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">Registros neste navegador · {requests.length} requisições</p></Card>
  </div>;
}

function AnalyticsPage() {
  const requests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const stock = useInventoryItems();
  const daily = Object.entries(requests.reduce<Record<string, number>>((counts, request) => {
    counts[request.date] = (counts[request.date] ?? 0) + 1;
    return counts;
  }, {})).sort(([first], [second]) => {
    const [firstDay, firstMonth, firstYear] = first.split("/").map(Number);
    const [secondDay, secondMonth, secondYear] = second.split("/").map(Number);
    return new Date(firstYear, firstMonth - 1, firstDay).getTime() - new Date(secondYear, secondMonth - 1, secondDay).getTime();
  });
  const statusList = [
    { name: "Pendente", color: "#d99a26" },
    { name: "Em andamento", color: "#28529b" },
    { name: "Aprovado", color: "#6b83aa" },
    { name: "Concluído", color: "#16845b" },
  ].map((status) => ({ ...status, value: requests.filter((request) => request.status === status.name).length }));
  const total = requests.length;
  let offset = 0;
  const donut = statusList.map((status) => {
    const dash = status.value / Math.max(total, 1) * 100;
    const segment = { ...status, dash, offset };
    offset += dash;
    return segment;
  });
  const pointX = (index: number) => 110 + index * (180 / Math.max(daily.length - 1, 1));
  const pointY = (count: number) => 142 - count / Math.max(...daily.map(([, amount]) => amount), 1) * 110;

  return <>
    <PageHeading eyebrow="Inteligência operacional" title="Análises" description="Explore padrões de consumo, pedidos e níveis de estoque."/>
    <div data-reveal className="mb-5 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-900"><strong>Dados demonstrativos:</strong> os gráficos refletem as requisições registradas neste navegador.</div>
    <div data-reveal-group className="mb-5 grid gap-4 sm:grid-cols-3"><KpiCard label="Requisições analisadas" value={String(requests.length)} note="na amostra disponível" icon={ClipboardList} accent="bg-blue-50 text-brand"/><KpiCard label="Setores atendidos" value={String(new Set(requests.map((request) => request.sector)).size)} note="com pedidos registrados" icon={Building2} accent="bg-violet-50 text-violet-700"/><KpiCard label="Materiais no catálogo" value={String(stock.length)} note="itens demonstrativos" icon={Package} accent="bg-emerald-50 text-emerald-700"/></div>
    <div data-reveal-group className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card data-reveal-item className="p-5 sm:p-6"><div className="mb-4"><h2 className="text-sm font-bold text-slate-900">Pedidos por dia</h2><p className="mt-1 text-xs text-slate-500">Contagem nas datas presentes no histórico</p></div><div role="img" aria-label={`Gráfico de linha: ${daily.map(([date, count]) => `${date}: ${count}`).join(", ")}`}><svg viewBox="0 0 400 180" className="mx-auto h-48 w-full max-w-[640px]" preserveAspectRatio="xMidYMid meet"><path d="M45 20V142H380" fill="none" stroke="var(--line)"/><path d="M45 98H380M45 54H380" fill="none" stroke="var(--line)" strokeDasharray="3 5"/><polyline className="analytics-line" points={daily.map(([, count], index) => `${pointX(index)},${pointY(count)}`).join(" ")} fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1"/>{daily.map(([date, count], index) => { const x = pointX(index); const y = pointY(count); return <g key={date}><circle cx={x} cy={y} r="5" fill="var(--surface)" stroke="var(--brand)" strokeWidth="3"/><text x={x} y="165" textAnchor="middle" fill="var(--muted)" fontSize="10">{date}</text><text x={x} y={y - 12} textAnchor="middle" fill="var(--foreground)" fontSize="10" fontWeight="600">{count}</text></g>; })}</svg></div><p className="mt-2 text-[11px] text-slate-400">Sem datas intermediárias no histórico de demonstração</p></Card>
      <Card data-reveal-item className="p-5 sm:p-6"><div className="mb-4"><h2 className="text-sm font-bold text-slate-900">Distribuição por status</h2><p className="mt-1 text-xs text-slate-500">Etapa atual das solicitações registradas</p></div><div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center"><div className="relative h-40 w-40 shrink-0" role="img" aria-label={`Gráfico de rosca com ${total} requisições`}><svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r="43" fill="none" stroke="var(--line)" strokeWidth="13"/>{donut.map((segment) => <circle key={segment.name} cx="60" cy="60" r="43" fill="none" stroke={segment.color} strokeWidth="13" strokeDasharray={`${segment.dash} ${100 - segment.dash}`} strokeDashoffset={-segment.offset} pathLength="100" className="analytics-donut-segment"/>)}</svg><div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl font-semibold text-slate-900">{total}</strong><span className="text-[10px] text-slate-500">pedidos</span></div></div><ul className="w-full max-w-[210px] space-y-3">{statusList.map((status) => <li key={status.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: status.color }}/>{status.name}</span><strong className="tabular-nums text-slate-800">{status.value}</strong></li>)}</ul></div></Card>
      <Card data-reveal-item className="p-5 sm:p-6 xl:col-span-2"><div className="mb-5"><h2 className="text-sm font-bold text-slate-900">Disponível versus estoque mínimo</h2><p className="mt-1 text-xs text-slate-500">Comparação dos materiais sinalizados no inventário</p></div><div className="space-y-5" role="img" aria-label="Gráfico de barras comparando saldo atual e estoque mínimo">{stock.filter((item) => item.quantity < item.minimum).map((item, index) => { const max = Math.max(item.quantity, item.minimum, 1); return <div key={item.code} data-reveal-item><div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-slate-700">{item.name}</span><span className="shrink-0 font-mono text-[10px] text-slate-500">{item.code}</span></div><div className="grid grid-cols-[54px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-500"><span>Atual · {item.quantity}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="analytics-bar h-full rounded-full bg-sky-500" style={{ "--bar-width": `${item.quantity / max * 100}%`, "--bar-delay": `${index * 90}ms` } as React.CSSProperties}/></div><span>Mínimo · {item.minimum}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="analytics-bar h-full rounded-full bg-slate-400" style={{ "--bar-width": `${item.minimum / max * 100}%`, "--bar-delay": `${index * 90 + 100}ms` } as React.CSSProperties}/></div></div></div>; })}</div><div className="mt-5 flex gap-5 border-t border-slate-100 pt-3 text-[11px] text-slate-500"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-sky-500"/>Disponível</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-sm bg-slate-400"/>Estoque mínimo</span></div></Card>
    </div>
    <DemandAnalytics/>
  </>;
}

function RequestsTable({ compact = false, onAccept, acceptedIds = [], onViewDetails, rows }: { compact?: boolean; onAccept?: (id: string) => void; acceptedIds?: string[]; onViewDetails?: (request: (typeof requests)[number]) => void; rows?: typeof requests }) {
  const displayedRows = rows ?? (compact ? requests.slice(0, 4) : requests);
  return <div className="overflow-x-auto"><table className={`responsive-table w-full min-w-[700px] text-left ${compact ? "text-[11px]" : ""}`}><thead><tr className="border-y border-slate-100 bg-slate-50/70 text-[10px] font-medium uppercase tracking-[.06em] text-slate-500"><th className="px-5 py-2.5">Requisi&#231;&#227;o</th><th className="px-4 py-2.5">Ordem serv.</th><th className="px-4 py-2.5">Solicitante</th><th className="px-4 py-2.5">Data</th><th className="px-4 py-2.5">Status</th><th className="px-5 py-2.5 text-right">A&#231;&#245;es</th></tr></thead><tbody data-reveal-group>{displayedRows.map((row) => { const accepted = acceptedIds.includes(row.id); const status = accepted ? "Em andamento" : row.status; return <tr data-reveal-item key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"><td data-label="Requisição" className={`px-5 ${compact ? "py-2.5" : "py-4"} font-mono text-xs font-semibold text-slate-800`}>{row.id}</td><td data-label="Ordem de serviço" className={`px-4 ${compact ? "py-2.5" : "py-4"} font-mono text-xs text-slate-600`}>{row.order}</td><td data-label="Solicitante" className={`px-4 ${compact ? "py-2.5" : "py-4"} text-xs font-medium text-slate-800`}>{row.requester}</td><td data-label="Data" className={`px-4 ${compact ? "py-2.5" : "py-4"} text-xs text-slate-500`}>{row.date}</td><td data-label="Status" className={`px-4 ${compact ? "py-2.5" : "py-4"}`}><StatusBadge status={status}/></td><td data-label="Ações" className={`px-5 ${compact ? "py-2.5" : "py-4"} text-right`}>{onViewDetails ? <Button variant="secondary" onClick={() => onViewDetails(row)} className="!min-h-8 !px-3 !text-xs"><Eye size={14}/>Ver detalhes</Button> : onAccept && row.status === "Pendente" ? <Button onClick={() => onAccept(row.id)} className="!min-h-8 !px-3 !text-xs" disabled={accepted}>{accepted ? <><Check size={14}/>Aceito</> : "Aceitar pedido"}</Button> : <Link href={`/separacao?request=${encodeURIComponent(row.id)}`} className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-brand">Ver detalhes</Link>}</td></tr>; })}</tbody></table>{displayedRows.length === 0 && <EmptyState title="Nenhum registro encontrado" description="As requisições aprovadas e concluídas aparecerão aqui. Ajuste a busca para consultar outro pedido."/>}</div>;
}
function Dashboard() { return <OperationsDashboard/>; }

function FormField({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">{label}</span><input type={type} placeholder={placeholder} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label>; }

function MaterialSelection() {
  const inventoryItems = useInventoryItems();
  const availableCatalog = materialsCatalog.map((material) => ({
    ...material,
    quantity: inventoryItems.find((item) => item.code === material.code)?.quantity ?? 0,
  }));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [availability, setAvailability] = useState("Todos");
  const [unit, setUnit] = useState("Todas");
  const [page, setPage] = useState(1);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, number>>({});
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const categories = [...new Set(availableCatalog.map((item) => item.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const units = [...new Set(availableCatalog.map((item) => item.unit))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const filteredMaterials = availableCatalog.filter((item) => {
    const searchable = `${item.name} ${item.code} ${item.category} ${item.specification}`.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const status = item.quantity <= 0 ? "Indisponível" : item.quantity <= item.minimum ? "Crítico" : "Disponível";
    return searchable.includes(normalizedSearch) && (category === "Todas" || item.category === category) && (availability === "Todos" || status === availability) && (unit === "Todas" || item.unit === unit);
  });
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
  const visibleMaterials = filteredMaterials.slice((page - 1) * pageSize, page * pageSize);
  const selectedEntries = Object.entries(selectedMaterials);
  const query = new URLSearchParams();
  selectedEntries.forEach(([code, quantity]) => { query.append("material", code); query.append("qty", String(quantity)); });
  const hasFilters = Boolean(search || category !== "Todas" || availability !== "Todos" || unit !== "Todas");

  function toggleMaterial(code: string, checked: boolean) {
    if (checked && (availableCatalog.find((item) => item.code === code)?.quantity ?? 0) <= 0) return;
    setSelectedMaterials((current) => {
      const next = { ...current };
      if (checked) next[code] = next[code] ?? 1;
      else delete next[code];
      return next;
    });
  }

  function updateQuantity(code: string, quantity: number) {
    const available = Math.max(availableCatalog.find((item) => item.code === code)?.quantity ?? 1, 1);
    setSelectedMaterials((current) => ({ ...current, [code]: Math.min(available, Math.max(1, quantity || 1)) }));
  }

  function selectScannedMaterial(material: (typeof materialsCatalog)[number]) {
    setSelectedMaterials((current) => ({ ...current, [material.code]: current[material.code] ?? 1 }));
    setSearch(material.code);
    setCategory("Todas");
    setAvailability("Todos");
    setUnit("Todas");
    setPage(1);
  }

  function clearFilters() {
    setSearch(""); setCategory("Todas"); setAvailability("Todos"); setUnit("Todas"); setPage(1);
  }

  return <>
    <PageHeading eyebrow="Requisitante · Materiais" title="Selecione os materiais" description="Encontre itens do almoxarifado, refine a lista e informe as quantidades." action={<a href="#continuar-pedido" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-brand transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><ChevronDown size={15}/>Ir até continuar pedido</a>} />
    <Card className="max-w-6xl border-slate-300 shadow-md">
      <div className="catalog-toolbar">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-base font-bold">Catálogo do almoxarifado</h2><p className="mt-1 text-xs text-slate-300">Pesquise por descrição, código, categoria ou especificação.</p></div>
          <div className="flex items-center gap-2"><ProductQrPicker onSelect={selectScannedMaterial} materials={availableCatalog}/><span className="catalog-count">{filteredMaterials.length} {filteredMaterials.length === 1 ? "item" : "itens"}</span></div>
        </div>
        <div className="catalog-controls">
          <label className="flex h-11 items-center gap-2.5 rounded-lg border border-white/20 bg-white px-3 text-slate-500 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"><Search size={16} /><span className="sr-only">Pesquisar material</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nome, código ou especificação" className="min-w-0 flex-1 bg-transparent text-xs font-medium text-slate-900 outline-none placeholder:text-slate-500" /></label>
          <button type="button" onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen} aria-controls="catalog-filter-fields" className="catalog-filter-toggle ui-button ui-button--secondary"><SlidersHorizontal size={15}/>Filtros</button>
          <div id="catalog-filter-fields" className={`catalog-filter-fields ${filtersOpen ? "is-open" : ""}`}>
          <label className="relative"><span className="sr-only">Filtrar por categoria</span><SlidersHorizontal size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select aria-label="Filtrar por categoria" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"><option value="Todas">Todas as categorias</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label><span className="sr-only">Filtrar por disponibilidade</span><select aria-label="Filtrar por disponibilidade" value={availability} onChange={(event) => { setAvailability(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"><option value="Todos">Qualquer disponibilidade</option><option>Disponível</option><option>Crítico</option><option>Indisponível</option></select></label>
          <label><span className="sr-only">Filtrar por unidade</span><select aria-label="Filtrar por unidade de medida" value={unit} onChange={(event) => { setUnit(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"><option value="Todas">Todas as unidades</option>{units.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          </div>
        </div>
        {hasFilters && <button type="button" onClick={clearFilters} className="mt-3 min-h-9 rounded-md text-xs font-semibold text-slate-500 transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Limpar filtros</button>}
      </div>
      <div className="catalog-list">
        {visibleMaterials.length ? visibleMaterials.map((item) => {
          const selected = selectedMaterials[item.code] !== undefined;
          const status = item.quantity <= 0 ? "Indisponível" : item.quantity <= item.minimum ? "Crítico" : "Disponível";
          const badge = status === "Indisponível" ? "bg-slate-100 text-slate-600" : status === "Crítico" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
          return <div key={item.code} className={`catalog-row grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4 ${selected ? "is-selected" : ""}`}>
            <label className={`flex min-h-11 min-w-11 items-center justify-center ${item.quantity > 0 || selected ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`} aria-label={`Selecionar ${item.name}`}><input type="checkbox" checked={selected} disabled={item.quantity <= 0 && !selected} onChange={(event) => toggleMaterial(item.code, event.target.checked)} className="h-5 w-5 rounded accent-brand" /></label>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="catalog-material-name text-slate-950">{item.name}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${badge}`}>{status}</span></div><p className="catalog-specification mt-1 text-slate-600">{item.specification}</p><div className="catalog-meta"><span className="catalog-code font-mono">{item.code}</span><span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-800">{item.category}</span><span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">{item.quantity} {item.unit} disponíveis</span></div></div>
            {selected && <label className="col-span-2 flex items-center justify-end gap-2 rounded-lg bg-white/80 p-2 sm:col-span-1"><span className="text-xs font-bold text-slate-700">Quantidade</span><input aria-label={`Quantidade de ${item.name}`} type="number" min={1} max={Math.max(item.quantity, 1)} value={selectedMaterials[item.code]} onChange={(event) => updateQuantity(item.code, Number(event.target.value))} className="h-11 w-20 rounded-lg border-2 border-blue-200 bg-white px-2 text-center text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>}
          </div>;
        }) : <div className="px-5 py-14 text-center"><Package size={26} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">Nenhum material encontrado</p><p className="mt-1 text-xs text-slate-500">Ajuste a busca ou os filtros para ver outros itens.</p>{hasFilters && <button type="button" onClick={clearFilters} className="mt-4 text-xs font-semibold text-brand hover:underline">Limpar filtros</button>}</div>}
      </div>
      {filteredMaterials.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6"><p className="text-xs font-medium text-slate-600">Exibindo {Math.min((page - 1) * pageSize + 1, filteredMaterials.length)}–{Math.min(page * pageSize, filteredMaterials.length)} de {filteredMaterials.length}</p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Anterior</button><span className="px-1 text-xs font-bold tabular-nums text-slate-700">{page} / {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Próxima</button></div></div>}
      <div id="continuar-pedido" className="catalog-selection flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p role="status" className="text-xs font-medium text-slate-700">{selectedEntries.length ? <><strong className="mr-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-700 px-1.5 text-xs font-bold text-white">{selectedEntries.length}</strong> {selectedEntries.length === 1 ? "material selecionado" : "materiais selecionados"} · quantidades preservadas ao filtrar</> : "Selecione os itens desejados e informe a quantidade de cada um."}</p><Link aria-disabled={!selectedEntries.length} tabIndex={selectedEntries.length ? 0 : -1} href={selectedEntries.length ? `/pedido?${query.toString()}` : "/materiais"} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${selectedEntries.length ? "bg-brand text-white hover:bg-brand-strong" : "pointer-events-none bg-slate-300 text-slate-700"}`}>Continuar pedido <ArrowRight size={16} /></Link></div>
    </Card>
    <p className="mt-3 max-w-6xl text-[11px] text-slate-400">Catálogo de demonstração. As quantidades e os níveis de estoque são ilustrativos; os filtros seguem as categorias e unidades cadastradas no banco.</p>
  </>;
}
function RequestForm() { const searchParams = useSearchParams(); const selectedCodes = searchParams.getAll("material"); const quantities = searchParams.getAll("qty"); const selectedItems = selectedCodes.map((code, index) => ({ item: materialsCatalog.find((product) => product.code === code), quantity: Number(quantities[index]) || 1 })).filter((entry) => entry.item); return <><PageHeading eyebrow="Requisitante - Materiais" title="Nova requisição" description="Preencha os dados para solicitar materiais ao almoxarifado." action={<Link href="/materiais" className="text-xs font-semibold text-brand hover:underline">Trocar material</Link>}/><div data-reveal-group className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><Card className="p-5 sm:p-7"><div className="mb-6 border-b border-slate-100 pb-4"><h2 className="text-sm font-bold text-slate-900">Dados da solicitação</h2><p className="mt-1 text-xs text-slate-500">Os campos com * são obrigatórios.</p></div><div className="grid gap-5 sm:grid-cols-2"><FormField label="Nome do solicitante *" placeholder="Ex.: José Alencar"/><FormField label="Ordem de serviço *" placeholder="Ex.: OS-821"/><label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Setor *</span><select defaultValue="" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="">Selecione o setor</option>{sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select></label><FormField label="Data necessária *" placeholder="dd/mm/aaaa" type="date"/></div><div className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-bold text-slate-800">Material solicitado</h3><Link href="/materiais" className="text-xs font-semibold text-brand hover:underline">Escolher outro</Link></div><div className="space-y-2">{selectedItems.length ? selectedItems.map(({ item, quantity }) => item && <div key={item.code} className="grid grid-cols-[minmax(0,1fr)_100px] items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{item.name}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{item.code}</p></div><p className="text-right text-xs font-semibold text-slate-700">Qtd.: {quantity}</p></div>) : <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500">Nenhum material selecionado. <Link href="/materiais" className="font-semibold text-brand">Escolher materiais</Link></div>}</div></div><label className="mt-5 block"><span className="mb-2 block text-xs font-semibold text-slate-700">Observações</span><textarea rows={3} placeholder="Descreva a aplicação ou informações adicionais..." className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label><div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row"><Link href="/materiais" className="ui-button ui-button--secondary w-full sm:w-auto">Voltar à seleção</Link><Link href="/acompanhar" className="ui-button ui-button--primary w-full sm:w-auto">Enviar requisição <ArrowRight size={16}/></Link></div></Card><Card className="h-fit p-5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-brand"><ShieldCheck size={18}/></div><div><h3 className="text-sm font-bold text-slate-900">Antes de solicitar</h3><p className="mt-1 text-xs leading-5 text-slate-500">Confira as informações para agilizar a separação dos materiais.</p></div></div><ul className="mt-5 space-y-4 text-xs text-slate-600"><li className="flex gap-2"><Check size={15} className="shrink-0 text-emerald-600"/>Tenha a ordem de serviço em mãos.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emerald-600"/>Informe a quantidade necessária para o serviço.</li><li className="flex gap-2"><Check size={15} className="shrink-0 text-emerald-600"/>Acompanhe o andamento pela tela de acompanhamento.</li></ul></Card></div></> }

function TrackingPage() { return <><PageHeading eyebrow="Requisitante - Acompanhamento" title="Acompanhar pedido" description="Consulte o andamento da sua requisição." action={<Button variant="secondary"><Search size={15}/>Buscar pedido</Button>}/><div data-reveal-group className="grid gap-5 lg:grid-cols-[1.3fr_1fr]"><Card className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5"><div><p className="font-mono text-xs font-bold text-brand">REQ-2045</p><h2 className="mt-2 text-lg font-bold text-slate-900">Disco de Corte para Aço Carbono 4.1/2&quot; x 1.0mm - 12 un.</h2><p className="mt-1 text-xs text-slate-500">OS-819 - Usinagem e Solda - Solicitado em 24/10/2024</p></div><StatusBadge status="Em andamento"/></div><h3 className="mb-5 mt-6 text-xs font-bold text-slate-800">Etapas do pedido</h3><div data-reveal-group className="space-y-0">{[{ title: "Requisição enviada", time: "Hoje, 08:42 - José Alencar", done: true },{ title: "Pedido aceito pelo almoxarife", time: "Hoje, 09:15 - Carlos Silva", done: true },{ title: "Separação dos materiais", time: "Em andamento", active: true },{ title: "Retirada disponível", time: "Aguardando conclusão" }].map((step, i) => <div data-reveal-item key={step.title} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative flex w-6 shrink-0 justify-center"><span className={`z-10 flex h-6 w-6 items-center justify-center rounded-full ${step.done ? "bg-emerald-100 text-emerald-700" : step.active ? "bg-blue-100 text-brand" : "bg-slate-100 text-slate-400"}`}>{step.done ? <Check size={13}/> : <span className="h-2 w-2 rounded-full bg-current"/>}</span>{i < 3 && <span className={`absolute top-6 h-full w-px ${step.done ? "bg-emerald-200" : "bg-slate-200"}`}/>}</div><div><p className={`text-xs font-semibold ${step.active ? "text-brand" : step.done ? "text-slate-800" : "text-slate-400"}`}>{step.title}</p><p className="mt-1 text-[11px] text-slate-400">{step.time}</p></div></div>)}</div></Card><Card className="h-fit p-5"><h2 className="text-sm font-bold text-slate-900">Resumo do pedido</h2><div className="mt-4 space-y-3 text-xs"><div className="flex justify-between"><span className="text-slate-500">Solicitante</span><span className="font-medium text-slate-800">José Alencar</span></div><div className="flex justify-between"><span className="text-slate-500">Setor</span><span className="font-medium text-slate-800">Usinagem e Solda</span></div><div className="flex justify-between"><span className="text-slate-500">Ordem de serviço</span><span className="font-mono font-medium text-slate-800">OS-819</span></div></div><div className="mt-5 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800">Seu pedido está sendo separado. Você receberá uma atualização quando estiver disponível para retirada.</div></Card></div></> }

function SeparationPage() {
  const searchParams = useSearchParams();
  const liveRequests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const availableRequests = liveRequests.filter((item) => item.status !== "Concluído");
  const requestedId = searchParams.get("request");
  const fallbackRequest = availableRequests[1] ?? availableRequests[0];
  const [selectedId, setRequestId] = useState("");
  const requestId = selectedId || requestedId || fallbackRequest?.id || "";
  const request = availableRequests.find((item) => item.id === requestId) ?? fallbackRequest;
  if (!request) return <><PageHeading eyebrow="Opera&#231;&#227;o &#183; Almoxarifado" title="Confirmar separa&#231;&#227;o" description="Confira os itens e confirme a entrega ao solicitante."/><Card className="p-5 text-sm text-slate-500">N&#227;o h&#225; pedidos aguardando separa&#231;&#227;o.</Card></>;
  const requestedItems = request.items.split(";").filter((entry) => entry.trim()).map((entry) => {
    const [name, quantity] = entry.trim().split(/\s\u00b7\s/);
    const material = materialsCatalog.find((item) => item.name === name);
    return { name, quantity: quantity ?? "1 un.", code: material?.code ?? "Código não encontrado" };
  });
  return <>
    <PageHeading eyebrow="Opera&#231;&#227;o &#183; Almoxarifado" title="Confirmar separa&#231;&#227;o" description="Confira os itens e confirme a entrega ao solicitante." action={<PurchaseRequest requestId={request.id} sector={request.sector}/>}/>
    <div data-reveal-group className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-sm font-bold text-slate-900">Pedidos em separa&#231;&#227;o</h2><p className="mt-1 text-xs text-slate-500">Escolha qual requisição está atendendo</p></div>
            <select aria-label="Requisi&#231;&#227;o atendida" value={requestId} onChange={(event) => setRequestId(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">{liveRequests.filter((item) => item.status !== "Concluído").map((item) => <option key={item.id} value={item.id}>{item.id} &#183; {item.requester}</option>)}</select>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">Ordem de servi&#231;o <strong className="font-mono text-slate-800">{request.order}</strong></p><StatusBadge status={request.status === "Pendente" ? "Em andamento" : request.status}/></div>
        </div>
        <div className="overflow-x-auto"><table className="responsive-table w-full min-w-[520px] text-left"><thead><tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-500"><th className="px-5 py-3">Material</th><th className="px-4 py-3">Localização</th><th className="px-4 py-3">Solicitado</th><th className="px-4 py-3">Separado</th></tr></thead><tbody>{requestedItems.map((item, index) => <tr key={index} className="border-b border-slate-100"><td data-label="Material" className="px-5 py-4"><p className="text-xs font-semibold text-slate-800">{item.name}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{item.code}</p></td><td data-label="Localização" className="px-4 py-4 text-xs text-slate-600">A-02-14</td><td data-label="Solicitado" className="px-4 py-4 text-xs font-medium text-slate-700">{item.quantity}</td><td data-label="Separado" className="px-4 py-4"><label className="inline-flex min-h-10 items-center gap-2 text-xs text-slate-500"><input type="checkbox" aria-label={`Material separado: ${item.name}`} defaultChecked className="h-4 w-4 accent-brand"/>OK</label></td></tr>)}</tbody></table></div>
        <div className="flex flex-col-reverse justify-end gap-3 p-5 sm:flex-row">
          <Link href="/fila" className="ui-button ui-button--secondary">Voltar à fila</Link>
          {request.deliveryConfirmed
            ? <span role="status" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 text-sm font-semibold text-emerald-800"><Check size={16}/>Entrega confirmada</span>
            : <Button onClick={() => confirmRequestDelivery(request.id)}><CheckSquare size={16}/>Confirmar entrega</Button>}
        </div>
      </Card>
      <Card className="h-fit p-5"><h3 className="text-sm font-bold text-slate-900">Dados do solicitante</h3><div className="mt-4 space-y-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"><UserRound size={17}/></div><div><p className="text-xs font-semibold text-slate-800">{request.requester}</p><p className="mt-1 text-[11px] text-slate-500">{request.sector} &#183; {request.shift ?? "Turno não informado"}</p></div></div><div className="rounded-lg border border-slate-100 p-3"><p className="text-[10px] font-semibold uppercase text-slate-400">Requisição selecionada</p><p className="mt-1 font-mono text-xs text-slate-700">{request.id} &#183; {request.order}</p></div><Link href="/qrcode" className="ui-button ui-button--secondary w-full"><QrCode size={16}/>Validar retirada com QR</Link></div></Card>
    </div>
  </>;
}
function QrPage() {
  const requests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerHandled = useRef(false);
  const [productPurchase, setProductPurchase] = useState<{ name: string; code: string; quantity: number; unit: string; batchId: string } | null>(null);
  useDialogAccessibility(scannerOpen, () => setScannerOpen(false));

  useEffect(() => {
    if (!scannerOpen) return;
    let disposed = false;
    let scanner: Html5Qrcode | undefined;
    void import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (disposed) return;
      scanner = new Html5Qrcode("request-qr-reader");
      return scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 230, height: 230 } }, (value) => {
        if (scannerHandled.current) return;
        scannerHandled.current = true;
        const candidates = [value.trim()];
        try {
          const parsed: unknown = JSON.parse(value);
          if (parsed && typeof parsed === "object") {
            const data = parsed as Record<string, unknown>;
            for (const key of ["request", "requestId", "id", "code", "codigo", "order", "os"]) {
              if (typeof data[key] === "string" || typeof data[key] === "number") candidates.push(String(data[key]));
            }
          }
        } catch { /* O conteúdo pode ser apenas o código da requisição. */ }
        try {
          const url = new URL(value);
          for (const key of ["request", "requestId", "id", "code", "codigo", "order", "os"]) {
            const parameter = url.searchParams.get(key);
            if (parameter) candidates.push(parameter);
          }
          const pathCode = url.pathname.split("/").filter(Boolean).at(-1);
          if (pathCode) candidates.push(decodeURIComponent(pathCode));
        } catch { /* O QR pode conter um código simples. */ }
        const normalized = new Set(candidates.map((candidate) => candidate.trim().toLocaleLowerCase("pt-BR")));
        const request = requests.find((item) => normalized.has(item.id.toLocaleLowerCase("pt-BR")) || normalized.has(item.order.toLocaleLowerCase("pt-BR")));
        if (!request || request.status === "Concluído") {
          scannerHandled.current = false;
          setError("QR Code inválido ou requisição já concluída. Tente outro código ou informe o número manualmente.");
          return;
        }
        setError("");
        setScannerOpen(false);
        router.push("/separacao?request=" + encodeURIComponent(request.id));
      }, () => undefined).catch((cameraError: unknown) => {
        if (disposed) return;
        const name = cameraError instanceof Error ? cameraError.name : "";
        const message = name === "NotAllowedError" || name === "PermissionDeniedError"
          ? "Permita o acesso à câmera no navegador para ler o QR Code."
          : name === "NotFoundError" || name === "DevicesNotFoundError"
            ? "Nenhuma câmera foi encontrada neste dispositivo. Digite o código da requisição manualmente."
            : name === "SecurityError"
              ? "O navegador exige uma conexão segura (HTTPS) para acessar a câmera."
              : "Não foi possível iniciar a câmera. Confira a permissão ou informe o código manualmente.";
        setError(message);
      });
    }).catch(() => {
      if (!disposed) setError("Não foi possível carregar o leitor. Digite o código da requisição manualmente.");
    });
    return () => {
      disposed = true;
      if (scanner?.isScanning) void scanner.stop().catch(() => undefined);
    };
  }, [scannerOpen, requests, router]);

  function validateCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = requests.find((item) => item.id.toLocaleLowerCase("pt-BR") === code.trim().toLocaleLowerCase("pt-BR"));
    if (!request || request.status === "Conclu\u00eddo") {
      setError("Não encontramos uma requisição aberta com esse código.");
      return;
    }
    setError("");
    router.push("/separacao?request=" + encodeURIComponent(request.id));
  }

  return <>
    <PageHeading eyebrow="Opera&#231;&#227;o &#183; Valida&#231;&#227;o" title="Leitor de QR Code" description="Leia etiquetas de produtos para solicitar reposi&#231;&#227;o ou valide uma requisi&#231;&#227;o." />
    <div className="mx-auto grid max-w-3xl gap-4">
      <Card className="p-5 sm:p-6">
        <h2 className="text-sm font-bold text-slate-900">Solicitar produto para Compras</h2>
        <p className="mt-1 text-xs text-slate-500">Os c&#243;digos num&#233;ricos das etiquetas cadastradas geram um pedido de reposi&#231;&#227;o.</p>
        <div className="mt-4"><ProductQrPicker purpose="purchase" onSelect={(material) => {
          const quantity = Math.max(material.minimum - material.quantity, 1);
          const batchId = createPurchaseRequestBatch({
            items: [{ material: material.name, code: material.code, quantity, unit: material.unit }],
            requester: "Carlos Silva",
            sector: "Almoxarifado - Planta 01",
            reason: "Reposição de estoque solicitada pela leitura do QR Code do produto.",
          });
          setProductPurchase({ name: material.name, code: material.code, quantity, unit: material.unit, batchId });
        }} /></div>
        {productPurchase && <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-900">Pedido de reposi&#231;&#227;o criado</p><p className="mt-1 text-xs text-emerald-800">{productPurchase.name} · {productPurchase.code}</p><p className="mt-1 text-xs text-emerald-800">Quantidade: {productPurchase.quantity} {productPurchase.unit}</p><p className="mt-2 font-mono text-xs text-emerald-800">{productPurchase.batchId}</p><button type="button" onClick={() => setProductPurchase(null)} className="mt-3 min-h-9 rounded-md px-3 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100">Concluir</button></div>}
      </Card>
      <Card className="p-5 sm:p-6">
        <h2 className="text-sm font-bold text-slate-900">Validar requisi&#231;&#227;o</h2>
        <p className="mt-1 text-xs text-slate-500">Informe o c&#243;digo da requisi&#231;&#227;o para abrir a separa&#231;&#227;o.</p>
        <form onSubmit={validateCode} className="mt-4">
          <label htmlFor="request-code" className="mb-2 block text-xs font-semibold text-slate-700">C&#243;digo da requisi&#231;&#227;o</label>
          <div className="flex flex-col gap-2 sm:flex-row"><input id="request-code" required value={code} onChange={(event) => { setCode(event.target.value); setError(""); }} placeholder="Ex.: REQ-2045" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/><Button type="submit"><QrCode size={16}/>Validar c&#243;digo</Button><Button type="button" variant="secondary" onClick={() => { scannerHandled.current = false; setError(""); setScannerOpen(true); }}><QrCode size={16}/>Ler QR Code</Button></div>
          {error && <p role="alert" className="mt-2 text-xs font-medium text-rose-700">{error}</p>}
        </form>
      </Card>
    </div>
    {scannerOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setScannerOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="request-qr-title" className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="request-qr-title" className="text-lg font-bold text-slate-900">Ler QR da requisição</h2><p className="mt-1 text-sm text-slate-500">Aponte a câmera para o código da requisição.</p></div><button type="button" aria-label="Fechar leitor" onClick={() => setScannerOpen(false)} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Fechar</button></div><div id="request-qr-reader" className="mt-5 min-h-64 overflow-hidden rounded-lg bg-slate-950"/><p className="mt-3 text-center text-xs text-slate-500">Se a câmera não estiver disponível, feche esta janela e digite o código.</p></section></div>}
  </>;
}

function InventoryPage() { const [search, setSearch] = useState(""); const filteredStock = stock.filter((item) => `${item.name} ${item.code}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))); return <><PageHeading eyebrow="Controle de materiais" title="Inventário" description="Consulte saldos e níveis de reposição dos materiais." action={<Button><Plus size={16}/>Adicionar material</Button>}/><div data-reveal-group className="mb-5 grid gap-4 sm:grid-cols-3"><KpiCard label="Itens cadastrados" value={String(stock.length)} note="itens no catálogo" icon={Package} accent="bg-blue-50 text-brand"/><KpiCard label="Estoque crítico" value="03" note="requer atenção" icon={Activity} accent="bg-rose-50 text-rose-700"/><KpiCard label="Movimentações hoje" value="18" note="entradas e saídas" icon={Truck} accent="bg-emerald-50 text-emerald-700"/></div><Card><div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-bold text-slate-900">Materiais em estoque</h2><p className="mt-1 text-xs text-slate-500">Saldos demonstrativos</p></div><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar material" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar material..." className="w-full bg-transparent text-xs outline-none sm:w-48"/></label></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-500"><th className="px-5 py-3">Material</th><th className="px-4 py-3">Código</th><th className="px-4 py-3">Disponível</th><th className="px-4 py-3">Estoque mínimo</th><th className="px-4 py-3">Situação</th></tr></thead><tbody data-reveal-group>{filteredStock.map((item) => <tr data-reveal-item key={item.code} className="border-b border-slate-100"><td className="px-5 py-4 text-xs font-semibold text-slate-800">{item.name}</td><td className="px-4 py-4 font-mono text-xs text-slate-500">{item.code}</td><td className="px-4 py-4 text-xs font-semibold text-slate-700">{item.quantity} {item.unit}</td><td className="px-4 py-4 text-xs text-slate-500">{item.minimum} {item.unit}</td><td className="px-4 py-4"><StatusBadge status="Crítico"/></td></tr>)}</tbody></table>{filteredStock.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">Nenhum material encontrado.</p>}</div></Card></> }

function downloadRequestPdf(request: (typeof requests)[number]) {
  const ascii = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, " ");
  const escape = (value: string) => ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const lines = ["Comprovante de requisicao de materiais", `Requisicao: ${request.id}`, `Solicitante: ${request.requester}`, `Setor: ${request.sector}`, `Ordem de servico: ${request.order}`, `Data: ${request.date}`, `Status: ${request.status}`, `Material requisitado: ${request.items}`];
  const content = lines.map((line, index) => `BT /F1 ${index === 0 ? 18 : 12} Tf 52 ${790 - index * 34} Td (${escape(line)}) Tj ET`).join("\n");
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `comprovante-${request.id}.pdf`; anchor.click(); URL.revokeObjectURL(url);
}

function requestDateValue(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  return year ? new Date(year, month - 1, day).getTime() : Number.NaN;
}

function downloadHistorySpreadsheet(rows: RequestRecord[], filename: string) {
  const columns = ["Requisição", "Ordem de serviço", "Solicitante", "Setor", "Turno", "Data desejada da entrega", "Status", "Materiais"];
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const content = [columns, ...rows.map((row) => [row.id, row.order, row.requester, row.sector, row.shift ?? "", row.date, row.status, row.items])]
    .map((line) => line.map(escapeCell).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function HistoryPage() {
  const allRequests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const [selectedRequest, setSelectedRequest] = useState<(typeof requests)[number] | null>(null);
  useDialogAccessibility(Boolean(selectedRequest), () => setSelectedRequest(null));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [exportPeriod, setExportPeriod] = useState("15");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const filteredRows = allRequests.filter((request) => (request.status === "Concluído" || request.status === "Aprovado") && [request.id, request.order, request.requester, request.items].join(" ").toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")) && (statusFilter === "Todos" || request.status === statusFilter));
  const now = new Date();
  const exportRows = filteredRows.filter((request) => {
    const value = requestDateValue(request.date);
    if (!Number.isFinite(value)) return false;
    if (exportPeriod === "all") return true;
    if (exportPeriod === "custom") {
      const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
      const to = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
      return value >= from && value <= to;
    }
    const days = Number(exportPeriod);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    return value >= start && value < end;
  });
  function exportHistory() {
    const label = exportPeriod === "custom" ? `${dateFrom || "inicio"}-a-${dateTo || "hoje"}` : exportPeriod === "all" ? "todo-periodo" : `ultimos-${exportPeriod}-dias`;
    downloadHistorySpreadsheet(exportRows, `historico-requisicoes-${label}.csv`);
  }
  return <><PageHeading eyebrow="Operação &#183; Registros" title="Histórico de requisições" description="Consulte pedidos anteriores e gere comprovantes."/><Card><div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-bold text-slate-900">Requisições aprovadas e concluídas</h2><p className="mt-1 text-xs text-slate-500">Pedidos aceitos ou finalizados no almoxarifado</p></div><div className="flex flex-wrap gap-2"><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar historico" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." className="w-28 bg-transparent text-xs outline-none sm:w-40"/></label><label className="sr-only" htmlFor="history-status">Filtrar pelo status</label><select id="history-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"><option>Todos</option><option value="Aprovado">Aprovado</option><option value={"Conclu\u00eddo"}>Conclu&#237;do</option></select></div></div><div className="flex flex-col gap-3 border-y border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex flex-wrap items-end gap-3"><label className="text-xs font-semibold text-slate-700">Período do arquivo<select aria-label="Período para exportação" value={exportPeriod} onChange={(event) => setExportPeriod(event.target.value)} className="mt-1 block h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="15">Últimos 15 dias</option><option value="30">Últimos 30 dias</option><option value="60">Últimos 60 dias</option><option value="custom">Intervalo personalizado</option><option value="all">Todo o histórico</option></select></label>{exportPeriod === "custom" && <><label className="text-xs font-semibold text-slate-700">De<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1 block h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"/></label><label className="text-xs font-semibold text-slate-700">Até<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1 block h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"/></label></>}</div><div className="flex items-center gap-3"><span className="text-xs text-slate-500">{exportRows.length} registros</span><Button onClick={exportHistory} disabled={!exportRows.length}><FileSpreadsheet size={16}/>Baixar planilha Excel</Button></div></div><RequestsTable rows={filteredRows} onViewDetails={setSelectedRequest}/></Card>
    {selectedRequest && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedRequest(null); }}><section role="dialog" aria-modal="true" aria-labelledby="request-detail-title" className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs font-bold text-brand">{selectedRequest.id}</p><h2 id="request-detail-title" className="mt-2 text-lg font-bold text-slate-900">Detalhes da requisição</h2></div><button aria-label="Fechar detalhes" onClick={() => setSelectedRequest(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div><div className="mt-5 grid gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Solicitante</p><p className="mt-1 text-sm font-semibold text-slate-800">{selectedRequest.requester}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Setor</p><p className="mt-1 text-sm font-semibold text-slate-800">{selectedRequest.sector}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ordem de serviço</p><p className="mt-1 font-mono text-sm font-semibold text-slate-800">{selectedRequest.order}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Data</p><p className="mt-1 text-sm font-semibold text-slate-800">{selectedRequest.date}</p></div></div><div className="mt-4 rounded-lg border border-slate-100 p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Materiais requisitados</p><p className="mt-2 text-sm font-semibold text-slate-800">{selectedRequest.items}</p><div className="mt-3"><StatusBadge status={selectedRequest.status}/></div></div><div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row"><Button variant="secondary" onClick={() => setSelectedRequest(null)}>Fechar</Button><Button onClick={() => downloadRequestPdf(selectedRequest)}><FileText size={16}/>Baixar comprovante PDF</Button></div></section></div>}
  </>;
}
function LoginPage({ requester = false }: { requester?: boolean }) {
  const suffix = requester ? ".funcionario" : ".almoxarife";
  const target = requester ? "/materiais" : "/painel";
  return <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8"><ThemeToggle className="fixed right-4 top-4 z-40"/><div className="w-full max-w-[440px]">
    <Link href="/login" aria-label="Voltar ao acesso Marcon" className="mb-8 flex flex-col items-center gap-2"><BrandLogo className="w-[184px]"/><span className="text-[10px] font-medium uppercase tracking-[.16em] text-slate-400">Almoxarifado</span></Link>
    <Card className="p-6 sm:p-8"><div className="mb-7"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.14em] text-brand">Acesso ao sistema</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">{requester ? "Acesso do funcion\u00e1rio" : "Acesso do almoxarife"}</h1><p className="mt-2 text-sm text-slate-500">{requester ? "Entre para solicitar e acompanhar materiais da f\u00e1brica." : "Entre para gerenciar pedidos e o estoque do almoxarifado."}</p></div>
    <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">C&#243;digo de acesso</span><input type="text" placeholder={requester ? "ex.: 123456.funcionario" : "ex.: 123456.almoxarife"} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/><span className="mt-2 block text-[11px] text-slate-500">Seu c&#243;digo deve terminar com <strong className="font-semibold text-slate-700">{suffix}</strong>.</span></label>
    <div className="mt-5"><FormField label="Senha" placeholder="Digite sua senha" type="password"/></div><div className="my-5 flex items-center justify-between"><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" className="h-4 w-4 rounded accent-brand"/>Manter conectado</label><a href="#" className="text-xs font-semibold text-brand">Esqueceu a senha?</a></div>
    <Link href={target} className="ui-button ui-button--primary w-full">Entrar <ArrowRight size={16}/></Link><div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">{requester ? "Acesso do almoxarife?" : "\u00c9 usu\u00e1rio da f\u00e1brica?"} <Link className="font-semibold text-brand" href="/login">Voltar ao acesso</Link></div></Card>
    <p className="mt-5 text-center text-[11px] text-slate-400">Ambiente de demonstra&#231;&#227;o &#183; C&#243;digos de exemplo</p></div></main>;
}
function LoginChoice() {
  return <main className="relative flex min-h-screen items-center justify-center bg-[#F4F7FB] px-4 py-10"><ThemeToggle className="fixed right-4 top-4 z-40"/><div className="w-full max-w-3xl"><div className="mb-9 text-center"><BrandLogo className="mx-auto mb-3 w-[184px]"/><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Gestão de almoxarifado</p><h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Como você deseja acessar?</h1><p className="mt-2 text-sm text-slate-500">Escolha o perfil que corresponde à sua função.</p></div><div className="grid gap-4 md:grid-cols-2"><Link href="/login/requisitante" className="group"><Card className="h-full p-6 transition hover:border-blue-300 hover:ring-2 hover:ring-blue-50 sm:p-7"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-brand"><ClipboardList size={21}/></span><h2 className="mt-5 text-base font-bold text-slate-900">Usuário da fábrica</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">Solicite materiais para sua ordem de serviço e acompanhe o pedido.</p><span className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white group-hover:bg-brand-strong">Acessar como requisitante <ArrowRight size={16}/></span></Card></Link><Link href="/login/almoxarife" className="group"><Card className="h-full p-6 transition hover:border-blue-300 hover:ring-2 hover:ring-blue-50 sm:p-7"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Boxes size={21}/></span><h2 className="mt-5 text-base font-bold text-slate-900">Almoxarife</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">Gerencie fila, separação, inventário e histórico de requisições.</p><span className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 group-hover:bg-slate-50">Acessar como almoxarife <ArrowRight size={16}/></span></Card></Link></div><p className="mt-6 text-center text-[11px] text-slate-400">Acesso demonstrativo - Sem autenticação real</p></div></main>;
}

export default function WarehouseScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login") return <LoginChoice/>;
  if (pathname.startsWith("/login")) return <LoginPage requester={pathname.includes("requisitante")}/>;
  if (pathname === "/chat") return <RequesterLayout><RequestChat role="employee"/></RequesterLayout>;
  if (pathname === "/notificacoes") return <RequesterLayout><EmployeeNotifications/></RequesterLayout>;
  if (pathname === "/acompanhar") return <RequesterLayout><RequestSearch/></RequesterLayout>;
  if (pathname === "/materiais" || pathname === "/pedido" || pathname === "/acompanhar" || pathname === "/meu-estoque") return <RequesterLayout>{pathname === "/materiais" ? <MaterialSelection/> : pathname === "/pedido" ? <RequestSubmissionForm/> : pathname === "/acompanhar" ? <TrackingPage/> : <SectorStockPage/>}</RequesterLayout>;
  const content: Record<string, ReactNode> = { "/": <Dashboard/>, "/painel": <Dashboard/>, "/analises": <AnalyticsPage/>, "/fila": <WarehouseQueue/>, "/pedido": <RequestForm/>, "/materiais": <MaterialSelection/>, "/acompanhar": <TrackingPage/>, "/separacao": <SeparationPage/>, "/estoque-setor": <SectorStockPage isWarehouse/>, "/qrcode": <QrPage/>, "/historico": <HistoryPage/>, "/inventario": <InventoryPage/> };
  content["/fila"] = <WarehouseQueue/>;
  content["/conversas"] = <RequestChat role="warehouse"/>;
  content["/inventario"] = <InventoryScreen/>;
  content["/compras"] = <PurchaseCart/>;
  content["/perfil"] = <WarehouseProfileScreen/>;
  return <div className="warehouse-app"><a href="#main-content" className="skip-link">Pular para o conteúdo</a><Sidebar open={menuOpen} close={() => setMenuOpen(false)}/><div className="shell-main" inert={menuOpen}><Topbar menuOpen={menuOpen} onMenu={() => setMenuOpen(true)}/><main id="main-content" tabIndex={-1} className="warehouse-content">{content[pathname] || <Dashboard/>}</main><footer className="product-footer"><span>Marcon <span aria-hidden="true">/</span> Gestão de materiais</span><span>Ambiente demonstrativo</span></footer></div></div>;
}
