"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? "dark" : "light";
    window.localStorage.setItem("cellarium-theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  }

  return <button type="button" onClick={toggleTheme} aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"} title={isDark ? "Tema claro" : "Tema escuro"} className={`theme-toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 ${className}`}><span className="sr-only">{isDark ? "Tema claro" : "Tema escuro"}</span>{isDark ? <Sun size={17}/> : <Moon size={17}/>}</button>;
}
