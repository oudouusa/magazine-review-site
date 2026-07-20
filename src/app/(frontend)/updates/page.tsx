import type { Metadata } from "next";
import { SectionHead } from "@/components/fx/SectionHead";
import { getApprovedChangeEvents } from "@/lib/monitor-updates";
import { safeHttpUrl } from "@/lib/safe-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "更新情報 — MODEL HUB",
  description: "MODEL HUB が検知し、確認・承認した雑誌情報の更新履歴です。",
};

function formatDetectedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function UpdatesPage() {
  const events = getApprovedChangeEvents();

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px var(--pad) 0" }}>
      <SectionHead eyebrow="Updates" title="更新情報" />
      <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: -8, marginBottom: 24, lineHeight: 1.9 }}>
        公開元の変更を確認し、承認した情報を掲載しています。
      </p>

      {events.length === 0 ? (
        <p style={{ color: "var(--ink-3)", padding: "40px 0" }}>現在、公開中の更新情報はありません。</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {events.map((event, index) => {
            const isReleaseDate = event.fieldGuess === "release_date";
            const sourceUrl = safeHttpUrl(event.url);
            return (
              <article
                key={`${event.sourceId}-${event.detectedAt}-${index}`}
                style={{
                  background: "var(--paper)",
                  border: `1px solid ${isReleaseDate ? "var(--primary)" : "var(--line)"}`,
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span
                    className={isReleaseDate ? "tag" : "tag alt"}
                    style={{ fontSize: 10, padding: "3px 9px" }}
                  >
                    {isReleaseDate ? "発売日変更" : "更新検知"}
                  </span>
                  <time dateTime={event.detectedAt} style={{ color: "var(--ink-3)", fontSize: 11.5 }}>
                    {formatDetectedAt(event.detectedAt)}
                  </time>
                </div>
                {isReleaseDate && (
                  <p style={{ color: "var(--ink)", fontSize: 15, fontWeight: 700, margin: "12px 0 0", lineHeight: 1.8 }}>
                    発売日変更: <span className="mh-num">{event.oldValue || "不明"}</span>
                    <span aria-hidden style={{ color: "var(--primary)", padding: "0 8px" }}>→</span>
                    <span className="mh-num">{event.newValue || "不明"}</span>
                  </p>
                )}
                <div style={{ marginTop: isReleaseDate ? 10 : 12, fontSize: 12.5, color: "var(--ink-2)" }}>
                  {sourceUrl ? (
                    <a href={sourceUrl} target="_blank" rel="nofollow noreferrer noopener" style={{ color: "var(--rose)" }}>
                      公開元を確認
                    </a>
                  ) : (
                    <span>公開元: {event.sourceId}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
