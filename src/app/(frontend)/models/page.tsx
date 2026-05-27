import type { Metadata } from "next";
import Link from "next/link";
import { getTopModels, type MhModel } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "モデル一覧",
  description: "グラビアモデル・アイドルの一覧。五十音順・ジャンル別に探せます。",
};

const KANA_INDEX = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ", "A", "#"];

const FACETS = {
  genre: ["グラビア", "アイドル", "女優", "モデル", "タレント"],
  era: ["2020年代", "2010年代", "2000年代"],
  coverCount: ["表紙1回以上", "表紙5回以上", "表紙10回以上"],
  photobookCount: ["写真集あり", "写真集2冊以上", "写真集5冊以上"],
};

function PortraitCard({ model }: { model: MhModel }) {
  return (
    <Link href={`/models/${model.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform .12s, box-shadow .12s",
        boxShadow: "0 1px 2px rgba(60,30,40,.04)",
      }}>
        <div style={{
          aspectRatio: "3/4",
          background: `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), radial-gradient(at 70% 60%, ${model.gradient.c2} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`,
          position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "rgba(255,255,255,.5)", fontFamily: '"Noto Serif JP",serif', letterSpacing: "0.25em", fontSize: 9 }}>PORTRAIT</div>
        </div>
        <div style={{ padding: "10px 12px 12px" }}>
          <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", color: "var(--ink)", marginBottom: 2 }}>{model.name}</div>
          <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.12em", marginBottom: 6 }}>{model.nameYomi}</div>
          <div style={{ display: "flex", borderTop: "1px dashed var(--line)", paddingTop: 6, fontSize: 10, color: "var(--ink-3)" }}>
            <span>出演 <b style={{ color: "var(--plum)", fontFamily: '"Noto Serif JP",serif' }}>{model.stats.issues}</b></span>
            <span style={{ marginLeft: 8 }}>表紙 <b style={{ color: "var(--plum)", fontFamily: '"Noto Serif JP",serif' }}>{model.stats.covers}</b></span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ModelsPage() {
  const models = getTopModels(100);
  const total = models.length;

  // Split into groups of 8 for display
  const chunks: MhModel[][] = [];
  for (let i = 0; i < models.length; i += 8) {
    chunks.push(models.slice(i, i + 8));
  }

  return (
    <>
      {/* Page header */}
      <div style={{
        background: "linear-gradient(120deg, var(--rose-3) 0%, var(--primary-2) 100%)",
        padding: "32px var(--pad) 28px",
        borderBottom: "1px solid var(--line)",
      }}>
        <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, letterSpacing: "0.32em", color: "var(--ink-3)", marginBottom: 6 }}>MODELS</div>
        <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 32, fontWeight: 600, letterSpacing: "0.1em", margin: 0, color: "var(--ink)" }}>モデル一覧</h1>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6, letterSpacing: "0.04em" }}>全{total}名のグラビアモデル・アイドルをアーカイブ</p>
      </div>

      {/* Toolbar */}
      <div style={{ padding: "14px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>全{total}名</span>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {["人気順", "表紙数", "出演数"].map((s, i) => (
            <button key={s} style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: i === 0 ? "var(--primary)" : "white",
              color: i === 0 ? "white" : "var(--ink-2)",
              cursor: "pointer",
              fontFamily: '"Noto Serif JP",serif',
              letterSpacing: "0.08em",
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Kana index */}
      <div style={{ padding: "10px var(--pad)", background: "var(--paper)", borderBottom: "1px solid var(--line)", display: "flex", gap: 4, flexWrap: "wrap" }}>
        {KANA_INDEX.map((k) => (
          <button key={k} style={{
            width: 36, height: 36,
            borderRadius: 6,
            border: "1px solid var(--line)",
            background: "white",
            color: "var(--ink-2)",
            fontFamily: '"Noto Serif JP",serif',
            fontSize: 13,
            cursor: "pointer",
          }}>{k}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "var(--gap)", padding: "var(--row-gap) var(--pad)", alignItems: "start" }}>
        {/* Left: model groups */}
        <div>
          {chunks.map((chunk, idx) => (
            <div key={idx} style={{ marginBottom: "var(--row-gap)" }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--line), transparent)", marginBottom: 16 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap)" }}>
                {chunk.map((m) => <PortraitCard key={m.slug} model={m} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Right: facets */}
        <aside style={{ position: "sticky", top: 80 }}>
          {Object.entries(FACETS).map(([key, values]) => (
            <div key={key} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", color: "var(--ink-3)", marginBottom: 10 }}>
                {key === "genre" ? "ジャンル" : key === "era" ? "活動年代" : key === "coverCount" ? "表紙起用" : "写真集刊行"}
              </div>
              {values.map((v) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-2)", cursor: "pointer", marginBottom: 6 }}>
                  <input type="checkbox" style={{ accentColor: "var(--primary)" }} />
                  {v}
                </label>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
