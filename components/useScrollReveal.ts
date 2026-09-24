"use client";

import { useEffect } from "react";

export function useScrollReveal() {
  useEffect(() => {
    const targets = "[data-reveal]";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll<HTMLElement>(targets).forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });

    const observe = (element: Element) => {
      if (element instanceof HTMLElement && element.matches(targets) && !element.classList.contains("is-visible")) observer.observe(element);
      element.querySelectorAll<HTMLElement>(targets).forEach((child) => {
        if (!child.classList.contains("is-visible")) observer.observe(child);
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
