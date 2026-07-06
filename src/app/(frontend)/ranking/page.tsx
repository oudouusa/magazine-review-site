import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ModelCard } from "@/components/ui/ModelCard";
import { getTopModels } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "モデルランキング",
  description: "全期間の掲載数をもとにしたグラビアモデルランキング。",
};

function rankAccent(rank: number): string | undefined {
  if (rank === 1) return "#f5c451";
  if (rank === 2) return "#c8d0dc";
  if (rank === 3) return "#d69a73";
  return undefined;
}

export default function RankingPage() {
  const models = getTopModels(60);

  return (
    <>
      <main className="ranking-page">
        <section className="ranking-hero">
          <div>
            <div className="ranking-eyebrow">ALL-TIME RANKING</div>
            <h1>モデルランキング</h1>
            <p>収録データ全期間の掲載数順に集計しています。</p>
          </div>
          <Link href="/trending" className="ranking-trending-link">
            直近の勢いは 📈 急上昇モデルへ
          </Link>
        </section>

        <section className="ranking-section">
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">MODELS</div>
              <h2 className="sh-title">掲載数ランキング</h2>
            </div>
            <div className="sh-rule" />
            <span className="ranking-count">{models.length}名</span>
          </div>

          <div className="ranking-grid">
            {models.map((model, index) => {
              const rank = index + 1;
              return (
                <div key={model.slug} className="ranking-card-wrap" style={{ "--rank-accent": rankAccent(rank) ?? "var(--accent)" } as CSSProperties}>
                  <ModelCard
                    href={`/models/${model.slug}`}
                    name={model.name}
                    sub={`${model.stats.issues}誌・表紙${model.stats.covers}回`}
                    imageUrl={model.imageUrl}
                    c1={model.gradient.c1}
                    c2={model.gradient.c2}
                    rank={rank}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <style>{`
        .ranking-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: var(--row-gap) var(--pad);
        }
        .ranking-hero {
          display: flex;
          justify-content: space-between;
          gap: var(--gap);
          align-items: flex-end;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--paper);
          padding: clamp(18px, 3vw, 28px);
          margin-bottom: var(--row-gap);
        }
        .ranking-eyebrow {
          margin-bottom: 6px;
          color: var(--accent);
          font-family: "Noto Serif JP", serif;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .28em;
        }
        .ranking-hero h1 {
          margin: 0;
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 900;
          letter-spacing: 0;
          line-height: 1.08;
        }
        .ranking-hero p {
          margin: 10px 0 0;
          color: var(--ink-2);
          font-size: 13px;
          line-height: 1.7;
        }
        .ranking-trending-link {
          flex-shrink: 0;
          border: 1px solid rgba(245,184,61,.28);
          border-radius: 999px;
          background: rgba(245,184,61,.12);
          color: var(--accent);
          font-family: "Noto Serif JP", serif;
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
          padding: 10px 14px;
        }
        .ranking-count {
          flex-shrink: 0;
          color: var(--ink-3);
          font-size: 11px;
        }
        .ranking-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 156px);
          gap: 14px;
        }
        .ranking-card-wrap {
          --accent: var(--rank-accent);
        }
        .ranking-card-wrap:nth-child(-n + 3) a {
          background: linear-gradient(180deg, rgba(245,184,61,.08), var(--bg-2));
          border-color: color-mix(in srgb, var(--rank-accent) 50%, var(--line));
        }
        @media (max-width: 720px) {
          .ranking-page {
            padding-left: 12px;
            padding-right: 12px;
          }
          .ranking-hero {
            display: grid;
            align-items: start;
          }
          .ranking-trending-link {
            justify-self: start;
          }
          .ranking-grid {
            grid-template-columns: repeat(2, 156px);
            overflow-x: auto;
            padding-bottom: 4px;
          }
        }
      `}</style>
    </>
  );
}
