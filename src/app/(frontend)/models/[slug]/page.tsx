import type { Metadata } from "next";
import Link from "next/link";
import { getModelDetail } from "@/lib/magazine-hub-db";
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
  const desc = `${model.name}（${model.nameYomi}）のグラビア出演情報。出演${model.stats.issues}誌・表紙${model.stats.covers}回。`;
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
  const model = getModelDetail(decodeURIComponent(slug));
  if (!model) notFound();

  const profileItems: Array<{ label: string; value: string }> = [];
  if (model.profile.birthday) profileItems.push({ label: "生年月日", value: model.profile.birthday });
  if (model.profile.birthplace) profileItems.push({ label: "出身地", value: model.profile.birthplace });
  if (model.profile.height) profileItems.push({ label: "身長", value: model.profile.height });
  if (model.profile.bust && model.profile.waist && model.profile.hip) {
    profileItems.push({ label: "BWH", value: `B${model.profile.bust} W${model.profile.waist} H${model.profile.hip}` });
  }
  if (model.profile.debutYear) profileItems.push({ label: "デビュー", value: `${model.profile.debutYear}年` });
  if (model.stats.firstDate) profileItems.push({ label: "初出演", value: model.stats.firstDate });
  if (model.stats.lastDate) profileItems.push({ label: "最終出演", value: model.stats.lastDate });

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ padding: "10px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 6, alignItems: "center" }}>
        <Link href="/" style={{ color: "var(--ink-3)", textDecoration: "none" }}>ホーム</Link>
        <span>›</span>
        <Link href="/models" style={{ color: "var(--ink-3)", textDecoration: "none" }}>モデル</Link>
        <span>›</span>
        <span style={{ color: "var(--ink-2)" }}>{model.name}</span>
      </div>

      <div style={{ padding: "var(--row-gap) var(--pad)" }}>
        {/* Model Hero */}
        <div className="model-hero" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 32, marginBottom: "var(--row-gap)" }}>
          {/* Portrait */}
          <div>
            <div style={{
              aspectRatio: "3/4",
              borderRadius: 14,
              background: model.imageUrl
                ? `url("${model.imageUrl}") center / cover no-repeat, radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`
                : `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), radial-gradient(at 70% 60%, ${model.gradient.c2} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`,
              boxShadow: "0 30px 60px rgba(120,60,80,.22)",
              ...(!model.imageUrl ? { display: "grid", placeItems: "center", color: "rgba(255,255,255,.55)", fontFamily: '"Noto Serif JP",serif', letterSpacing: "0.3em", fontSize: 14 } : {}),
            }}>{!model.imageUrl ? "PORTRAIT" : null}</div>
          </div>

          {/* Profile */}
          <div>
            <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, letterSpacing: "0.32em", color: "var(--ink-3)", marginBottom: 4 }}>MODEL PROFILE</div>
            <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 42, fontWeight: 600, letterSpacing: "0.14em", color: "var(--ink)", lineHeight: 1.05, margin: "0 0 4px" }}>{model.name}</h1>
            <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 14, color: "var(--ink-2)", letterSpacing: "0.25em", marginBottom: 16 }}>{model.nameYomi}</div>

            {/* Profile grid */}
            {profileItems.length > 0 && (
              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr auto 1fr", gap: "8px 20px", fontSize: 12, marginBottom: 22 }}>
                {profileItems.map(({ label, value }) => (
                  <>
                    <dt key={`dt-${label}`} style={{ color: "var(--ink-3)", letterSpacing: "0.08em", fontFamily: '"Noto Serif JP",serif', whiteSpace: "nowrap" }}>{label}</dt>
                    <dd key={`dd-${label}`} style={{ color: "var(--ink)", margin: 0 }}>{value}</dd>
                  </>
                ))}
              </dl>
            )}

            {/* Stats */}
            <div style={{ display: "flex", gap: 26, padding: "16px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
              {[
                { n: model.stats.issues, l: "出演誌" },
                { n: model.stats.covers, l: "表紙回数" },
                { n: model.stats.brands, l: "出演誌種" },
              ].map(({ n, l }) => (
                <div key={l}>
                  <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 24, fontWeight: 600, color: "var(--ink)" }}>{n}</div>
                  <div style={{ fontSize: 9.5, letterSpacing: "0.25em", color: "var(--ink-3)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent appearances */}
        {model.recentIssues.length > 0 && (
          <div style={{ marginBottom: "var(--row-gap)" }}>
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">APPEARANCES</div>
                <h2 className="sh-title">最近の出演誌</h2>
              </div>
              <div className="sh-rule" />
            </div>
            <div className="appearances-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "var(--gap)" }}>
              {model.recentIssues.map((mag) => (
                <article key={mag.slug}>
                  <Link href={`/magazines/${mag.slug}`} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{
                      aspectRatio: "3/4",
                      borderRadius: 5,
                      background: mag.coverImageUrl
                        ? `url("${mag.coverImageUrl}") center top / cover no-repeat, linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`
                        : `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`,
                      position: "relative",
                      overflow: "hidden",
                      marginBottom: 9,
                      boxShadow: "0 10px 24px rgba(80,50,40,.12)",
                    }}>
                      {!mag.coverImageUrl && <div style={{ position: "absolute", top: 14, left: 14, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em" }}>{mag.seriesName}</div>}
                      <div style={{ position: "absolute", bottom: 12, left: 10, right: 10, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontSize: 11, fontWeight: 600, lineHeight: 1.3, textShadow: "0 1px 8px rgba(0,0,0,.34)" }}>{mag.issue}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: '"Noto Serif JP",serif', marginBottom: 2 }}>{mag.releaseDate}</div>
                    <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, fontWeight: 600, color: "var(--ink)", minHeight: 34 }}>{mag.seriesName}</div>
                  </Link>
                  <div className="appearance-buy">
                    <a href={amazonHref(mag)} target="_blank" rel="nofollow sponsored noopener" aria-label={`${mag.seriesName} ${mag.issue}をAmazonで見る`}>Amazon <span>PR</span></a>
                    <a href={rakutenHref(mag)} target="_blank" rel="nofollow sponsored noopener" aria-label={`${mag.seriesName} ${mag.issue}を楽天ブックスで見る`}>楽天 <span>PR</span></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Appearance timeline */}
        {model.recentIssues.length > 0 && (
          <div>
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">TIMELINE</div>
                <h2 className="sh-title">出演履歴</h2>
              </div>
              <div className="sh-rule" />
              <span style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>全{model.stats.issues}件</span>
            </div>
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
              {model.recentIssues.map((mag, i) => (
                <div key={mag.slug} className="timeline-row" style={{ display: "grid", gridTemplateColumns: "100px 56px 1fr auto", gap: 16, alignItems: "center", padding: "12px 16px", borderBottom: i < model.recentIssues.length - 1 ? "1px solid var(--line-2)" : undefined }}>
                  <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 11, color: "var(--ink-3)" }}>{mag.releaseDate}</div>
                  <div style={{
                    width: 56,
                    aspectRatio: "3/4",
                    borderRadius: 3,
                    background: mag.coverImageUrl
                      ? `url("${mag.coverImageUrl}") center top / cover no-repeat, linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`
                      : `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`
                  }} />
                  <div>
                    <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{mag.seriesName} {mag.issue}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mag.title}</div>
                  </div>
                  <div className="timeline-buy">
                    <a href={amazonHref(mag)} target="_blank" rel="nofollow sponsored noopener" aria-label={`${mag.seriesName} ${mag.issue}をAmazonで見る`}>Amazon</a>
                    <a href={rakutenHref(mag)} target="_blank" rel="nofollow sponsored noopener" aria-label={`${mag.seriesName} ${mag.issue}を楽天ブックスで見る`}>楽天</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        .appearance-buy {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
          margin-top: 8px;
        }
        .appearance-buy a,
        .timeline-buy a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          color: var(--ink);
          background: var(--paper);
          border: 1px solid var(--line);
        }
        .appearance-buy a:first-child,
        .timeline-buy a:first-child {
          background: #ff9900;
          border-color: #ee8d00;
          color: #241405;
        }
        .appearance-buy a:last-child,
        .timeline-buy a:last-child {
          background: #cc0000;
          border-color: #b50000;
          color: white;
        }
        .appearance-buy span {
          font-size: 8px;
          opacity: .72;
          margin-left: 3px;
        }
        .timeline-buy {
          display: flex;
          gap: 6px;
        }
        .timeline-buy a {
          min-width: 64px;
          min-height: 28px;
          font-size: 10.5px;
        }
        @media (max-width: 640px) {
          .model-hero { grid-template-columns: 1fr !important; gap: 20px !important; }
          .appearances-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .timeline-row { grid-template-columns: 74px 44px 1fr !important; gap: 10px !important; }
          .timeline-buy { grid-column: 1 / -1; justify-content: flex-end; }
        }
      `}</style>
    </>
  );
}
