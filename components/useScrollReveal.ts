"use client";

import { useEffect } from "react";

export function useScrollReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) || !("animate" in Element.prototype)) return;
    const targets = "[data-reveal], [data-reveal-group]";
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealed = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const animate = (element: Element, delay = 0) => {
      const animation = element.animate(
        [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 360, delay, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" },
      );
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
    };
    const reveal = (element: HTMLElement) => {
      revealed.add(element);
      if (motion.matches) return;
      const items = Array.from(element.children).filter((child) => child.matches("[data-reveal-item]"));
      if (items.length) items.forEach((item, index) => animate(item, Math.min(index, 6) * 40));
      else animate(element);
    };
    const collectTargets = (root: Element) => {
      const candidates = [
        ...(root.matches(targets) ? [root] : []),
        ...root.querySelectorAll<HTMLElement>(targets),
      ];
      return candidates.filter((candidate) =>
        candidate.hasAttribute("data-reveal-group") || !candidate.parentElement?.closest("[data-reveal-group]"),
      );
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });

    const observe = (element: Element) => {
      collectTargets(element).forEach((target) => {
        if (!revealed.has(target)) observer.observe(target);
      });
    };
    // Web Animations leaves React's HTML untouched, including during hydration.
    document.querySelectorAll<HTMLElement>(targets).forEach(observe);
    const mutations = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node instanceof Element) observe(node);
    })));
    mutations.observe(document.body, { childList: true, subtree: true });
    const cancelAnimations = () => { animations.forEach((animation) => animation.cancel()); animations.clear(); };
    const onMotionChange = () => { if (motion.matches) cancelAnimations(); };
    motion.addEventListener("change", onMotionChange);

    return () => {
      mutations.disconnect();
      observer.disconnect();
      motion.removeEventListener("change", onMotionChange);
      cancelAnimations();
    };
  }, []);
}
