"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ThemeToggle } from "./fx/ThemeToggle";

const TABS: Array<{ href: string; label: string }> = [
  { href: "/", label: "ホーム" },
  { href: "/calendar", label: "発売カレンダー" },
  { href: "/trending", label: "急上昇" },
  { href: "/models", label: "モデル" },
  { href: "/magazines", label: "雑誌" },
  { href: "/brands", label: "ブランド" },
  { href: "/covers", label: "カバーウォール" },
  { href: "/ranking", label: "ランキング" },
  { href: "/features", label: "特集" },
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "color-mix(in srgb, var(--bg) 84%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px var(--pad) 0",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
          <span
            className="serif"
            style={{ fontSize: 21, fontWeight: 900, letterSpacing: "0.14em", color: "var(--ink)", lineHeight: 1 }}
          >
            MODEL<span style={{ color: "var(--primary)" }}>HUB</span>
            <span aria-hidden style={{ color: "var(--primary)", fontSize: 12, marginLeft: 3 }}>
              ●
            </span>
          </span>
        </Link>
        <form
          action="/search"
          method="get"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = searchRef.current?.value?.trim();
            if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
          style={{ marginLeft: "auto", flex: "0 1 280px", minWidth: 90 }}
        >
          <input
            ref={searchRef}
            type="search"
            name="q"
            placeholder="モデル・雑誌を検索（/）"
            aria-label="サイト内検索"
            style={{
              width: "100%",
              padding: "9px 14px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </form>
        <ThemeToggle />
      </div>
      <nav aria-label="メインナビゲーション" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 var(--pad)" }}>
        <div style={{ display: "flex", gap: 2, overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                style={{
                  padding: "10px 13px 11px",
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--ink)" : "var(--ink-2)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  borderBottom: active ? "2.5px solid var(--primary)" : "2.5px solid transparent",
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
