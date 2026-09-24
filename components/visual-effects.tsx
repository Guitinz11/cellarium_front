"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/components/useScrollReveal";

function CustomCursor() {
  const dotRef = useRef<HTMLSpanElement>(null);
  const trailRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const active = !coarsePointer.matches && !reducedMotion.matches;
    setEnabled(active);
    document.documentElement.classList.toggle("custom-cursor-active", active);
    if (!active) {
      return () => document.documentElement.classList.remove("custom-cursor-active");
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let trailX = targetX;
    let trailY = targetY;
    let frame = 0;
    let visible = false;

    const render = () => {
      frame = 0;
      trailX += (targetX - trailX) * 0.18;
      trailY += (targetY - trailY) * 0.18;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      if (trailRef.current) trailRef.current.style.transform = `translate3d(${trailX}px, ${trailY}px, 0)`;
      if (Math.abs(targetX - trailX) > 0.15 || Math.abs(targetY - trailY) > 0.15) frame = requestAnimationFrame(render);
    };
    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!visible) {
        visible = true;
        dotRef.current?.classList.add("cursor-visible");
        trailRef.current?.classList.add("cursor-visible");
      }
      const hovered = event.target instanceof Element && event.target.closest("a, button, [role='button'], .interactive");
      document.documentElement.classList.toggle("cursor-hovering", Boolean(hovered));
      if (!frame) frame = requestAnimationFrame(render);
    };
    const onLeave = () => {
      visible = false;
      dotRef.current?.classList.remove("cursor-visible");
      trailRef.current?.classList.remove("cursor-visible");
      document.documentElement.classList.remove("cursor-hovering");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      document.documentElement.classList.remove("custom-cursor-active", "cursor-hovering");
    };
  }, []);

  if (!enabled) return null;
  return <div className="custom-cursor-layer" aria-hidden="true"><span ref={trailRef} className="custom-cursor-trail"/><span ref={dotRef} className="custom-cursor-dot"/></div>;
}

export default function VisualEffects() {
  useScrollReveal();
  return <CustomCursor/>;
}
