import type { Metadata } from "next";
import Link from "next/link";
import { getTopModels } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "モデルランキング",
  description: "表紙起用数・お気に入り数・ページ閲覧の3指標による月間グラビアモデルランキング。",
};

const PERIOD_TABS = [
  { key: "monthly", label: "今月のTOP", count: 30 },
  { key: "lastmonth", label: "先月", count: 30 },
  { key: "yearly", label: "年間", count: 30 },
  { key: "hof", label: "殿堂入り", count: 42 },
];


const HOF_MODELS = [
  { name: "鈴木 あや", yomi: "すずき あや", since: 2018, gradient: { c1: "#f5d8c8", c2: "#d4a8b2", c3: "#f1d9d2", c4: "#c49098" } },
  { name: "田中 ゆり", yomi: "たなか ゆり", since: 2019, gradient: { c1: "#bcc6d9", c2: "#5a6b8f", c3: "#8ea0c4", c4: "#4a5a7a" } },
  { name: "山田 花子", yomi: "やまだ はなこ", since: 2017, gradient: { c1: "#d9c8f0", c2: "#8a6bbc", c3: "#c8b2e8", c4: "#7a5aaa" } },
  { name: "佐藤 みく", yomi: "さとう みく", since: 2020, gradient: { c1: "#f0d4b8", c2: "#c88a5a", c3: "#e8c8a0", c4: "#b87a4a" } },
  { name: "伊藤 なな", yomi: "いとう なな", since: 2016, gradient: { c1: "#c8d8c8", c2: "#5a8f5a", c3: "#b8ceb8", c4: "#4a7a4a" } },
  { name: "中村 りこ", yomi: "なかむら りこ", since: 2021, gradient: { c1: "#f8d0d8", c2: "#c85a78", c3: "#f0b8c8", c4: "#b84a68" } },
];

