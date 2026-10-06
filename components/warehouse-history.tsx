"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { CalendarClock, Package, RefreshCw, Search, UserRound } from "lucide-react";
import { Button, PageHeading } from "@/components/ui";
import {
  ApiError,
  getAccessToken,
  listMovements,
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

function formatQuantity(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);
}

export default function WarehouseHistory() {
  const [movements, setMovements] = useState<ApiMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try {
      if (!getAccessToken()) throw new ApiError("Entre no sistema para consultar movimentações do banco.", 401);
      const result = await listMovements();
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

  return <>
    <PageHeading eyebrow="Operação · Auditoria" title="Histórico de movimentações" description="Saídas e ajustes registrados, com responsável, setor e saldo do estoque." />
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><Button variant="secondary" onClick={() => void reload()}><RefreshCw size={15}/>Tentar novamente</Button></div>}
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold text-slate-900">Movimentações registradas</h2><p className="mt-1 text-xs text-slate-500">{entries.length} registros · {filtered.length} linhas de item</p></div><div className="flex gap-2"><label className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-400"><Search size={15}/><input aria-label="Buscar movimentação" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs text-slate-700 outline-none sm:w-52" placeholder="Material, pessoa ou setor"/></label><Button variant="secondary" aria-label="Atualizar histórico" title="Atualizar histórico" onClick={() => void reload()}><RefreshCw size={15}/></Button></div></div>
      {loading ? <p role="status" className="border-t border-slate-100 p-6 text-sm text-slate-500">Carregando histórico…</p> : entries.length ? <ul className="movement-history-list">{entries.map((entry) => {
        const primary = entry.movements[0];
        const itemTotals = new Map<string, { material: string; quantity: number; unit: string }>();
        for (const movement of entry.movements) {
          const unit = movement.unidade?.trim() ?? "";
          const itemKey = `${movement.material_id}:${unit}`;
          const current = itemTotals.get(itemKey);
          if (current) current.quantity += movement.quantidade;
          else itemTotals.set(itemKey, { material: movement.material, quantity: movement.quantidade, unit });
        }
        const items = [...itemTotals.values()];
        const employee = primary.solicitante || primary.usuario;
        const requestDate = entry.isRequest ? primary.requisicao_data || primary.data : primary.data;
        const requestNumber = primary.requisicao_numero || (primary.requisicao_id ? `REQ-${primary.requisicao_id}` : "Movimentação avulsa");
        return <li key={entry.key} className="movement-history-entry">
          <header className="movement-history-heading">
            <div className="min-w-0"><span className="movement-history-kind">{entry.isRequest ? "Retirada por requisição" : movementType(primary.tipo)}</span><h3>{requestNumber}</h3><p>{primary.setor ?? "Setor não informado"}</p></div>
            <time className="movement-history-date" dateTime={requestDate}><CalendarClock size={16} aria-hidden="true"/><span><small>{entry.isRequest ? "Requisitada em" : "Registrada em"}</small><strong>{formatDate(requestDate)}</strong></span></time>
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
