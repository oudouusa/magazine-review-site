import type { Metadata } from "next";
import Link from "next/link";
import { LATEST_ISSUES, EDITOR_PICKS } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "雑誌・写真集一覧",
  description: "グラビア雑誌・写真集の一覧。週刊・月刊・写真集・電子限定・復刻・限定版を網羅。",
};

const TYPE_TABS = [
  { key: "all", label: "すべて", count: 892 },
  { key: "weekly", label: "週刊誌", count: 156 },
  { key: "monthly", label: "月刊誌", count: 88 },
  { key: "photobook", label: "写真集", count: 412 },
  { key: "digital-only", label: "電子限定", count: 134 },
  { key: "backnumber", label: "バックナンバー", count: 567 },
  { key: "reissue", label: "復刻", count: 43 },
  { key: "limited", label: "限定版", count: 29 },
];

const FACETS = {
  publisher: ["講談社", "集英社", "小学館", "光文社", "サンライズ出版"],
  year: ["2026年", "2025年", "2024年", "2023年以前"],
  priceRange: ["〜500円", "501〜1000円", "1001〜3000円", "3001円〜"],
  status: ["新刊", "予約受付中", "在庫あり", "品切れ・絶版"],
};

const allMags = [...LATEST_ISSUES, ...EDITOR_PICKS.map((p) => ({
  slug: p.slug,
  title: p.title,
  seriesName: p.seriesName,
  issue: p.issue,
  publisher: p.publisher,
  releaseDate: p.releaseDate,
  gradient: p.gradient,
  price: p.price,
  badge: undefined as "new" | "preorder" | "reissue" | undefined,
}))];

export default function MagazinesPage() {
  return (
    <>
      {/* Page header */}
      <div style={{ background: "linear-gradient(120deg, var(--primary-2) 0%, var(--rose-3) 100%)", padding: "32px var(--pad) 28px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, letterSpacing: "0.32em", color: "var(--ink-3)", marginBottom: 6 }}>MAGAZINE &amp; PHOTOBOOK</div>
        <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 32, fontWeight: 600, letterSpacing: "0.1em", margin: 0, color: "var(--ink)" }}>雑誌・写真集一覧</h1>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6, letterSpacing: "0.04em" }}>グラビア誌・写真集 892タイトルを収録</p>
      </div>

      {/* Type tabs */}
      <div style={{ padding: "0 var(--pad)", background: "var(--paper)", borderBottom: "1px solid var(--line)", display: "flex", gap: 2, overflowX: "auto" }}>
        {TYPE_TABS.map((tab) => (
          <Link key={tab.key} href={`/magazines?type=${tab.key}`} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "14px 18px",
            fontFamily: '"Noto Serif JP",serif',
            fontSize: 13,
            letterSpacing: "0.08em",
            color: tab.key === "all" ? "var(--primary)" : "var(--ink-2)",
            textDecoration: "none",
            borderBottom: tab.key === "all" ? "2px solid var(--primary)" : "2px solid transparent",
            whiteSpace: "nowrap",
          }}>
            {tab.label}
            <span style={{ fontSize: 10, background: tab.key === "all" ? "var(--primary-2)" : "var(--bg-2)", color: tab.key === "all" ? "var(--primary)" : "var(--ink-3)", padding: "1px 6px", borderRadius: 999 }}>{tab.count}</span>
          </Link>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ padding: "12px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>全892件</span>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {["新着順", "発売日", "人気", "価格 安い", "価格 高い"].map((s, i) => (
            <button key={s} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 999, border: "1px solid var(--line)", background: i === 0 ? "var(--primary)" : "white", color: i === 0 ? "white" : "var(--ink-2)", cursor: "pointer", fontFamily: '"Noto Serif JP",serif' }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "var(--gap)", padding: "var(--row-gap) var(--pad)", alignItems: "start" }}>
        {/* Left: month-grouped lists */}
        <div>
          {/* 2026年5月 */}
          <div style={{ marginBottom: "var(--row-gap)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--plum)", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>2026年5月</div>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--line), transparent)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap)" }}>
              {LATEST_ISSUES.map((mag) => (
                <Link key={mag.slug} href={`/magazines/${mag.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,30,40,.04)", cursor: "pointer" }}>
                    <div style={{ aspectRatio: "3/4", background: `linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,.35)), linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`, position: "relative" }}>
                      <div style={{ position: "absolute", top: 12, left: 12, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontWeight: 700, fontSize: 14, letterSpacing: "0.12em" }}>{mag.seriesName}</div>
                      <div style={{ position: "absolute", left: 12, right: 12, bottom: 14, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontSize: 12, fontWeight: 600, lineHeight: 1.35, letterSpacing: "0.04em" }}>{mag.title}</div>
                      {mag.badge && <div style={{ position: "absolute", top: 8, right: 8, background: mag.badge === "new" ? "var(--leaf)" : mag.badge === "preorder" ? "var(--amber)" : "var(--amber)", color: "white", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>{mag.badge === "new" ? "新刊" : mag.badge === "preorder" ? "予約" : "復刻"}</div>}
                    </div>
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 3 }}>{mag.publisher} · {mag.releaseDate}</div>
                      <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>{mag.issue}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>￥{mag.price.toLocaleString()}</span>
                        <span style={{ fontSize: 10, background: "var(--primary-2)", color: "var(--primary)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>Amazon</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 2026年4月 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--plum)", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>2026年4月</div>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--line), transparent)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap)" }}>
              {EDITOR_PICKS.map((book) => (
                <Link key={book.slug} href={`/magazines/${book.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,30,40,.04)" }}>
                    <div style={{ aspectRatio: "3/4", background: `linear-gradient(160deg, ${book.gradient.c1}, ${book.gradient.c2})`, position: "relative" }}>
                      <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", lineHeight: 1.35 }}>{book.title}</div>
                    </div>
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 3 }}>{book.releaseDate}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>￥{book.price.toLocaleString()}</span>
                        <span style={{ fontSize: 10, background: "var(--primary-2)", color: "var(--primary)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>Amazon</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right: facets */}
        <aside style={{ position: "sticky", top: 80 }}>
          {Object.entries(FACETS).map(([key, values]) => (
            <div key={key} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: "var(--ink-3)", marginBottom: 10 }}>
                {key === "publisher" ? "出版社" : key === "year" ? "発売年" : key === "priceRange" ? "価格帯" : "状態"}
              </div>
              {values.map((v) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-2)", cursor: "pointer", marginBottom: 6 }}>
                  <input type="checkbox" style={{ accentColor: "var(--primary)" }} />
                  {v}
                </label>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
