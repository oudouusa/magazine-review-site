import type { Metadata } from "next";
import Link from "next/link";
import { getTrendingModels } from "@/lib/mh-insights";
import { SectionHead } from "@/components/fx/SectionHead";
import { Sparkline } from "@/components/fx/Sparkline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "急上昇モデル — MODEL HUB",
  description: "直近6ヶ月の掲載ペースが伸びているグラビアモデルのランキング。雑誌の起用は人気の先行指標。",
};

export default async function TrendingPage() {
  const models = getTrendingModels(30);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px var(--pad) 0" }}>
      <SectionHead eyebrow="Rising Stars" title="急上昇モデル" />
      <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: -8, marginBottom: 24, lineHeight: 1.9 }}>
        編集部の起用は人気の<strong>先行指標</strong>。直近6ヶ月の掲載ペースが前の6ヶ月より
        伸びているモデルを、伸び率順に並べています。
      </p>

      {models.length === 0 ? (
        <p style={{ color: "var(--ink-3)", padding: "40px 0" }}>集計データを取得できませんでした。</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {models.map((t, i) => {
            const rank = i + 1;
            return (
              <div
                key={t.key}
                className="mh-lift"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: "12px 18px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="serif mh-num"
                  aria-label={`${rank}位`}
                  style={{
                    fontSize: rank <= 3 ? 36 : 22,
                    fontStyle: "italic",
                    fontWeight: 900,
                    lineHeight: 1,
                    color: rank <= 3 ? "var(--amber)" : "var(--ink-3)",
                    width: 48,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {rank}
                </span>
                <Link href={`/models/${t.slug}`} aria-label={t.name} style={{ flexShrink: 0 }}>
                  <span
                    style={{
                      display: "block",
                      width: 58,
                      height: 58,
                      borderRadius: 999,
                      border: "2px solid var(--line)",
                      background: t.imageUrl
                        ? `url("${t.imageUrl}") center 20% / cover no-repeat`
                        : `linear-gradient(150deg, ${t.c1}, ${t.c2})`,
                    }}
                  />
                </Link>
                <span style={{ flex: "1 1 150px", minWidth: 130 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Link
                      href={`/models/${t.slug}`}
                      style={{ color: "var(--ink)", fontWeight: 700, fontSize: 15.5, textDecoration: "none" }}
                    >
                      {t.name}
                    </Link>
                    {t.isNewFace && (
                      <span className="tag alt" style={{ fontSize: 9.5, padding: "2px 8px" }}>
                        NEW FACE
                      </span>
                    )}
                  </span>
                  <span className="mh-num" style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>
                    {t.firstDate ? `初掲載 ${t.firstDate.slice(0, 4)}年` : ""} ・ 通算 {t.totalPubs.toLocaleString()}誌
                  </span>
                </span>
                <span style={{ flexShrink: 0 }}>
                  <Sparkline values={t.monthly} width={170} height={40} />
                  <span style={{ display: "block", fontSize: 9.5, color: "var(--ink-3)", textAlign: "center", marginTop: 1 }}>
                    24ヶ月の掲載推移
                  </span>
                </span>
                <span style={{ flexShrink: 0, textAlign: "right", minWidth: 96, marginLeft: "auto" }}>
                  <span className="serif mh-num" style={{ display: "block", fontSize: 21, fontWeight: 900, color: "var(--ink)" }}>
                    {t.recent6}
                    <span style={{ fontSize: 11, color: "var(--ink-2)", fontWeight: 500 }}>誌 / 6ヶ月</span>
                  </span>
                  <span
                    className="mh-num"
                    style={{
                      display: "inline-block",
                      marginTop: 4,
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: "2px 10px",
                      borderRadius: 999,
                      background: t.prior6 === 0 ? "var(--rose-2)" : t.score >= 3 ? "var(--primary-2)" : "var(--bg-2)",
                      color: t.prior6 === 0 ? "var(--rose)" : t.score >= 3 ? "var(--primary)" : "var(--ink-3)",
                    }}
                  >
                    {t.prior6 === 0 ? "復帰・新登場" : `前期比 ×${t.score}`}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "16px 20px",
          margin: "28px 0 8px",
          fontSize: 12.5,
          color: "var(--ink-2)",
          lineHeight: 1.9,
        }}
      >
        <strong style={{ color: "var(--ink)" }}>集計方法</strong> — 直近183日の掲載誌数 ÷ その前183日の掲載誌数。
        直近183日に4誌以上掲載されたモデルが対象。掲載データは当サイトの雑誌インデックスに基づく推定値で、
        毎日更新されます。
      </div>
    </div>
  );
}
