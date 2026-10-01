import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { ArrowRight, LoaderCircle, PackageSearch } from "lucide-react";
import CountUp from "@/components/count-up";

export function Button({ children, variant = "primary", loading = false, className = "", disabled, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet"; loading?: boolean }) {
  return <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`ui-button ui-button--${variant} ${className}`} {...props}>{loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true"/>}{children}</button>;
}

export function Card({ children, className = "", ...props }: ComponentProps<"section">) {
  return <section className={`ui-panel ${className}`} {...props}>{children}</section>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><p className="ui-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action && <div className="page-heading-action">{action}</div>}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const tone = ["Concluido", "Aprovado", "Disponivel"].includes(normalized) ? "success" : normalized === "Em andamento" ? "info" : ["Critico", "Indisponivel"].includes(normalized) ? "danger" : "warning";
  return <span className={`ui-badge ui-badge--${tone}`}><span aria-hidden="true"/>{status}</span>;
}

export function Metric({ label, value, note, icon, tone = "default" }: { label: string; value: number; note: string; icon?: ReactNode; tone?: "default" | "warning" | "success" }) {
  return <article className={`ui-metric ui-metric--${tone}`}><div className="ui-metric-label">{icon}{label}</div><p className="ui-metric-value"><CountUp value={value}/></p><p className="ui-metric-note">{note}</p></article>;
}

export function EmptyState({ title, description, icon = <PackageSearch size={24}/>, action }: { title: string; description: string; icon?: ReactNode; action?: ReactNode }) {
  return <div className="ui-empty"><span className="ui-empty-icon" aria-hidden="true">{icon}</span><h3>{title}</h3><p>{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function TextLink({ children, className = "", ...props }: ComponentProps<"a">) {
  return <a className={`ui-text-link ${className}`} {...props}>{children}<ArrowRight size={14} aria-hidden="true"/></a>;
}

export function PageSkeleton() {
  return <main aria-busy="true" aria-label="Carregando página" className="page-skeleton"><div className="skeleton h-4 w-36"/><div className="skeleton mt-4 h-10 w-64"/><div className="skeleton mt-3 h-4 max-w-md"/><div className="mt-10 grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="skeleton h-28"/>)}</div><div className="skeleton mt-6 h-72"/><span className="sr-only">Carregando conteúdo…</span></main>;
}

export function Pagination({ page, total, pageSize, onPageChange }: { page: number; total: number; pageSize: number; onPageChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <nav aria-label="Paginação da lista" className="list-pagination"><p>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} itens` : "Nenhum item"}</p><div><Button variant="secondary" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Anterior</Button><span aria-live="polite">{page} / {pages}</span><Button variant="secondary" onClick={() => onPageChange(page + 1)} disabled={page >= pages}>Próxima</Button></div></nav>;
}
