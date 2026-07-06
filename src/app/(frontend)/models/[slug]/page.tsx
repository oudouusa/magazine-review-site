import type { Metadata } from "next";
import Link from "next/link";
import { getModelDetail } from "@/lib/magazine-hub-db";
import { getModelYearCounts, getCoStars, getRelatedModels } from "@/lib/mh-insights";
import { CoverCard } from "@/components/fx/CoverCard";
import { ModelCard } from "@/components/fx/ModelCard";
import { SectionHead } from "@/components/fx/SectionHead";
import { YearBars } from "@/components/fx/YearBars";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function purchaseQuery(seriesName: string, issue: string, title: string): string {
  return encodeURIComponent(`${seriesName} ${issue} ${title}`.trim());
}

function amazonHref(mag: { seriesName: string; issue: string; title: string; amazonUrl?: string }): string {
  return mag.amazonUrl ?? `https://www.amazon.co.jp/s?k=${purchaseQuery(mag.seriesName, mag.issue, mag.title)}&tag=magazinelab-22`;
}

function rakutenHref(mag: { seriesName: string; issue: string; title: string; rakutenUrl?: string }): string {
  return mag.rakutenUrl ?? `https://search.books.rakuten.co.jp/bks/genesis/search/?g=001&sitem=${purchaseQuery(mag.seriesName, mag.issue, mag.title)}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelDetail(decodeURIComponent(slug));
  if (!model) return { title: "モデルが見つかりません" };
  const desc = `${model.name}（${model.nameYomi}）のグラビア出演情報。出演${model.stats.issues}誌・表紙${model.stats.covers}回。掲載推移・共演モデル・関連モデルも。`;
  return {
    title: `${model.name} — モデル詳細`,
    description: desc,
    openGraph: {
      title: `${model.name} | MODEL HUB`,
      description: desc,
      url: `https://magazine.happyharem.com/models/${slug}`,
      ...(model.imageUrl ? { images: [{ url: model.imageUrl, alt: model.name }] } : {}),
    },
  };
}

