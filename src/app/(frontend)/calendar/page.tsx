import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getBirthdaysForMonth, getUpcomingReleases, type MhUpcoming } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "発売カレンダー — MODEL HUB",
};

type KindFilter = "all" | MhUpcoming["kind"];
type Props = { searchParams: Promise<{ kind?: string }> };

const kinds: Array<{ value: KindFilter; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "magazine", label: "雑誌" },
  { value: "photobook", label: "写真集" },
  { value: "digital_photobook", label: "デジタル写真集" },
];

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function normalizeKind(value: string | undefined): KindFilter {
  return value === "magazine" || value === "photobook" || value === "digital_photobook" ? value : "all";
}

function dateParts(date: string): { year: number; month: number; day: number; weekday: string; weekdayIndex: number } {
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(`${date}T00:00:00`);
  const weekdayIndex = parsed.getDay();
  return { year, month, day, weekday: weekdays[weekdayIndex] ?? "", weekdayIndex };
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${year}年${month}月`;
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

function ReleaseRow({ item }: { item: MhUpcoming }) {
  return (
    <div className="calendar-release">
      {item.coverImageUrl && (
        <div
          aria-hidden="true"
          className="calendar-thumb"
          style={{ background: `url("${item.coverImageUrl}") center / cover no-repeat` }}
        />
      )}
      <div className="calendar-release-main">
        <div className="calendar-release-meta">
          <Badge tone="muted">{item.brand || "未分類"}</Badge>
          <Badge tone={kindTone(item.kind)}>{kindLabel(item.kind)}</Badge>
        </div>
        <div className="calendar-release-title">
          {item.cardId ? (
            <Link href={`/magazines/card-${item.cardId}`}>{item.title}</Link>
          ) : (
            <span>{item.title}</span>
          )}
        </div>
        {item.performerName && (
          <div className="calendar-performer">
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

export default async function CalendarPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeKind = normalizeKind(params.kind);
  const releases = getUpcomingReleases(210).filter((item) => activeKind === "all" || item.kind === activeKind);
  const grouped = new Map<string, Map<string, MhUpcoming[]>>();

  for (const item of releases) {
    const monthKey = item.date.slice(0, 7);
    const dayKey = item.date;
    const month = grouped.get(monthKey) ?? new Map<string, MhUpcoming[]>();
    const day = month.get(dayKey) ?? [];
    day.push(item);
    month.set(dayKey, day);
    grouped.set(monthKey, month);
  }

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const birthdays = getBirthdaysForMonth(currentMonth).sort((a, b) => a.day - b.day || b.pubCount - a.pubCount);
  const visibleBirthdays = birthdays.slice(0, 10);

  return (
    <main className="calendar-page">
      <SectionHeader
        icon="🗓"
        title="発売カレンダー"
        subtitle={`これから発売されるグラビア雑誌・写真集 ${releases.length.toLocaleString("ja-JP")}件`}
      />

      <div className="calendar-tabs" aria-label="種別フィルタ">
        {kinds.map((kind) => {
          const active = kind.value === activeKind;
          return (
            <Link key={kind.value} href={`/calendar?kind=${kind.value}`} className={active ? "calendar-tab-active" : "tag"}>
              {kind.label}
            </Link>
          );
        })}
      </div>

      <div className="calendar-layout">
        <div className="calendar-main">
          {Array.from(grouped.entries()).map(([monthKey, dayMap]) => (
            <section key={monthKey} className="calendar-month">
              <h2 className="mh-serif">{monthLabel(monthKey)}</h2>
              <div className="calendar-days">
                {Array.from(dayMap.entries()).map(([dayKey, items]) => {
                  const parts = dateParts(dayKey);
                  const dayClass = parts.weekdayIndex === 0 ? " sunday" : parts.weekdayIndex === 6 ? " saturday" : "";
                  return (
                    <div key={dayKey} className="calendar-day">
                      <div className={`calendar-day-block${dayClass}`}>
                        <span className="mh-serif mh-num">{parts.day}</span>
                        <small>{parts.weekday}</small>
                      </div>
                      <div className="calendar-release-list">
                        {items.map((item) => (
                          <ReleaseRow key={`${item.date}-${item.title}-${item.cardId ?? item.performerKey ?? item.brand}`} item={item} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="calendar-side">
          <h2 className="mh-serif">今月の誕生日</h2>
          {visibleBirthdays.length > 0 ? (
            <div className="birthday-list">
              {visibleBirthdays.map((birthday) => (
                <div key={birthday.key} className="birthday-row">
                  <span className="mh-num">{birthday.day}日</span>
                  <Link href={`/models/${encodeURIComponent(birthday.key)}`}>{birthday.name}</Link>
                  <small>{birthday.pubCount}誌</small>
                </div>
              ))}
              {birthdays.length > visibleBirthdays.length && (
                <div className="birthday-more">ほか{birthdays.length - visibleBirthdays.length}名</div>
              )}
            </div>
          ) : (
            <p>今月の誕生日データはありません。</p>
          )}
        </aside>
      </div>

      <p className="calendar-note">発売日は JPO・出版社データに基づく予定日です。変更されることがあります。</p>

      <style>{`
        .calendar-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--row-gap) var(--pad);
        }
        .calendar-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: var(--row-gap);
        }
        .calendar-tabs a {
          text-decoration: none;
        }
        .calendar-tab-active {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          background: var(--primary);
          color: white;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
          padding: 6px 12px;
        }
        .calendar-layout {
          display: grid;
          gap: 28px;
        }
        .calendar-month {
          margin-top: var(--row-gap);
        }
        .calendar-month:first-child {
          margin-top: 0;
        }
        .calendar-month h2 {
          margin: 0 0 14px;
          color: var(--ink);
          font-size: 24px;
          font-weight: 900;
          line-height: 1.2;
        }
        .calendar-days {
          display: grid;
          gap: 14px;
        }
        .calendar-day {
          display: grid;
          grid-template-columns: 56px minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }
        .calendar-day-block {
          display: grid;
          place-items: center;
          min-height: 58px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--bg-2);
        }
        .calendar-day-block span {
          color: var(--ink);
          font-size: 22px;
          font-weight: 900;
          line-height: 1;
        }
        .calendar-day-block small {
          margin-top: 4px;
          color: var(--ink-3);
          font-size: 10px;
          font-weight: 800;
        }
        .calendar-day-block.saturday span,
        .calendar-day-block.saturday small {
          color: var(--info);
        }
        .calendar-day-block.sunday span,
        .calendar-day-block.sunday small {
          color: var(--primary);
        }
        .calendar-release-list {
          display: grid;
          gap: 8px;
        }
        .calendar-release {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
        }
        .calendar-thumb {
          width: 44px;
          aspect-ratio: 3 / 4;
          flex-shrink: 0;
          border: 1px solid var(--line);
          border-radius: 5px;
        }
        .calendar-release-main {
          min-width: 0;
          flex: 1;
        }
        .calendar-release-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 5px;
        }
        .calendar-release-title {
          color: var(--ink);
          font-size: 14px;
          font-weight: 800;
          line-height: 1.45;
        }
        .calendar-release-title a,
        .calendar-performer a,
        .birthday-row a {
          color: inherit;
          text-decoration: none;
        }
        .calendar-release-title a:hover,
        .calendar-performer a:hover,
        .birthday-row a:hover {
          color: var(--primary);
        }
        .calendar-performer {
          margin-top: 3px;
          color: var(--ink-2);
          font-size: 12px;
        }
        .calendar-side {
          align-self: start;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--bg-2);
          padding: 14px;
        }
        .calendar-side h2 {
          margin: 0 0 12px;
          color: var(--ink);
          font-size: 17px;
          font-weight: 900;
        }
        .calendar-side p {
          margin: 0;
          color: var(--ink-3);
          font-size: 12px;
          line-height: 1.7;
        }
        .birthday-list {
          display: grid;
          gap: 8px;
        }
        .birthday-row {
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr) auto;
          gap: 8px;
          align-items: center;
          color: var(--ink);
          font-size: 12px;
        }
        .birthday-row > span {
          color: var(--accent);
          font-weight: 900;
        }
        .birthday-row small {
          color: var(--ink-3);
          font-size: 11px;
        }
        .birthday-more {
          color: var(--ink-3);
          font-size: 12px;
          padding-top: 4px;
        }
        .calendar-note {
          margin: var(--row-gap) 0 0;
          color: var(--ink-3);
          font-size: 12px;
          line-height: 1.7;
        }
        @media (min-width: 960px) {
          .calendar-layout {
            grid-template-columns: minmax(0, 1fr) 280px;
          }
        }
        @media (max-width: 640px) {
          .calendar-day {
            grid-template-columns: 48px minmax(0, 1fr);
            gap: 10px;
          }
          .calendar-release {
            align-items: flex-start;
          }
          .calendar-release > .btn {
            align-self: center;
          }
        }
      `}</style>
    </main>
  );
}
