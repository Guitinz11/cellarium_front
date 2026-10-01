"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowDownToLine, Bell, Check, ChevronDown, Package, RotateCcw, Search, Send } from "lucide-react";
import { materialsCatalog, sectors } from "@/lib/mock-data";
import { getAllRequests, getServerRequests, subscribeToRequests, updateRequestStatus } from "@/lib/request-storage";
import { getRequesterCode, getRequesterSector, getUserRole, getServerRequesterValue, subscribeToRequesterSession } from "@/lib/requester-session";
import { getReadNotificationsSnapshot, getServerReadNotificationsSnapshot, markNotificationAsRead, parseReadNotificationIds, subscribeToReadNotifications } from "@/lib/notification-storage";

import { Button, Metric, PageHeading } from "@/components/ui";
import { useDialogAccessibility } from "@/components/use-dialog-accessibility";

type SectorItem = {
  code: string;
  name: string;
  sector: string;
  quantity: number;
  minimum: number;
  unit: string;
};

type SectorMessage = {
  id: string;
  code: string;
  itemName: string;
  sector: string;
  text: string;
  createdAt: number;
};

type SectorStockData = { items: SectorItem[]; messages: SectorMessage[]; closedRequestIds?: string[] };

const storageKey = "marcon-sector-stock-v2";
const initialData: SectorStockData = {
  items: [
    { code: "CS-001", name: "Arame de Solda MIG/MAG Solid ER70S-6 - 1.2mm", sector: "Montagem e Pintura", quantity: 30, minimum: 8, unit: "Rolo" },
    { code: "EP-008", name: "Luva de Raspa Cano Longo", sector: "Montagem e Pintura", quantity: 4, minimum: 6, unit: "Par" },
    { code: "AB-001", name: "Disco de Corte para Aço Carbono 4.1/2\" x 1.0mm", sector: "Usinagem e Solda", quantity: 12, minimum: 5, unit: "Unidade" },
    { code: "UT-005", name: "Fita Veda Rosca PTFE", sector: "Usinagem e Solda", quantity: 18, minimum: 10, unit: "Rolo" },
  ],
  messages: [
    {
      id: "notice-initial",
      code: "CS-001",
      itemName: "Arame de Solda MIG/MAG Solid ER70S-6 - 1.2mm",
      sector: "Montagem e Pintura",
      text: "O material já está disponível no estoque do seu setor.",
      createdAt: new Date("2026-09-25T11:30:00.000Z").getTime(),
    },
  ],
};

function parseSavedData(saved: string): SectorStockData {
  try {
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && "items" in parsed && "messages" in parsed && Array.isArray(parsed.items) && Array.isArray(parsed.messages)) {
        const closedRequestIds = "closedRequestIds" in parsed && Array.isArray(parsed.closedRequestIds)
          ? parsed.closedRequestIds.filter((id): id is string => typeof id === "string")
          : [];
        return { ...parsed, closedRequestIds } as SectorStockData;
      }
    }
  } catch {
    return initialData;
  }
  return initialData;
}

function subscribeToSectorStock(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("marcon-sector-stock-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("marcon-sector-stock-change", callback);
  };
}

function getSectorStockSnapshot() {
  return localStorage.getItem(storageKey) ?? "";
}

function getServerSectorStockSnapshot() {
  return "";
}

