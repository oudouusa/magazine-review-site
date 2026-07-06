import type { Metadata } from "next";
import Link from "next/link";
import { CoverCard } from "@/components/ui/CoverCard";
import { ModelCard } from "@/components/ui/ModelCard";
import { getTopModels, searchIssues, searchModels } from "@/lib/magazine-hub-db";

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
  const suggestions = query && total === 0 ? getTopModels(6) : [];

  return (
    <>
      <div className="search-breadcrumb">
        <Link href="/">ホーム</Link>
        <span>/</span>
        <span>検索</span>
        {query && (
          <>
            <span>/</span>
            <span>{query}</span>
          </>
        )}
      </div>

      <main className="search-page">
        <section className="search-hero">
          <div>
            <div className="search-eyebrow">SEARCH</div>
            <h1>検索</h1>
          </div>
          <form action="/search" method="get" className="search-form">
            <label>
              <span>検索語</span>
              <input
                name="q"
                defaultValue={query}
                placeholder="モデル名・雑誌名・シリーズ名"
                autoFocus
              />
            </label>
            <button type="submit" className="btn btn-primary">検索</button>
          </form>
        </section>

        {!query && (
          <section className="search-empty-card">
            <h2>キーワードを入力してください</h2>
            <p>モデル名、雑誌名、シリーズ名から検索できます。</p>
          </section>
        )}

        {query && total === 0 && (
          <section className="search-empty-card">
            <h2>見つかりませんでした</h2>
            <p>「{query}」に一致するモデル・雑誌はありませんでした。</p>
          </section>
        )}

        {models.length > 0 && (
          <section className="search-section">
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">MODELS</div>
                <h2 className="sh-title">モデル {models.length}件</h2>
              </div>
              <div className="sh-rule" />
            </div>
            <div className="search-model-grid">
              {models.map((model) => (
                <ModelCard
                  key={model.slug}
                  href={`/models/${model.slug}`}
                  name={model.name}
                  sub={`出演 ${model.stats.issues}誌`}
                  imageUrl={model.imageUrl}
                  c1={model.gradient.c1}
                  c2={model.gradient.c2}
                />
              ))}
            </div>
          </section>
        )}

        {issues.length > 0 && (
          <section className="search-section">
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">MAGAZINES</div>
                <h2 className="sh-title">雑誌・写真集 {issues.length}件</h2>
              </div>
              <div className="sh-rule" />
            </div>
            <div className="search-cover-grid">
              {issues.map((mag) => (
                <CoverCard
                  key={mag.slug}
                  href={`/magazines/${mag.slug}`}
                  title={mag.title || mag.seriesName}
                  sub={`${mag.seriesName}・${mag.releaseDate}`}
                  imageUrl={mag.coverImageUrl}
                  c1={mag.gradient.c1}
                  c2={mag.gradient.c2}
                  badge={mag.badge === "new" ? "新刊" : mag.badge === "preorder" ? "予約" : undefined}
                  width="100%"
                />
              ))}
            </div>
          </section>
        )}

        {suggestions.length > 0 && (
          <section className="search-section">
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">POPULAR</div>
                <h2 className="sh-title">人気モデル</h2>
              </div>
              <div className="sh-rule" />
            </div>
            <div className="search-model-grid">
              {suggestions.map((model, index) => (
                <ModelCard
                  key={model.slug}
                  href={`/models/${model.slug}`}
                  name={model.name}
                  sub={`${model.stats.issues}誌`}
                  imageUrl={model.imageUrl}
                  c1={model.gradient.c1}
                  c2={model.gradient.c2}
                  rank={index + 1}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <style>{`
        .search-breadcrumb {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 10px var(--pad);
          border-bottom: 1px solid var(--line);
          background: var(--paper-2);
          color: var(--ink-3);
          font-size: 11px;
        }
        .search-breadcrumb a {
          color: var(--ink-3);
          text-decoration: none;
        }
        .search-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: var(--row-gap) var(--pad);
        }
        .search-hero {
          display: grid;
          grid-template-columns: minmax(220px, 330px) minmax(0, 1fr);
          gap: var(--gap);
          align-items: end;
          margin-bottom: var(--row-gap);
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--paper);
          padding: clamp(18px, 3vw, 28px);
        }
        .search-eyebrow {
          margin-bottom: 6px;
          color: var(--accent);
          font-family: "Noto Serif JP", serif;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .28em;
        }
        .search-hero h1 {
          margin: 0;
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 900;
          letter-spacing: 0;
          line-height: 1.08;
        }
        .search-form {
          display: flex;
          gap: 10px;
          align-items: end;
          min-width: 0;
        }
        .search-form label {
          display: grid;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }
        .search-form label span {
          color: var(--ink-3);
          font-size: 10px;
        }
        .search-form input {
          width: 100%;
          min-height: 46px;
          border: 1px solid var(--line);
          border-radius: 999px;
          outline: 0;
          background: var(--bg-2);
          color: var(--ink);
          padding: 0 16px;
        }
        .search-form button {
          min-height: 46px;
          justify-content: center;
        }
        .search-empty-card {
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--paper);
          padding: 28px;
          margin-bottom: var(--row-gap);
        }
        .search-empty-card h2 {
          margin: 0;
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 0;
        }
        .search-empty-card p {
          margin: 8px 0 0;
          color: var(--ink-2);
          font-size: 13px;
          line-height: 1.7;
        }
        .search-section {
          margin-top: var(--row-gap);
        }
        .search-model-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 156px);
          gap: 14px;
        }
        .search-cover-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: var(--gap);
        }
        @media (max-width: 720px) {
          .search-page {
            padding-left: 12px;
            padding-right: 12px;
          }
          .search-hero,
          .search-form {
            grid-template-columns: 1fr;
          }
          .search-form {
            display: grid;
          }
          .search-form button {
            width: 100%;
          }
          .search-model-grid {
            grid-template-columns: repeat(2, 156px);
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .search-cover-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </>
  );
}
