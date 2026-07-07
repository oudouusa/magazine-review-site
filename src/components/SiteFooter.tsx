import Link from "next/link";

const EXPLORE: Array<{ href: string; label: string }> = [
  { href: "/calendar", label: "発売カレンダー" },
  { href: "/trending", label: "急上昇モデル" },
  { href: "/covers", label: "カバーウォール" },
  { href: "/ranking", label: "ランキング" },
  { href: "/brands", label: "ブランド一覧" },
];

const INFO: Array<{ href: string; label: string }> = [
  { href: "/about", label: "このサイトについて" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/affiliate-disclosure", label: "アフィリエイト表記" },
];

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", marginTop: "var(--row-gap)", background: "var(--bg-2)" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "36px var(--pad) 28px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 28,
        }}
      >
        <div>
          <div className="serif" style={{ fontSize: 17, fontWeight: 900, letterSpacing: "0.14em", color: "var(--ink)" }}>
            MODEL<span style={{ color: "var(--primary)" }}>HUB</span>
            <span aria-hidden style={{ color: "var(--primary)", fontSize: 10, marginLeft: 3 }}>●</span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.9, marginTop: 10 }}>
            グラビア雑誌・写真集の総合アーカイブ。発売カレンダー、掲載ランキング、
            カバーウォールで「次の一冊」に出会えます。毎日更新。
          </p>
        </div>
        <nav aria-label="探す">
          <div style={{ fontSize: 11, letterSpacing: "0.22em", color: "var(--ink-3)", marginBottom: 10 }}>探す</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {EXPLORE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} style={{ color: "var(--ink-2)", fontSize: 13, textDecoration: "none" }}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="サイト情報">
          <div style={{ fontSize: 11, letterSpacing: "0.22em", color: "var(--ink-3)", marginBottom: 10 }}>サイト情報</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {INFO.map((l) => (
              <li key={l.href}>
                <Link href={l.href} style={{ color: "var(--ink-2)", fontSize: 13, textDecoration: "none" }}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div style={{ borderTop: "1px solid var(--line)" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px var(--pad)",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11.5,
            color: "var(--ink-3)",
          }}
        >
          <span>© 2026 MODEL HUB</span>
          <span>当サイトはアフィリエイト広告を利用しています。価格・在庫は各ストアの表示が優先されます。</span>
        </div>
      </div>
    </footer>
  );
}
