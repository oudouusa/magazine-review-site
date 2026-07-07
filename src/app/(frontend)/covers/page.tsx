import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/magazine-hub-db";
import { getCoverWall } from "@/lib/mh-insights";
import { CoverCard } from "@/components/fx/CoverCard";
import { SectionHead } from "@/components/fx/SectionHead";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "カバーウォール — MODEL HUB",
  description: "グラビア雑誌・写真集の表紙アーカイブを年代・ブランドで一望。",
};

const ERAS = [
  { key: "", label: "すべて" },
  { key: "2020s", label: "2020s" },
  { key: "2010s", label: "2010s" },
  { key: "2000s", label: "2000s" },
  { key: "1990s", label: "1990s" },
] as const;

const PAGE_SIZE = 96;

function wallHref(era: string, brand: string, page: number): string {
  const params = new URLSearchParams();
  if (era) params.set("era", era);
  if (brand) params.set("brand", brand);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/covers?${qs}` : "/covers";
}

export default async function CoversPage({
  searchParams,
}: {
  searchParams: Promise<{ era?: string; brand?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const era = sp.era ?? "";
  const brand = sp.brand ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total } = getCoverWall({ era: era || undefined, brand: brand || undefined, page, pageSize: PAGE_SIZE });
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > lastPage) redirect(wallHref(era, brand, lastPage));
  const brands = getBrands().slice(0, 40);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px var(--pad) 0" }}>
      <SectionHead eyebrow="Cover Wall" title="カバーウォール" />
      <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: -8, marginBottom: 20 }}>
        表紙 <strong className="mh-num">{total.toLocaleString()}</strong> 枚のアーカイブ。年代とブランドで絞り込めます。
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="tablist" aria-label="年代フィルタ">
          {ERAS.map((e) => {
            const active = era === e.key;
            return (
              <Link
                key={e.key || "all"}
                href={wallHref(e.key, brand, 1)}
                aria-current={active ? "true" : undefined}
                className="mh-num"
                style={{
                  padding: "7px 15px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  textDecoration: "none",
                  background: active ? "var(--primary)" : "var(--paper)",
                  color: active ? "#fff" : "var(--ink-2)",
                  border: `1px solid ${active ? "var(--primary)" : "var(--line)"}`,
                }}
              >
                {e.label}
              </Link>
            );
          })}
        </div>
        <form action="/covers" method="get" style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {era && <input type="hidden" name="era" value={era} />}
          <select
            name="brand"
            defaultValue={brand}
            aria-label="ブランドで絞り込み"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: 13,
              fontFamily: "inherit",
              maxWidth: 220,
            }}
          >
            <option value="">すべてのブランド</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.name}>
                {b.name}（{b.issueCount.toLocaleString()}）
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-ghost" style={{ fontSize: 12, padding: "8px 16px" }}>
            絞り込む
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-3)" }}>
          <div style={{ fontSize: 34, marginBottom: 10 }} aria-hidden>🗄</div>
          この条件の表紙はまだありません。
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
          {items.map((c) => (
            <CoverCard
              key={c.slug}
              href={`/magazines/${c.slug}`}
              title={c.seriesName}
              sub={`${c.issue || c.releaseDate.slice(0, 7)}`}
              imageUrl={c.coverImageUrl}
              c1={c.gradient.c1}
              c2={c.gradient.c2}
              width="100%"
              minTitle
            />
          ))}
        </div>
      )}

      <nav
        aria-label="ページ送り"
        style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, padding: "30px 0 10px" }}
      >
        {page > 1 ? (
          <Link href={wallHref(era, brand, page - 1)} className="btn btn-ghost" style={{ fontSize: 12.5 }}>
            ← 前のページ
          </Link>
        ) : (
          <span style={{ width: 110 }} />
        )}
        <span className="mh-num" style={{ color: "var(--ink-2)", fontSize: 13 }}>
          {page} / {lastPage.toLocaleString()}
        </span>
        {page < lastPage ? (
          <Link href={wallHref(era, brand, page + 1)} className="btn btn-ghost" style={{ fontSize: 12.5 }}>
            次のページ →
          </Link>
        ) : (
          <span style={{ width: 110 }} />
        )}
      </nav>
    </div>
  );
}
