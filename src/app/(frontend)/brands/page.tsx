import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ブランド一覧",
  description: "グラビア雑誌・写真集のシリーズ（ブランド）一覧。",
};

export default function BrandsPage() {
  const brands = getBrands();

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ padding: "10px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 6, alignItems: "center" }}>
        <Link href="/" style={{ color: "var(--ink-3)", textDecoration: "none" }}>ホーム</Link>
        <span>›</span>
        <span style={{ color: "var(--ink-2)" }}>ブランド一覧</span>
      </div>

      {/* Page header */}
      <div style={{ background: "linear-gradient(120deg, var(--primary-2) 0%, var(--rose-3) 100%)", padding: "32px var(--pad) 28px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, letterSpacing: "0.32em", color: "var(--ink-3)", marginBottom: 6 }}>BRANDS</div>
        <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 32, fontWeight: 600, letterSpacing: "0.1em", margin: 0, color: "var(--ink)" }}>ブランド一覧</h1>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6, letterSpacing: "0.04em" }}>全{brands.length}シリーズ収録</p>
      </div>

      <div style={{ padding: "var(--row-gap) var(--pad)" }}>
        <div className="brands-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--gap)" }}>
          {brands.map((brand) => (
            <Link key={brand.name} href={`/magazines?brand=${brand.slug}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,30,40,.04)", cursor: "pointer" }}>
                {/* Portrait cover */}
                <div style={{
                  aspectRatio: "3/4",
                  background: brand.coverImageUrl
                    ? `url("${brand.coverImageUrl}") center / cover no-repeat, linear-gradient(160deg, ${brand.gradient.c1}, ${brand.gradient.c2})`
                    : `linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,.5)), linear-gradient(160deg, ${brand.gradient.c1}, ${brand.gradient.c2})`,
                  position: "relative",
                }}>
                  {!brand.coverImageUrl && (
                    <>
                      <div style={{ position: "absolute", top: 12, left: 12, right: 12, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", lineHeight: 1.4 }}>
                        {brand.name}
                      </div>
                      <div style={{ position: "absolute", bottom: 10, left: 12, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.8)", fontSize: 10 }}>
                        {brand.issueCount}号
                      </div>
                    </>
                  )}
                </div>
                <div style={{ padding: "8px 10px 10px" }}>
                  <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 11, fontWeight: 600, color: "var(--ink)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{brand.name}</div>
                  <div style={{ fontSize: 9.5, color: "var(--ink-3)" }}>
                    <b style={{ color: "var(--plum)", fontFamily: '"Noto Serif JP",serif' }}>{brand.issueCount}</b>号 · {brand.latestDate.slice(0, 7)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .brands-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </>
  );
}
