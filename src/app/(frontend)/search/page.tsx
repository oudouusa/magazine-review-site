import type { Metadata } from "next";
import { getTopModels, searchIssues, searchModels } from "@/lib/magazine-hub-db";
import { CoverCard } from "@/components/fx/CoverCard";
import { ModelCard } from "@/components/fx/ModelCard";
import { SectionHead } from "@/components/fx/SectionHead";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return q ? { title: `「${q}」の検索結果 — MODEL HUB` } : { title: "検索 — MODEL HUB" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const models = query ? searchModels(query, 24) : [];
  const issues = query ? searchIssues(query, 24) : [];
  const total = models.length + issues.length;
  const suggestions = !query || total === 0 ? getTopModels(6) : [];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px var(--pad) 0" }}>
      <SectionHead eyebrow="Search" title={query ? `「${query}」の検索結果` : "検索"} />

      <form action="/search" method="get" role="search" style={{ display: "flex", gap: 10, maxWidth: 560, marginBottom: "var(--row-gap)" }}>
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="モデル名・雑誌名・シリーズ名"
          aria-label="検索語"
          autoFocus
          style={{
            flex: 1,
            minHeight: 46,
            border: "1px solid var(--line)",
            borderRadius: 999,
            outline: 0,
            background: "var(--paper)",
            color: "var(--ink)",
            padding: "0 18px",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />
        <button type="submit" className="btn btn-primary" style={{ minHeight: 46, justifyContent: "center" }}>
          検索
        </button>
      </form>

      {query && total === 0 && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--paper)", padding: 28, marginBottom: "var(--row-gap)" }}>
          <div className="serif" style={{ color: "var(--ink)", fontSize: 21, fontWeight: 900 }}>見つかりませんでした</div>
          <p style={{ margin: "8px 0 0", color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.8 }}>
            「{query}」に一致するモデル・雑誌はありませんでした。別の表記(ひらがな・漢字)でもお試しください。
          </p>
        </div>
      )}

      {models.length > 0 && (
        <section style={{ marginBottom: "var(--row-gap)" }}>
          <SectionHead eyebrow="Models" title={`モデル ${models.length}件`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: "var(--gap)" }}>
            {models.map((model) => (
              <ModelCard
                key={model.slug}
                href={`/models/${model.slug}`}
                name={model.name}
                sub={`掲載 ${model.stats.issues.toLocaleString()}誌`}
                imageUrl={model.imageUrl}
                c1={model.gradient.c1}
                c2={model.gradient.c2}
                width="100%"
              />
            ))}
          </div>
        </section>
      )}

      {issues.length > 0 && (
        <section style={{ marginBottom: "var(--row-gap)" }}>
          <SectionHead eyebrow="Magazines" title={`雑誌・写真集 ${issues.length}件`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: "var(--gap)" }}>
            {issues.map((mag) => (
              <CoverCard
                key={mag.slug}
                href={`/magazines/${mag.slug}`}
                title={mag.title || mag.seriesName}
                sub={`${mag.seriesName} ・ ${mag.releaseDate}`}
                imageUrl={mag.coverImageUrl}
                c1={mag.gradient.c1}
                c2={mag.gradient.c2}
                obi={mag.badge === "preorder" ? "予約" : mag.badge === "new" ? "新刊" : undefined}
                width="100%"
              />
            ))}
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section style={{ marginBottom: "var(--row-gap)" }}>
          <SectionHead
            eyebrow="Popular"
            title="人気モデルから探す"
            moreHref="/ranking"
            moreLabel="ランキングを見る"
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: "var(--gap)" }}>
            {suggestions.map((model, index) => (
              <ModelCard
                key={model.slug}
                href={`/models/${model.slug}`}
                name={model.name}
                sub={`${model.stats.issues.toLocaleString()}誌`}
                imageUrl={model.imageUrl}
                c1={model.gradient.c1}
                c2={model.gradient.c2}
                rank={index + 1}
                width="100%"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