export default function RankingPage() {
  const models = getTopModels(10);
  const top3 = models.slice(0, 3);
  const rest = models.slice(3, 10);

  return (
    <>
      {/* Page header */}
      <div style={{ background: "linear-gradient(120deg, var(--rose-3) 0%, var(--primary-2) 50%, var(--rose-2) 100%)", padding: "32px var(--pad) 28px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, letterSpacing: "0.32em", color: "var(--ink-3)", marginBottom: 6 }}>MONTHLY RANKING</div>
        <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 32, fontWeight: 600, letterSpacing: "0.1em", margin: 0, color: "var(--ink)" }}>モデルランキング</h1>
        <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>集計対象期間: 2026年5月1日〜5月26日 · 表紙起用・お気に入り数・ページ閲覧の3指標を加重合計</p>
      </div>

      {/* Period tabs */}
      <div style={{ padding: "0 var(--pad)", background: "var(--paper)", borderBottom: "1px solid var(--line)", display: "flex", gap: 2 }}>
        {PERIOD_TABS.map((tab) => (
          <Link key={tab.key} href={`/ranking?period=${tab.key}`} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "14px 18px",
            fontFamily: '"Noto Serif JP",serif',
            fontSize: 13, letterSpacing: "0.08em",
            color: tab.key === "monthly" ? "var(--primary)" : "var(--ink-2)",
            textDecoration: "none",
            borderBottom: tab.key === "monthly" ? "2px solid var(--primary)" : "2px solid transparent",
          }}>
            {tab.label}
            <span style={{ fontSize: 10, background: "var(--bg-2)", color: "var(--ink-3)", padding: "1px 6px", borderRadius: 999 }}>{tab.count}</span>
          </Link>
        ))}
      </div>

      <div style={{ padding: "var(--row-gap) var(--pad)" }}>
        {/* TOP3 Podium */}
        <div className="ranking-podium" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1fr", gap: "var(--gap)", marginBottom: "var(--row-gap)", alignItems: "end" }}>
          {/* 2nd */}
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,30,40,.04)" }}>
            <div style={{ aspectRatio: "3/4", background: `radial-gradient(at 30% 25%, ${top3[1].gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${top3[1].gradient.c3} 0%, ${top3[1].gradient.c4} 100%)`, position: "relative" }}>
              <div style={{ position: "absolute", top: 8, left: 10, fontFamily: '"Noto Serif JP",serif', fontSize: 56, fontWeight: 700, lineHeight: 1, background: "linear-gradient(180deg, #f4f0e8, #a89d8e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>2</div>
            </div>
            <div style={{ padding: "12px 16px 16px" }}>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 17, fontWeight: 600, letterSpacing: "0.06em", color: "var(--ink)", marginBottom: 2 }}>{top3[1].name}</div>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em", marginBottom: 10 }}>{top3[1].nameYomi}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, fontSize: 10, textAlign: "center", color: "var(--ink-3)" }}>
                <div><b style={{ display: "block", fontFamily: '"Noto Serif JP",serif', fontSize: 16, color: "var(--ink)" }}>{top3[1].stats.issues}</b>出演誌</div>
                <div><b style={{ display: "block", fontFamily: '"Noto Serif JP",serif', fontSize: 16, color: "var(--ink)" }}>{top3[1].stats.covers}</b>表紙</div>
              </div>
            </div>
          </div>

          {/* 1st - elevated */}
          <div style={{ background: "var(--paper)", border: "2px solid var(--rose-2)", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 24px rgba(80,50,40,.12)", transform: "translateY(-12px)" }}>
            <div style={{ background: "var(--hero-grad)", padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 9.5, letterSpacing: "0.32em", color: "var(--pr)" }}>★ MONTHLY TOP MODEL</span>
            </div>
            <div style={{ aspectRatio: "3/4", background: `radial-gradient(at 30% 25%, ${top3[0].gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${top3[0].gradient.c3} 0%, ${top3[0].gradient.c4} 100%)`, position: "relative" }}>
              <div style={{ position: "absolute", top: 8, left: 10, fontFamily: '"Noto Serif JP",serif', fontSize: 68, fontWeight: 700, lineHeight: 1, background: "linear-gradient(180deg, #f6e0a4, #c98a3a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>1</div>
            </div>
            <div style={{ padding: "12px 16px 16px" }}>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 20, fontWeight: 600, letterSpacing: "0.06em", color: "var(--ink)", marginBottom: 2 }}>{top3[0].name}</div>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em", marginBottom: 10 }}>{top3[0].nameYomi}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, fontSize: 10, textAlign: "center", color: "var(--ink-3)" }}>
                <div><b style={{ display: "block", fontFamily: '"Noto Serif JP",serif', fontSize: 18, color: "var(--ink)" }}>{top3[0].stats.issues}</b>出演誌</div>
                <div><b style={{ display: "block", fontFamily: '"Noto Serif JP",serif', fontSize: 18, color: "var(--ink)" }}>{top3[0].stats.covers}</b>表紙</div>
              </div>
            </div>
          </div>

          {/* 3rd */}
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,30,40,.04)" }}>
            <div style={{ aspectRatio: "3/4", background: `radial-gradient(at 30% 25%, ${top3[2].gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${top3[2].gradient.c3} 0%, ${top3[2].gradient.c4} 100%)`, position: "relative" }}>
              <div style={{ position: "absolute", top: 8, left: 10, fontFamily: '"Noto Serif JP",serif', fontSize: 56, fontWeight: 700, lineHeight: 1, background: "linear-gradient(180deg, #efd0bb, #a47868)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>3</div>
            </div>
            <div style={{ padding: "12px 16px 16px" }}>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 17, fontWeight: 600, letterSpacing: "0.06em", color: "var(--ink)", marginBottom: 2 }}>{top3[2].name}</div>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em", marginBottom: 10 }}>{top3[2].nameYomi}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, fontSize: 10, textAlign: "center", color: "var(--ink-3)" }}>
                <div><b style={{ display: "block", fontFamily: '"Noto Serif JP",serif', fontSize: 16, color: "var(--ink)" }}>{top3[2].stats.issues}</b>出演誌</div>
                <div><b style={{ display: "block", fontFamily: '"Noto Serif JP",serif', fontSize: 16, color: "var(--ink)" }}>{top3[2].stats.covers}</b>表紙</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ranks 4-10 */}
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", marginBottom: "var(--row-gap)" }}>
          {rest.map((model, i) => (
            <Link key={model.slug} href={`/models/${model.slug}`} className="ranking-rest" style={{
              textDecoration: "none",
              display: "grid",
              gridTemplateColumns: "50px 80px 1fr auto",
              gap: 16,
              alignItems: "center",
              padding: "14px 20px",
              borderBottom: i < rest.length - 1 ? "1px solid var(--line-2)" : undefined,
              color: "inherit",
            }}>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 28, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1 }}>{i + 4}</div>
              <div style={{ width: 80, aspectRatio: "1/1", borderRadius: 8, background: `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)` }} />
              <div>
                <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{model.name}</div>
                <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em" }}>{model.nameYomi}</div>
              </div>
              <div style={{ display: "flex", gap: 18, fontSize: 11, color: "var(--ink-3)" }}>
                <div style={{ textAlign: "center" }}><b style={{ display: "block", fontFamily: '"Noto Serif JP",serif', fontSize: 16, color: "var(--ink)" }}>{model.stats.issues}</b>出演</div>
                <div style={{ textAlign: "center" }}><b style={{ display: "block", fontFamily: '"Noto Serif JP",serif', fontSize: 16, color: "var(--ink)" }}>{model.stats.covers}</b>表紙</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Hall of Fame */}
        <div>
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">HALL OF FAME</div>
              <h2 className="sh-title">殿堂入り</h2>
            </div>
            <div className="sh-rule" />
            <Link href="/ranking?period=hof" className="sh-more">全42名を見る</Link>
          </div>
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "var(--card-pad)" }}>
            <p style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, color: "var(--ink-3)", marginBottom: 16, letterSpacing: "0.04em" }}>3ヶ月連続TOP10入りを達成したモデルが殿堂入りとなります。</p>
            <div className="hof-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
              {HOF_MODELS.map((model) => (
                <div key={model.name} style={{ textAlign: "center" }}>
                  <div style={{ position: "relative", marginBottom: 8, display: "inline-block" }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`, border: "2px solid var(--amber)" }} />
                    <div style={{ position: "absolute", top: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: "var(--amber)", display: "grid", placeItems: "center", fontSize: 12 }}>👑</div>
                  </div>
                  <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{model.name}</div>
                  <div style={{ fontSize: 9.5, color: "var(--ink-3)", fontFamily: '"Noto Serif JP",serif', marginTop: 2 }}>since {model.since}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .ranking-podium { grid-template-columns: 1fr !important; align-items: start !important; }
          .ranking-podium > div:nth-child(2) { transform: none !important; order: -1; }
          .ranking-rest { grid-template-columns: 50px 72px 1fr auto !important; gap: 10px !important; padding: 12px 14px !important; }
          .hof-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </>
  );
}
