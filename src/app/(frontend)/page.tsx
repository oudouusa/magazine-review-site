import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { CoverCard } from "@/components/ui/CoverCard";
import { ModelCard } from "@/components/ui/ModelCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCounter } from "@/components/ui/StatCounter";
import {
  getBrands,
  getNewThisWeek,
  getOnThisDay,
  getSiteStats,
  getTodayBirthdays,
  getTopModels,
  getTrendingModels,
  getUpcomingReleases,
  type MhUpcoming,
} from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MODEL HUB — グラビア雑誌・写真集アーカイブ",
  description: "グラビア雑誌・写真集のコレクター向けアーカイブ。発売カレンダーと急上昇モデルもチェックできます。",
  openGraph: {
    title: "MODEL HUB — グラビア雑誌・写真集アーカイブ",
    description: "グラビア雑誌・写真集のコレクター向けアーカイブ。発売カレンダー、急上昇モデル、カバーアーカイブを収録。",
    url: "https://magazine.happyharem.com",
    type: "website",
  },
};

const pageWrap: CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "0 var(--pad)",
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function formatMonthDay(date: string): string {
  const [, month = "", day = ""] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function getWeekday(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  return weekdays[parsed.getDay()] ?? "";
}

function kindLabel(kind: MhUpcoming["kind"]): string {
  if (kind === "photobook") return "写真集";
  if (kind === "digital_photobook") return "デジタル";
  return "雑誌";
}

function kindTone(kind: MhUpcoming["kind"]): "primary" | "accent" | "info" {
  if (kind === "photobook") return "primary";
  if (kind === "digital_photobook") return "accent";
  return "info";
}

function UpcomingRow({ item, compactThumb = false }: { item: MhUpcoming; compactThumb?: boolean }) {
  return (
    <div className="home-release-row">
      <div className="home-date-chip">
        <span className="mh-num">{formatMonthDay(item.date)}</span>
        <small>{getWeekday(item.date)}</small>
      </div>
      {compactThumb && item.coverImageUrl && (
        <div
          aria-hidden="true"
          style={{
            width: 44,
            aspectRatio: "3 / 4",
            flexShrink: 0,
            borderRadius: 5,
            border: "1px solid var(--line)",
            background: `url("${item.coverImageUrl}") center / cover no-repeat`,
          }}
        />
      )}
      <div className="home-release-main">
        <div className="home-release-meta">
          <Badge tone="muted">{item.brand || "未分類"}</Badge>
          <Badge tone={kindTone(item.kind)}>{kindLabel(item.kind)}</Badge>
        </div>
        <div className="home-release-title">
          {item.cardId ? (
            <Link href={`/magazines/card-${item.cardId}`}>{item.title}</Link>
          ) : (
            <span>{item.title}</span>
          )}
        </div>
        {item.performerName && (
          <div className="home-release-performer">
            {item.performerKey ? (
              <Link href={`/models/${encodeURIComponent(item.performerKey)}`}>{item.performerName}</Link>
            ) : (
              <span>{item.performerName}</span>
            )}
          </div>
        )}
      </div>
      {item.amazonUrl && (
        <a
          href={item.amazonUrl}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="btn btn-amazon"
          style={{ fontSize: 11, padding: "7px 10px" }}
        >
          予約
        </a>
      )}
    </div>
  );
}

export default function HomePage() {
  const stats = getSiteStats();
  const heroCovers = getNewThisWeek(8);
  const newThisWeek = getNewThisWeek(14);
  const upcoming = getUpcomingReleases(30).slice(0, 8);
  const trending = getTrendingModels(6);
  const birthdays = getTodayBirthdays();
  const onThisDay = getOnThisDay(4);
  const topModels = getTopModels(12);
  const brands = getBrands().slice(0, 20);

  return (
    <>
      <section className="home-hero">
        <div style={pageWrap}>
          <div className="home-hero-grid">
            <div>
              <h1 className="mh-serif home-hero-title">今夜も、いいグラビアに出会う。</h1>
              <p className="home-hero-sub">グラビア雑誌・写真集のアーカイブと発売カレンダー。</p>
              <div className="home-stats" aria-label="収録データ">
                <StatCounter value={stats.models} label="収録モデル" />
                <StatCounter value={stats.issues} label="収録誌" />
                <StatCounter value={stats.covers} label="カバー" />
                <StatCounter value={stats.brands} label="ブランド" />
              </div>
            </div>

            <div className="home-collage">
              {heroCovers.map((cover, index) => {
                const rotate = [-3, 2, -2, 3, 2, -3, 3, -2][index] ?? 0;
                return (
                  <Link
                    key={cover.slug}
                    href={`/magazines/${cover.slug}`}
                    className="home-collage-card"
                    style={{
                      width: index % 2 === 0 ? 122 : 110,
                      transform: `rotate(${rotate}deg)`,
                      background: cover.coverImageUrl
                        ? `url("${cover.coverImageUrl}") center / cover no-repeat, linear-gradient(160deg, ${cover.gradient.c1}, ${cover.gradient.c2})`
                        : `linear-gradient(160deg, ${cover.gradient.c1}, ${cover.gradient.c2})`,
                    }}
                  >
                    {!cover.coverImageUrl && <span>{cover.seriesName}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main style={{ ...pageWrap, paddingTop: "var(--row-gap)", paddingBottom: "var(--row-gap)" }}>
        <section>
          <SectionHeader icon="🆕" title="今週の新刊" moreHref="/magazines" />
          <div className="mh-rail">
            {newThisWeek.map((magazine) => (
              <CoverCard
                key={magazine.slug}
                href={`/magazines/${magazine.slug}`}
                title={magazine.title}
                sub={`${magazine.seriesName}・${formatMonthDay(magazine.releaseDate)}`}
                imageUrl={magazine.coverImageUrl}
                c1={magazine.gradient.c1}
                c2={magazine.gradient.c2}
                badge={magazine.badge === "new" ? "新刊" : magazine.badge === "preorder" ? "予約" : undefined}
                width={150}
              />
            ))}
          </div>
        </section>

        <section style={{ marginTop: "var(--row-gap)" }}>
          <SectionHeader icon="🗓" title="近日発売" moreHref="/calendar" moreLabel="カレンダーを見る" />
          <div className="home-list">
            {upcoming.map((item) => (
              <UpcomingRow key={`${item.date}-${item.title}-${item.cardId ?? item.performerKey ?? item.brand}`} item={item} />
            ))}
          </div>
        </section>

        <section style={{ marginTop: "var(--row-gap)" }}>
          <SectionHeader icon="📈" title="急上昇モデル" moreHref="/trending" />
          <div className="home-model-grid">
            {trending.map((model) => (
              <ModelCard
                key={model.key}
                href={`/models/${encodeURIComponent(model.key)}`}
                name={model.name}
                sub={`直近6ヶ月 ${model.recent6}誌`}
                imageUrl={model.imageUrl}
                c1={model.c1}
                c2={model.c2}
                spark={model.monthly.slice(-12)}
              />
            ))}
          </div>
        </section>

        {birthdays.length > 0 && (
          <section style={{ marginTop: "var(--row-gap)" }}>
            <SectionHeader icon="🎂" title="今日が誕生日" />
            <div className="home-model-grid">
              {birthdays.map((model) => (
                <ModelCard
                  key={model.key}
                  href={`/models/${encodeURIComponent(model.key)}`}
                  name={model.name}
                  sub={`${model.birthday}生まれ・${model.pubCount}誌`}
                  imageUrl={model.imageUrl}
                  c1={model.c1}
                  c2={model.c2}
                />
              ))}
            </div>
          </section>
        )}

        <section style={{ marginTop: "var(--row-gap)" }}>
          <SectionHeader icon="📅" title="この日、あの表紙" subtitle="過去の同じ日に発売された一冊" />
          <div className="home-cover-grid">
            {onThisDay.map((magazine) => (
              <CoverCard
                key={magazine.slug}
                href={`/magazines/${magazine.slug}`}
                title={magazine.title}
                sub={`${magazine.seriesName}・${magazine.releaseDate.slice(0, 4)}年`}
                imageUrl={magazine.coverImageUrl}
                c1={magazine.gradient.c1}
                c2={magazine.gradient.c2}
                width="100%"
              />
            ))}
          </div>
        </section>

        <section style={{ marginTop: "var(--row-gap)" }}>
          <SectionHeader icon="👑" title="人気モデル" moreHref="/models" />
          <div className="home-model-grid">
            {topModels.map((model, index) => (
              <ModelCard
                key={model.slug}
                href={`/models/${model.slug}`}
                name={model.name}
                sub={`${model.stats.issues}誌`}
                imageUrl={model.imageUrl}
                c1={model.gradient.c1}
                c2={model.gradient.c2}
                rank={index + 1}
              />
            ))}
          </div>
        </section>

        <section style={{ marginTop: "var(--row-gap)" }}>
          <SectionHeader icon="🏷" title="ブランドから探す" moreHref="/brands" />
          <div className="home-brand-tags">
            {brands.map((brand) => (
              <Link key={brand.name} href={`/magazines?brand=${brand.slug}`} className="tag">
                {brand.name}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        .home-hero {
          position: relative;
          overflow: hidden;
          padding: 48px 0 40px;
          border-bottom: 1px solid var(--line);
          background:
            radial-gradient(circle at 18% 8%, var(--hero-glow1), transparent 28%),
            radial-gradient(circle at 76% 0%, var(--hero-glow2), transparent 26%),
            var(--hero-grad);
        }
        .home-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 44px;
          align-items: center;
        }
        .home-hero-title {
          max-width: 620px;
          margin: 0;
          color: var(--ink);
          font-size: clamp(30px, 5vw, 44px);
          font-weight: 900;
          line-height: 1.22;
        }
        .home-hero-sub {
          margin: 14px 0 0;
          color: var(--ink-2);
          font-size: 14px;
          line-height: 1.8;
        }
        .home-stats {
          display: flex;
          gap: clamp(18px, 4vw, 34px);
          flex-wrap: wrap;
          margin-top: 28px;
        }
        .home-collage {
          display: grid;
          grid-template-columns: repeat(2, max-content);
          gap: 12px 14px;
          align-items: center;
        }
        .home-collage-card {
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 8px;
          color: rgba(255,255,255,0.92);
          text-align: center;
          text-decoration: none;
          box-shadow: 0 16px 40px rgba(0,0,0,0.34);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .home-collage-card:hover {
          transform: rotate(0deg) translateY(-2px) !important;
          box-shadow: 0 20px 48px rgba(0,0,0,0.42);
        }
        .home-collage-card span {
          max-width: 80%;
          font-family: "Noto Serif JP", serif;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.35;
          text-shadow: 0 1px 8px rgba(0,0,0,0.4);
        }
        .home-list {
          display: grid;
          gap: 10px;
        }
        .home-release-row {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
        }
        .home-date-chip {
          display: grid;
          place-items: center;
          flex: 0 0 58px;
          min-height: 48px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--bg-2);
        }
        .home-date-chip span {
          color: var(--ink);
          font-size: 16px;
          font-weight: 900;
          line-height: 1;
        }
        .home-date-chip small {
          margin-top: 4px;
          color: var(--ink-3);
          font-size: 10px;
          font-weight: 800;
        }
        .home-release-main {
          min-width: 0;
          flex: 1;
        }
        .home-release-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 5px;
        }
        .home-release-title {
          color: var(--ink);
          font-size: 14px;
          font-weight: 800;
          line-height: 1.45;
        }
        .home-release-title a,
        .home-release-performer a {
          color: inherit;
          text-decoration: none;
        }
        .home-release-title a:hover,
        .home-release-performer a:hover {
          color: var(--primary);
        }
        .home-release-performer {
          margin-top: 3px;
          color: var(--ink-2);
          font-size: 12px;
        }
        .home-model-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 14px;
        }
        .home-cover-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .home-brand-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .home-brand-tags a {
          text-decoration: none;
        }
        @media (max-width: 899px) {
          .home-hero-grid {
            grid-template-columns: 1fr;
          }
          .home-collage {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .home-hero {
            padding: 36px 0 30px;
          }
          .home-stats {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .home-release-row {
            align-items: flex-start;
          }
          .home-release-row > .btn {
            align-self: center;
          }
          .home-cover-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </>
  );
}
