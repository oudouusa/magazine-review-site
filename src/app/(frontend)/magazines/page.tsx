import type { Metadata } from "next";
import Link from "next/link";
import { getRecentIssues, type MhMagazine } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "雑誌・写真集一覧",
  description: "グラビア雑誌・写真集の一覧。週刊・月刊・写真集・電子限定・復刻・限定版を網羅。",
};

const FACETS = {
  year: ["2026年", "2025年", "2024年", "2023年以前"],
  status: ["新刊", "予約受付中", "バックナンバー"],
};

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

export default function MagazinesPage() {
  const issues = getRecentIssues(60);
  const total = issues.length;

  // Group by year-month
  const byMonth = new Map<string, MhMagazine[]>();
  for (const issue of issues) {
    const ym = issue.releaseDate.slice(0, 7); // "2026-04"
    if (!byMonth.has(ym)) byMonth.set(ym, []);
    byMonth.get(ym)!.push(issue);
  }

  function formatMonth(ym: string): string {
    const [y, m] = ym.split("-");
    return `${y}年${Number(m)}月`;
  }

  return (
    <>
      {/* Page header */}
      <div style={{ background: "linear-gradient(120deg, var(--primary-2) 0%, var(--rose-3) 100%)", padding: "32px var(--pad) 28px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, letterSpacing: "0.32em", color: "var(--ink-3)", marginBottom: 6 }}>MAGAZINE &amp; PHOTOBOOK</div>
        <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 32, fontWeight: 600, letterSpacing: "0.1em", margin: 0, color: "var(--ink)" }}>雑誌・写真集一覧</h1>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6, letterSpacing: "0.04em" }}>直近{total}号を収録中</p>
      </div>

      {/* Toolbar */}
      <div style={{ padding: "12px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>全{total}件</span>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {["新着順", "発売日"].map((s, i) => (
            <button key={s} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 999, border: "1px solid var(--line)", background: i === 0 ? "var(--primary)" : "white", color: i === 0 ? "white" : "var(--ink-2)", cursor: "pointer", fontFamily: '"Noto Serif JP",serif' }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "var(--gap)", padding: "var(--row-gap) var(--pad)", alignItems: "start" }}>
        {/* Left: month-grouped issues */}
        <div>
          {[...byMonth.entries()].map(([ym, mags]) => (
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
          ))}
        </div>

        {/* Right: facets */}
        <aside style={{ position: "sticky", top: 80 }}>
          {Object.entries(FACETS).map(([key, values]) => (
            <div key={key} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: "var(--ink-3)", marginBottom: 10 }}>
                {key === "year" ? "発売年" : "状態"}
              </div>
              {values.map((v) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-2)", cursor: "pointer", marginBottom: 6 }}>
                  <input type="checkbox" style={{ accentColor: "var(--primary)" }} />
                  {v}
                </label>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
