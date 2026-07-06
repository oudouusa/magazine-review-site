import Link from "next/link";

const exploreLinks = [
  { href: "/", label: "トップ" },
  { href: "/models", label: "モデル一覧" },
  { href: "/magazines", label: "雑誌・写真集" },
  { href: "/brands", label: "ブランド" },
  { href: "/ranking", label: "ランキング" },
  { href: "/features", label: "特集記事" },
  { href: "/magazines?type=weekly", label: "週刊グラビア誌" },
  { href: "/magazines?type=monthly", label: "月刊グラビア誌" },
  { href: "/magazines?type=photobook", label: "写真集" },
  { href: "/magazines?type=reissue", label: "復刻・絶版" },
  { href: "/magazines?type=digital-only", label: "電子限定" },
];

const policyLinks = [
  { href: "/about", label: "このサイトについて" },
  { href: "/about#affiliate", label: "広告掲載について" },
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/affiliate-disclosure", label: "アフィリエイト開示" },
];

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="footer-grid">
        <section>
          <div className="mh-serif foot-brand">
            <span>MODEL</span>
            <span>HUB</span>
          </div>
          <p className="foot-copy">
            グラビア雑誌・写真集の発売情報、表紙、出演モデルをまとめるコレクター向けアーカイブです。
          </p>
          <Link href="/about" className="foot-link strong">サイト概要</Link>
        </section>

        <section>
          <h2 className="foot-title">リンク集</h2>
          <div className="foot-links">
            {exploreLinks.map((link) => (
              <Link key={link.href} href={link.href} className="foot-link">
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="foot-title">免責</h2>
          <p className="foot-copy">
            本サイトはアフィリエイト広告を掲載しています。商品情報、価格、在庫、特典は各ストアの表示を確認してください。
          </p>
          <div className="foot-links policy">
            {policyLinks.map((link) => (
              <Link key={link.href} href={link.href} className="foot-link">
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="foot-bottom">
        <span>© 2026 MODEL HUB</span>
        <span>価格・在庫は各ストアの表示が優先されます</span>
      </div>

      <style>{`
        .site-foot {
          margin-top: var(--row-gap);
          border-top: 1px solid var(--line);
          background: var(--bg-2);
          color: var(--ink-2);
          padding: 34px var(--pad) 22px;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: minmax(220px, 1.1fr) minmax(220px, 1.5fr) minmax(220px, 1fr);
          gap: 28px;
          max-width: 1160px;
          margin: 0 auto;
        }
        .foot-brand {
          display: flex;
          gap: 0.4em;
          color: var(--ink);
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.14em;
          line-height: 1;
        }
        .foot-brand span:last-child {
          color: var(--primary);
        }
        .foot-copy {
          max-width: 38em;
          color: var(--ink-2);
          font-size: 13px;
          line-height: 1.8;
          margin: 14px 0;
        }
        .foot-title {
          color: var(--ink);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin: 0 0 12px;
        }
        .foot-links {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px 16px;
        }
        .foot-links.policy {
          grid-template-columns: 1fr;
          margin-top: 14px;
        }
        .foot-link {
          color: var(--ink-2);
          font-size: 12px;
          line-height: 1.5;
          text-decoration: none;
        }
        .foot-link:hover,
        .foot-link.strong {
          color: var(--primary);
        }
        .foot-bottom {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 10px 18px;
          max-width: 1160px;
          margin: 26px auto 0;
          border-top: 1px solid var(--line);
          padding-top: 16px;
          color: var(--ink-3);
          font-size: 11px;
        }
        @media (max-width: 760px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
          .foot-links {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
