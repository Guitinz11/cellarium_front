import { Database } from "lucide-react";

export default function BackendDataUnavailable({ title, detail }: { title: string; detail: string }) {
  return <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="backend-data-title">
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Database size={19}/></span>
    <h1 id="backend-data-title" className="mt-4 text-lg font-semibold text-slate-900">{title}</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
  </section>;
}
