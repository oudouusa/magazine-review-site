"use client";
import { cssBgUrl } from "@/lib/safe-url";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MhMagazine } from "@/lib/magazine-hub-db";

const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

const YEAR_OPTS = ["2026年", "2025年", "2024年", "2023年以前"];
const STATUS_OPTS = ["新刊", "予約受付中", "バックナンバー"];

function getStatus(m: MhMagazine): "preorder" | "new" | "back" {
  if (m.releaseDate > today) return "preorder";
  if (m.releaseDate >= thirtyDaysAgo) return "new";
  return "back";
}

function getStatusLabel(m: MhMagazine): string {
  const status = getStatus(m);
  if (status === "preorder") return "予約";
  if (status === "new") return "新刊";
  return "既刊";
}

function getPurchaseQuery(mag: MhMagazine): string {
  return encodeURIComponent(`${mag.seriesName} ${mag.issue} ${mag.title}`.trim());
}

function getAmazonSearchUrl(mag: MhMagazine): string {
  return mag.amazonUrl ?? `https://www.amazon.co.jp/s?k=${getPurchaseQuery(mag)}&tag=magazinelab-22`;
}

function getRakutenUrl(mag: MhMagazine): string {
  return mag.rakutenUrl ?? `https://search.books.rakuten.co.jp/bks/genesis/search/?g=001&sitem=${getPurchaseQuery(mag)}`;
}