export default function SectorStockPage({ isWarehouse = false }: { isWarehouse?: boolean }) {
  const snapshot = useSyncExternalStore(subscribeToSectorStock, getSectorStockSnapshot, getServerSectorStockSnapshot);
  const [dataOverride, setDataOverride] = useState<SectorStockData | null>(null);
  const data = dataOverride ?? parseSavedData(snapshot);
  const [sector, setSector] = useState("Montagem e Pintura");
  const [search, setSearch] = useState("");
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [ordersExpanded, setOrdersExpanded] = useState(true);
  const requests = useSyncExternalStore(subscribeToRequests, getAllRequests, getServerRequests);
  const [closingOrder, setClosingOrder] = useState<(typeof requests)[number] | null>(null);
  useDialogAccessibility(Boolean(closingOrder), () => setClosingOrder(null));
  const [leftovers, setLeftovers] = useState<Record<string, string>>({});
  const [closingError, setClosingError] = useState("");
  const [closureMessage, setClosureMessage] = useState("");
  const userRole = useSyncExternalStore(subscribeToRequesterSession, getUserRole, getServerRequesterValue);
  const requesterCode = useSyncExternalStore(subscribeToRequesterSession, getRequesterCode, getServerRequesterValue);
  const requesterSector = useSyncExternalStore(subscribeToRequesterSession, getRequesterSector, getServerRequesterValue);
  const activeSector = isWarehouse ? sector : requesterSector || sector;
  const openOrders = requests.filter((request) => ["Em andamento", "Aprovado"].includes(request.status) && (isWarehouse || request.sector === activeSector));
  const canCloseOrder = !isWarehouse && userRole !== "almoxarife" && (userRole === "requisitante" || Boolean(requesterCode));

  function updateData(update: (current: SectorStockData) => SectorStockData) {
    const next = update(data);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event("marcon-sector-stock-change"));
      setDataOverride(null);
    } catch {
      setDataOverride(next);
    }
  }

  const visibleItems = data.items.filter((item) => {
    const matchesSector = item.sector === activeSector;
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return matchesSector && `${item.name} ${item.code}`.toLocaleLowerCase("pt-BR").includes(query);
  });
  const sectorMessages = data.messages.filter((message) => message.sector === activeSector).slice().sort((a, b) => b.createdAt - a.createdAt);
  const readScope = `employee:${requesterCode || activeSector || "default"}`;
  const readSnapshot = useSyncExternalStore(subscribeToReadNotifications, () => getReadNotificationsSnapshot(readScope), getServerReadNotificationsSnapshot);
  const readIds = parseReadNotificationIds(readSnapshot);
  const unreadSectorMessages = sectorMessages.filter((message) => !readIds.includes(message.id));
  const totalUnits = visibleItems.reduce((total, item) => total + item.quantity, 0);
  const lowStockCount = visibleItems.filter((item) => item.quantity <= item.minimum).length;

  function adjustQuantity(code: string, change: number) {
    updateData((current) => ({
      ...current,
      items: current.items.map((item) => item.code === code
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item),
    }));
  }

  function sendAvailabilityMessage(item: SectorItem) {
    const message: SectorMessage = {
      id: `${item.code}-${Date.now()}`,
      code: item.code,
      itemName: item.name,
      sector: item.sector,
      text: `${item.name} já está disponível no estoque do setor. Saldo atual: ${item.quantity} ${item.unit}.`,
      createdAt: Date.now(),
    };
    updateData((current) => ({ ...current, messages: [message, ...current.messages] }));
    setSentMessages((current) => [...current, item.code]);
  }

  function closeOrderWithLeftovers() {
    if (!closingOrder || !canCloseOrder) return;
    setClosingError("");
    const latestOrder = getAllRequests().find((request) => request.id === closingOrder.id);
    if (!latestOrder?.deliveryConfirmed || !["Em andamento", "Aprovado"].includes(latestOrder.status)) {
      setClosingError("Esta OS precisa estar aberta e com a entrega confirmada pelo almoxarife.");
      return;
    }
    for (const [index, entry] of closingOrder.items.split(";").entries()) {
      const requestedQuantity = Number(entry.trim().match(/·\s*(\d+(?:[,.]\d+)?)/)?.[1]?.replace(",", "."));
      const quantity = Number((leftovers[String(index)] ?? "0").replace(",", "."));
      if (!Number.isFinite(quantity) || quantity < 0 || (Number.isFinite(requestedQuantity) && quantity > requestedQuantity)) {
        setClosingError("Informe uma sobra entre zero e a quantidade entregue de cada material.");
        return;
      }
    }
    try {
      const savedData = parseSavedData(localStorage.getItem(storageKey) ?? "");
      const closedRequestIds = savedData.closedRequestIds ?? [];
      if (!closedRequestIds.includes(closingOrder.id)) {
        const nextItems = savedData.items.map((item) => ({ ...item }));
        closingOrder.items.split(";").forEach((entry, index) => {
          const match = entry.trim().match(/^(.*?)\s*·\s*(\d+(?:[,.]\d+)?)\s*(.*)$/);
          const material = materialsCatalog.find((item) => item.name.toLocaleLowerCase("pt-BR") === (match?.[1] ?? entry.trim()).toLocaleLowerCase("pt-BR"));
          const quantity = Math.max(0, Number((leftovers[String(index)] ?? "0").replace(",", ".")) || 0);
          if (!material || quantity === 0) return;

          const existingIndex = nextItems.findIndex((item) => item.code === material.code && item.sector === closingOrder.sector);
          if (existingIndex >= 0) {
            nextItems[existingIndex] = { ...nextItems[existingIndex], quantity: nextItems[existingIndex].quantity + quantity };
          } else {
            nextItems.push({
              code: material.code,
              name: material.name,
              sector: closingOrder.sector,
              quantity,
              minimum: material.minimum,
              unit: match?.[3]?.trim() || material.unit,
            });
          }
        });
        localStorage.setItem(storageKey, JSON.stringify({
          ...savedData,
          items: nextItems,
          closedRequestIds: [...closedRequestIds, closingOrder.id],
        }));
        window.dispatchEvent(new Event("marcon-sector-stock-change"));
      }
      updateRequestStatus(closingOrder.id, "Concluído", JSON.stringify(leftovers));
      setClosureMessage(`${closingOrder.order} encerrada. As sobras foram registradas no estoque do setor.`);
      setClosingOrder(null);
    } catch {
      setClosingError("Não foi possível salvar a devolução. Verifique o armazenamento do navegador e tente novamente.");
    }
  }

  const heading = isWarehouse ? "Estoque dos setores" : "Estoque do meu setor";

  return (
    <>
      <PageHeading eyebrow="Controle de materiais" title={heading} description={isWarehouse ? "Consulte os saldos locais e avise os setores sobre os materiais disponíveis." : "Acompanhe o saldo do setor e registre as sobras após utilizar os materiais."} action={isWarehouse ? <label className="text-xs text-slate-500">Setor<select aria-label="Selecionar setor do estoque" value={sector} onChange={(event) => setSector(event.target.value)} className="mt-1.5 block h-11 max-w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-800">{sectors.map((option) => <option key={option}>{option}</option>)}</select></label> : undefined}/>


      <section id="fechar-os" className="mb-6 scroll-mt-32 rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-label="Ordens de serviço em andamento">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><RotateCcw size={17} className="text-brand"/>{isWarehouse ? "OS em atendimento" : "Fechar OS e devolver sobras"}</h2>
          <button type="button" aria-expanded={ordersExpanded} aria-controls="open-orders-list" aria-label={ordersExpanded ? "Minimizar OS em andamento" : "Expandir OS em andamento"} onClick={() => setOrdersExpanded((expanded) => !expanded)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
            <ChevronDown size={18} className={`transition-transform ${ordersExpanded ? "" : "-rotate-90"}`} />
          </button>
        </div>
        <div id="open-orders-list" hidden={!ordersExpanded}>
          <p className="mt-1 text-xs text-slate-500">Selecione a OS após utilizar os materiais e informe o que será devolvido ao estoque do setor.</p>
          {openOrders.length ? <div className="mt-4 divide-y divide-slate-100">{openOrders.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-mono text-xs font-bold text-brand">{request.order} · {request.id}</p><p className="mt-1 text-xs text-slate-600">{request.requester} · {request.items}</p>{!isWarehouse && <p className={`mt-1 text-[11px] font-semibold ${request.deliveryConfirmed ? "text-emerald-700" : "text-amber-700"}`}>{request.deliveryConfirmed ? "Entrega confirmada pelo almoxarife" : "Aguardando confirmação da entrega pelo almoxarife"}</p>}</div>{canCloseOrder && (request.deliveryConfirmed ? <button type="button" onClick={() => { setClosingOrder(request); setLeftovers({}); setClosingError(""); setClosureMessage(""); }} className="ui-button ui-button--primary shrink-0"><RotateCcw size={15}/>Fechar OS e registrar sobras</button> : <span className="text-xs font-semibold text-slate-400">Fechamento indisponível</span>)}</div>)}</div> : <p className="mt-4 text-xs text-slate-500">Nenhuma OS aprovada ou em andamento para este setor. As ordens aparecerão aqui após o aceite do almoxarife.</p>}
        </div>
      </section>
      {closureMessage && <p role="status" className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800"><Check size={16}/>{closureMessage}</p>}
      {canCloseOrder && closingOrder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
        <section role="dialog" aria-modal="true" aria-labelledby="close-order-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-7">
          <h2 id="close-order-title" className="text-lg font-bold text-slate-900">Fechar {closingOrder.order}</h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">Informe as sobras de cada material. Ao confirmar, elas voltam ao saldo do setor e a OS é encerrada. Use 0 quando todo o material foi utilizado.</p>
          <form onSubmit={(event) => { event.preventDefault(); closeOrderWithLeftovers(); }}>
            <div className="mt-5 space-y-3">{closingOrder.items.split(";").map((entry, index) => {
              const maximum = Number(entry.trim().match(/·\s*(\d+(?:[,.]\d+)?)/)?.[1]?.replace(",", "."));
              return <label key={closingOrder.id + "-" + index} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <span className="min-w-0 text-xs leading-5 text-slate-700">{entry.trim()}</span>
                <input aria-label={"Quantidade sobrante: " + entry.trim()} type="number" required min="0" max={Number.isFinite(maximum) ? maximum : undefined} step="any" value={leftovers[String(index)] ?? "0"} onChange={(event) => { setLeftovers((current) => ({ ...current, [String(index)]: event.target.value })); setClosingError(""); }} className="h-11 w-20 shrink-0 rounded-md border border-slate-200 px-2 text-center text-sm"/>
              </label>;
            })}</div>
            {closingError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{closingError}</p>}
            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row"><Button variant="secondary" onClick={() => setClosingOrder(null)}>Cancelar</Button><Button type="submit">Salvar sobras e fechar OS</Button></div>
          </form>
        </section>
      </div>}
      <div className="metrics-strip"><Metric label="Materiais no setor" value={visibleItems.length} note="Itens do setor selecionado"/><Metric label="Quantidade em estoque" value={totalUnits} note="Soma das quantidades cadastradas"/><Metric label="No mínimo ou abaixo" value={lowStockCount} note="Materiais que merecem atenção" tone="warning"/></div>

      {!isWarehouse && <section aria-label="Avisos do almoxarifado" className="mb-7">
        <div className="mb-3 flex items-center gap-2"><Bell size={15} className="text-amber-700"/><h2 className="text-sm font-semibold text-slate-900">Avisos do almoxarifado</h2><span className="text-[11px] text-slate-400">{unreadSectorMessages.length}</span></div>
        {unreadSectorMessages.length ? <div className="divide-y divide-amber-200 border-l-2 border-amber-500 bg-amber-50/60">
          {unreadSectorMessages.slice(0, 3).map((message) => <div key={message.id} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-800"><Package size={14}/></span>
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-900">{message.itemName} <span className="font-normal text-slate-500">· {message.code}</span></p><p className="mt-1 text-xs leading-5 text-slate-600">{message.text}</p></div>
            <time className="shrink-0 text-[10px] text-slate-500">{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(message.createdAt)}</time>
            <button type="button" aria-label={`Marcar como lido: ${message.itemName}`} title="Marcar como lido" onClick={() => markNotificationAsRead(readScope, message.id)} className="rounded-md p-1.5 text-slate-500 transition hover:bg-emerald-100 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"><Check size={15}/></button>
          </div>)}
        </div> : <p className="border-y border-slate-200 py-4 text-xs text-slate-500">Nenhum aviso novo para este setor.</p>}
      </section>}

      <section aria-label="Materiais disponíveis no setor">
        <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h2 className="text-sm font-semibold text-slate-900">Saldo por material</h2><p className="mt-1 text-xs text-slate-500">Ajuste o estoque conforme entradas e retiradas.</p></div>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar material no estoque do setor" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar material" className="w-full bg-transparent text-xs text-slate-700 outline-none sm:w-48"/></label>
        </div>
        <div className="border-y border-slate-200">
          {visibleItems.length ? visibleItems.map((item) => {
            const amount = amounts[item.code] ?? 1;
            const low = item.quantity <= item.minimum;
            return <article key={item.code} className="grid gap-4 border-b border-slate-100 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="flex min-w-0 items-start gap-3 px-1">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${low ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}><Package size={17}/></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-sm font-semibold text-slate-900">{item.name}</h3><span className={`text-[10px] font-semibold ${low ? "text-amber-800" : "text-emerald-800"}`}>{low ? "Estoque baixo" : "Disponível"}</span></div><p className="mt-1 font-mono text-[10px] text-slate-500">{item.code} <span className="font-sans">· mínimo {item.minimum} {item.unit}</span></p></div>
                <p className="shrink-0 text-right"><span className="block text-xl font-semibold leading-none tabular-nums text-slate-950">{item.quantity}</span><span className="mt-1 block text-[10px] text-slate-500">{item.unit}</span></p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                <label className="sr-only" htmlFor={`amount-${item.code}`}>Quantidade para ajuste de {item.name}</label>
                <input id={`amount-${item.code}`} type="number" min="1" max="9999" value={amount} onChange={(event) => setAmounts((current) => ({ ...current, [item.code]: Math.max(1, Number(event.target.value) || 1) }))} className="h-9 w-[72px] rounded-md border border-slate-200 bg-white px-2 text-center text-xs tabular-nums text-slate-800"/>
                <button type="button" onClick={() => adjustQuantity(item.code, -amount)} disabled={item.quantity === 0} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ArrowDownToLine size={14}/><span>Dar baixa</span></button>
                {isWarehouse && item.quantity > 0 && <button type="button" onClick={() => sendAvailabilityMessage(item)} disabled={sentMessages.includes(item.code)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-brand transition hover:bg-blue-50 disabled:text-emerald-700"><span>{sentMessages.includes(item.code) ? <Check size={14}/> : <Send size={14}/>}</span><span>{sentMessages.includes(item.code) ? "Aviso enviado" : "Avisar setor"}</span></button>}
              </div>
            </article>;
          }) : <p className="py-10 text-center text-sm text-slate-500">Nenhum material encontrado neste setor.</p>}
        </div>
      </section>
      <p className="mt-4 text-[10px] leading-5 text-slate-400">Saldos demonstrativos, salvos neste navegador. A integração com a balança e o sistema central será necessária para atualização em tempo real.</p>
    </>
  );
}
