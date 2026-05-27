import Link from "next/link";

const footerCols = [
  {
    title: "EXPLORE",
    links: [
      { href: "/", label: "トップ" },
      { href: "/models", label: "モデル一覧" },
      { href: "/magazines", label: "雑誌・写真集" },
      { href: "/ranking", label: "ランキング" },
      { href: "/features", label: "特集記事" },
    ],
  },
  {
    title: "COLLECTION",
    links: [
      { href: "/magazines?type=weekly", label: "週刊グラビア誌" },
      { href: "/magazines?type=monthly", label: "月刊グラビア誌" },
      { href: "/magazines?type=photobook", label: "写真集" },
      { href: "/magazines?type=reissue", label: "復刻・絶版" },
      { href: "/magazines?type=digital-only", label: "電子限定" },
    ],
  },
  {
    title: "ABOUT",
    links: [
      { href: "/about", label: "このサイトについて" },
      { href: "/about#affiliate", label: "広告掲載について" },
      { href: "/contact", label: "お問い合わせ" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { href: "/privacy", label: "プライバシーポリシー" },
      { href: "/terms", label: "利用規約" },
      { href: "/affiliate-disclosure", label: "アフィリエイト開示" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="ft-cols">
        {footerCols.map((col) => (
          <div key={col.title} className="ft-col">
            <div className="ft-col-title">{col.title}</div>
            {col.links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="ft-right">
        <div>MODEL HUB</div>
        <div>GRAVURE MAGAZINE &amp; PHOTOBOOK ARCHIVE</div>
        <div className="pr-policy">本サイトはアフィリエイト広告を掲載しています</div>
        <div style={{ marginTop: "12px", fontSize: "9px", color: "var(--ink-3)" }}>
          © 2026 MODEL HUB. All rights reserved.
        </div>
      </div>

      <style>{`
        .site-foot {
          background: var(--paper);
          border-top: 1px solid var(--line);
          padding: 26px var(--pad);
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          margin-top: var(--row-gap);
        }
        .ft-cols {
          display: grid;
          grid-template-columns: repeat(4, auto);
          gap: 32px;
          font-size: 11px;
          letter-spacing: 0.04em;
        }
        .ft-col-title {
          font-family: "Noto Serif JP", serif;
          font-size: 11px;
          letter-spacing: 0.22em;
          color: var(--ink-3);
          font-weight: 600;
          margin-bottom: 8px;
        }
        .ft-col a {
          display: block;
          color: var(--ink-2);
          text-decoration: none;
          line-height: 2;
          transition: color 0.12s;
        }
        .ft-col a:hover { color: var(--primary); }
        .ft-right {
          text-align: right;
          font-size: 10px;
          color: var(--ink-3);
          letter-spacing: 0.08em;
          line-height: 1.7;
        }
        .pr-policy {
          display: inline-block;
          margin-top: 8px;
          background: rgba(0, 0, 0, 0.05);
          padding: 6px 10px;
          border-radius: 8px;
          color: var(--pr);
          font-family: "Noto Serif JP", serif;
          letter-spacing: 0.12em;
          font-weight: 600;
        }
        @media (max-width: 640px) {
          .site-foot {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .ft-cols {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .ft-right {
            text-align: left;
            border-top: 1px solid var(--line);
            padding-top: 20px;
          }
        }
      `}</style>
    </footer>
  );
}
