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
        <div className="brands-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap)" }}>
          {brands.map((brand) => (
            <Link key={brand.name} href={`/magazines?brand=${brand.slug}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,30,40,.04)", cursor: "pointer", transition: "box-shadow 0.12s" }}>
                {/* Cover strip */}
                <div style={{
                  height: 100,
                  background: brand.coverImageUrl
                    ? `url("${brand.coverImageUrl}") center / cover no-repeat, linear-gradient(160deg, ${brand.gradient.c1}, ${brand.gradient.c2})`
                    : `linear-gradient(160deg, ${brand.gradient.c1}, ${brand.gradient.c2})`,
                  position: "relative",
                }}>
                  {!brand.coverImageUrl && (
                    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.8)", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", padding: "0 12px", textAlign: "center" }}>
                      {brand.name}
                    </div>
                  )}
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{brand.name}</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 10, color: "var(--ink-3)" }}>
                    <span><b style={{ color: "var(--plum)", fontFamily: '"Noto Serif JP",serif', fontSize: 12 }}>{brand.issueCount}</b> 号</span>
                    <span>{brand.latestDate.slice(0, 7)} 最新</span>
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
