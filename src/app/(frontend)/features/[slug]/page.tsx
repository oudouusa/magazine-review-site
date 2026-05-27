import type { Metadata } from "next";
import Link from "next/link";
import { getRecentIssues } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

const FEATURE_ARTICLES = [
  { slug: "first-edition-guide", title: "初版の見分け方・完全ガイド", lede: "写真集コレクターなら必ず知っておきたい、初版と重版の見分け方。背表紙の印刷番号から奥付の確認方法まで徹底解説。", category: "解説", author: "編集部", date: "2026/05/15", gradient: { c1: "#f5d4dc", c2: "#c87890" } },
  { slug: "interview-asahina", title: "朝比奈 結衣 特別インタビュー", lede: "ファースト写真集発売を前に、撮影の裏話から今後の活動まで。独占インタビューを全文掲載。", category: "インタビュー", author: "編集部", date: "2026/05/10", gradient: { c1: "#bcc6d9", c2: "#5a6b8f" } },
  { slug: "luna-weekly-history", title: "Luna Weekly 40年の歴史", lede: "1986年創刊から続くグラビア誌の金字塔。歴代表紙モデルと時代を彩った名作グラビアを一挙紹介。", category: "特集", author: "編集部", date: "2026/05/05", gradient: { c1: "#f0d4b8", c2: "#c88a5a" } },
];

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = FEATURE_ARTICLES.find((a) => a.slug === slug) ?? FEATURE_ARTICLES[0];
  return {
    title: article.title,
    description: article.lede,
  };
}

