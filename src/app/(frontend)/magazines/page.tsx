import type { Metadata } from "next";
import Link from "next/link";
import { getRecentIssues, getIssuesByBrand } from "@/lib/magazine-hub-db";
import { MagazinesClient } from "./MagazinesClient";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ brand?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { brand } = await searchParams;
  return brand
    ? { title: `${decodeURIComponent(brand)} — 号一覧` }
    : { title: "雑誌・写真集一覧", description: "グラビア雑誌・写真集の一覧。週刊・月刊・写真集・電子限定・復刻・限定版を網羅。" };
}

export default async function MagazinesPage({ searchParams }: Props) {
  const { brand: brandSlug } = await searchParams;
  const brand = brandSlug ? decodeURIComponent(brandSlug) : null;
  const issues = brand ? getIssuesByBrand(brand) : getRecentIssues(120);
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const preorderCount = issues.filter((issue) => issue.releaseDate > today).length;
  const newCount = issues.filter((issue) => issue.releaseDate <= today && issue.releaseDate >= thirtyDaysAgo).length;
  const linkedCount = issues.filter((issue) => issue.amazonUrl || issue.rakutenUrl).length;
  const headerStats = [
    { label: "収録", value: `${issues.length}号` },
    { label: "新刊", value: `${newCount}号` },
    { label: "予約", value: `${preorderCount}号` },
    { label: "購入先", value: `${linkedCount}件` },
  ];

  return (
    <>
      {/* Breadcrumb (brand mode only) */}
      {brand && (
        <div style={{ padding: "10px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 6, alignItems: "center" }}>
          <Link href="/" style={{ color: "var(--ink-3)", textDecoration: "none" }}>ホーム</Link>
          <span>›</span>
          <Link href="/brands" style={{ color: "var(--ink-3)", textDecoration: "none" }}>ブランド</Link>
          <span>›</span>
          <span style={{ color: "var(--ink-2)" }}>{brand}</span>
        </div>
      )}

      {/* Page header */}
      <div className="mags-page-header">
        <div>
          <div className="mags-page-eyebrow">
            {brand ? "BRAND ISSUES" : "MAGAZINE PICKS"}
          </div>
          <h1>
            {brand || "雑誌・写真集一覧"}
          </h1>
          <p>
            {brand ? `${brand}の新刊・バックナンバー` : "Amazon・楽天の商品ページへ直接進めるレビュー向けアーカイブ"}
          </p>
        </div>
        <div className="mags-page-stats" aria-label="一覧サマリー">
          {headerStats.map((stat) => (
            <div key={stat.label}>
              <span>{stat.label}</span>
              <b>{stat.value}</b>
            </div>
          ))}
        </div>
      </div>

      <MagazinesClient issues={issues} />
      <style>{`
        .mags-page-header {
          background:
            linear-gradient(120deg, rgba(239, 234, 246, 0.92) 0%, rgba(251, 233, 238, 0.88) 58%, rgba(255, 248, 240, 0.82) 100%);
          padding: 32px var(--pad) 28px;
          border-bottom: 1px solid var(--line);
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 20px;
          align-items: end;
        }
        .mags-page-eyebrow {
          font-family: "Noto Serif JP", serif;
          font-size: 10px;
          letter-spacing: 0.32em;
          color: var(--ink-3);
          margin-bottom: 6px;
        }
        .mags-page-header h1 {
          font-family: "Noto Serif JP", serif;
          font-size: 34px;
          font-weight: 600;
          letter-spacing: 0.1em;
          line-height: 1.22;
          margin: 0;
          color: var(--ink);
        }
        .mags-page-header p {
          font-size: 13px;
          color: var(--ink-2);
          margin: 8px 0 0;
          letter-spacing: 0.04em;
        }
        .mags-page-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(72px, 1fr));
          gap: 8px;
          min-width: min(420px, 100%);
        }
        .mags-page-stats div {
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(122, 74, 90, 0.14);
          border-radius: 8px;
          padding: 9px 10px;
          box-shadow: 0 1px 8px rgba(80, 50, 60, 0.04);
        }
        .mags-page-stats span {
          display: block;
          color: var(--ink-3);
          font-size: 10px;
          letter-spacing: 0.12em;
          margin-bottom: 3px;
        }
        .mags-page-stats b {
          color: var(--plum);
          font-family: "Noto Serif JP", serif;
          font-size: 16px;
          letter-spacing: 0.04em;
        }
        @media (max-width: 860px) {
          .mags-page-header {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 520px) {
          .mags-page-header h1 {
            font-size: 26px;
          }
          .mags-page-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </>
  );
}
