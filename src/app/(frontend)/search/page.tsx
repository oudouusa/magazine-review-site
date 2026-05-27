import type { Metadata } from "next";
import Link from "next/link";
import { searchModels, searchIssues } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return q ? { title: `「${q}」の検索結果` } : { title: "検索" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const models = query ? searchModels(query, 24) : [];
  const issues = query ? searchIssues(query, 24) : [];
  const total = models.length + issues.length;

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ padding: "10px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 6, alignItems: "center" }}>
        <Link href="/" style={{ color: "var(--ink-3)", textDecoration: "none" }}>ホーム</Link>
        <span>›</span>
        <span style={{ color: "var(--ink-2)" }}>検索</span>
        {query && <><span>›</span><span style={{ color: "var(--ink-2)" }}>{query}</span></>}
      </div>

      <div style={{ padding: "var(--row-gap) var(--pad)" }}>
        {/* Search form */}
        <form action="/search" method="get" style={{ marginBottom: "var(--row-gap)" }}>
          <div style={{ display: "flex", gap: 8, maxWidth: 560 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 999, padding: "10px 16px", boxShadow: "0 1px 4px rgba(60,30,40,.06)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                name="q"
                defaultValue={query}
                placeholder="モデル名・雑誌名・シリーズ名から探す"
                autoFocus
                style={{ border: 0, outline: 0, background: "transparent", flex: 1, fontSize: 15, color: "var(--ink)", fontFamily: "inherit" }}
              />
            </div>
            <button type="submit" style={{ padding: "10px 20px", background: "var(--primary)", color: "white", border: 0, borderRadius: 999, fontFamily: '"Noto Serif JP",serif', fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
              検索
            </button>
          </div>
        </form>

        {/* No query state */}
        {!query && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-3)", fontFamily: '"Noto Serif JP",serif' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🔍</div>
            <div style={{ fontSize: 14, letterSpacing: "0.1em" }}>モデル名や雑誌名を入力して検索してください</div>
          </div>
        )}

        {/* Query with no results */}
        {query && total === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-3)", fontFamily: '"Noto Serif JP",serif' }}>
            <div style={{ fontSize: 14, letterSpacing: "0.1em", marginBottom: 8 }}>「{query}」に一致する結果が見つかりませんでした</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>別のキーワードで試してみてください</div>
          </div>
        )}

        {/* Models results */}
        {models.length > 0 && (
          <div style={{ marginBottom: "var(--row-gap)" }}>
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">MODELS</div>
                <h2 className="sh-title">モデル</h2>
              </div>
              <div className="sh-rule" />
              <span style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{models.length}件</span>
            </div>
            <div className="search-model-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "var(--gap)" }}>
              {models.map((model) => (
                <Link key={model.slug} href={`/models/${model.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,30,40,.04)" }}>
                    <div style={{
                      aspectRatio: "3/4",
                      background: model.imageUrl
                        ? `url("${model.imageUrl}") center / cover no-repeat, radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`
                        : `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), radial-gradient(at 70% 60%, ${model.gradient.c2} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`,
                    }} />
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{model.name}</div>
                      <div style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.1em" }}>出演 {model.stats.issues}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Issues results */}
        {issues.length > 0 && (
          <div>
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">MAGAZINES</div>
                <h2 className="sh-title">雑誌・写真集</h2>
              </div>
              <div className="sh-rule" />
              <span style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{issues.length}件</span>
            </div>
            <div className="search-mag-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "var(--gap)" }}>
              {issues.map((mag) => (
                <Link key={mag.slug} href={`/magazines/${mag.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,30,40,.04)" }}>
                    <div style={{
                      aspectRatio: "3/4",
                      background: mag.coverImageUrl
                        ? `url("${mag.coverImageUrl}") center / cover no-repeat, linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`
                        : `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`,
                      position: "relative",
                    }}>
                      {!mag.coverImageUrl && (
                        <div style={{ position: "absolute", top: 10, left: 10, right: 10, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.9)", fontWeight: 700, fontSize: 11 }}>{mag.seriesName}</div>
                      )}
                    </div>
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mag.seriesName}</div>
                      <div style={{ fontSize: 9, color: "var(--ink-3)" }}>{mag.releaseDate}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .search-model-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .search-mag-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </>
  );
}
