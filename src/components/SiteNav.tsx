import Link from "next/link";

const navLinks = [
  { href: "/", label: "トップ" },
  { href: "/models", label: "モデル" },
  { href: "/magazines", label: "雑誌・写真集" },
  { href: "/brands", label: "ブランド" },
  { href: "/ranking", label: "ランキング" },
  { href: "/features", label: "特集" },
];

const shelfLinks = [
  "週刊グラビア誌",
  "月刊グラビア誌",
  "写真集",
  "電子限定",
  "復刻・絶版",
  "水着",
  "アイドル系",
  "女優系",
];

export function SiteNav({ activePath = "/" }: { activePath?: string }) {
  return (
    <>
      <nav className="site-nav">
        <div className="nav-logo">
          <div className="logo-mark">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {[0, 1, 2, 3, 4].map((i) => {
                const angle = (i * 72 - 90) * (Math.PI / 180);
                const x = 11 + 7 * Math.cos(angle);
                const y = 11 + 7 * Math.sin(angle);
                return (
                  <ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx="4"
                    ry="2.5"
                    transform={`rotate(${i * 72} ${x} ${y})`}
                    fill="rgba(232,168,184,0.7)"
                  />
                );
              })}
              <circle cx="11" cy="11" r="3.5" fill="rgba(232,168,184,0.9)" />
            </svg>
          </div>
          <div>
            <div className="logo-text">MODEL HUB</div>
            <div className="logo-sub">GRAVURE MAGAZINE &amp; PHOTOBOOK ARCHIVE</div>
          </div>
        </div>

        <ul className="nav-menu">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`nav-link${activePath === link.href ? " active" : ""}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          <form action="/search" method="get" className="nav-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input name="q" placeholder="モデル名・雑誌名から探す" />
          </form>
          <button className="icon-circ" aria-label="お気に入り">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="badge">12</span>
          </button>
          <button className="icon-circ" aria-label="マイページ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile-only nav strip */}
      <nav className="mobile-nav" aria-label="モバイルナビ">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`mobile-nav-link${activePath === link.href ? " active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="subnav">
        <span className="subnav-label">棚から探す</span>
        {shelfLinks.map((label, i) => (
          <span key={label} style={{ display: "contents" }}>
            {i > 0 && <span className="subnav-divider" />}
            <a href={`/magazines?genre=${encodeURIComponent(label)}`} className="subnav-item">
              {label}
            </a>
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--ink-3)", whiteSpace: "nowrap" }}>
          最終更新 2026/05/26
        </span>
      </div>

      <style>{`
        .site-nav {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 22px;
          padding: 18px 28px;
          background: var(--paper);
          border-bottom: 1px solid var(--line);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }
        .logo-mark {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #fff 0%, var(--rose-3) 55%, var(--rose-2) 100%);
          display: grid;
          place-items: center;
          box-shadow: inset 0 0 0 1px rgba(232, 168, 184, 0.4);
          flex-shrink: 0;
        }
        .logo-text {
          font-family: "Noto Serif JP", serif;
          font-weight: 600;
          font-size: 19px;
          letter-spacing: 0.12em;
          line-height: 1;
          color: var(--ink);
        }
        .logo-sub {
          font-size: 9.5px;
          letter-spacing: 0.28em;
          color: var(--ink-3);
          margin-top: 4px;
          white-space: nowrap;
        }
        .nav-menu {
          display: flex;
          align-items: center;
          gap: 4px;
          justify-self: center;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .nav-link {
          display: inline-flex;
          align-items: center;
          font-family: "Noto Serif JP", serif;
          font-size: 13.5px;
          letter-spacing: 0.14em;
          color: var(--ink-2);
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          transition: background 0.12s, color 0.12s;
        }
        .nav-link:hover { background: var(--rose-3); color: var(--plum); }
        .nav-link.active { color: var(--primary); font-weight: 600; }
        .nav-link.active::after {
          content: "";
          display: block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--primary);
          margin-left: 6px;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nav-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--paper-2);
          border: 1px solid var(--line);
          padding: 8px 12px;
          border-radius: 999px;
          width: 220px;
          color: var(--ink-3);
        }
        .nav-search input {
          border: 0;
          outline: 0;
          background: transparent;
          flex: 1;
          font-family: inherit;
          font-size: 13px;
          color: var(--ink);
          min-width: 0;
        }
        .icon-circ {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--paper-2);
          border: 1px solid var(--line);
          cursor: pointer;
          position: relative;
          color: var(--ink-2);
        }
        .icon-circ .badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--primary);
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 999px;
          min-width: 15px;
          text-align: center;
          border: 2px solid var(--paper);
        }
        .subnav {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 10px 28px;
          background: var(--paper-2);
          border-bottom: 1px solid var(--line);
          font-size: 11.5px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .subnav::-webkit-scrollbar { display: none; }
        .subnav-label {
          font-size: 10px;
          letter-spacing: 0.22em;
          color: var(--ink-3);
          font-weight: 600;
          white-space: nowrap;
          font-family: "Noto Serif JP", serif;
        }
        .subnav-item {
          color: var(--ink-2);
          cursor: pointer;
          white-space: nowrap;
          letter-spacing: 0.06em;
          text-decoration: none;
          transition: color 0.12s;
        }
        .subnav-item:hover { color: var(--primary); }
        .subnav-divider {
          width: 1px;
          height: 14px;
          background: var(--line);
          flex-shrink: 0;
        }
        .mobile-nav { display: none; }
        @media (max-width: 640px) {
          .site-nav {
            grid-template-columns: auto auto;
            padding: 10px 16px;
            gap: 10px;
          }
          .nav-menu { display: none; }
          .logo-sub { display: none; }
          .nav-search { display: none; }
          .logo-mark { width: 34px; height: 34px; }
          .logo-text { font-size: 16px; }
          .icon-circ { width: 32px; height: 32px; }
          .mobile-nav {
            display: flex;
            overflow-x: auto;
            scrollbar-width: none;
            background: var(--paper);
            border-bottom: 1px solid var(--line);
            padding: 0 16px;
          }
          .mobile-nav::-webkit-scrollbar { display: none; }
          .mobile-nav-link {
            padding: 10px 12px;
            font-family: "Noto Serif JP", serif;
            font-size: 12.5px;
            letter-spacing: 0.1em;
            color: var(--ink-2);
            text-decoration: none;
            white-space: nowrap;
            border-bottom: 2px solid transparent;
            flex-shrink: 0;
          }
          .mobile-nav-link.active {
            color: var(--primary);
            font-weight: 600;
            border-bottom-color: var(--primary);
          }
          .subnav { padding: 8px 16px; gap: 12px; font-size: 11px; }
        }
      `}</style>
    </>
  );
}
