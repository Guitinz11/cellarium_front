"use client";

import { useEffect, useRef } from "react";

/** Animates a metric once on entry; subsequent data updates stay immediate. */
export default function CountUp({ value }: { value: number }) {
  const element = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);
  const formatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const formatted = formatter.format(value);

  useEffect(() => {
    const target = element.current;
    if (!target) return;
    target.textContent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (animated.current || motion.matches || !window.IntersectionObserver || value === 0) return;
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      target.textContent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      animated.current = true;
      observer.disconnect();
      if (motion.matches) { finish(); return; }
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 850, 1);
        target.textContent = new Intl.NumberFormat("pt-BR").format(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
        else finish();
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    observer.observe(target);
    motion.addEventListener("change", finish);
    return () => { observer.disconnect(); motion.removeEventListener("change", finish); finish(); };
  }, [value]);

  return <><span ref={element} aria-hidden="true" className="count-up" style={{ minWidth: `${formatted.length}ch` }}>{formatted}</span><span className="sr-only">{formatted}</span></>;
}
