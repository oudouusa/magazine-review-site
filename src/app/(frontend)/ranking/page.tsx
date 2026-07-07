import type { Metadata } from "next";
import Link from "next/link";
import { getTopModels } from "@/lib/magazine-hub-db";
import { ModelCard } from "@/components/fx/ModelCard";
import { SectionHead } from "@/components/fx/SectionHead";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "モデルランキング — MODEL HUB",
  description: "収録データ全期間の掲載誌数によるグラビアモデルランキング。",
};

export default async function RankingPage() {
  const models = getTopModels(60);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px var(--pad) 0" }}>
      <SectionHead eyebrow="All-Time Ranking" title="モデルランキング">
        <Link
          href="/trending"
          className="mh-num"
          style={{
            flexShrink: 0,
            alignSelf: "center",
            border: "1px solid color-mix(in srgb, var(--amber) 30%, transparent)",
            borderRadius: 999,
            background: "color-mix(in srgb, var(--amber) 12%, transparent)",
            color: "var(--amber)",
            fontSize: 12.5,
            fontWeight: 700,
            textDecoration: "none",
            padding: "8px 14px",
            whiteSpace: "nowrap",
          }}
        >
          直近の勢いは 📈 急上昇へ
        </Link>
      </SectionHead>
      <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: -8, marginBottom: 24 }}>
        収録データ全期間(1992〜)の掲載誌数で集計した殿堂ランキング、上位 {models.length} 名。
      </p>

      {models.length === 0 ? (
        <p style={{ color: "var(--ink-3)", padding: "40px 0" }}>集計データを取得できませんでした。</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: "var(--gap)", marginBottom: "var(--row-gap)" }}>
          {models.map((model, index) => (
            <ModelCard
              key={model.slug}
              href={`/models/${model.slug}`}
              name={model.name}
              sub={`${model.stats.issues.toLocaleString()}誌・表紙${model.stats.covers.toLocaleString()}回`}
              imageUrl={model.imageUrl}
              c1={model.gradient.c1}
              c2={model.gradient.c2}
              rank={index + 1}
              width="100%"
            />
          ))}
        </div>
      )}
    </div>
  );
}
