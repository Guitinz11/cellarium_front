"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, EmptyState, PageHeading } from "@/components/ui";
import { ApiError, closeServiceOrder, consumeSectorStock, getRequestDetail, listMyRequests, listSectors, listSectorStock, listSectorStockHistory, type ApiRequestDetail, type ApiSectorMovement, type ApiSectorStock, type ApiSector } from "@/lib/warehouse-api";

const date = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

export default function SectorStockLive({ warehouse = false }: { warehouse?: boolean }) {
  const [items, setItems] = useState<ApiSectorStock[]>([]);
  const [history, setHistory] = useState<ApiSectorMovement[]>([]);
  const [sectors, setSectors] = useState<ApiSector[]>([]);
  const [sectorId, setSectorId] = useState(0);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [orders, setOrders] = useState<ApiRequestDetail[]>([]);
  const [closingOrderId, setClosingOrderId] = useState<number | null>(null);
  const [leftovers, setLeftovers] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (warehouse && !sectorId) return;
    try {
      const requestsPromise = warehouse ? Promise.resolve(undefined) : listMyRequests({ status: "ATENDIDA" });
      const [stock, movements, requestResult] = await Promise.all([
        listSectorStock(warehouse ? sectorId : undefined),
        listSectorStockHistory(warehouse ? sectorId : undefined),
        requestsPromise,
      ]);
      setItems(stock);
      setHistory(movements);
      if (requestResult) {
        const openRequests = requestResult.dados.filter((request) => !request.os_encerrada_at);
        const details = await Promise.all(openRequests.map((request) => getRequestDetail(String(request.id))));
        setOrders(details.filter((request) => request.status === "ATENDIDA" && !request.os_encerrada_at));
      } else {
        setOrders([]);
      }
      setError("");
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível consultar o estoque do setor."); }
  }, [sectorId, warehouse]);
  useEffect(() => {
    if (!warehouse) return;
    const timer = window.setTimeout(() => { void listSectors().then((values) => { setSectors(values); setSectorId(values[0]?.id ?? 0); }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar setores.")); }, 0);
    return () => window.clearTimeout(timer);
  }, [warehouse]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);

  function startClosingOrder(order: ApiRequestDetail) {
    setClosingOrderId(order.id);
    setLeftovers(Object.fromEntries(order.itens.filter((item) => item.quantidade_atendida > 0).map((item) => [item.id, "0"])));
    setError("");
    setMessage("");
  }

  async function closeOrder(order: ApiRequestDetail) {
    const deliveredItems = order.itens.filter((item) => item.quantidade_atendida > 0);
    const quantitiesToReturn = deliveredItems.map((item) => ({
      item_id: item.id,
      quantidade_sobrante: Number(leftovers[item.id]),
    }));
    if (quantitiesToReturn.some(({ quantidade_sobrante }, index) => {
      const raw = leftovers[deliveredItems[index].id];
      return raw === undefined || raw.trim() === "" || !Number.isFinite(quantidade_sobrante)
        || quantidade_sobrante < 0 || quantidade_sobrante > deliveredItems[index].quantidade_atendida;
    })) {
      setError("Informe a sobra entre zero e a quantidade entregue de cada material.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await closeServiceOrder(order.id, quantitiesToReturn);
      setClosingOrderId(null);
      setLeftovers({});
      setMessage(`${order.numero} fechada. As sobras ficaram disponíveis no estoque compartilhado do setor.`);
      await refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível fechar a OS.");
    } finally {
      setBusy(false);
    }
  }

  async function consume(item: ApiSectorStock) {
    const quantity = Number(quantities[item.material_id]);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > item.quantidade_atual) { setError("Informe uma quantidade positiva que não ultrapasse o saldo do setor."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      await consumeSectorStock({ material_id: item.material_id, quantidade: quantity }, `consumo:${crypto.randomUUID()}`);
      setQuantities((current) => ({ ...current, [item.material_id]: "" }));
      setMessage(`Consumo registrado para ${item.material}.`); await refresh();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Não foi possível registrar o consumo."); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-5xl">
    <PageHeading eyebrow="Saldo do setor" title={warehouse ? "Estoque por setor" : "Meu estoque"} description={warehouse ? "Consulte saldos setoriais e movimentações." : "Feche suas OS e registre retiradas do saldo compartilhado do setor."} action={<div className="flex items-center gap-2">{warehouse && <label><span className="sr-only">Setor</span><select className="h-10 border border-slate-300 px-3 text-sm" value={sectorId} onChange={(event) => setSectorId(Number(event.target.value))}><option value={0}>Selecione setor</option>{sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.nome}</option>)}</select></label>}<Button variant="secondary" onClick={() => void refresh()}>Atualizar</Button></div>}/>
    {error && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {message && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}

    {!warehouse && <Card className="mb-5 p-5 sm:p-6">
      <div className="mb-3"><h2 className="text-sm font-semibold text-slate-900">OS atendidas aguardando fechamento</h2><p className="mt-1 text-xs text-slate-500">Informe o que sobrou para deixar o saldo do setor atualizado para todos.</p></div>
      {orders.length ? <ul className="divide-y divide-slate-100">{orders.map((order) => {
        const deliveredItems = order.itens.filter((item) => item.quantidade_atendida > 0);
        const isClosing = closingOrderId === order.id;
        return <li key={order.id} className="py-4 first:pt-2 last:pb-0">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="font-mono text-xs font-semibold text-blue-800">{order.numero}</p><p className="mt-1 text-xs text-slate-600">{order.setor.nome} · {deliveredItems.length} {deliveredItems.length === 1 ? "material entregue" : "materiais entregues"}</p></div>{isClosing ? <Button variant="secondary" disabled={busy} onClick={() => setClosingOrderId(null)}>Cancelar</Button> : <Button variant="secondary" disabled={busy} onClick={() => startClosingOrder(order)}>Registrar sobras</Button>}</div>
          {isClosing && <form className="mt-4 rounded-md bg-slate-50 p-4" onSubmit={(event) => { event.preventDefault(); void closeOrder(order); }}>
            <p className="text-xs leading-5 text-slate-600">A entrega já está no saldo do setor. Ao fechar, o consumo será baixado e as sobras informadas continuarão disponíveis.</p>
            {deliveredItems.length ? <div className="mt-3 divide-y divide-slate-200">{deliveredItems.map((item) => <label key={item.id} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><span className="min-w-0 text-xs text-slate-700">{item.descricao} <span className="text-slate-500">· entregue {item.quantidade_atendida} {item.unidade.sigla || item.unidade.nome}</span></span><span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-700">Sobra<input aria-label={`Quantidade sobrante de ${item.descricao}`} required type="number" min="0" max={item.quantidade_atendida} step="0.001" value={leftovers[item.id] ?? "0"} onChange={(event) => setLeftovers((current) => ({ ...current, [item.id]: event.target.value }))} className="h-10 w-28 rounded-md border border-slate-300 bg-white px-2 text-center text-sm"/>{item.unidade.sigla || item.unidade.nome}</span></label>)}</div> : <p className="mt-3 text-xs text-slate-500">Esta OS não teve materiais entregues.</p>}
            <div className="mt-4 flex justify-end"><Button type="submit" loading={busy} disabled={busy}>Salvar sobras e fechar OS</Button></div>
          </form>}
        </li>;
      })}</ul> : <EmptyState title="Nenhuma OS aguardando fechamento" description="As OS atendidas pela sua conta aparecerão aqui até serem fechadas."/>}
    </Card>}

    <Card className="p-5 sm:p-6"><div className="mb-3"><h2 className="text-sm font-semibold text-slate-900">Saldo disponível</h2><p className="mt-1 text-xs text-slate-500">{items.length} materiais com saldo</p></div>
      {items.length ? <div className="divide-y divide-slate-100">{items.map((item) => <article key={item.material_id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><h3 className="text-sm font-semibold text-slate-900">{item.material}</h3><p className="mt-1 text-xs text-slate-500">{item.codigo} · Saldo: <strong className="text-slate-800">{item.quantidade_atual} {item.unidade_sigla}</strong></p></div>{!warehouse && <div className="flex items-center gap-2"><label className="sr-only" htmlFor={`consume-${item.material_id}`}>Quantidade para retirada de {item.material}</label><input id={`consume-${item.material_id}`} type="number" min="0.001" step="0.001" max={item.quantidade_atual} value={quantities[item.material_id] ?? ""} onChange={(event) => setQuantities((current) => ({ ...current, [item.material_id]: event.target.value }))} className="h-10 w-24 border border-slate-300 px-3 text-sm" placeholder="Qtd."/><Button disabled={busy || Number(quantities[item.material_id]) <= 0 || Number(quantities[item.material_id]) > item.quantidade_atual} onClick={() => void consume(item)}>Registrar retirada</Button></div>}</article>)}</div> : <EmptyState title={warehouse && !sectorId ? "Selecione um setor" : "Nenhum saldo disponível"} description={warehouse && !sectorId ? "Escolha um setor para consultar o saldo." : "As sobras registradas nas OS e as entradas do setor aparecerão aqui."}/>}
    </Card>
    <Card className="mt-5 p-5 sm:p-6"><div className="stock-movements-heading mb-4"><h2 className="text-sm font-semibold text-slate-900">Movimentações recentes</h2><p className="mt-1 text-xs text-slate-500">Entradas, fechamentos de OS e retiradas do setor</p></div>{history.length ? <ul className="stock-movements-list">{history.map((movement) => {
        const isOutflow = movement.tipo.startsWith("CONSUMO") || movement.tipo.startsWith("DEVOLUCAO");
        return <li key={movement.id} className="stock-movement-item"><div className="stock-movement-description"><div className="stock-movement-title"><strong>{movement.material}</strong><span className={`stock-movement-kind ${isOutflow ? "is-outflow" : "is-inflow"}`}>{movement.tipo.replaceAll("_", " ")}</span></div>{movement.observacao && <p>{movement.observacao}</p>}</div><div className="stock-movement-meta"><strong className={isOutflow ? "is-outflow" : "is-inflow"}>{isOutflow ? "−" : "+"}{movement.quantidade}</strong><time>{date(movement.created_at)}</time></div></li>;
      })}</ul> : <EmptyState title="Sem movimentações" description="As entradas e as retiradas registradas ficarão no histórico."/>}</Card>
  </div>;
}
