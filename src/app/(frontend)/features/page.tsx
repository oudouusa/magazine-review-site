import type { Metadata } from "next";
import Link from "next/link";
import { FEATURE_ARTICLES } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "特集記事",
  description: "グラビア雑誌・写真集に関する特集記事・インタビュー・解説。編集部が厳選してお届けします。",
};

const ALL_FEATURES = [
  ...FEATURE_ARTICLES,
  { slug: "reissue-guide", title: "復刻版・絶版の見分け方と入手法", lede: "市場から消えた名作グラビア写真集を手に入れるための完全ガイド。", category: "ガイド", author: "編集部", date: "2026/04/28", gradient: { c1: "#d9c8f0", c2: "#8a6bbc" } },
  { slug: "magazine-history", title: "グラビア雑誌40年史", lede: "1980年代の創刊ラッシュから現在のデジタル化まで、日本のグラビア文化を振り返る。", category: "特集", author: "編集部", date: "2026/04/15", gradient: { c1: "#c8d8c8", c2: "#4a7a4a" } },
  { slug: "photobook-production", title: "写真集ができるまで — 制作現場に密着", lede: "企画から撮影、校正、印刷まで。写真集の制作現場を独占取材。", category: "特集", author: "編集部", date: "2026/04/01", gradient: { c1: "#f0d4b8", c2: "#c88a5a" } },
];

export default function FeaturesPage() {
  const hero = ALL_FEATURES[0];
  const rest = ALL_FEATURES.slice(1);

  return (
    <>
      {/* Page header */}
      <div style={{ background: "linear-gradient(120deg, var(--primary-2) 0%, var(--rose-3) 100%)", padding: "32px var(--pad) 28px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, letterSpacing: "0.32em", color: "var(--ink-3)", marginBottom: 6 }}>FEATURE ARTICLES</div>
        <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 32, fontWeight: 600, letterSpacing: "0.1em", margin: 0, color: "var(--ink)" }}>特集記事</h1>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>編集部がお届けする、グラビア文化の深掘り記事</p>
      </div>

      <div style={{ padding: "var(--row-gap) var(--pad)" }}>
        {/* Featured hero article */}
        <Link href={`/features/${hero.slug}`} style={{ textDecoration: "none", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap)", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", marginBottom: "var(--row-gap)", boxShadow: "0 1px 2px rgba(60,30,40,.04)", cursor: "pointer" }}>
          <div style={{
            aspectRatio: "16/10",
            background: `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,.4)), linear-gradient(160deg, ${hero.gradient.c1}, ${hero.gradient.c2})`,
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,.92)", color: "var(--primary)", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em" }}>{hero.category}</div>
          </div>
          <div style={{ padding: "28px 28px 24px" }}>
            <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.14em", marginBottom: 10 }}>{hero.date} · {hero.author}</div>
            <h2 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 26, fontWeight: 600, letterSpacing: "0.06em", color: "var(--ink)", lineHeight: 1.4, margin: "0 0 14px" }}>{hero.title}</h2>
            <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.85, letterSpacing: "0.04em", margin: 0 }}>{hero.lede}</p>
          </div>
        </Link>

        {/* Grid of remaining articles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap)" }}>
          {rest.map((article) => (
            <Link key={article.slug} href={`/features/${article.slug}`} style={{ textDecoration: "none", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 1px 2px rgba(60,30,40,.04)", cursor: "pointer" }}>
              <div style={{ aspectRatio: "16/9", background: `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,.32)), linear-gradient(160deg, ${article.gradient.c1}, ${article.gradient.c2})`, position: "relative" }}>
                <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,.92)", color: "var(--primary)", padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em" }}>{article.category}</div>
              </div>
              <div style={{ padding: "var(--card-pad)", flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.14em", fontFamily: '"Noto Serif JP",serif', marginBottom: 6 }}>{article.date} · {article.author}</div>
                <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 16, fontWeight: 600, letterSpacing: "0.04em", color: "var(--ink)", lineHeight: 1.5, marginBottom: 8 }}>{article.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.7, letterSpacing: "0.02em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{article.lede}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
