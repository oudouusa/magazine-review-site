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
      <div style={{ background: "linear-gradient(120deg, var(--primary-2) 0%, var(--rose-3) 100%)", padding: "32px var(--pad) 28px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, letterSpacing: "0.32em", color: "var(--ink-3)", marginBottom: 6 }}>
          {brand ? "BRAND ISSUES" : "MAGAZINE & PHOTOBOOK"}
        </div>
        <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 32, fontWeight: 600, letterSpacing: "0.1em", margin: 0, color: "var(--ink)" }}>
          {brand || "雑誌・写真集一覧"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6, letterSpacing: "0.04em" }}>
          {brand ? `全${issues.length}号収録` : `直近${issues.length}号を収録中`}
        </p>
      </div>

      <MagazinesClient issues={issues} />
    </>
  );
}
