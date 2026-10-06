export default function MaterialSelectionLoading() {
  return (
    <main className="page-skeleton" aria-busy="true" aria-label="Carregando catálogo de materiais">
      <section className="catalog-page catalog-loading">
        <div className="catalog-loading-header">
          <div className="skeleton h-3 w-36" />
          <div className="skeleton mt-4 h-9 w-72 max-w-full" />
          <div className="skeleton mt-3 h-4 w-80 max-w-full" />
        </div>
        <div className="catalog-loading-summary"><div className="skeleton h-8 w-24"/><div className="skeleton h-8 w-24"/><div className="skeleton h-8 w-24"/></div>
        <div className="skeleton mb-4 h-11 w-full" />
        <div className="catalog-loading-list" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => <div key={index} className="catalog-loading-card"><span className="skeleton h-5 w-5 rounded-md"/><span className="skeleton h-10 w-10 rounded-lg"/><span className="catalog-loading-copy"><i className="skeleton h-3 w-3/4"/><i className="skeleton h-3 w-1/2"/><i className="skeleton h-3 w-2/3"/></span></div>)}
        </div>
        <span className="sr-only">Carregando itens…</span>
      </section>
    </main>
  );
}
