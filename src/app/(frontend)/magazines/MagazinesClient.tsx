"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { MhMagazine } from "@/lib/magazine-hub-db";

const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

function getStatus(m: MhMagazine): "preorder" | "new" | "back" {
  if (m.releaseDate > today) return "preorder";
  if (m.releaseDate >= thirtyDaysAgo) return "new";
  return "back";
}

function IssueCard({ mag }: { mag: MhMagazine }) {
  return (
    <Link href={`/magazines/${mag.slug}`} style={{ textDecoration: "none" }}>
      <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,30,40,.04)", cursor: "pointer" }}>
        <div style={{ aspectRatio: "3/4", background: `linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.38)), linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`, position: "relative" }}>
          <div style={{ position: "absolute", top: 12, left: 12, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", textShadow: "0 1px 2px rgba(0,0,0,.2)" }}>{mag.seriesName}</div>
          <div style={{ position: "absolute", left: 12, right: 12, bottom: 14, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontSize: 11, fontWeight: 600, lineHeight: 1.35, letterSpacing: "0.02em", textShadow: "0 1px 2px rgba(0,0,0,.25)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{mag.title}</div>
          {mag.badge && (
            <div style={{ position: "absolute", top: 8, right: 8, background: mag.badge === "preorder" ? "var(--amber)" : "var(--leaf)", color: "white", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>
              {mag.badge === "new" ? "新刊" : mag.badge === "preorder" ? "予約" : "復刻"}
            </div>
          )}
        </div>
        <div style={{ padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 3 }}>{mag.releaseDate}</div>
          <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, color: "var(--ink)", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mag.issue}</div>
        </div>
      </div>
    </Link>
  );
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}年${Number(m)}月`;
}

type Props = { issues: MhMagazine[] };

export function MagazinesClient({ issues }: Props) {
  const [years, setYears] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  function toggle(set: string[], setSet: (v: string[]) => void, val: string) {
    setSet(set.includes(val) ? set.filter((x) => x !== val) : [...set, val]);
  }

  const filtered = useMemo(() => {
    return issues.filter((m) => {
      if (years.length > 0) {
        const y = m.releaseDate.slice(0, 4);
        const matches =
          (years.includes("2026年") && y === "2026") ||
          (years.includes("2025年") && y === "2025") ||
          (years.includes("2024年") && y === "2024") ||
          (years.includes("2023年以前") && parseInt(y) <= 2023);
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
  }, [issues, years, statuses]);

  const byMonth = useMemo(() => {
    const map = new Map<string, MhMagazine[]>();
    for (const m of filtered) {
      const ym = m.releaseDate.slice(0, 7);
      if (!map.has(ym)) map.set(ym, []);
      map.get(ym)!.push(m);
    }
    return map;
  }, [filtered]);

  const YEAR_OPTS = ["2026年", "2025年", "2024年", "2023年以前"];
  const STATUS_OPTS = ["新刊", "予約受付中", "バックナンバー"];

  return (
    <>
      {/* Toolbar */}
      <div style={{ padding: "12px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {filtered.length !== issues.length ? `${filtered.length}件表示 / 全${issues.length}件` : `全${issues.length}件`}
        </span>
        {(years.length > 0 || statuses.length > 0) && (
          <button
            onClick={() => { setYears([]); setStatuses([]); }}
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, border: "1px solid var(--line)", background: "white", color: "var(--plum)", cursor: "pointer", fontFamily: '"Noto Serif JP",serif' }}
          >
            フィルター解除
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "var(--gap)", padding: "var(--row-gap) var(--pad)", alignItems: "start" }}>
        {/* Left: month-grouped issues */}
        <div>
          {filtered.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)", fontFamily: '"Noto Serif JP",serif', fontSize: 13 }}>
              条件に一致する号がありません
            </div>
          ) : (
            [...byMonth.entries()].map(([ym, mags]) => (
              <div key={ym} style={{ marginBottom: "var(--row-gap)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--plum)", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{formatMonth(ym)}</div>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--line), transparent)" }} />
                  <span style={{ fontSize: 10, color: "var(--ink-3)" }}>{mags.length}号</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap)" }}>
                  {mags.map((mag) => <IssueCard key={mag.slug} mag={mag} />)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: facets */}
        <aside style={{ position: "sticky", top: 80 }}>
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: "var(--ink-3)", marginBottom: 10 }}>発売年</div>
            {YEAR_OPTS.map((v) => (
              <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: years.includes(v) ? "var(--ink)" : "var(--ink-2)", cursor: "pointer", marginBottom: 6, fontWeight: years.includes(v) ? 600 : 400 }}>
                <input type="checkbox" checked={years.includes(v)} onChange={() => toggle(years, setYears, v)} style={{ accentColor: "var(--primary)" }} />
                {v}
              </label>
            ))}
          </div>
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: "var(--ink-3)", marginBottom: 10 }}>状態</div>
            {STATUS_OPTS.map((v) => (
              <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: statuses.includes(v) ? "var(--ink)" : "var(--ink-2)", cursor: "pointer", marginBottom: 6, fontWeight: statuses.includes(v) ? 600 : 400 }}>
                <input type="checkbox" checked={statuses.includes(v)} onChange={() => toggle(statuses, setStatuses, v)} style={{ accentColor: "var(--primary)" }} />
                {v}
              </label>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
