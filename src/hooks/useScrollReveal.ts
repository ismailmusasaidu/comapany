import { useEffect } from 'react';

// Adds .is-visible to every [data-reveal] element as it enters the viewport.
export function useScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)'));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  });
}