function hasDirectRetailLink(mag: MhMagazine): boolean {
  return Boolean(mag.amazonUrl || mag.rakutenUrl);
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${Number(m)}月`;
}

function CoverArt({ mag, compact = false }: { mag: MhMagazine; compact?: boolean }) {
  return (
    <div
      className={`cover-art${compact ? " compact" : ""}${mag.coverImageUrl ? " has-image" : ""}`}
      style={{
        background: mag.coverImageUrl
          ? `${cssBgUrl(mag.coverImageUrl)} center top / cover no-repeat, linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`
          : `linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(0,0,0,.42)), linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`,
      }}
    >
      {!mag.coverImageUrl && <>
        <div className="cover-topline">{mag.seriesName}</div>
        <div className="cover-title">{mag.title || mag.issue}</div>
      </>}
      <div className={`cover-badge ${getStatus(mag)}`}>{getStatusLabel(mag)}</div>
    </div>
  );
}

function PurchaseButtons({ mag, compact = false }: { mag: MhMagazine; compact?: boolean }) {
  return (
    <div className={`purchase-row${compact ? " compact" : ""}`}>
      <a
        href={getAmazonSearchUrl(mag)}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="purchase-btn amazon"
        aria-label={`${mag.seriesName} ${mag.issue}をAmazonで見る`}
      >
        {mag.amazonUrl ? "Amazon商品" : "Amazon"} <span>PR</span>
      </a>
      <a
        href={getRakutenUrl(mag)}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="purchase-btn rakuten"
        aria-label={`${mag.seriesName} ${mag.issue}を楽天ブックスで見る`}
      >
        {mag.rakutenUrl ? "楽天商品" : "楽天"} <span>PR</span>
      </a>
    </div>
  );
}

function ShelfIssue({ mag, featured = false }: { mag: MhMagazine; featured?: boolean }) {
  return (
    <article className={`shelf-card${featured ? " featured" : ""}`}>
      <Link href={`/magazines/${mag.slug}`} className="shelf-cover-link" aria-label={`${mag.seriesName} ${mag.issue}の詳細を見る`}>
        <CoverArt mag={mag} compact={!featured} />
      </Link>
      <div className="shelf-copy">
        <div className="shelf-meta">
          <span>{mag.releaseDate}</span>
          <span>{mag.issue}</span>
        </div>
        <Link href={`/magazines/${mag.slug}`} className="shelf-title">
          {mag.title || `${mag.seriesName} ${mag.issue}`}
        </Link>
        <PurchaseButtons mag={mag} compact={!featured} />
      </div>
    </article>
  );
}

function IssueCard({ mag }: { mag: MhMagazine }) {
  return (
    <article className="issue-card">
      <Link href={`/magazines/${mag.slug}`} className="issue-cover-link" aria-label={`${mag.seriesName} ${mag.issue}の詳細を見る`}>
        <CoverArt mag={mag} />
      </Link>
      <div className="issue-copy">
        <div className="issue-meta">
          <span>{mag.releaseDate}</span>
          <span>{mag.issue}</span>
        </div>
        <Link href={`/magazines/${mag.slug}`} className="issue-title">
          {mag.title || `${mag.seriesName} ${mag.issue}`}
        </Link>
        <div className="issue-series">{mag.seriesName}</div>
        <PurchaseButtons mag={mag} compact />
      </div>
    </article>
  );
}

type Props = { issues: MhMagazine[] };

export function MagazinesClient({ issues }: Props) {
  const [years, setYears] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  function toggle(set: string[], setSet: (v: string[]) => void, val: string) {
    setSet(set.includes(val) ? set.filter((x) => x !== val) : [...set, val]);
  }

  const filtered = useMemo(() => {
    return issues.filter((m) => {
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        if (!m.seriesName.toLowerCase().includes(q) && !m.title.toLowerCase().includes(q) && !m.issue.toLowerCase().includes(q)) return false;
      }
      if (years.length > 0) {
        const y = m.releaseDate.slice(0, 4);
        const matches =
          (years.includes("2026年") && y === "2026") ||
          (years.includes("2025年") && y === "2025") ||
          (years.includes("2024年") && y === "2024") ||
          (years.includes("2023年以前") && parseInt(y, 10) <= 2023);
        if (!matches) return false;
      }
      if (statuses.length > 0) {
        const s = getStatus(m);
        const matches =
          (statuses.includes("新刊") && s === "new") ||
          (statuses.includes("予約受付中") && s === "preorder") ||
          (statuses.includes("バックナンバー") && s === "back");
        if (!matches) return false;
      }
      return true;
    });
  }, [issues, years, statuses, query]);

  const byMonth = useMemo(() => {
    const map = new Map<string, MhMagazine[]>();
    for (const m of filtered) {
      const ym = m.releaseDate.slice(0, 7);
      if (!map.has(ym)) map.set(ym, []);
      map.get(ym)!.push(m);
    }
    return map;
  }, [filtered]);

  const shelfIssues = useMemo(() => {
    const linked = filtered.filter(hasDirectRetailLink);
    const unlinked = filtered.filter((m) => !hasDirectRetailLink(m));
    return [...linked, ...unlinked].slice(0, 5);
  }, [filtered]);

  const hasFilters = years.length > 0 || statuses.length > 0 || query.trim().length > 0;

  return (
    <>
      <div className="mags-toolbar">
        <div className="mags-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="シリーズ名・号数で絞り込む"
          />
          {query && <button onClick={() => setQuery("")} aria-label="検索条件を消去">×</button>}
        </div>
        <span className="result-count">
          {filtered.length !== issues.length ? `${filtered.length}件 / ${issues.length}件` : `全${issues.length}件`}
        </span>
        {hasFilters && (
          <button
            onClick={() => { setYears([]); setStatuses([]); setQuery(""); }}
            className="reset-btn"
          >
            解除
          </button>
        )}
      </div>

      <div className="mags-layout">
        <main className="mags-main">
          {shelfIssues.length > 0 && (
            <section className="shelf-band" aria-label="買える注目棚">
              <div className="shelf-head">
                <div>
                  <div className="shelf-eyebrow">SHOPPING SHELF</div>
                  <h2>買える注目棚</h2>
                </div>
                <span>{shelfIssues.filter(hasDirectRetailLink).length || shelfIssues.length}件購入先あり</span>
              </div>
              <div className="shelf-grid">
                {shelfIssues.map((mag, index) => <ShelfIssue key={mag.slug} mag={mag} featured={index === 0} />)}
              </div>
            </section>
          )}

          {filtered.length === 0 ? (
            <div className="empty-state">条件に一致する号がありません</div>
          ) : (
            [...byMonth.entries()].map(([ym, mags]) => (
              <section key={ym} className="month-section">
                <div className="month-head">
                  <h2>{formatMonth(ym)}</h2>
                  <div />
                  <span>{mags.length}号</span>
                </div>
                <div className="mags-grid">
                  {mags.map((mag) => <IssueCard key={mag.slug} mag={mag} />)}
                </div>
              </section>
            ))
          )}
        </main>

        <aside className="mags-sidebar">
          <div className="facet-panel">
            <div className="facet-title">発売年</div>
            <div className="facet-options">
              {YEAR_OPTS.map((v) => (
                <label key={v} className={years.includes(v) ? "active" : ""}>
                  <input type="checkbox" checked={years.includes(v)} onChange={() => toggle(years, setYears, v)} />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="facet-panel">
            <div className="facet-title">状態</div>
            <div className="facet-options">
              {STATUS_OPTS.map((v) => (
                <label key={v} className={statuses.includes(v) ? "active" : ""}>
                  <input type="checkbox" checked={statuses.includes(v)} onChange={() => toggle(statuses, setStatuses, v)} />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .mags-toolbar {
          padding: 10px var(--pad);
          background: rgba(255, 255, 255, 0.78);
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          backdrop-filter: blur(12px);
        }
        .mags-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 7px 12px;
          flex: 1 1 220px;
          min-width: 0;
          color: var(--ink-3);
          box-shadow: 0 1px 8px rgba(80, 50, 60, 0.04);
        }
        .mags-search input {
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 12px;
          color: var(--ink);
          flex: 1;
          min-width: 0;
          font-family: inherit;
        }
        .mags-search button,
        .reset-btn {
          border: 0;
          background: transparent;
          color: var(--ink-3);
          cursor: pointer;
          font-family: inherit;
        }
        .mags-search button {
          font-size: 15px;
          line-height: 1;
          padding: 0;
        }
        .result-count {
          font-size: 12px;
          color: var(--ink-3);
          white-space: nowrap;
        }
        .reset-btn {
          font-size: 11px;
          color: var(--plum);
          background: var(--rose-3);
          border: 1px solid rgba(122, 74, 90, 0.14);
          border-radius: 999px;
          padding: 5px 11px;
        }
        .mags-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 236px;
          gap: var(--gap);
          padding: var(--row-gap) var(--pad);
          align-items: start;
        }
        .mags-main {
          min-width: 0;
        }
        .shelf-band {
          margin-bottom: calc(var(--row-gap) + 4px);
          padding: 18px;
          border: 1px solid rgba(122, 74, 90, 0.14);
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(251, 233, 238, 0.82) 48%, rgba(239, 234, 246, 0.78) 100%);
          box-shadow: 0 18px 36px rgba(80, 48, 65, 0.08);
        }
        .shelf-head,
        .month-head {
          display: flex;
          align-items: end;
          gap: 12px;
          margin-bottom: 14px;
        }
        .shelf-eyebrow {
          font-family: "Noto Serif JP", serif;
          font-size: 10px;
          letter-spacing: 0.28em;
          color: var(--ink-3);
          margin-bottom: 3px;
        }
        .shelf-head h2,
        .month-head h2 {
          margin: 0;
          font-family: "Noto Serif JP", serif;
          font-weight: 600;
          color: var(--ink);
        }
        .shelf-head h2 {
          font-size: 22px;
          letter-spacing: 0.12em;
        }
        .shelf-head > span {
          margin-left: auto;
          font-size: 11px;
          color: var(--amber);
          background: rgba(201, 138, 58, 0.12);
          border: 1px solid rgba(201, 138, 58, 0.2);
          border-radius: 999px;
          padding: 5px 10px;
          white-space: nowrap;
        }
        .shelf-grid {
          display: grid;
          grid-template-columns: minmax(250px, 1.35fr) repeat(4, minmax(132px, 1fr));
          gap: 12px;
          align-items: stretch;
        }
        .shelf-card,
        .issue-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(122, 74, 90, 0.14);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(60, 30, 40, 0.04);
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
        }
        .shelf-card:hover,
        .issue-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 26px rgba(80, 50, 60, 0.12);
          border-color: rgba(122, 74, 90, 0.26);
        }
        .shelf-card.featured {
          display: grid;
          grid-template-columns: minmax(130px, 0.9fr) minmax(0, 1fr);
        }
        .shelf-cover-link,
        .issue-cover-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .cover-art {
          aspect-ratio: 3 / 4;
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        .cover-art::after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 46%;
          background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.54));
          z-index: 0;
        }
        .cover-art.has-image::after {
          display: none;
        }
        .cover-topline,
        .cover-title,
        .cover-badge {
          position: absolute;
          z-index: 1;
        }
        .cover-topline {
          top: 12px;
          left: 12px;
          right: 58px;
          font-family: "Noto Serif JP", serif;
          color: rgba(255, 255, 255, 0.96);
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cover-title {
          left: 12px;
          right: 12px;
          bottom: 13px;
          font-family: "Noto Serif JP", serif;
          color: rgba(255, 255, 255, 0.96);
          font-size: 11px;
          font-weight: 600;
          line-height: 1.38;
          letter-spacing: 0.02em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .cover-badge {
          top: 8px;
          right: 8px;
          color: white;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          padding: 3px 6px;
          border-radius: 4px;
          background: var(--leaf);
        }
        .cover-badge.preorder {
          background: var(--amber);
        }
        .cover-badge.back {
          background: rgba(42, 31, 36, 0.72);
        }
        .cover-art.compact .cover-topline,
        .cover-art.compact .cover-title {
          font-size: 10px;
        }
        .shelf-copy,
        .issue-copy {
          padding: 11px 12px 12px;
        }
        .shelf-card.featured .shelf-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 15px;
        }
        .shelf-meta,
        .issue-meta {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 10px;
          color: var(--ink-3);
          margin-bottom: 6px;
          white-space: nowrap;
        }
        .shelf-title,
        .issue-title {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-decoration: none;
          font-family: "Noto Serif JP", serif;
          color: var(--ink);
          font-weight: 600;
          line-height: 1.42;
          letter-spacing: 0.04em;
        }
        .shelf-title {
          font-size: 14px;
          -webkit-line-clamp: 3;
        }
        .issue-title {
          min-height: 3.4em;
          font-size: 12px;
          -webkit-line-clamp: 2;
        }
        .issue-series {
          margin-top: 7px;
          font-size: 10px;
          color: var(--plum);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .purchase-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
          margin-top: 12px;
        }
        .purchase-row.compact {
          margin-top: 9px;
        }
        .purchase-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 0;
          min-height: 30px;
          border-radius: 999px;
          padding: 7px 8px;
          color: white;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: filter 0.15s ease, transform 0.15s ease;
        }
        .purchase-btn:hover {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }
        .purchase-btn.amazon {
          background: #ff9900;
          color: #20160a;
        }
        .purchase-btn.rakuten {
          background: #bf0000;
        }
        .purchase-btn span {
          font-size: 8px;
          letter-spacing: 0.08em;
          opacity: 0.75;
        }
        .month-section {
          margin-bottom: var(--row-gap);
        }
        .month-head h2 {
          font-size: 14px;
          letter-spacing: 0.08em;
          color: var(--plum);
          white-space: nowrap;
        }
        .month-head div {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, var(--line), transparent);
        }
        .month-head span {
          font-size: 10px;
          color: var(--ink-3);
          white-space: nowrap;
        }
        .mags-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
          gap: var(--gap);
        }
        .mags-sidebar {
          position: sticky;
          top: 86px;
          display: grid;
          gap: 12px;
        }
        .facet-panel {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 14px;
          box-shadow: 0 1px 8px rgba(80, 50, 60, 0.04);
        }
        .facet-title {
          font-family: "Noto Serif JP", serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          color: var(--ink-3);
          margin-bottom: 10px;
        }
        .facet-options {
          display: grid;
          gap: 7px;
        }
        .facet-options label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--ink-2);
          cursor: pointer;
          min-height: 24px;
        }
        .facet-options label.active {
          color: var(--ink);
          font-weight: 700;
        }
        .facet-options input {
          accent-color: var(--primary);
        }
        .empty-state {
          padding: 54px 0;
          text-align: center;
          color: var(--ink-3);
          font-family: "Noto Serif JP", serif;
          font-size: 13px;
        }
        @media (max-width: 980px) {
          .shelf-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .shelf-card.featured {
            grid-column: span 3;
          }
        }
        @media (max-width: 760px) {
          .mags-layout {
            grid-template-columns: 1fr;
          }
          .mags-sidebar {
            position: static;
            order: -1;
            grid-template-columns: 1fr 1fr;
          }
          .facet-options {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }
          .facet-options label {
            border: 1px solid var(--line);
            border-radius: 999px;
            padding: 5px 9px;
            background: var(--paper);
          }
          .facet-options input {
            width: 12px;
            height: 12px;
          }
        }
        @media (max-width: 640px) {
          .mags-toolbar {
            align-items: stretch;
          }
          .mags-search {
            flex-basis: 100%;
          }
          .shelf-band {
            padding: 12px;
          }
          .shelf-head {
            align-items: start;
            flex-direction: column;
            gap: 8px;
          }
          .shelf-head > span {
            margin-left: 0;
          }
          .shelf-grid {
            grid-template-columns: 1fr;
          }
          .shelf-card.featured {
            grid-column: auto;
            grid-template-columns: minmax(118px, 0.86fr) minmax(0, 1fr);
          }
          .mags-sidebar {
            grid-template-columns: 1fr;
          }
          .mags-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .purchase-btn {
            font-size: 10px;
            padding-inline: 6px;
          }
        }
        @media (max-width: 420px) {
          .shelf-card.featured {
            display: block;
          }
          .shelf-title {
            -webkit-line-clamp: 2;
          }
        }
      `}</style>
    </>
  );
}
