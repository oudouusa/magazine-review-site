"use client";

import { useEffect, useRef, useState } from "react";

export function StatCounter({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = () => {
      if (started.current) return;
      started.current = true;
      if (reduced) {
        setShown(value);
        return;
      }
      const t0 = performance.now();
      const dur = 900;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(Math.round(value * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        start();
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div ref={ref} style={{ minWidth: 90 }}>
      <div
        className="serif mh-num"
        style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.1, color: "var(--ink)", letterSpacing: "0.02em" }}
      >
        {shown.toLocaleString("ja-JP")}
        {suffix && <span style={{ fontSize: 14, color: "var(--ink-2)", marginLeft: 2 }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.18em", marginTop: 4 }}>{label}</div>
    </div>
  );
}
