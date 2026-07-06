import type { Metadata } from "next";
import Link from "next/link";
import { CoverCard } from "@/components/ui/CoverCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getBrands, getCoverWall } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "カバーウォール — MODEL HUB",
};

type Era = "1990s" | "2000s" | "2010s" | "2020s";
type Props = { searchParams: Promise<{ era?: string; brand?: string; page?: string }> };

const eras: Array<{ value: Era | "all"; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "2020s", label: "2020s" },
  { value: "2010s", label: "2010s" },
  { value: "2000s", label: "2000s" },
  { value: "1990s", label: "1990s" },
];

function normalizeEra(value: string | undefined): Era | undefined {
  return value === "1990s" || value === "2000s" || value === "2010s" || value === "2020s" ? value : undefined;
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function safeDecode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildHref({ era, brand, page }: { era?: Era; brand?: string; page?: number }): string {
  const params = new URLSearchParams();
  if (era) params.set("era", era);
  if (brand) params.set("brand", brand);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/covers?${query}` : "/covers";
}

export default async function CoversPage({ searchParams }: Props) {
  const params = await searchParams;
  const era = normalizeEra(params.era);
  const brand = safeDecode(params.brand);
  const page = parsePage(params.page);
  const perPage = 96;
  const brands = getBrands();
  const brandOptions = brands.slice(0, 40);
  const { items, total } = getCoverWall({
    era,
    brand,
    offset: (page - 1) * perPage,
    limit: perPage,
  });
  const lastPage = Math.max(1, Math.ceil(total / perPage));

  return (
    <main className="covers-page">
      <SectionHeader
        icon="🖼"
        title="カバーウォール"
        subtitle={`表紙 ${total.toLocaleString("ja-JP")}枚のアーカイブ`}
      />

      <div className="covers-filters">
        <div className="covers-era-tabs" aria-label="年代フィルタ">
          {eras.map((item) => {
            const tabEra = item.value === "all" ? undefined : item.value;
            const active = era === tabEra || (!era && item.value === "all");
            return (
              <Link
                key={item.value}
                href={buildHref({ era: tabEra, brand, page })}
                className={active ? "covers-tab-active" : "tag"}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <form id="covers-brand-form" method="get" className="covers-brand-form">
          {era && <input type="hidden" name="era" value={era} />}
          <label htmlFor="covers-brand">ブランド</label>
          <select id="covers-brand" name="brand" defaultValue={brand ?? ""}>
            <option value="">すべて</option>
            {brandOptions.map((option) => (
              <option key={option.name} value={option.name}>{option.name}</option>
            ))}
          </select>
          <button type="submit" className="tag">適用</button>
        </form>
      </div>

      {items.length > 0 ? (
        <div className="covers-grid">
          {items.map((item) => (
            <CoverCard
              key={item.slug}
              href={`/magazines/${item.slug}`}
              title={item.title}
              sub={`${item.seriesName}・${item.releaseDate.slice(0, 4)}年`}
              imageUrl={item.coverImageUrl}
              c1={item.gradient.c1}
              c2={item.gradient.c2}
              width="100%"
            />
          ))}
        </div>
      ) : (
        <div className="covers-empty">この条件の表紙はまだありません</div>
      )}

      {total > perPage && (
        <nav className="covers-pagination" aria-label="ページネーション">
          {page > 1 && <Link href={buildHref({ era, brand, page: page - 1 })}>← 前へ</Link>}
          <span className="mh-num">{page}</span>
          {page < lastPage && <Link href={buildHref({ era, brand, page: page + 1 })}>次へ →</Link>}
        </nav>
      )}

      <script
        dangerouslySetInnerHTML={{
          __html: `document.getElementById("covers-brand")?.addEventListener("change",function(){this.form?.submit();});`,
        }}
      />

      <style>{`
        .covers-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--row-gap) var(--pad);
        }
        .covers-filters {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: var(--row-gap);
        }
        .covers-era-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .covers-era-tabs a,
        .covers-pagination a {
          text-decoration: none;
        }
        .covers-tab-active {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          background: var(--primary);
          color: white;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
          padding: 6px 12px;
        }
        .covers-brand-form {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .covers-brand-form label {
          color: var(--ink-3);
          font-size: 12px;
          font-weight: 800;
        }
        .covers-brand-form select {
          min-width: 180px;
          height: 34px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--bg-2);
          color: var(--ink);
          padding: 0 12px;
        }
        .covers-brand-form button {
          cursor: pointer;
        }
        .covers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 14px;
        }
        .covers-empty {
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--bg-2);
          color: var(--ink-2);
          font-size: 14px;
          line-height: 1.8;
          padding: 22px;
          text-align: center;
        }
        .covers-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          margin-top: var(--row-gap);
          color: var(--ink-2);
          font-size: 13px;
          font-weight: 800;
        }
        .covers-pagination a {
          color: var(--primary);
        }
        .covers-pagination span {
          color: var(--ink);
          font-size: 18px;
          font-weight: 900;
        }
        @media (max-width: 640px) {
          .covers-brand-form,
          .covers-brand-form select {
            width: 100%;
          }
          .covers-brand-form {
            align-items: stretch;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </main>
  );
}
