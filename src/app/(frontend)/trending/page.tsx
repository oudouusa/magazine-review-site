import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Sparkline } from "@/components/ui/Sparkline";
import { getTrendingModels } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "急上昇モデル — MODEL HUB",
};

function firstYear(firstDate: string | undefined): string {
  return firstDate ? `${firstDate.slice(0, 4)}年` : "不明";
}

function isNewFace(firstDate: string | undefined): boolean {
  if (!firstDate) return false;
  const first = new Date(`${firstDate}T00:00:00`);
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - 18);
  return first >= threshold;
}

function formatScore(score: number): string {
  return score >= 10 ? score.toFixed(0) : score.toFixed(1).replace(/\.0$/, "");
}

export default function TrendingPage() {
  const models = getTrendingModels(30);

  return (
    <main className="trending-page">
      <SectionHeader
        icon="📈"
        title="急上昇モデル"
        subtitle="直近6ヶ月の掲載ペースが伸びているモデル"
      />

      <div className="trend-list">
        {models.map((model, index) => {
          const rank = index + 1;
          const featuredRank = rank <= 3;
          const href = `/models/${encodeURIComponent(model.key)}`;
          const growthLabel = model.prior6 === 0 ? "復帰" : `×${formatScore(model.score)}`;
          return (
            <div key={model.key} className="trend-row">
              <div className={`trend-rank mh-serif mh-num${featuredRank ? " featured" : ""}`}>{rank}</div>
              <Link
                href={href}
                className="trend-icon"
                aria-label={`${model.name}の詳細`}
                style={{
                  background: model.imageUrl
                    ? `url("${model.imageUrl}") center / cover no-repeat, linear-gradient(145deg, ${model.c1}, ${model.c2})`
                    : `linear-gradient(145deg, ${model.c1}, ${model.c2})`,
                }}
              >
                {!model.imageUrl && <span>{model.name.slice(0, 1)}</span>}
              </Link>
              <div className="trend-main">
                <div className="trend-name-line">
                  <Link href={href}>{model.name}</Link>
                  {isNewFace(model.firstDate) && <Badge tone="accent">NEW FACE</Badge>}
                </div>
                <div className="trend-first">初掲載 {firstYear(model.firstDate)}</div>
              </div>
              <div className="trend-spark">
                <Sparkline values={model.monthly} width={160} height={34} />
              </div>
              <div className="trend-counts">
                <div className="mh-num trend-recent">{model.recent6}誌</div>
                <div className="trend-prior">前期 {model.prior6}誌</div>
                <Badge tone={model.score >= 3 ? "primary" : "muted"}>{growthLabel}</Badge>
              </div>
            </div>
          );
        })}
      </div>

      <div className="trend-note">
        集計方法: 直近183日の掲載誌数 ÷ その前183日の掲載誌数。直近 4 誌以上のモデルが対象。データは掲載誌インデックスに基づく推定です。
      </div>

      <style>{`
        .trending-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--row-gap) var(--pad);
        }
        .trend-list {
          display: grid;
          gap: 10px;
        }
        .trend-row {
          display: grid;
          grid-template-columns: 52px 56px minmax(0, 1fr) 180px 118px;
          gap: 14px;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid var(--line);
        }
        .trend-rank {
          color: var(--ink-3);
          font-size: 22px;
          font-style: italic;
          font-weight: 900;
          text-align: center;
        }
        .trend-rank.featured {
          color: var(--accent);
          font-size: 34px;
        }
        .trend-icon {
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 50%;
          color: rgba(255,255,255,0.94);
          text-decoration: none;
        }
        .trend-icon span {
          font-family: "Noto Serif JP", serif;
          font-size: 20px;
          font-weight: 900;
          text-shadow: 0 1px 8px rgba(0,0,0,0.38);
        }
        .trend-main {
          min-width: 0;
        }
        .trend-name-line {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .trend-name-line a {
          color: var(--ink);
          font-size: 15px;
          font-weight: 900;
          line-height: 1.4;
          text-decoration: none;
        }
        .trend-name-line a:hover {
          color: var(--primary);
        }
        .trend-first {
          margin-top: 3px;
          color: var(--ink-3);
          font-size: 11px;
        }
        .trend-spark {
          width: 160px;
          height: 34px;
        }
        .trend-counts {
          display: grid;
          justify-items: end;
          gap: 4px;
        }
        .trend-recent {
          color: var(--ink);
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
        }
        .trend-prior {
          color: var(--ink-3);
          font-size: 11px;
        }
        .trend-note {
          margin-top: var(--row-gap);
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--bg-2);
          color: var(--ink-2);
          font-size: 13px;
          line-height: 1.8;
          padding: 14px 16px;
        }
        @media (max-width: 820px) {
          .trend-row {
            grid-template-columns: 38px 56px minmax(0, 1fr) 88px;
          }
          .trend-spark {
            grid-column: 3 / -1;
            width: 160px;
          }
          .trend-counts {
            grid-column: 4;
            grid-row: 1;
          }
          .trend-rank.featured {
            font-size: 28px;
          }
        }
        @media (max-width: 560px) {
          .trend-row {
            grid-template-columns: 34px 48px minmax(0, 1fr);
            gap: 10px;
          }
          .trend-icon {
            width: 48px;
            height: 48px;
          }
          .trend-counts {
            grid-column: 3;
            grid-row: auto;
            justify-items: start;
          }
          .trend-spark {
            grid-column: 3;
          }
        }
      `}</style>
    </main>
  );
}
