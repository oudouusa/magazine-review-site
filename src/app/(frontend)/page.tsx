import type { Metadata } from "next";
import Link from "next/link";
import { getTopModels, getRecentIssues, getBrands } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "MODEL HUB — グラビア雑誌・写真集アーカイブ",
  description: "グラビア雑誌・写真集のコレクター向けアーカイブ。Amazon・楽天・FANZAの3社価格比較。",
  openGraph: {
    title: "MODEL HUB — グラビア雑誌・写真集アーカイブ",
    description: "グラビア雑誌・写真集のコレクター向けアーカイブ。3,000名以上のモデルと163,000誌以上を収録。",
    url: "https://magazine.happyharem.com",
    type: "website",
  },
};

function CoverPlaceholder({
  c1,
  c2,
  width,
  aspectRatio = "3/4",
  rotate = 0,
  mast,
  feature,
  badge,
  coverImageUrl,
}: {
  c1: string;
  c2: string;
  width?: string;
  aspectRatio?: string;
  rotate?: number;
  mast?: string;
  feature?: string;
  badge?: string;
  coverImageUrl?: string;
}) {
  return (
    <div
      style={{
        width,
        aspectRatio,
        borderRadius: "5px",
        background: coverImageUrl
          ? `url("${coverImageUrl}") center / cover no-repeat, linear-gradient(160deg, ${c1}, ${c2})`
          : `linear-gradient(160deg, ${c1}, ${c2})`,
        position: "relative",
        overflow: "hidden",
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        flexShrink: 0,
      }}
    >
      {!coverImageUrl && <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(at 30% 25%, rgba(255,255,255,.32), transparent 55%)",
        }}
      />}
      {badge && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "var(--pr)",
            color: "white",
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 3,
            letterSpacing: "0.12em",
          }}
        >
          {badge === "new" ? "新刊" : badge === "preorder" ? "予約" : "復刻"}
        </div>
      )}
      {mast && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            fontFamily: '"Noto Serif JP", serif',
            color: "rgba(255,255,255,.96)",
            textShadow: "0 1px 3px rgba(0,0,0,.25)",
            letterSpacing: "0.12em",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {mast}
        </div>
      )}
      {feature && (
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 16,
            fontFamily: '"Noto Serif JP", serif',
            color: "rgba(255,255,255,.96)",
            textShadow: "0 1px 3px rgba(0,0,0,.25)",
            fontSize: 13,
            letterSpacing: "0.06em",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          {feature}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const issues = getRecentIssues(20);
  const top10 = getTopModels(10);
  const brands = getBrands().slice(0, 12);
  const featured = issues[0];
  const editorIssues = issues.slice(1, 5);
  const newArrivals = issues.slice(6, 12);

  return (
    <>
      {/* ── Hero (cover variant) ── */}
      <section className="hero">
        <div className="hero-eyebrow">
          FEATURED ISSUE — 今週のスポットライト
          <span className="pr-tag" style={{ marginLeft: 8 }}>PR</span>
        </div>
        <div className="hero-cover">
          <div className="h-meta">
            <h1 className="h-title serif" style={{ fontSize: 42, fontWeight: 600, lineHeight: 1.2, letterSpacing: "0.06em", margin: "2px 0 12px", color: "var(--ink)" }}>
              {featured?.title ?? "最新グラビアをアーカイブ"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.85, letterSpacing: "0.04em", marginBottom: 22, maxWidth: 460 }}>
              表紙＆巻頭グラビアで圧巻のデビュー。沖縄ロケで撮り下ろした20ページの独占グラビアは必見。彼女の魅力を余すことなく収めた保存版。
            </p>
            <div style={{ display: "flex", gap: 16, marginBottom: 22, fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", flexWrap: "wrap" }}>
              <span>誌名 <b style={{ color: "var(--plum)", fontFamily: "\"Noto Serif JP\",serif" }}>{featured?.seriesName}</b></span>
              <span>号数 <b style={{ color: "var(--plum)", fontFamily: "\"Noto Serif JP\",serif" }}>{featured?.issue}</b></span>
              <span>発売 <b style={{ color: "var(--plum)", fontFamily: "\"Noto Serif JP\",serif" }}>{featured?.releaseDate}</b></span>
            </div>
            <div className="h-ctas">
              <a href="#" className="btn btn-amazon">Amazonで買う <span className="pr-mini">PR</span></a>
              <a href="#" className="btn btn-rakuten">楽天ブックス <span className="pr-mini">PR</span></a>
              {featured && <Link href={`/magazines/${featured.slug}`} className="btn btn-ghost" style={{ textDecoration: "none" }}>詳細を見る</Link>}
            </div>
          </div>
          <div className="h-cover-stage">
            {featured && <CoverPlaceholder
              c1={featured.gradient.c1}
              c2={featured.gradient.c2}
              width="320px"
              rotate={-2}
              mast={featured.coverImageUrl ? undefined : featured.seriesName}
              feature={featured.coverImageUrl ? undefined : featured.title}
              coverImageUrl={featured.coverImageUrl}
            />}
          </div>
        </div>
      </section>

      <div style={{ padding: "0 var(--pad)" }}>
        {/* ── Latest Issues ── */}
        <section className="section">
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">LATEST ISSUES</div>
              <h2 className="sh-title">最新号スポットライト</h2>
            </div>
            <div className="sh-rule" />
            <Link href="/magazines" className="sh-more">すべて見る</Link>
          </div>
          <div className="spotlight">
            {/* Hero card */}
            {featured && <div className="sl-hero" style={{ gridRow: "span 2", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "var(--card-pad)", display: "flex", flexDirection: "column", boxShadow: "0 1px 2px rgba(60,30,40,.04)" }}>
              <div style={{ flex: 1, marginBottom: 14 }}>
                <CoverPlaceholder
                  c1={featured.gradient.c1}
                  c2={featured.gradient.c2}
                  mast={featured.coverImageUrl ? undefined : featured.seriesName}
                  feature={featured.coverImageUrl ? undefined : featured.title}
                  coverImageUrl={featured.coverImageUrl}
                />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: "\"Noto Serif JP\",serif", color: "var(--plum)", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em" }}>{featured.seriesName}</span>
                <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{featured.issue}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)", fontFamily: "\"Noto Serif JP\",serif" }}>{featured.releaseDate}</span>
              </div>
              <h3 style={{ fontFamily: "\"Noto Serif JP\",serif", fontSize: 18, fontWeight: 600, letterSpacing: "0.04em", color: "var(--ink)", lineHeight: 1.45, margin: "4px 0 10px" }}>{featured.title}</h3>
              <Link href={`/magazines/${featured.slug}`} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12, textDecoration: "none", textAlign: "center" }}>詳細を見る</Link>
            </div>}
            {/* Small cards */}
            {issues.slice(1, 6).map((mag) => (
              <Link key={mag.slug} href={`/magazines/${mag.slug}`} className="sl-item" style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: "var(--card-pad)", display: "grid", gridTemplateColumns: "96px 1fr", gap: 12, alignItems: "center", cursor: "pointer", transition: "transform .12s, box-shadow .12s", boxShadow: "0 1px 2px rgba(60,30,40,.04)", textDecoration: "none" }}>
                <CoverPlaceholder c1={mag.gradient.c1} c2={mag.gradient.c2} width="96px" mast={mag.coverImageUrl ? undefined : mag.seriesName.slice(0, 8)} coverImageUrl={mag.coverImageUrl} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: "0.06em", marginBottom: 4 }}>
                    <b style={{ color: "var(--plum)", fontFamily: "\"Noto Serif JP\",serif", fontWeight: 600, letterSpacing: "0.08em", marginRight: 6 }}>{mag.seriesName}</b>
                    {mag.issue}
                  </div>
                  <div style={{ fontFamily: "\"Noto Serif JP\",serif", fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.45, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{mag.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "var(--ink-3)" }}>{mag.releaseDate}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10.5, padding: "4px 10px", borderRadius: 999, background: "var(--primary)", color: "white", fontWeight: 600 }}>詳細を見る</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── TOP 10 Ranking ── */}
        <section className="section">
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">MONTHLY TRENDING</div>
              <h2 className="sh-title">モデル TOP 10</h2>
            </div>
            <div className="sh-rule" />
            <Link href="/ranking" className="sh-more">ランキングへ</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
            {[0, 5].map((offset) => (
              <div key={offset} className="ranking">
                {top10.slice(offset, offset + 5).map((model, i) => {
                  const rank = offset + i + 1;
                  return (
                    <Link key={model.slug} href={`/models/${model.slug}`} className="rank-card" style={{ textDecoration: "none" }}>
                      <div className="rk-portrait" style={{ "--c1": model.gradient.c1, "--c2": model.gradient.c2, "--c3": model.gradient.c3, "--c4": model.gradient.c4, ...(model.imageUrl ? { background: `url("${model.imageUrl}") center / cover no-repeat, radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)` } : {}) } as React.CSSProperties}>
                        <div className={`rk-num${rank <= 3 ? ` r-${rank}` : ""}`}>{rank}</div>
                      </div>
                      <div className="rk-body">
                        <div className="rk-name serif">{model.name}</div>
                        <div className="rk-yomi serif">{model.nameYomi}</div>
                        <div className="rk-foot">
                          <span>出演 <b>{model.stats.issues}</b>誌</span>
                          <span style={{ marginLeft: 12 }}>表紙 <b>{model.stats.covers}</b>回</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {/* ── Editor's Pick ── */}
        <section className="section">
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">RECENT ISSUES</div>
              <h2 className="sh-title">最近の号</h2>
            </div>
            <div className="sh-rule" />
            <Link href="/magazines" className="sh-more">すべて見る</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap)" }}>
            {editorIssues.map((issue) => (
              <Link key={issue.slug} href={`/magazines/${issue.slug}`} style={{ textDecoration: "none" }}>
                <div style={{
                  aspectRatio: "3/4", borderRadius: 8,
                  background: issue.coverImageUrl
                    ? `url("${issue.coverImageUrl}") center / cover no-repeat, linear-gradient(160deg, ${issue.gradient.c1}, ${issue.gradient.c2})`
                    : `linear-gradient(160deg, ${issue.gradient.c1}, ${issue.gradient.c2})`,
                  marginBottom: 8, position: "relative", overflow: "hidden", boxShadow: "0 8px 18px rgba(80,50,40,.12)",
                }}>
                  {!issue.coverImageUrl && <>
                    <div style={{ position: "absolute", top: 12, left: 12, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontWeight: 700, fontSize: 13 }}>{issue.seriesName}</div>
                    <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{issue.title}</div>
                  </>}
                </div>
                <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{issue.issue}</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{issue.releaseDate}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Browse by Brand ── */}
        <section className="section">
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">BROWSE</div>
              <h2 className="sh-title">ブランドから探す</h2>
            </div>
            <div className="sh-rule" />
            <Link href="/brands" className="sh-more">すべてのブランド</Link>
          </div>
          <div className="browse">
            <div className="browse-grid">
              {brands.map((brand) => (
                <Link key={brand.name} href={`/magazines?brand=${brand.slug}`} className="bw-card" style={{
                  ...({"--c1": brand.gradient.c1, "--c2": brand.gradient.c2} as React.CSSProperties),
                  ...(brand.coverImageUrl ? { background: `url("${brand.coverImageUrl}") center / cover no-repeat, linear-gradient(160deg, ${brand.gradient.c1}, ${brand.gradient.c2})` } : {}),
                }}>
                  <div className="bw-label">
                    <div className="ttl">{brand.name}</div>
                    <div className="n">{brand.issueCount}号</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── New Arrivals ── */}
        <section className="section">
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">NEW ARRIVALS</div>
              <h2 className="sh-title">新着・予約受付中</h2>
            </div>
            <div className="sh-rule" />
            <Link href="/magazines?sort=release_date" className="sh-more">すべて見る</Link>
          </div>
          <div className="arrivals">
            {newArrivals.map((book) => (
              <Link key={book.slug} href={`/magazines/${book.slug}`} className="ar-card" style={{ textDecoration: "none" }}>
                <div className="ar-cover" style={{
                  ...({"--c1": book.gradient.c1, "--c2": book.gradient.c2} as React.CSSProperties),
                  ...(book.coverImageUrl ? { background: `url("${book.coverImageUrl}") center / cover no-repeat, linear-gradient(160deg, ${book.gradient.c1}, ${book.gradient.c2})` } : {}),
                }}>
                  {book.badge && <div className="ar-badge">{book.badge === "new" ? "新刊" : book.badge === "preorder" ? "予約" : "復刻"}</div>}
                  {!book.coverImageUrl && <div className="ar-mast">{book.seriesName}</div>}
                </div>
                <div className="ar-meta">{book.releaseDate}</div>
                <div className="ar-name">{book.title}</div>
                <div className="ar-foot">
                  <span className="shop">詳細を見る</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── More Models ── */}
        <section className="section">
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">MODELS</div>
              <h2 className="sh-title">注目モデル</h2>
            </div>
            <div className="sh-rule" />
            <Link href="/models" className="sh-more">全モデル一覧</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "var(--gap)" }} className="more-models-grid">
            {getTopModels(6).map((model) => (
              <Link key={model.slug} href={`/models/${model.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,30,40,.04)" }}>
                  <div style={{
                    aspectRatio: "3/4",
                    background: model.imageUrl
                      ? `url("${model.imageUrl}") center / cover no-repeat, radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`
                      : `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), radial-gradient(at 70% 60%, ${model.gradient.c2} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`,
                  }} />
                  <div style={{ padding: "8px 10px 10px" }}>
                    <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{model.name}</div>
                    <div style={{ fontSize: 9, color: "var(--ink-3)" }}>出演 {model.stats.issues}誌</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ── Newsletter ── */}
      <div style={{ padding: "0 var(--pad)" }}>
        <div className="newsletter">
          <div>
            <div className="nl-eyebrow">NEWSLETTER</div>
            <h3 className="nl-title">新刊・予約情報をメールでお届け</h3>
            <p className="nl-sub">週1回、注目の新刊と予約受付開始情報をお届けします。</p>
          </div>
          <form className="nl-form" action="#">
            <input type="email" placeholder="メールアドレスを入力" />
            <button type="submit">登録</button>
          </form>
        </div>
      </div>

      <style>{`
        .hero {
          position: relative;
          background: var(--hero-grad);
          padding: var(--pad) 32px;
          overflow: hidden;
        }
        .hero::before {
          content: "";
          position: absolute;
          top: -40px; left: 20%;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: var(--hero-glow1);
          filter: blur(20px);
          pointer-events: none;
        }
        .hero::after {
          content: "";
          position: absolute;
          bottom: -60px; right: 12%;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: var(--hero-glow2);
          filter: blur(20px);
          pointer-events: none;
        }
        .hero-eyebrow {
          position: relative;
          z-index: 1;
          font-family: "Noto Serif JP", serif;
          font-size: 11px;
          letter-spacing: 0.35em;
          color: var(--ink-3);
          margin-bottom: 4px;
        }
        .hero-cover {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 32px;
          align-items: center;
          padding: 24px 0 20px;
          position: relative;
          z-index: 1;
        }
        .h-cover-stage {
          display: grid;
          place-items: center;
        }
        .h-ctas { display: flex; gap: 8px; flex-wrap: wrap; }
        .section { padding: var(--row-gap) 0 0; }
        .spotlight {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: var(--gap);
        }
        .sl-item:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(80,50,40,.08); }
        .ranking {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: var(--gap);
        }
        .rank-card {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 1px 2px rgba(60,30,40,.04);
          cursor: pointer;
          color: inherit;
        }
        .rk-portrait {
          aspect-ratio: 3/4;
          background:
            radial-gradient(at 30% 25%, var(--c1) 0%, transparent 55%),
            radial-gradient(at 70% 60%, var(--c2) 0%, transparent 55%),
            linear-gradient(180deg, var(--c3) 0%, var(--c4) 100%);
          position: relative;
        }
        .rk-num {
          position: absolute;
          top: 8px; left: 10px;
          font-family: "Noto Serif JP", serif;
          font-size: 56px;
          font-weight: 700;
          line-height: 1;
          color: rgba(255,255,255,.96);
          text-shadow: 0 2px 8px rgba(0,0,0,.22);
          letter-spacing: -0.02em;
          z-index: 1;
        }
        .rk-num::before {
          content: "No.";
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: -8px;
          opacity: 0.75;
        }
        .rank-card.r-1 .rk-num,
        .rank-card.r-2 .rk-num,
        .rank-card.r-3 .rk-num {
          background: linear-gradient(180deg, #f6e0a4, #c98a3a);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: none;
        }
        .rank-card.r-2 .rk-num { background: linear-gradient(180deg, #f4f0e8, #a89d8e); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .rank-card.r-3 .rk-num { background: linear-gradient(180deg, #efd0bb, #a47868); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .rk-trend {
          position: absolute;
          top: 12px; right: 10px;
          font-size: 10px;
          background: rgba(0,0,0,.45);
          color: white;
          padding: 2px 7px;
          border-radius: 999px;
          letter-spacing: 0.04em;
          font-weight: 600;
          z-index: 1;
        }
        .rk-trend.up   { background: rgba(107,143,107,.85); }
        .rk-trend.down { background: rgba(180,90,80,.7); }
        .rk-trend.new  { background: rgba(201,138,58,.92); }
        .rk-body { padding: 10px 12px 12px; }
        .rk-name { font-family: "Noto Serif JP", serif; font-size: 15px; font-weight: 600; letter-spacing: 0.06em; color: var(--ink); }
        .rk-yomi { font-family: "Noto Serif JP", serif; font-size: 10px; color: var(--ink-3); letter-spacing: 0.12em; margin: 1px 0 6px; }
        .rk-tags { display: flex; gap: 3px; flex-wrap: wrap; margin-bottom: 8px; }
        .rk-foot { display: flex; border-top: 1px dashed var(--line); padding-top: 7px; font-size: 10px; color: var(--ink-3); letter-spacing: 0.04em; }
        .rk-foot b { color: var(--plum); font-family: "Noto Serif JP", serif; font-weight: 700; }
        .pickup {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: var(--gap);
          align-items: stretch;
        }
        .pk-hero {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 14px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          box-shadow: 0 1px 2px rgba(60,30,40,.04);
        }
        .pk-cover-stage {
          background: var(--hero-grad);
          display: grid; place-items: center;
          padding: 26px 14px;
          position: relative;
          overflow: hidden;
        }
        .pk-meta { padding: 22px 24px; display: flex; flex-direction: column; }
        .pk-eyebrow { font-family: "Noto Serif JP", serif; font-size: 9.5px; letter-spacing: 0.32em; color: var(--pr); margin-bottom: 8px; }
        .pk-title { font-family: "Noto Serif JP", serif; font-size: 22px; font-weight: 600; letter-spacing: 0.06em; line-height: 1.35; margin: 0 0 8px; color: var(--ink); }
        .pk-by { font-size: 11.5px; color: var(--ink-3); letter-spacing: 0.08em; font-family: "Noto Serif JP", serif; margin-bottom: 12px; }
        .pk-by b { color: var(--plum); font-weight: 600; }
        .pk-quote { font-family: "Noto Serif JP", serif; font-size: 12.5px; line-height: 1.85; color: var(--ink-2); letter-spacing: 0.04em; border-left: 2px solid var(--rose-2); padding-left: 10px; margin: 0 0 14px; }
        .pk-stats { display: flex; gap: 14px; font-size: 10.5px; color: var(--ink-3); letter-spacing: 0.08em; margin-bottom: auto; }
        .pk-stats b { color: var(--ink); font-family: "Noto Serif JP", serif; font-weight: 600; font-size: 14px; display: block; }
        .pk-buy { display: grid; grid-template-columns: auto auto; gap: 6px; margin-top: 16px; }
        .price-tag { grid-column: 1 / -1; display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; padding-bottom: 6px; border-bottom: 1px dashed var(--line); }
        .price-tag .price { font-family: "Noto Serif JP", serif; font-size: 22px; font-weight: 600; color: var(--ink); }
        .price-tag .yen { font-size: 13px; color: var(--ink-3); }
        .pickup-list { display: flex; flex-direction: column; gap: var(--gap); }
        .pk-item { background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: var(--card-pad); display: grid; grid-template-columns: 96px 1fr; gap: 14px; align-items: center; cursor: pointer; box-shadow: 0 1px 2px rgba(60,30,40,.04); flex: 1; transition: transform .12s; }
        .pk-item:hover { transform: translateY(-1px); }
        .pk-mini { aspect-ratio: 3/4; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 10px rgba(80,50,40,.10); }
        .pki-body { min-width: 0; }
        .pki-genre { font-size: 9.5px; letter-spacing: 0.25em; color: var(--pr); font-family: "Noto Serif JP", serif; margin-bottom: 4px; font-weight: 600; }
        .pki-title { font-family: "Noto Serif JP", serif; font-size: 14px; font-weight: 600; letter-spacing: 0.04em; line-height: 1.4; margin-bottom: 6px; color: var(--ink); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .pki-foot { display: flex; align-items: center; gap: 8px; font-size: 10.5px; color: var(--ink-3); font-family: "Noto Serif JP", serif; }
        .pki-price { margin-left: auto; color: var(--ink); font-size: 12.5px; font-weight: 600; }
        .pki-price .yen { font-size: 10px; color: var(--ink-3); margin-right: 1px; }
        .browse { background: var(--paper); border: 1px solid var(--line); border-radius: 14px; padding: var(--card-pad); box-shadow: 0 1px 2px rgba(60,30,40,.04); }
        .browse-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
        .bw-card {
          aspect-ratio: 4/5;
          border-radius: 10px;
          background: linear-gradient(180deg, rgba(255,255,255,0) 50%, rgba(0,0,0,.35)), linear-gradient(160deg, var(--c1), var(--c2));
          position: relative; overflow: hidden; cursor: pointer; transition: transform .15s; display: block;
        }
        .bw-card:hover { transform: translateY(-2px); }
        .bw-label { position: absolute; bottom: 10px; left: 10px; right: 10px; color: white; font-family: "Noto Serif JP", serif; }
        .bw-label .ttl { font-size: 14px; font-weight: 600; letter-spacing: 0.08em; line-height: 1; text-shadow: 0 1px 3px rgba(0,0,0,.3); }
        .bw-label .n { font-size: 9.5px; letter-spacing: 0.18em; opacity: 0.85; margin-top: 4px; font-weight: 500; }
        .arrivals { display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--gap); }
        .ar-card { cursor: pointer; }
        .ar-cover {
          aspect-ratio: 3/4; border-radius: 5px;
          background: linear-gradient(160deg, var(--c1), var(--c2));
          position: relative; overflow: hidden; margin-bottom: 9px; box-shadow: 0 10px 24px rgba(80,50,40,.12);
        }
        .ar-cover::before { content: ""; position: absolute; inset: 0; background: radial-gradient(at 30% 25%, rgba(255,255,255,.32), transparent 55%); }
        .ar-badge { position: absolute; top: 8px; left: 8px; background: var(--pr); color: white; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.12em; }
        .ar-mast { position: absolute; bottom: 12px; left: 10px; right: 10px; font-family: "Noto Serif JP", serif; color: rgba(255,255,255,.96); text-shadow: 0 1px 2px rgba(0,0,0,.3); font-size: 12px; letter-spacing: 0.06em; font-weight: 600; line-height: 1.3; }
        .ar-meta { font-size: 10px; color: var(--ink-3); letter-spacing: 0.06em; font-family: "Noto Serif JP", serif; margin-bottom: 1px; }
        .ar-name { font-family: "Noto Serif JP", serif; font-size: 13px; font-weight: 600; color: var(--ink); letter-spacing: 0.04em; line-height: 1.35; margin-bottom: 5px; }
        .ar-foot { display: flex; align-items: center; gap: 6px; font-size: 11px; font-family: "Noto Serif JP", serif; }
        .ar-foot .price { color: var(--ink); font-weight: 600; }
        .ar-foot .yen { color: var(--ink-3); font-size: 9px; }
        .ar-foot .shop { margin-left: auto; font-size: 9.5px; background: var(--primary-2); color: var(--primary); padding: 2px 7px; border-radius: 999px; font-weight: 600; letter-spacing: 0.04em; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gap); }
        .feat-card { background: var(--paper); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 1px 2px rgba(60,30,40,.04); display: flex; flex-direction: column; }
        .feat-img { aspect-ratio: 16/9; background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,.32)), linear-gradient(160deg, var(--c1), var(--c2)); position: relative; overflow: hidden; }
        .feat-img::before { content: ""; position: absolute; inset: 0; background: radial-gradient(at 30% 25%, rgba(255,255,255,.25), transparent 55%); }
        .feat-tag { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,.92); color: var(--primary); padding: 3px 9px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; }
        .feat-body { padding: var(--card-pad); }
        .feat-meta { font-size: 10px; color: var(--ink-3); letter-spacing: 0.14em; font-family: "Noto Serif JP", serif; margin-bottom: 6px; }
        .feat-title { font-family: "Noto Serif JP", serif; font-size: 16px; font-weight: 600; letter-spacing: 0.04em; color: var(--ink); line-height: 1.5; margin-bottom: 8px; }
        .feat-lede { font-size: 12px; color: var(--ink-2); line-height: 1.7; letter-spacing: 0.02em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .newsletter { background: var(--hero-grad); border-radius: 16px; padding: 28px 32px; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 24px; position: relative; overflow: hidden; margin-top: var(--row-gap); }
        .newsletter::before { content: ""; position: absolute; top: -30px; right: 20%; width: 180px; height: 180px; background: var(--hero-glow1); filter: blur(20px); border-radius: 50%; }
        .nl-eyebrow { font-family: "Noto Serif JP", serif; font-size: 10px; letter-spacing: 0.35em; color: var(--ink-3); margin-bottom: 6px; position: relative; }
        .nl-title { font-family: "Noto Serif JP", serif; font-size: 22px; font-weight: 600; letter-spacing: 0.1em; margin: 0 0 4px; color: var(--ink); position: relative; }
        .nl-sub { font-size: 12px; color: var(--ink-2); letter-spacing: 0.04em; line-height: 1.6; position: relative; margin: 0; }
        .nl-form { display: flex; background: white; border: 1px solid var(--line); border-radius: 999px; padding: 4px; align-items: center; position: relative; }
        .nl-form input { border: 0; outline: 0; padding: 8px 16px; font-size: 12.5px; font-family: inherit; width: 240px; background: transparent; color: var(--ink); }
        .nl-form button { background: var(--primary); color: white; border: 0; border-radius: 999px; padding: 10px 22px; font-family: "Noto Serif JP", serif; font-size: 12px; letter-spacing: 0.12em; cursor: pointer; font-weight: 600; }
        @media (max-width: 640px) {
          .hero { padding: var(--pad); }
          .hero-cover { grid-template-columns: 1fr; }
          .h-cover-stage { display: none; }
          .h-title { font-size: 28px !important; }
          .h-ctas { flex-direction: column; }
          .spotlight { grid-template-columns: 1fr; }
          .sl-hero { display: none; }
          .ranking { grid-template-columns: repeat(2, 1fr); }
          .browse-grid { grid-template-columns: repeat(3, 1fr); }
          .arrivals { grid-template-columns: repeat(3, 1fr); }
          .features-grid { grid-template-columns: 1fr; }
          .newsletter { grid-template-columns: 1fr; gap: 16px; }
          .nl-form { flex-direction: column; border-radius: 12px; gap: 8px; }
          .nl-form input { width: 100%; }
          .nl-form button { border-radius: 999px; width: 100%; }
        }
      `}</style>
    </>
  );
}
