import type { Metadata } from "next";
import { getRecentIssues } from "@/lib/magazine-hub-db";
import { MagazinesClient } from "./MagazinesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "雑誌・写真集一覧",
  description: "グラビア雑誌・写真集の一覧。週刊・月刊・写真集・電子限定・復刻・限定版を網羅。",
};

export default function MagazinesPage() {
  const issues = getRecentIssues(120);

  return (
    <>
      {/* Page header */}
      <div style={{ background: "linear-gradient(120deg, var(--primary-2) 0%, var(--rose-3) 100%)", padding: "32px var(--pad) 28px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, letterSpacing: "0.32em", color: "var(--ink-3)", marginBottom: 6 }}>MAGAZINE &amp; PHOTOBOOK</div>
        <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 32, fontWeight: 600, letterSpacing: "0.1em", margin: 0, color: "var(--ink)" }}>雑誌・写真集一覧</h1>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6, letterSpacing: "0.04em" }}>直近{issues.length}号を収録中</p>
      </div>

      <MagazinesClient issues={issues} />
    </>
  );
}