export default async function FeatureDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = FEATURE_ARTICLES.find((a) => a.slug === slug) ?? FEATURE_ARTICLES[0];
  const otherArticles = FEATURE_ARTICLES.filter((a) => a.slug !== article.slug);
  const recentIssues = getRecentIssues(4);

  return (
    <>
      {/* Article hero */}
      <div style={{ textAlign: "center", padding: "48px var(--pad) 32px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,.92)", color: "var(--primary)", padding: "4px 16px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", border: "1px solid var(--rose-2)", marginBottom: 16 }}>{article.category}</div>
        <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 38, fontWeight: 600, letterSpacing: "0.08em", color: "var(--ink)", lineHeight: 1.45, margin: "0 0 16px" }}>{article.title}</h1>
        <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.85, letterSpacing: "0.04em", margin: "0 0 20px" }}>{article.lede}</p>
        <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.14em", fontFamily: '"Noto Serif JP",serif' }}>
          {article.date} · {article.author} · 読了時間 約8分
        </div>
      </div>

      {/* Article cover image */}
      <div style={{
        height: 400,
        background: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.5)), linear-gradient(160deg, ${article.gradient.c1}, ${article.gradient.c2})`,
        marginTop: -32,
        marginBottom: 0,
      }} />

      {/* Article body */}
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "48px var(--pad)" }}>
        <p style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 16, lineHeight: 2.0, letterSpacing: "0.04em", color: "var(--ink-2)", marginBottom: 32 }}>
          グラビアの世界において、「初版」の価値は単なるコレクターズアイテムを超えている。発売直後の鮮度、印刷の品質、そして何より「その時」にしか存在しなかった文化的瞬間の証人として、初版には特別な意味が宿る。
        </p>

        <h2 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 24, fontWeight: 600, letterSpacing: "0.1em", color: "var(--ink)", margin: "40px 0 16px", borderLeft: "3px solid var(--primary)", paddingLeft: 16 }}>
          1. 奥付を確認する
        </h2>
        <p style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 15, lineHeight: 2.0, letterSpacing: "0.04em", color: "var(--ink-2)", marginBottom: 24 }}>
          最も確実な方法は奥付（本の末尾）に記載された発行日と刷数を確認することだ。「第1刷発行」と明記されていれば初版である。多くの写真集では発行年月日の下に「第〇刷」という表記がある。
        </p>

        <h3 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 18, fontWeight: 600, letterSpacing: "0.08em", color: "var(--plum)", margin: "32px 0 12px" }}>
          背表紙の印刷番号
        </h3>
        <p style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 15, lineHeight: 2.0, letterSpacing: "0.04em", color: "var(--ink-2)", marginBottom: 24 }}>
          一部の出版社では背表紙の下部に小さな数字を印刷している。「1」から始まるものが初版、それ以上の数字が重版を示す。ただしこの慣行は出版社によって異なるため、注意が必要だ。
        </p>

        <blockquote style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 14, lineHeight: 1.9, color: "var(--ink-2)", letterSpacing: "0.04em", borderLeft: "3px solid var(--rose-2)", paddingLeft: 18, background: "var(--paper-2)", padding: "16px 18px", borderRadius: "0 8px 8px 0", margin: "24px 0", fontStyle: "italic" }}>
          「初版には、その本が生まれた瞬間の熱量がある。編集者、撮影スタッフ、モデル、全員が最高のものを作ろうとした、その空気が紙に宿っている気がする」<br />
          <cite style={{ fontSize: 12, color: "var(--ink-3)", fontStyle: "normal", display: "block", marginTop: 8 }}>— ベテランコレクター・田中氏</cite>
        </blockquote>

        {/* Inline product card */}
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "var(--card-pad)", display: "grid", gridTemplateColumns: "96px 1fr auto", gap: 16, alignItems: "center", margin: "32px 0" }}>
          {recentIssues[0] && <>
            <div style={{ width: 96, aspectRatio: "3/4", borderRadius: 5, background: `linear-gradient(160deg, ${recentIssues[0].gradient.c1}, ${recentIssues[0].gradient.c2})` }} />
            <div>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 9.5, letterSpacing: "0.25em", color: "var(--pr)", marginBottom: 4, fontWeight: 600 }}>最新号</div>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{recentIssues[0].seriesName} {recentIssues[0].issue}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{recentIssues[0].releaseDate}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <a href={`/magazines/${recentIssues[0].slug}`} className="btn btn-primary" style={{ fontSize: 11, padding: "7px 14px" }}>詳細を見る</a>
            </div>
          </>}
        </div>

        <h2 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 24, fontWeight: 600, letterSpacing: "0.1em", color: "var(--ink)", margin: "40px 0 16px", borderLeft: "3px solid var(--primary)", paddingLeft: 16 }}>
          2. カバーの加工を確認する
        </h2>
        <p style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 15, lineHeight: 2.0, letterSpacing: "0.04em", color: "var(--ink-2)", marginBottom: 24 }}>
          高価な写真集では初版のみ特殊加工（箔押し、UV加工、エンボス等）が施されることがある。重版では原価削減のためこれらが省略されることも多い。手に取ってカバーの触感を確かめることも重要な判断基準となる。
        </p>

        {/* Action row */}
        <div style={{ display: "flex", gap: 12, padding: "24px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", margin: "40px 0 32px" }}>
          <button className="btn btn-ghost">👍 役立った</button>
          <button className="btn btn-ghost">🔖 あとで読む</button>
          <button className="btn btn-ghost">共有</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {["コレクション", "写真集", "ガイド"].map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>
      </article>

      {/* Related products */}
      <div style={{ padding: "0 var(--pad)", maxWidth: 760, margin: "0 auto" }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <div>
            <div className="sh-eyebrow">RELATED PRODUCTS</div>
            <h2 className="sh-title" style={{ fontSize: 20 }}>この記事で取り上げた商品</h2>
          </div>
          <div className="sh-rule" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap)", marginBottom: "var(--row-gap)" }}>
          {recentIssues.slice(0, 4).map((mag) => (
            <Link key={mag.slug} href={`/magazines/${mag.slug}`} style={{ textDecoration: "none" }}>
              <div style={{ aspectRatio: "3/4", borderRadius: 5, background: `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`, marginBottom: 8, boxShadow: "0 8px 18px rgba(80,50,40,.12)" }} />
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{mag.seriesName}</div>
              <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{mag.releaseDate}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Related articles */}
      <div style={{ padding: "0 var(--pad) var(--row-gap)", maxWidth: 760, margin: "0 auto" }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <div>
            <div className="sh-eyebrow">RELATED ARTICLES</div>
            <h2 className="sh-title" style={{ fontSize: 20 }}>関連記事</h2>
          </div>
          <div className="sh-rule" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--gap)" }}>
          {otherArticles.map((a) => (
            <Link key={a.slug} href={`/features/${a.slug}`} style={{ textDecoration: "none", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ aspectRatio: "16/9", background: `linear-gradient(160deg, ${a.gradient.c1}, ${a.gradient.c2})`, position: "relative" }}>
                <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,.9)", color: "var(--primary)", padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 700 }}>{a.category}</div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.45 }}>{a.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