export default async function ModelDetailPage({ params }: Props) {
  const { slug } = await params;
  const key = decodeURIComponent(slug);
  const model = getModelDetail(key);
  if (!model) notFound();

  const yearCounts = getModelYearCounts(key);
  const coStars = getCoStars(key, 8);
  const related = getRelatedModels(key, 6);
  const activeYears = yearCounts.filter((y) => y.count > 0).length;

  const profileItems: Array<{ label: string; value: string }> = [];
  if (model.profile.birthday) profileItems.push({ label: "生年月日", value: model.profile.birthday });
  if (model.profile.birthplace) profileItems.push({ label: "出身地", value: model.profile.birthplace });
  if (model.profile.height) profileItems.push({ label: "身長", value: model.profile.height });
  if (model.profile.bust && model.profile.waist && model.profile.hip) {
    profileItems.push({ label: "BWH", value: `B${model.profile.bust} W${model.profile.waist} H${model.profile.hip}` });
  }
  if (model.profile.debutYear) profileItems.push({ label: "デビュー", value: `${model.profile.debutYear}年` });
  if (model.stats.firstDate) profileItems.push({ label: "初掲載", value: model.stats.firstDate });
  if (model.stats.lastDate) profileItems.push({ label: "最新掲載", value: model.stats.lastDate });

  return (
    <>
      {/* Breadcrumb */}
      <div
        style={{
          padding: "10px var(--pad)",
          background: "var(--bg-2)",
          borderBottom: "1px solid var(--line)",
          fontSize: 11,
          color: "var(--ink-3)",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <Link href="/" style={{ color: "var(--ink-3)", textDecoration: "none" }}>ホーム</Link>
        <span aria-hidden>›</span>
        <Link href="/models" style={{ color: "var(--ink-3)", textDecoration: "none" }}>モデル</Link>
        <span aria-hidden>›</span>
        <span style={{ color: "var(--ink-2)" }}>{model.name}</span>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "var(--row-gap) var(--pad) 0" }}>
        {/* ---------------- Hero ---------------- */}
        <div className="model-hero" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 32, marginBottom: "var(--row-gap)" }}>
          <div>
            <div
              style={{
                aspectRatio: "3/4",
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: model.imageUrl
                  ? `url("${model.imageUrl}") center / cover no-repeat, linear-gradient(180deg, ${model.gradient.c3}, ${model.gradient.c4})`
                  : `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3}, ${model.gradient.c4})`,
                boxShadow: "var(--shadow-lift)",
                ...(!model.imageUrl
                  ? { display: "grid", placeItems: "center", color: "rgba(255,255,255,.6)", fontFamily: '"Noto Serif JP",serif', letterSpacing: "0.3em", fontSize: 14 }
                  : {}),
              }}
            >
              {!model.imageUrl ? "PORTRAIT" : null}
            </div>
          </div>

          <div>
            <div className="sh-eyebrow">Model Profile</div>
            <h1
              className="serif"
              style={{ fontSize: "clamp(30px, 4.5vw, 44px)", fontWeight: 900, letterSpacing: "0.12em", color: "var(--ink)", lineHeight: 1.1, margin: "0 0 6px" }}
            >
              {model.name}
            </h1>
            <div className="serif" style={{ fontSize: 14, color: "var(--ink-2)", letterSpacing: "0.25em", marginBottom: 18 }}>
              {model.nameYomi}
            </div>

            {profileItems.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {profileItems.map(({ label, value }) => (
                  <span key={label} className="tag" style={{ fontSize: 12 }}>
                    <span style={{ color: "var(--ink-3)", marginRight: 6 }}>{label}</span>
                    <span className="mh-num" style={{ color: "var(--ink)", fontWeight: 600 }}>{value}</span>
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 30, padding: "16px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
              {[
                { n: model.stats.issues, l: "掲載誌" },
                { n: model.stats.covers, l: "表紙" },
                { n: model.stats.brands, l: "ブランド" },
                { n: activeYears, l: "活動年数" },
              ].map(({ n, l }) => (
                <div key={l}>
                  <div className="serif mh-num" style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)" }}>
                    {n.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 9.5, letterSpacing: "0.25em", color: "var(--ink-3)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {yearCounts.length > 1 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--ink-3)", marginBottom: 8 }}>
                  キャリア年表（年別掲載数）
                </div>
                <YearBars data={yearCounts} height={104} />
              </div>
            )}
          </div>
        </div>

        {/* ---------------- 最近の掲載誌 ---------------- */}
        {model.recentIssues.length > 0 && (
          <section style={{ marginBottom: "var(--row-gap)" }}>
            <SectionHead eyebrow="Appearances" title="最近の掲載誌" />
            <div className="mh-rail">
              {model.recentIssues.map((mag) => (
                <div key={mag.slug} style={{ width: 150, flexShrink: 0 }}>
                  <CoverCard
                    href={`/magazines/${mag.slug}`}
                    title={`${mag.seriesName} ${mag.issue}`}
                    sub={mag.releaseDate}
                    imageUrl={mag.coverImageUrl}
                    c1={mag.gradient.c1}
                    c2={mag.gradient.c2}
                    obi={mag.badge === "preorder" ? "予約" : mag.badge === "new" ? "新刊" : undefined}
                    width="100%"
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                    <a
                      href={amazonHref(mag)}
                      target="_blank"
                      rel="nofollow sponsored noopener"
                      className="btn btn-amazon"
                      style={{ fontSize: 10.5, padding: "6px 0", justifyContent: "center" }}
                      aria-label={`${mag.seriesName} ${mag.issue}をAmazonで見る`}
                    >
                      Amazon
                    </a>
                    <a
                      href={rakutenHref(mag)}
                      target="_blank"
                      rel="nofollow sponsored noopener"
                      className="btn btn-rakuten"
                      style={{ fontSize: 10.5, padding: "6px 0", justifyContent: "center" }}
                      aria-label={`${mag.seriesName} ${mag.issue}を楽天ブックスで見る`}
                    >
                      楽天
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- 共演 ---------------- */}
        {coStars.length > 0 && (
          <section style={{ marginBottom: "var(--row-gap)" }}>
            <SectionHead eyebrow="Co-starring" title="よく同じ号に載るモデル" />
            <div className="mh-rail">
              {coStars.map((c) => (
                <ModelCard
                  key={c.key}
                  href={`/models/${c.slug}`}
                  name={c.name}
                  sub={`共演 ${c.count}回`}
                  imageUrl={c.imageUrl}
                  c1={c.c1}
                  c2={c.c2}
                  width={140}
                />
              ))}
            </div>
          </section>
        )}

        {/* ---------------- 出演履歴 ---------------- */}
        {model.recentIssues.length > 0 && (
          <section style={{ marginBottom: "var(--row-gap)" }}>
            <SectionHead eyebrow="Timeline" title="掲載履歴">
              <span style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap", paddingBottom: 6 }}>
                全{model.stats.issues.toLocaleString()}件中 直近{model.recentIssues.length}件
              </span>
            </SectionHead>
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
              {model.recentIssues.map((mag, i) => (
                <div
                  key={mag.slug}
                  className="timeline-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 52px 1fr auto",
                    gap: 16,
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: i < model.recentIssues.length - 1 ? "1px solid var(--line-2)" : undefined,
                  }}
                >
                  <div className="mh-num" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{mag.releaseDate}</div>
                  <Link href={`/magazines/${mag.slug}`} aria-label={`${mag.seriesName} ${mag.issue}`}>
                    <div
                      style={{
                        width: 52,
                        aspectRatio: "3/4",
                        borderRadius: 3,
                        background: mag.coverImageUrl
                          ? `url("${mag.coverImageUrl}") center top / cover no-repeat, linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`
                          : `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`,
                      }}
                    />
                  </Link>
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/magazines/${mag.slug}`} style={{ textDecoration: "none" }}>
                      <div className="serif" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>
                        {mag.seriesName} {mag.issue}
                      </div>
                    </Link>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {mag.title}
                    </div>
                  </div>
                  <div className="timeline-buy">
                    <a href={amazonHref(mag)} target="_blank" rel="nofollow sponsored noopener" aria-label={`${mag.seriesName} ${mag.issue}をAmazonで見る`}>Amazon</a>
                    <a href={rakutenHref(mag)} target="_blank" rel="nofollow sponsored noopener" aria-label={`${mag.seriesName} ${mag.issue}を楽天ブックスで見る`}>楽天</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- この人が好きなら ---------------- */}
        {related.length > 0 && (
          <section style={{ marginBottom: "var(--row-gap)" }}>
            <SectionHead eyebrow="You May Also Like" title="この人が好きなら" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--gap)" }}>
              {related.map((c) => (
                <ModelCard
                  key={c.key}
                  href={`/models/${c.slug}`}
                  name={c.name}
                  sub={c.count > 0 ? `共演 ${c.count}回` : "同じ雑誌に多数掲載"}
                  imageUrl={c.imageUrl}
                  c1={c.c1}
                  c2={c.c2}
                  width="100%"
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .timeline-buy { display: flex; gap: 6px; }
        .timeline-buy a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 64px;
          min-height: 28px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 10.5px;
          font-weight: 700;
        }
        .timeline-buy a:first-child { background: #ff9900; color: #241405; }
        .timeline-buy a:last-child { background: #bf0000; color: white; }
        @media (max-width: 640px) {
          .model-hero { grid-template-columns: 1fr !important; gap: 20px !important; }
          .timeline-row { grid-template-columns: 74px 44px 1fr !important; gap: 10px !important; }
          .timeline-buy { grid-column: 1 / -1; justify-content: flex-end; }
        }
      `}</style>
    </>
  );
}
