import type { Metadata } from "next";
import Link from "next/link";
import { getUpcomingReleases, getBirthdaysForMonth, jstToday, type MhUpcoming } from "@/lib/mh-insights";
import { SectionHead } from "@/components/fx/SectionHead";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "発売カレンダー — MODEL HUB",
  description: "グラビア雑誌・写真集の発売予定カレンダー。予約リンク付きで発売日を見逃さない。",
};

const KINDS = [
  { key: "all", label: "すべて" },
  { key: "magazine", label: "雑誌" },
  { key: "photobook", label: "写真集" },
  { key: "digital_photobook", label: "デジタル写真集" },
] as const;

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function groupByMonth(items: MhUpcoming[]) {
  const months = new Map<string, Map<string, MhUpcoming[]>>();
  for (const it of items) {
    const ym = it.date.slice(0, 7);
    if (!months.has(ym)) months.set(ym, new Map());
    const days = months.get(ym)!;
    if (!days.has(it.date)) days.set(it.date, []);
    days.get(it.date)!.push(it);
  }
  return months;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind = "all" } = await searchParams;
  const all = getUpcomingReleases(210);
  const items = kind === "all" ? all : all.filter((u) => u.kind === kind);
  const months = groupByMonth(items);
  const { m } = jstToday();
  const birthdays = getBirthdaysForMonth(m);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px var(--pad) 0" }}>
      <SectionHead
        eyebrow="Release Calendar"
        title="発売カレンダー"
      />
      <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: -8, marginBottom: 20 }}>
        これから発売されるグラビア雑誌・写真集 <strong className="mh-num">{items.length}</strong> 件。
        予約リンクから発売日に受け取れます。
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 26 }} role="tablist" aria-label="種別フィルタ">
        {KINDS.map((k) => {
          const active = kind === k.key;
          return (
            <Link
              key={k.key}
              href={k.key === "all" ? "/calendar" : `/calendar?kind=${k.key}`}
              aria-current={active ? "true" : undefined}
              style={{
                padding: "7px 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                textDecoration: "none",
                background: active ? "var(--primary)" : "var(--paper)",
                color: active ? "#fff" : "var(--ink-2)",
                border: `1px solid ${active ? "var(--primary)" : "var(--line)"}`,
              }}
            >
              {k.label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 28 }} className="mh-cal-grid">
        <div>
          {months.size === 0 && (
            <p style={{ color: "var(--ink-3)", padding: "40px 0" }}>この条件の発売予定はありません。</p>
          )}
          {Array.from(months.entries()).map(([ym, days]) => {
            const [y, mo] = ym.split("-");
            return (
              <section key={ym} style={{ marginBottom: 36 }}>
                <h2
                  className="serif"
                  style={{
                    position: "sticky",
                    top: 92,
                    zIndex: 5,
                    fontSize: 19,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    color: "var(--ink)",
                    background: "color-mix(in srgb, var(--bg) 92%, transparent)",
                    backdropFilter: "blur(8px)",
                    padding: "8px 0",
                    margin: "0 0 12px",
                    borderBottom: "2px solid var(--primary)",
                  }}
                >
                  {y}年{Number(mo)}月
                  <span style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: 10, fontWeight: 500 }}>
                    {Array.from(days.values()).reduce((n, v) => n + v.length, 0)}件
                  </span>
                </h2>
                <div style={{ display: "grid", gap: 14 }}>
                  {Array.from(days.entries()).map(([date, rels]) => {
                    const dt = new Date(`${date}T00:00:00+09:00`);
                    const wd = dt.getDay();
                    return (
                      <div key={date} style={{ display: "flex", gap: 14 }}>
                        <div style={{ width: 52, flexShrink: 0, textAlign: "center", paddingTop: 6 }}>
                          <div
                            className="serif mh-num"
                            style={{
                              fontSize: 24,
                              fontWeight: 900,
                              lineHeight: 1,
                              color: wd === 0 ? "var(--primary)" : wd === 6 ? "var(--leaf)" : "var(--ink)",
                            }}
                          >
                            {dt.getDate()}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.18em", marginTop: 3 }}>
                            {WEEKDAYS[wd]}
                          </div>
                        </div>
                        <div style={{ flex: 1, display: "grid", gap: 8, minWidth: 0 }}>
                          {rels.map((u, i) => (
                            <div
                              key={`${u.title}-${i}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: "var(--paper)",
                                border: "1px solid var(--line)",
                                borderRadius: 10,
                                padding: "9px 13px",
                                flexWrap: "wrap",
                              }}
                            >
                              {u.coverImageUrl && (
                                <span
                                  aria-hidden
                                  style={{
                                    width: 34,
                                    height: 46,
                                    borderRadius: 4,
                                    flexShrink: 0,
                                    background: `url("${u.coverImageUrl}") center / cover no-repeat`,
                                  }}
                                />
                              )}
                              <span
                                className="tag alt"
                                style={{ flexShrink: 0, fontSize: 10, padding: "3px 9px" }}
                              >
                                {u.kind === "magazine" ? "雑誌" : u.kind === "digital_photobook" ? "デジタル" : "写真集"}
                              </span>
                              <span style={{ flex: "1 1 200px", minWidth: 160 }}>
                                {u.cardId ? (
                                  <Link
                                    href={`/magazines/card-${u.cardId}`}
                                    style={{ color: "var(--ink)", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}
                                  >
                                    {u.title}
                                  </Link>
                                ) : (
                                  <span style={{ color: "var(--ink)", fontWeight: 700, fontSize: 13.5 }}>{u.title}</span>
                                )}
                                <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                                  {u.brand}
                                  {u.publisher ? ` ・ ${u.publisher}` : ""}
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
                                  style={{ fontSize: 10.5, padding: "6px 12px" }}
                                >
                                  予約 <span className="pr-mini">PR</span>
                                </a>
                              )}
                              {u.rakutenUrl && (
                                <a
                                  href={u.rakutenUrl}
                                  target="_blank"
                                  rel="nofollow sponsored noopener"
                                  className="btn btn-rakuten"
                                  style={{ fontSize: 10.5, padding: "6px 12px" }}
                                >
                                  楽天 <span className="pr-mini">PR</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          <p style={{ color: "var(--ink-3)", fontSize: 12, margin: "8px 0 24px" }}>
            発売日は JPO・出版社データに基づく予定日です。変更されることがあります。
          </p>
        </div>

        <aside>
          <div
            style={{
              position: "sticky",
              top: 104,
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "var(--card-pad)",
            }}
          >
            <div className="serif" style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 12 }}>
              🎂 {m}月の誕生日
            </div>
            {birthdays.length === 0 ? (
              <p style={{ color: "var(--ink-3)", fontSize: 12.5 }}>今月の誕生日データはありません。</p>
            ) : (
              <div style={{ display: "grid", gap: 7, maxHeight: 480, overflowY: "auto" }}>
                {birthdays.map((b) => (
                  <Link
                    key={b.key}
                    href={`/models/${b.slug}`}
                    style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
                  >
                    <span
                      className="serif mh-num"
                      style={{ width: 30, textAlign: "right", fontSize: 14, fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}
                    >
                      {b.day}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--ink-3)", flexShrink: 0 }}>日</span>
                    <span
                      style={{
                        color: "var(--ink)",
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {b.name}
                    </span>
                    <span className="mh-num" style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)", flexShrink: 0 }}>
                      {b.pubCount}誌
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .mh-cal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
