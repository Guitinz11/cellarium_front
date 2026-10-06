"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, EmptyState, PageHeading } from "@/components/ui";
import { ApiError, consumeSectorStock, listSectors, listSectorStock, listSectorStockHistory, type ApiSectorMovement, type ApiSectorStock, type ApiSector } from "@/lib/warehouse-api";

const date = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

export default function SectorStockLive({ warehouse = false }: { warehouse?: boolean }) {
  const [items, setItems] = useState<ApiSectorStock[]>([]);
  const [history, setHistory] = useState<ApiSectorMovement[]>([]);
  const [sectors, setSectors] = useState<ApiSector[]>([]);
  const [sectorId, setSectorId] = useState(0);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (warehouse && !sectorId) return;
    try { const [stock, movements] = await Promise.all([listSectorStock(warehouse ? sectorId : undefined), listSectorStockHistory(warehouse ? sectorId : undefined)]); setItems(stock); setHistory(movements); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível consultar o estoque do setor."); }
  }, [sectorId, warehouse]);
  useEffect(() => {
    if (!warehouse) return;
    const timer = window.setTimeout(() => { void listSectors().then((values) => { setSectors(values); setSectorId(values[0]?.id ?? 0); }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar setores.")); }, 0);
    return () => window.clearTimeout(timer);
  }, [warehouse]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);

  async function consume(item: ApiSectorStock) {
    const quantity = Number(quantities[item.material_id]);
    if (!Number.isFinite(quantity) || quantity <= 0) { setError("Informe uma quantidade maior que zero."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      await consumeSectorStock({ material_id: item.material_id, quantidade: quantity }, `consumo:${crypto.randomUUID()}`);
      setQuantities((current) => ({ ...current, [item.material_id]: "" }));
      setMessage(`Consumo registrado para ${item.material}.`); await refresh();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Não foi possível registrar o consumo."); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-5xl">
    <PageHeading eyebrow="Saldo do setor" title={warehouse ? "Estoque por setor" : "Meu estoque"} description="Materiais recebidos em requisições concluídas e consumos registrados." action={<div className="flex items-center gap-2">{warehouse && <label><span className="sr-only">Setor</span><select className="h-10 border border-slate-300 px-3 text-sm" value={sectorId} onChange={(event) => setSectorId(Number(event.target.value))}><option value={0}>Selecione setor</option>{sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.nome}</option>)}</select></label>}<Button variant="secondary" onClick={() => void refresh()}>Atualizar</Button></div>}/>
    {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}{message && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    <Card className="p-5 sm:p-6"><div className="mb-3"><h2 className="text-sm font-semibold text-slate-900">Saldo disponível</h2><p className="mt-1 text-xs text-slate-500">{items.length} materiais com saldo</p></div>
      {items.length ? <div className="divide-y divide-slate-100">{items.map((item) => <article key={item.material_id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><h3 className="text-sm font-semibold text-slate-900">{item.material}</h3><p className="mt-1 text-xs text-slate-500">{item.codigo} · Saldo: <strong className="text-slate-800">{item.quantidade_atual} {item.unidade_sigla}</strong></p></div>{!warehouse && <div className="flex items-center gap-2"><label className="sr-only" htmlFor={`consume-${item.material_id}`}>Quantidade consumida de {item.material}</label><input id={`consume-${item.material_id}`} type="number" min="0.001" step="0.001" max={item.quantidade_atual} value={quantities[item.material_id] ?? ""} onChange={(event) => setQuantities((current) => ({ ...current, [item.material_id]: event.target.value }))} className="h-10 w-24 border border-slate-300 px-3 text-sm" placeholder="Qtd."/><Button disabled={busy} onClick={() => void consume(item)}>Registrar consumo</Button></div>}</article>)}</div> : <EmptyState title={warehouse && !sectorId ? "Selecione um setor" : "Nenhum saldo disponível"} description={warehouse && !sectorId ? "Escolha um setor para consultar o saldo." : "Materiais atendidos para o setor aparecerão aqui."}/>}
    </Card>
    <Card className="mt-5 p-5 sm:p-6"><div className="mb-3"><h2 className="text-sm font-semibold text-slate-900">Movimentações recentes</h2><p className="mt-1 text-xs text-slate-500">Entradas de requisições e consumos do setor</p></div>{history.length ? <ul className="divide-y divide-slate-100">{history.map((movement) => <li key={movement.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span><strong className="text-slate-800">{movement.material}</strong><span className="ml-2 text-slate-500">{movement.tipo.replaceAll("_", " ")}</span>{movement.observacao && <span className="block text-xs text-slate-500">{movement.observacao}</span>}</span><span className="text-right text-slate-800">{movement.tipo === "CONSUMO" || movement.tipo.startsWith("DEVOLUCAO") ? "−" : "+"}{movement.quantidade}<small className="block text-xs text-slate-500">{date(movement.created_at)}</small></span></li>)}</ul> : <EmptyState title="Sem movimentações" description="As entradas e os consumos registrados ficarão no histórico."/>}</Card>
  </div>;
}
