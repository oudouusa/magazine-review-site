import type { Metadata } from "next";
import { getTopModels } from "@/lib/magazine-hub-db";
import { ModelsClient } from "./ModelsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "モデル一覧",
  description: "グラビアモデル・アイドルの一覧。五十音順・ジャンル別に探せます。",
};

export default function ModelsPage() {
  const models = getTopModels(200);

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
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6, letterSpacing: "0.04em" }}>全{models.length}名のグラビアモデル・アイドルをアーカイブ</p>
      </div>

      <ModelsClient models={models} />
    </>
  );
}
