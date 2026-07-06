"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navLinks = [
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

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname() || "/";

  return (
    <nav className="site-nav" aria-label="サイトナビゲーション">
      <div className="nav-top">
        <Link href="/" className="masthead" aria-label="MODEL HUB ホーム">
          <span className="mh-serif masthead-main">
            <span>MODEL</span>
            <span className="masthead-accent">HUB</span>
          </span>
        </Link>

        <div className="nav-actions">
          <form action="/search" method="get" className="nav-search">
            <span aria-hidden="true">🔍</span>
            <input name="q" placeholder="モデル・雑誌名で検索" />
          </form>
          <ThemeToggle />
        </div>
      </div>

      <div className="nav-tabs" aria-label="主要リンク">
        {navLinks.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link key={link.href} href={link.href} className={`nav-tab${active ? " active" : ""}`}>
              {link.label}
            </Link>
          );
        })}
        <Link href="/search" className="nav-tab search-tab" aria-label="検索">
          🔍
        </Link>
      </div>

      <style>{`
        .site-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: color-mix(in srgb, var(--bg) 82%, transparent);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--line);
        }
        .nav-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px var(--pad) 10px;
          min-width: 0;
        }
        .masthead {
          display: inline-flex;
          align-items: center;
          min-width: 0;
          color: var(--ink);
          text-decoration: none;
        }
        .masthead-main {
          display: inline-flex;
          gap: 0.4em;
          align-items: baseline;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.14em;
          line-height: 1;
          white-space: nowrap;
        }
        .masthead-accent {
          color: var(--primary);
        }
        .nav-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          min-width: 0;
        }
        .nav-search {
          --search-size: clamp(0px, calc(100vw - 640px), 260px);
          display: flex;
          align-items: center;
          gap: 8px;
          width: var(--search-size);
          max-width: 260px;
          min-width: 0;
          height: 36px;
          overflow: hidden;
          border: min(1px, var(--search-size)) solid var(--line);
          border-radius: 999px;
          background: var(--bg-2);
          color: var(--ink-3);
          padding-inline: min(12px, var(--search-size));
        }
        .nav-search input {
          min-width: 0;
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--ink);
          font-size: 13px;
        }
        .nav-search input::placeholder {
          color: var(--ink-3);
        }
        .nav-tabs {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          padding: 0 var(--pad) 8px;
          scrollbar-width: thin;
          scrollbar-color: var(--line) transparent;
        }
        .nav-tabs::-webkit-scrollbar {
          height: 4px;
        }
        .nav-tabs::-webkit-scrollbar-thumb {
          background: var(--line);
          border-radius: 999px;
        }
        .nav-tab {
          flex: 0 0 auto;
          color: var(--ink-2);
          border-bottom: 2px solid transparent;
          font-size: 13px;
          font-weight: 700;
          line-height: 1;
          padding: 10px 2px 8px;
          text-decoration: none;
          white-space: nowrap;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .nav-tab:hover {
          color: var(--ink);
        }
        .nav-tab.active {
          color: var(--ink);
          border-bottom-color: var(--primary);
        }
        .search-tab {
          --mobile-search-size: clamp(0px, calc(640px - 100vw), 32px);
          width: var(--mobile-search-size);
          min-width: var(--mobile-search-size);
          overflow: hidden;
          padding-inline: 0;
          text-align: center;
        }
      `}</style>
    </nav>
  );
}
