"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"night" | "light" | null>(null);

  useEffect(() => {
    const current = document.documentElement.dataset.theme === "light" ? "light" : "night";
    setTheme(current);
  }, []);

  if (!theme) {
    return <span style={{ display: "inline-block", width: 40, height: 40 }} aria-hidden />;
  }

  const next = theme === "night" ? "light" : "night";
  const toggle = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("mh-theme", next);
    } catch {
      // private mode etc.
    }
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={next === "light" ? "ライトテーマに切替" : "ナイトテーマに切替"}
      title={next === "light" ? "ライトテーマに切替" : "ナイトテーマに切替"}
      style={{
        width: 40,
        height: 40,
        borderRadius: 999,
        border: "1px solid var(--line)",
        background: "var(--paper)",
        color: "var(--ink-2)",
        cursor: "pointer",
        fontSize: 17,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {theme === "night" ? "☾" : "☀"}
    </button>
  );
}
