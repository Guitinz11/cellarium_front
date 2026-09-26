"use client";

import { useEffect } from "react";

export function useScrollReveal() {
  useEffect(() => {
    const targets = "[data-reveal], [data-reveal-group]";
    const reveal = (element: HTMLElement) => {
      Array.from(element.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement && child.matches("[data-reveal-item]"))
        .forEach((item, index) => item.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 60}ms`));
      element.classList.add("is-visible");
      element.querySelectorAll<HTMLElement>("[data-reveal-item]").forEach((item) => item.classList.add("is-visible"));
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
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll<HTMLElement>(targets).forEach(reveal);
      document.querySelectorAll<HTMLElement>("[data-reveal-item]").forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });

    const observe = (element: Element) => {
      const visibleGroup = element.closest<HTMLElement>("[data-reveal-group].is-visible");
      if (visibleGroup) {
        if (element instanceof HTMLElement && element.matches("[data-reveal-item]")) element.classList.add("is-visible");
        element.querySelectorAll<HTMLElement>("[data-reveal-item]").forEach((item) => item.classList.add("is-visible"));
      }
      collectTargets(element).forEach((target) => {
        if (!target.classList.contains("is-visible")) observer.observe(target);
      });
    };

    document.documentElement.classList.add("reveal-enabled");
    document.querySelectorAll<HTMLElement>(targets).forEach(observe);
    const mutations = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node instanceof Element) observe(node);
    })));
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
      document.documentElement.classList.remove("reveal-enabled");
    };
  }, []);
}
