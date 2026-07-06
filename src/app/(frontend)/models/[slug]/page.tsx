import type { Metadata } from "next";
import Link from "next/link";
import { ModelCard } from "@/components/ui/ModelCard";
import { YearBars } from "@/components/ui/YearBars";
import {
  getCoStars,
  getModelDetail,
  getModelYearCounts,
  getRelatedModels,
  type MhMagazine,
} from "@/lib/magazine-hub-db";
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

function badgeLabel(badge: MhMagazine["badge"]): string | undefined {
  if (badge === "new") return "新刊";
  if (badge === "preorder") return "予約";
  if (badge === "reissue") return "再販";
  return undefined;
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
  const performerKey = decodeURIComponent(slug);
  const model = getModelDetail(performerKey);
  if (!model) notFound();

  const yearCounts = getModelYearCounts(performerKey);
  const activeYears = yearCounts.filter((item) => item.count > 0).length;
  const showYearBars = activeYears >= 2;
  const coStars = getCoStars(performerKey, 8);
  const relatedModels = getRelatedModels(performerKey, 6);

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
      <div className="model-detail-breadcrumb">
        <Link href="/">ホーム</Link>
        <span>/</span>
        <Link href="/models">モデル</Link>
        <span>/</span>
        <span>{model.name}</span>
      </div>

      <main className="model-detail-page">
        <section className="model-detail-hero">
          <div className="model-detail-portrait">
            <div
              className="model-detail-portrait-img"
              style={{
                background: model.imageUrl
                  ? `url("${model.imageUrl}") center / cover no-repeat, radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`
                  : `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), radial-gradient(at 70% 60%, ${model.gradient.c2} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`,
              }}
            >
              {!model.imageUrl && <span>MODEL</span>}
            </div>
          </div>

          <div className="model-detail-profile">
            <div className="model-detail-eyebrow">MODEL PROFILE</div>
            <h1>{model.name}</h1>
            <p className="model-detail-yomi">{model.nameYomi}</p>

            {profileItems.length > 0 && (
              <dl className="model-detail-profile-grid">
                {profileItems.map(({ label, value }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="model-detail-stats">
              {[
                { n: model.stats.issues, l: "出演誌" },
                { n: model.stats.covers, l: "表紙回数" },
                { n: model.stats.brands, l: "出演誌種" },
                { n: activeYears, l: "活動年数" },
              ].map(({ n, l }) => (
                <div key={l}>
                  <strong className="mh-serif mh-num">{n}</strong>
                  <span>{l}</span>
                </div>
              ))}
            </div>

            {showYearBars && (
              <div className="model-detail-year-card">
                <h2>キャリア年表(年別掲載数)</h2>
                <YearBars data={yearCounts} height={88} />
              </div>
            )}
          </div>
        </section>

        {model.recentIssues.length > 0 && (
          <section className="model-detail-section">
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">APPEARANCES</div>
                <h2 className="sh-title">最近の出演誌</h2>
              </div>
              <div className="sh-rule" />
            </div>
            <div className="model-appearance-grid">
              {model.recentIssues.map((mag) => (
                <article key={mag.slug} className="model-appearance-card">
                  <Link href={`/magazines/${mag.slug}`} className="model-appearance-cover">
                    <span
                      style={{
                        background: mag.coverImageUrl
                          ? `linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,.72) 100%), url("${mag.coverImageUrl}") center top / cover no-repeat`
                          : `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`,
                      }}
                    >
                      {badgeLabel(mag.badge) && <b>{badgeLabel(mag.badge)}</b>}
                      {!mag.coverImageUrl && <em>{mag.seriesName}</em>}
                    </span>
                  </Link>
                  <div className="model-appearance-meta">
                    <time>{mag.releaseDate}</time>
                    <Link href={`/magazines/${mag.slug}`}>{mag.seriesName}</Link>
                    <p>{mag.issue}</p>
                  </div>
                  <div className="model-appearance-buy">
                    <a href={amazonHref(mag)} target="_blank" rel="nofollow sponsored noopener" className="btn btn-amazon" aria-label={`${mag.seriesName} ${mag.issue}をAmazonで見る`}>
                      Amazon <span className="pr-mini">PR</span>
                    </a>
                    <a href={rakutenHref(mag)} target="_blank" rel="nofollow sponsored noopener" className="btn btn-rakuten" aria-label={`${mag.seriesName} ${mag.issue}を楽天ブックスで見る`}>
                      楽天 <span className="pr-mini">PR</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {coStars.length > 0 && (
          <section className="model-detail-section">
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">CO-STARS</div>
                <h2 className="sh-title">よく同じ号に載るモデル</h2>
              </div>
              <div className="sh-rule" />
            </div>
            <div className="mh-rail">
              {coStars.map(({ model: coStar, count }) => (
                <ModelCard
                  key={coStar.slug}
                  href={`/models/${coStar.slug}`}
                  name={coStar.name}
                  sub={`共演 ${count}回`}
                  imageUrl={coStar.imageUrl}
                  c1={coStar.gradient.c1}
                  c2={coStar.gradient.c2}
                />
              ))}
            </div>
          </section>
        )}

        {relatedModels.length > 0 && (
          <section className="model-detail-section">
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">RELATED</div>
                <h2 className="sh-title">この人が好きなら</h2>
              </div>
              <div className="sh-rule" />
            </div>
            <div className="model-related-grid">
              {relatedModels.map(({ model: related, count }) => (
                <ModelCard
                  key={related.slug}
                  href={`/models/${related.slug}`}
                  name={related.name}
                  sub={count > 0 ? `共演 ${count}回` : "同じ雑誌に多数掲載"}
                  imageUrl={related.imageUrl}
                  c1={related.gradient.c1}
                  c2={related.gradient.c2}
                />
              ))}
            </div>
          </section>
        )}

        {model.recentIssues.length > 0 && (
          <section className="model-detail-section">
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">TIMELINE</div>
                <h2 className="sh-title">出演履歴</h2>
              </div>
              <div className="sh-rule" />
              <span className="model-detail-count">全{model.stats.issues}件</span>
            </div>
            <div className="model-timeline">
              {model.recentIssues.map((mag, index) => (
                <div key={mag.slug} className="model-timeline-row" style={{ borderBottom: index < model.recentIssues.length - 1 ? "1px solid var(--line-2)" : undefined }}>
                  <time>{mag.releaseDate}</time>
                  <Link
                    href={`/magazines/${mag.slug}`}
                    className="model-timeline-cover"
                    style={{
                      background: mag.coverImageUrl
                        ? `url("${mag.coverImageUrl}") center top / cover no-repeat, linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`
                        : `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`,
                    }}
                    aria-label={`${mag.seriesName} ${mag.issue}`}
                  />
                  <div>
                    <Link href={`/magazines/${mag.slug}`}>{mag.seriesName} {mag.issue}</Link>
                    <p>{mag.title}</p>
                  </div>
                  <div className="model-timeline-buy">
                    <a href={amazonHref(mag)} target="_blank" rel="nofollow sponsored noopener" className="btn btn-amazon" aria-label={`${mag.seriesName} ${mag.issue}をAmazonで見る`}>Amazon</a>
                    <a href={rakutenHref(mag)} target="_blank" rel="nofollow sponsored noopener" className="btn btn-rakuten" aria-label={`${mag.seriesName} ${mag.issue}を楽天ブックスで見る`}>楽天</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <style>{`
        .model-detail-breadcrumb {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 10px var(--pad);
          border-bottom: 1px solid var(--line);
          background: var(--paper-2);
          color: var(--ink-3);
          font-size: 11px;
        }
        .model-detail-breadcrumb a {
          color: var(--ink-3);
          text-decoration: none;
        }
        .model-detail-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: var(--row-gap) var(--pad);
        }
        .model-detail-hero {
          display: grid;
          grid-template-columns: minmax(240px, 330px) minmax(0, 1fr);
          gap: clamp(24px, 4vw, 44px);
          align-items: start;
          margin-bottom: calc(var(--row-gap) * 1.25);
        }
        .model-detail-portrait {
          padding: 10px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--paper);
          box-shadow: 0 22px 60px rgba(0,0,0,.28);
        }
        .model-detail-portrait-img {
          display: grid;
          place-items: center;
          aspect-ratio: 3 / 4;
          border-radius: 6px;
          overflow: hidden;
          color: rgba(255,255,255,.62);
          font-family: "Noto Serif JP", serif;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: .22em;
        }
        .model-detail-profile {
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--paper);
          padding: clamp(18px, 3vw, 28px);
        }
        .model-detail-eyebrow {
          margin-bottom: 6px;
          color: var(--accent);
          font-family: "Noto Serif JP", serif;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .28em;
        }
        .model-detail-profile h1 {
          margin: 0;
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: clamp(34px, 6vw, 58px);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: 0;
        }
        .model-detail-yomi {
          margin: 8px 0 22px;
          color: var(--ink-2);
          font-family: "Noto Serif JP", serif;
          font-size: 14px;
          letter-spacing: .16em;
        }
        .model-detail-profile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 16px;
          margin: 0 0 22px;
        }
        .model-detail-profile-grid div {
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--bg-2);
        }
        .model-detail-profile-grid dt {
          margin-bottom: 4px;
          color: var(--ink-3);
          font-size: 10px;
        }
        .model-detail-profile-grid dd {
          margin: 0;
          color: var(--ink);
          font-size: 13px;
          font-weight: 700;
        }
        .model-detail-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border: 1px solid var(--line);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-2);
        }
        .model-detail-stats div {
          padding: 14px 12px;
          border-right: 1px solid var(--line);
        }
        .model-detail-stats div:last-child {
          border-right: 0;
        }
        .model-detail-stats strong {
          display: block;
          color: var(--ink);
          font-size: 26px;
          font-weight: 900;
          line-height: 1;
        }
        .model-detail-stats span {
          display: block;
          margin-top: 6px;
          color: var(--ink-3);
          font-size: 10px;
          letter-spacing: .12em;
        }
        .model-detail-year-card {
          margin-top: 16px;
          padding: 14px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--bg-2);
        }
        .model-detail-year-card h2 {
          margin: 0 0 10px;
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0;
        }
        .model-detail-section {
          margin-top: var(--row-gap);
        }
        .model-appearance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: var(--gap);
        }
        .model-appearance-card {
          min-width: 0;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--paper);
          overflow: hidden;
        }
        .model-appearance-cover,
        .model-appearance-cover span {
          display: block;
          text-decoration: none;
        }
        .model-appearance-cover span {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
        }
        .model-appearance-cover b {
          position: absolute;
          top: 8px;
          left: 8px;
          border-radius: 999px;
          background: var(--primary);
          color: #fff;
          font-size: 10px;
          line-height: 1;
          padding: 5px 7px;
        }
        .model-appearance-cover em {
          position: absolute;
          inset: auto 12px 12px;
          color: rgba(255,255,255,.9);
          font-family: "Noto Serif JP", serif;
          font-size: 13px;
          font-style: normal;
          font-weight: 900;
          line-height: 1.35;
        }
        .model-appearance-meta {
          padding: 10px 10px 0;
          min-height: 78px;
        }
        .model-appearance-meta time {
          display: block;
          color: var(--ink-3);
          font-size: 10px;
          margin-bottom: 4px;
        }
        .model-appearance-meta a {
          display: block;
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.35;
          text-decoration: none;
        }
        .model-appearance-meta p {
          margin: 3px 0 0;
          color: var(--ink-2);
          font-size: 11px;
          line-height: 1.45;
        }
        .model-appearance-buy {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
          padding: 10px;
        }
        .model-appearance-buy .btn,
        .model-timeline-buy .btn {
          justify-content: center;
          min-width: 0;
          padding: 8px 9px;
          font-size: 11px;
        }
        .model-related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(156px, 156px));
          gap: 14px;
        }
        .model-detail-count {
          flex-shrink: 0;
          color: var(--ink-3);
          font-size: 11px;
        }
        .model-timeline {
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--paper);
          overflow: hidden;
        }
        .model-timeline-row {
          display: grid;
          grid-template-columns: 104px 54px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          padding: 12px 14px;
        }
        .model-timeline-row time {
          color: var(--ink-3);
          font-family: "Noto Serif JP", serif;
          font-size: 11px;
        }
        .model-timeline-cover {
          width: 54px;
          aspect-ratio: 3 / 4;
          border: 1px solid var(--line);
          border-radius: 4px;
        }
        .model-timeline-row a {
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
        }
        .model-timeline-row p {
          margin: 4px 0 0;
          color: var(--ink-3);
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .model-timeline-buy {
          display: flex;
          gap: 6px;
        }
        @media (max-width: 760px) {
          .model-detail-hero {
            grid-template-columns: 1fr;
          }
          .model-detail-portrait {
            max-width: 360px;
          }
          .model-detail-profile-grid,
          .model-detail-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .model-detail-stats div:nth-child(2) {
            border-right: 0;
          }
          .model-detail-stats div:nth-child(-n + 2) {
            border-bottom: 1px solid var(--line);
          }
          .model-timeline-row {
            grid-template-columns: 78px 44px minmax(0, 1fr);
            gap: 10px;
          }
          .model-timeline-buy {
            grid-column: 1 / -1;
            justify-content: flex-end;
          }
        }
        @media (max-width: 460px) {
          .model-detail-page {
            padding-left: 12px;
            padding-right: 12px;
          }
          .model-appearance-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .model-related-grid {
            grid-template-columns: repeat(2, 156px);
            overflow-x: auto;
            padding-bottom: 4px;
          }
        }
      `}</style>
    </>
  );
}
