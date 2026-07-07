import type { Metadata } from "next";
import Link from "next/link";
import { getTopModels, getBrands } from "@/lib/magazine-hub-db";
import { cssBgUrl } from "@/lib/safe-url";
import {
  getSiteStats,
  getNewThisWeek,
  getUpcomingReleases,
  getTrendingModels,
  getTodayBirthdays,
  getOnThisDay,
  jstToday,
} from "@/lib/mh-insights";
import { CoverCard } from "@/components/fx/CoverCard";
import { ModelCard } from "@/components/fx/ModelCard";
import { SectionHead } from "@/components/fx/SectionHead";
import { Sparkline } from "@/components/fx/Sparkline";
import { StatCounter } from "@/components/fx/StatCounter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MODEL HUB — グラビア雑誌・写真集アーカイブと発売カレンダー",
  description:
    "グラビア雑誌・写真集のアーカイブ。発売カレンダー、急上昇モデル、カバーウォールで次の一冊に出会える。Amazon・楽天の予約リンク付き。",
  openGraph: {
    title: "MODEL HUB — グラビア雑誌・写真集アーカイブ",
    description: "発売カレンダー・急上昇モデル・カバーウォール。毎日更新のグラビアアーカイブ。",
    url: "https://magazine.happyharem.com",
    type: "website",
  },
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function dateChip(dateIso: string) {
  const d = new Date(`${dateIso}T00:00:00+09:00`);
  const wd = WEEKDAYS[d.getDay()];
  return { md: `${d.getMonth() + 1}/${d.getDate()}`, wd, isSat: d.getDay() === 6, isSun: d.getDay() === 0 };
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 var(--pad)" }}>{children}</div>;
}

