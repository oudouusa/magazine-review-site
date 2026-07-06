"use client";

import { useEffect, useRef, useState } from "react";

export type StatCounterProps = {
  value: number;
  label: string;
  suffix?: string;
};

export function StatCounter({ value, label, suffix = "" }: StatCounterProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);
  // SSR shows the real value (crawlers / no-JS); the count-up starts on view.
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    const animate = () => {
      setDisplayValue(0);
      const start = performance.now();
      const duration = 800;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * eased));
        if (progress < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        animate();
      }
    }, { threshold: 0.24 });

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value]);

  return (
    <div ref={ref} style={{ display: "grid", gap: 4 }}>
      <div className="mh-num" style={{ color: "var(--ink)", fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
        {displayValue.toLocaleString("ja-JP")}{suffix}
      </div>
      <div style={{ color: "var(--ink-2)", fontSize: 12, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}
