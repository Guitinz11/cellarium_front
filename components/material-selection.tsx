"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Boxes, Cable, Check, CircleDot, Drill, Layers3, Package, Search, SlidersHorizontal, Wrench, X } from "lucide-react";
import { materialsCatalog } from "@/lib/mock-data";
import ProductQrPicker from "@/components/product-qr-picker";
import { useInventoryItems } from "@/components/use-inventory-items";
import { useDialogAccessibility } from "@/components/use-dialog-accessibility";

type CatalogMaterial = (typeof materialsCatalog)[number];
type CatalogItem = CatalogMaterial & { quantity: number };
type Filters = { category: string; availability: string; unit: string };

const unitPlural: Record<string, string> = {
  Barra: "barras", Bisnaga: "bisnagas", Bombona: "bombonas", Caixa: "caixas", Chapa: "chapas",
  Frasco: "frascos", Galão: "galões", Kg: "kg", Lata: "latas", Pacote: "pacotes", Par: "pares",
  Rolo: "rolos", Unidade: "unidades",
};

function getCategoryIcon(category: string) {
  const value = category.toLocaleLowerCase("pt-BR");
  if (value.includes("chapa")) return <Layers3 size={19} strokeWidth={1.8} />;
  if (value.includes("perfil") || value.includes("metal")) return <Boxes size={19} strokeWidth={1.8} />;
  if (value.includes("tubo") || value.includes("conex")) return <Cable size={19} strokeWidth={1.8} />;
  if (value.includes("abrasivo") || value.includes("corte")) return <Drill size={19} strokeWidth={1.8} />;
  if (value.includes("fixa")) return <Wrench size={19} strokeWidth={1.8} />;
  if (value.includes("roda") || value.includes("rodízio")) return <CircleDot size={19} strokeWidth={1.8} />;
  return <Package size={19} strokeWidth={1.8} />;
}

function getAvailability(item: CatalogItem) {
  if (item.quantity <= 0) return "Indisponível";
  if (item.quantity <= item.minimum) return "Estoque baixo";
  return "Disponível";
}

function getMainSpecification(specification: string) {
  return specification.split(/[—–;]/, 1)[0].replace(/^(espessura|diâmetro|comprimento|uso|aplicação)\s+/i, "").trim();
}

function getAvailableLabel(item: CatalogItem) {
  const plural = unitPlural[item.unit] ?? `${item.unit.toLocaleLowerCase("pt-BR")}s`;
  return `${item.quantity} ${plural} disponíveis`;
}

const MaterialCard = memo(function MaterialCard({
  item, selected, quantity, onToggle, onQuantity,
}: {
  item: CatalogItem;
  selected: boolean;
  quantity: number;
  onToggle: (code: string, selected: boolean) => void;
  onQuantity: (code: string, quantity: number) => void;
}) {
  const status = getAvailability(item);
  const disabled = item.quantity <= 0;

  return (
    <article className={`catalog-card ${selected ? "is-selected" : ""} ${disabled ? "is-unavailable" : ""}`}>
      <label className="catalog-card-select" htmlFor={`material-${item.code}`}>
        <input
          id={`material-${item.code}`}
          type="checkbox"
          checked={selected}
          disabled={disabled && !selected}
          onChange={(event) => onToggle(item.code, event.target.checked)}
          aria-label={`Selecionar ${item.name}`}
        />
        <span className="catalog-checkmark" aria-hidden="true">{selected && <Check size={14} strokeWidth={3} />}</span>
        <span className="catalog-card-icon" aria-hidden="true">{getCategoryIcon(item.category)}</span>
        <span className="catalog-card-copy">
          <span className="catalog-card-title">{item.name}</span>
          <span className="catalog-card-specification">{getMainSpecification(item.specification)}</span>
          <span className="catalog-card-meta">
            <span className="catalog-code">{item.code}</span>
            <span>{item.category}</span>
            <span className={`catalog-stock ${disabled ? "is-unavailable" : status === "Estoque baixo" ? "is-low" : ""}`}>
              {status === "Disponível" && <i aria-hidden="true" />}
              <strong>{getAvailableLabel(item)}</strong>
              {status !== "Disponível" && <em>{status}</em>}
            </span>
          </span>
        </span>
      </label>
      {selected && (
        <div className="catalog-stepper" aria-label={`Quantidade de ${item.name}`}>
          <button type="button" aria-label={`Diminuir quantidade de ${item.name}`} onClick={() => onQuantity(item.code, quantity - 1)} disabled={quantity <= 1}>−</button>
          <output aria-live="polite" aria-label={`${quantity} ${item.unit}`}>{quantity}</output>
          <button type="button" aria-label={`Aumentar quantidade de ${item.name}`} onClick={() => onQuantity(item.code, quantity + 1)} disabled={quantity >= item.quantity}>+</button>
        </div>
      )}
    </article>
  );
});

