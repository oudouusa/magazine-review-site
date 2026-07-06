"use client";

import { useEffect, useState } from "react";

type Theme = "night" | "light";

function readTheme(): Theme {
  if (typeof document === "undefined") return "night";
  return document.documentElement.dataset.theme === "light" ? "light" : "night";
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("night");

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const nextTheme: Theme = theme === "night" ? "light" : "night";

  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = nextTheme;
        localStorage.setItem("mh-theme", nextTheme);
        setTheme(nextTheme);
      }}
      aria-label={`テーマを${nextTheme === "light" ? "ライト" : "ナイト"}に切り替える`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 36,
        borderRadius: 999,
        border: "1px solid var(--line)",
        background: "var(--bg-2)",
        color: "var(--ink)",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 700,
        padding: "0 12px",
        whiteSpace: "nowrap",
      }}
    >
      {theme === "night" ? "☀️ ライト" : "🌙 ナイト"}
    </button>
  );
}