export default async function HomePage() {
  const stats = getSiteStats();
  const fresh = getNewThisWeek(14);
  const upcoming = getUpcomingReleases(30).slice(0, 9);
  const trending = getTrendingModels(5);
  const birthdays = getTodayBirthdays(6);
  const onThisDay = getOnThisDay(4);
  const topModels = getTopModels(12);
  const brands = getBrands().slice(0, 22);
  const { m, d } = jstToday();
  const collage = fresh.filter((f) => f.coverImageUrl).slice(0, 6);

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section
        style={{
          background: "var(--hero-grad)",
          borderBottom: "1px solid var(--line)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(560px 300px at 12% 0%, var(--hero-glow1), transparent 70%), radial-gradient(500px 320px at 88% 100%, var(--hero-glow2), transparent 70%)",
          }}
        />
        <Wrap>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 36,
              padding: "46px 0 42px",
              flexWrap: "wrap",
            }}
          >
            <div
              aria-hidden
              className="mh-vertical mh-rise"
              style={{
                fontFamily: '"Noto Serif JP", serif',
                fontSize: 15,
                color: "var(--primary)",
                fontWeight: 700,
                alignSelf: "stretch",
                paddingTop: 6,
              }}
            >
              今夜も、良い一冊を。
            </div>
            <div style={{ flex: "1 1 380px", minWidth: 300 }}>
              <h1
                className="serif mh-rise"
                style={{
                  fontSize: "clamp(30px, 4.6vw, 46px)",
                  fontWeight: 900,
                  lineHeight: 1.3,
                  letterSpacing: "0.06em",
                  margin: 0,
                  color: "var(--ink)",
                }}
              >
                深夜の<span style={{ color: "var(--primary)", whiteSpace: "nowrap" }}>ニューススタンド</span>へ、
                <br />
                ようこそ。
              </h1>
              <p
                className="mh-rise mh-rise-1"
                style={{ color: "var(--ink-2)", fontSize: 14.5, lineHeight: 2, marginTop: 14, maxWidth: 560 }}
              >
                1992年から今日までのグラビア雑誌・写真集を一つの棚に。
                発売カレンダーで予約を逃さず、急上昇ランキングで「次に来る人」を先に知る。
              </p>
              <div className="mh-rise mh-rise-2" style={{ display: "flex", gap: 34, flexWrap: "wrap", marginTop: 26 }}>
                <StatCounter value={stats.models} label="収録モデル" suffix="人" />
                <StatCounter value={stats.cards} label="収録誌" suffix="冊" />
                <StatCounter value={stats.covers} label="カバー" suffix="枚" />
                <StatCounter value={stats.brands} label="ブランド" />
              </div>
              <div className="mh-rise mh-rise-3" style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
                <Link href="/calendar" className="btn btn-primary">🗓 発売カレンダー</Link>
                <Link href="/trending" className="btn btn-ghost">📈 急上昇モデル</Link>
                <Link href="/covers" className="btn btn-ghost">🖼 カバーウォール</Link>
              </div>
            </div>
            {collage.length >= 4 && (
              <div
                className="mh-rise mh-rise-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 108px)",
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                {collage.map((c, i) => (
                  <div key={c.slug} style={{ transform: `rotate(${i % 2 === 0 ? -2.2 : 2.2}deg)` }}>
                    <CoverCard
                      href={`/magazines/${c.slug}`}
                      title={c.seriesName}
                      imageUrl={c.coverImageUrl}
                      c1={c.gradient.c1}
                      c2={c.gradient.c2}
                      width="100%"
                      minTitle
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Wrap>
      </section>

      <Wrap>
        {/* ---------------- 近日発売 ---------------- */}
        <section style={{ marginTop: "var(--row-gap)" }}>
          <SectionHead eyebrow="Coming Up" title="発売まもなく" moreHref="/calendar" moreLabel="カレンダーを見る" />
          {upcoming.length === 0 ? (
            <p style={{ color: "var(--ink-3)" }}>直近の発売予定は取得中です。</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {upcoming.map((u, i) => {
                const chip = dateChip(u.date);
                return (
                  <div
                    key={`${u.date}-${u.title}-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ width: 58, textAlign: "center", flexShrink: 0 }}>
                      <span
                        className="serif mh-num"
                        style={{
                          display: "block",
                          fontSize: 21,
                          fontWeight: 900,
                          lineHeight: 1,
                          color: chip.isSun ? "var(--primary)" : chip.isSat ? "var(--leaf)" : "var(--ink)",
                        }}
                      >
                        {chip.md}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em" }}>{chip.wd}曜</span>
                    </span>
                    <span className="tag alt" style={{ flexShrink: 0 }}>
                      {u.kind === "magazine" ? "雑誌" : u.kind === "digital_photobook" ? "デジタル" : "写真集"}
                    </span>
                    <span style={{ flex: "1 1 240px", minWidth: 200 }}>
                      {u.cardId ? (
                        <Link
                          href={`/magazines/card-${u.cardId}`}
                          style={{ color: "var(--ink)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}
                        >
                          {u.title}
                        </Link>
                      ) : (
                        <span style={{ color: "var(--ink)", fontWeight: 700, fontSize: 14 }}>{u.title}</span>
                      )}
                      <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                        {u.brand}
                        {u.performerName && (
                          <>
                            {" ・ "}
                            {u.performerKey ? (
                              <Link
                                href={`/models/${encodeURIComponent(u.performerKey)}`}
                                style={{ color: "var(--rose)", textDecoration: "none" }}
                              >
                                {u.performerName}
                              </Link>
                            ) : (
                              u.performerName
                            )}
                          </>
                        )}
                      </span>
                    </span>
                    {u.amazonUrl && (
                      <a
                        href={u.amazonUrl}
                        target="_blank"
                        rel="nofollow sponsored noopener"
                        className="btn btn-amazon"
                        style={{ fontSize: 11, padding: "7px 13px" }}
                      >
                        予約する <span className="pr-mini">PR</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ---------------- 今週の新刊 ---------------- */}
        <section style={{ marginTop: "var(--row-gap)" }}>
          <SectionHead eyebrow="New Arrivals" title="今週の新刊" moreHref="/magazines" />
          {fresh.length === 0 ? (
            <p style={{ color: "var(--ink-3)" }}>この2週間の新刊はまだ取り込まれていません。</p>
          ) : (
            <div className="mh-rail">
              {fresh.map((f) => (
                <CoverCard
                  key={f.slug}
                  href={`/magazines/${f.slug}`}
                  title={f.title || f.seriesName}
                  sub={`${f.seriesName} ・ ${f.releaseDate.slice(5).replace("-", "/")}`}
                  imageUrl={f.coverImageUrl}
                  c1={f.gradient.c1}
                  c2={f.gradient.c2}
                  obi={f.badge === "preorder" ? "予約" : f.badge === "new" ? "新刊" : undefined}
                  width={150}
                />
              ))}
            </div>
          )}
        </section>

        {/* ---------------- 急上昇 ---------------- */}
        <section style={{ marginTop: "var(--row-gap)" }}>
          <SectionHead eyebrow="Rising" title="急上昇モデル" moreHref="/trending" moreLabel="トップ30を見る" />
          <div style={{ display: "grid", gap: 10 }}>
            {trending.map((t, i) => (
              <div
                key={t.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="serif mh-num"
                  aria-label={`${i + 1}位`}
                  style={{
                    fontSize: i < 3 ? 30 : 22,
                    fontStyle: "italic",
                    fontWeight: 900,
                    color: i < 3 ? "var(--amber)" : "var(--ink-3)",
                    width: 40,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <Link href={`/models/${t.slug}`} style={{ flexShrink: 0 }} aria-label={t.name}>
                  <span
                    style={{
                      display: "block",
                      width: 52,
                      height: 52,
                      borderRadius: 999,
                      border: "2px solid var(--line)",
                      background: t.imageUrl
                        ? `${cssBgUrl(t.imageUrl)} center 20% / cover no-repeat`
                        : `linear-gradient(150deg, ${t.c1}, ${t.c2})`,
                    }}
                  />
                </Link>
                <span style={{ flex: "1 1 130px", minWidth: 110 }}>
                  <Link
                    href={`/models/${t.slug}`}
                    style={{ color: "var(--ink)", fontWeight: 700, fontSize: 14.5, textDecoration: "none" }}
                  >
                    {t.name}
                  </Link>
                  <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                    {t.isNewFace && (
                      <span className="tag alt" style={{ fontSize: 9.5, padding: "1px 7px", marginRight: 6 }}>
                        NEW FACE
                      </span>
                    )}
                    直近6ヶ月 {t.recent6}誌
                    {t.prior6 === 0 ? " ・ 復帰/新登場" : ` ・ 前期比 ×${t.score}`}
                  </span>
                </span>
                <span style={{ marginLeft: "auto", flexShrink: 0 }}>
                  <Sparkline values={t.monthly.slice(-12)} width={150} height={36} />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- きょうの棚(誕生日 + この日あの表紙) ---------------- */}
        <section style={{ marginTop: "var(--row-gap)" }}>
          <SectionHead eyebrow="Today's Shelf" title={`きょうの棚 — ${m}月${d}日`} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: birthdays.length > 0 ? "repeat(auto-fit, minmax(300px, 1fr))" : "1fr",
              gap: 20,
            }}
          >
            {birthdays.length > 0 && (
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "var(--card-pad)" }}>
                <div className="serif" style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "var(--ink)" }}>
                  🎂 今日が誕生日
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {birthdays.map((b) => (
                    <Link
                      key={b.key}
                      href={`/models/${b.slug}`}
                      style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}
                    >
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          flexShrink: 0,
                          background: b.imageUrl
                            ? `${cssBgUrl(b.imageUrl)} center 20% / cover no-repeat`
                            : `linear-gradient(150deg, ${b.c1}, ${b.c2})`,
                        }}
                      />
                      <span>
                        <span style={{ color: "var(--ink)", fontSize: 13.5, fontWeight: 700, display: "block" }}>{b.name}</span>
                        <span style={{ color: "var(--ink-3)", fontSize: 11 }}>
                          {b.birthday}生まれ ・ {b.pubCount}誌
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "var(--card-pad)" }}>
              <div className="serif" style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "var(--ink)" }}>
                📅 この頃、あの表紙
              </div>
              {onThisDay.length === 0 ? (
                <p style={{ color: "var(--ink-3)", fontSize: 13 }}>この時期の過去の表紙は見つかりませんでした。</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 12 }}>
                  {onThisDay.map((c) => (
                    <CoverCard
                      key={c.slug}
                      href={`/magazines/${c.slug}`}
                      title={c.seriesName}
                      sub={`${c.releaseDate.slice(0, 4)}年`}
                      imageUrl={c.coverImageUrl}
                      c1={c.gradient.c1}
                      c2={c.gradient.c2}
                      width="100%"
                      minTitle
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---------------- 人気モデル ---------------- */}
        <section style={{ marginTop: "var(--row-gap)" }}>
          <SectionHead eyebrow="Hall of Fame" title="人気モデル" moreHref="/models" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: "var(--gap)" }}>
            {topModels.map((mdl, i) => (
              <ModelCard
                key={mdl.slug}
                href={`/models/${mdl.slug}`}
                name={mdl.name}
                sub={`${mdl.stats.issues.toLocaleString()}誌`}
                imageUrl={mdl.imageUrl}
                c1={mdl.gradient.c1}
                c2={mdl.gradient.c2}
                rank={i + 1}
                width="100%"
              />
            ))}
          </div>
        </section>

        {/* ---------------- ブランド ---------------- */}
        <section style={{ marginTop: "var(--row-gap)", marginBottom: "var(--row-gap)" }}>
          <SectionHead eyebrow="Shelves" title="ブランドから探す" moreHref="/brands" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {brands.map((b) => (
              <Link key={b.slug} href={`/magazines?brand=${b.slug}`} style={{ textDecoration: "none" }}>
                <span className="tag" style={{ fontSize: 12.5, padding: "7px 14px" }}>
                  {b.name}{" "}
                  <span className="mh-num" style={{ color: "var(--ink-3)" }}>
                    {b.issueCount.toLocaleString()}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </Wrap>
    </>
  );
}