export default function MaterialSelection() {
  const inventoryItems = useInventoryItems();
  const catalog = useMemo(() => materialsCatalog.map((material) => ({
    ...material,
    quantity: inventoryItems.find((item) => item.code === material.code)?.quantity ?? 0,
  })), [inventoryItems]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ category: "Todas", availability: "Todos", unit: "Todas" });
  const [page, setPage] = useState(1);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, number>>({});
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  useDialogAccessibility(filtersOpen, closeFilters);

  const categories = useMemo(() => [...new Set(catalog.map((item) => item.category))].sort((a, b) => a.localeCompare(b, "pt-BR")), [catalog]);
  const units = useMemo(() => [...new Set(catalog.map((item) => item.unit))].sort((a, b) => a.localeCompare(b, "pt-BR")), [catalog]);
  const quantitiesByCode = useMemo(() => new Map(catalog.map((item) => [item.code, item.quantity])), [catalog]);
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filteredMaterials = catalog.filter((item) => {
    const searchable = `${item.name} ${item.code} ${item.category} ${item.specification}`.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const status = item.quantity <= 0 ? "Indisponível" : item.quantity <= item.minimum ? "Crítico" : "Disponível";
    return searchable.includes(normalizedSearch)
      && (filters.category === "Todas" || item.category === filters.category)
      && (filters.availability === "Todos" || status === filters.availability)
      && (filters.unit === "Todas" || item.unit === filters.unit);
  });
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleMaterials = filteredMaterials.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedEntries = Object.entries(selectedMaterials);
  const selectedCount = selectedEntries.length;
  const query = new URLSearchParams();
  selectedEntries.forEach(([code, quantity]) => { query.append("material", code); query.append("qty", String(quantity)); });
  const hasFilters = Boolean(search || filters.category !== "Todas" || filters.availability !== "Todos" || filters.unit !== "Todas");
  const summary = [
    { label: "materiais", value: catalog.length },
    { label: "categorias", value: categories.length },
    { label: "unidades", value: units.length },
  ];

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }, []);

  useEffect(() => {
    setSelectedMaterials((current) => {
      let changed = false;
      const next: Record<string, number> = {};
      Object.entries(current).forEach(([code, quantity]) => {
        const available = quantitiesByCode.get(code) ?? 0;
        if (available <= 0) { changed = true; return; }
        next[code] = Math.min(available, Math.max(1, quantity));
        if (next[code] !== quantity) changed = true;
      });
      return changed ? next : current;
    });
  }, [quantitiesByCode]);

  const toggleMaterial = useCallback((code: string, checked: boolean) => {
    if (checked && (quantitiesByCode.get(code) ?? 0) <= 0) return;
    setSelectedMaterials((current) => {
      const next = { ...current };
      if (checked) next[code] = next[code] ?? 1;
      else delete next[code];
      return next;
    });
  }, [quantitiesByCode]);

  const updateQuantity = useCallback((code: string, quantity: number) => {
    const available = quantitiesByCode.get(code) ?? 1;
    setSelectedMaterials((current) => ({ ...current, [code]: Math.min(available, Math.max(1, quantity)) }));
  }, [quantitiesByCode]);

  const selectScannedMaterial = useCallback((material: CatalogMaterial) => {
    setSelectedMaterials((current) => ({ ...current, [material.code]: current[material.code] ?? 1 }));
    setSearch(material.code);
    setFilters({ category: "Todas", availability: "Todos", unit: "Todas" });
    setPage(1);
  }, []);

  function clearFilters() {
    setSearch("");
    setFilters({ category: "Todas", availability: "Todos", unit: "Todas" });
    setPage(1);
  }

  const categoryControls = <>
    <label className="catalog-filter-chip"><span>Categoria</span><select aria-label="Filtrar por categoria" value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}><option value="Todas">Todas as categorias</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label className="catalog-filter-chip"><span>Disponibilidade</span><select aria-label="Filtrar por disponibilidade" value={filters.availability} onChange={(event) => updateFilter("availability", event.target.value)}><option value="Todos">Qualquer disponibilidade</option><option value="Disponível">Disponível</option><option value="Crítico">Estoque baixo</option><option value="Indisponível">Indisponível</option></select></label>
    <label className="catalog-filter-chip"><span>Unidade</span><select aria-label="Filtrar por unidade de medida" value={filters.unit} onChange={(event) => updateFilter("unit", event.target.value)}><option value="Todas">Todas as unidades</option>{units.map((item) => <option key={item}>{item}</option>)}</select></label>
  </>;

  return (
    <div className="catalog-page">
      <header className="catalog-intro">
        <div>
          <p className="catalog-eyebrow">Seleção de materiais</p>
          <h1>Selecione os materiais</h1>
          <p className="catalog-intro-copy">Encontre os itens para sua ordem de serviço e informe as quantidades.</p>
        </div>
        <div className="catalog-total"><strong>{catalog.length}</strong><span>itens no catálogo</span></div>
      </header>

      <section className="catalog-summary" aria-label="Resumo do catálogo">
        {summary.map(({ label, value }) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </section>

      <section className="catalog-panel" aria-labelledby="catalog-title">
        <div className="catalog-panel-heading">
          <div><p className="catalog-eyebrow">Materiais disponíveis</p><h2 id="catalog-title">Catálogo do almoxarifado</h2></div>
          <div className="catalog-heading-actions">
            <div className="catalog-qr-action"><ProductQrPicker onSelect={selectScannedMaterial} materials={catalog} /><span>Adicione um item lendo sua etiqueta</span></div>
            <span className="catalog-count">{filteredMaterials.length} {filteredMaterials.length === 1 ? "item" : "itens"}</span>
          </div>
        </div>

        <div className="catalog-toolbar">
          <div className="catalog-search-row">
            <label className="catalog-search"><Search size={17} aria-hidden="true"/><span className="sr-only">Pesquisar material</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nome, código, categoria ou especificação"/><span className="catalog-search-hint">{catalog.length} itens</span></label>
            <button type="button" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog" className="catalog-mobile-filter"><SlidersHorizontal size={16}/>Filtros{hasFilters && <span aria-label="filtros ativos">•</span>}</button>
          </div>
          <div className="catalog-desktop-filters">{categoryControls}{hasFilters && <button type="button" onClick={clearFilters} className="catalog-clear">Limpar filtros</button>}</div>
          <div className="catalog-category-scroll" aria-label="Categorias">
            <button type="button" aria-pressed={filters.category === "Todas"} onClick={() => updateFilter("category", "Todas")}>Todas <span>{catalog.length}</span></button>
            {categories.map((item) => <button key={item} type="button" aria-pressed={filters.category === item} onClick={() => updateFilter("category", item)}>{item}<span>{catalog.filter((material) => material.category === item).length}</span></button>)}
          </div>
          {hasFilters && <button type="button" onClick={clearFilters} className="catalog-clear catalog-mobile-clear">Limpar busca e filtros</button>}
        </div>

        <div className="catalog-results-heading"><h3>Materiais disponíveis</h3><span>{filteredMaterials.length} {filteredMaterials.length === 1 ? "resultado" : "resultados"}</span></div>
        <div className="catalog-list" aria-live="polite" aria-busy="false">
          {visibleMaterials.length ? visibleMaterials.map((item) => <MaterialCard key={item.code} item={item} selected={selectedMaterials[item.code] !== undefined} quantity={selectedMaterials[item.code] ?? 1} onToggle={toggleMaterial} onQuantity={updateQuantity}/>) : (
            <div className="catalog-empty"><Package size={26} aria-hidden="true"/><h3>Nenhum material encontrado</h3><p>Ajuste a busca ou os filtros para consultar outros itens.</p>{hasFilters && <button type="button" onClick={clearFilters} className="ui-button ui-button--secondary">Limpar filtros</button>}</div>
          )}
        </div>
        {filteredMaterials.length > 0 && <div className="catalog-pagination"><p>Exibindo {Math.min((currentPage - 1) * pageSize + 1, filteredMaterials.length)}–{Math.min(currentPage * pageSize, filteredMaterials.length)} de {filteredMaterials.length}</p><div><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>Anterior</button><span aria-live="polite">{currentPage} / {pageCount}</span><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>Próxima</button></div></div>}
      </section>

      {filtersOpen && <div className="catalog-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeFilters(); }}><section className="catalog-sheet" role="dialog" aria-modal="true" aria-labelledby="catalog-sheet-title"><div className="catalog-sheet-handle"/><div className="catalog-sheet-heading"><div><p className="catalog-eyebrow">Refinar resultados</p><h2 id="catalog-sheet-title">Filtros</h2></div><button type="button" aria-label="Fechar filtros" onClick={closeFilters}><X size={19}/></button></div><div className="catalog-sheet-fields">{categoryControls}</div><div className="catalog-sheet-actions"><button type="button" onClick={clearFilters} className="catalog-clear">Limpar filtros</button><button type="button" onClick={closeFilters} className="ui-button ui-button--primary">Ver {filteredMaterials.length} itens</button></div></section></div>}

      <p className="catalog-disclaimer">Catálogo demonstrativo. Os saldos e limites de quantidade vêm do inventário deste navegador.</p>
      {selectedCount > 0 && <aside className="catalog-selection-bar" aria-label="Materiais selecionados"><p aria-live="polite" aria-atomic="true"><strong>{selectedCount}</strong> {selectedCount === 1 ? "material selecionado" : "materiais selecionados"}<span>Revise quantidades no próximo passo</span></p><Link href={`/pedido?${query.toString()}`} className="ui-button ui-button--primary">Continuar<ArrowRight size={16}/></Link></aside>}
      {selectedCount > 0 && <div className="catalog-selection-spacer" aria-hidden="true"/>}
    </div>
  );
}
