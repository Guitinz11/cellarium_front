"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const isDark = useSyncExternalStore(
    (callback) => {
      window.addEventListener("cellarium-theme-change", callback);
      return () => window.removeEventListener("cellarium-theme-change", callback);
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  function toggleTheme() {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.classList.toggle("light", !nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? "dark" : "light";
    try {
      window.localStorage.setItem("cellarium-theme", nextIsDark ? "dark" : "light");
    } catch {
      // The selected theme still applies for this session when storage is unavailable.
    }
    window.dispatchEvent(new Event("cellarium-theme-change"));
  }

  return <button type="button" onClick={toggleTheme} aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"} title={isDark ? "Tema claro" : "Tema escuro"} className={`theme-toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-2 ${className}`}><span className="sr-only">{isDark ? "Tema claro" : "Tema escuro"}</span>{isDark ? <Sun size={17}/> : <Moon size={17}/>}</button>;
}
