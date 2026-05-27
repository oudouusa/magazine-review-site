"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { MhModel } from "@/lib/magazine-hub-db";

const KANA_INDEX = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ", "A", "#"];

const KANA_RANGES: Record<string, RegExp> = {
  あ: /^[あ-おア-オ]/,
  か: /^[か-こカ-コが-ごガ-ゴ]/,
  さ: /^[さ-そサ-ソざ-ぞザ-ゾ]/,
  た: /^[た-とタ-トだ-どダ-ド]/,
  な: /^[な-のナ-ノ]/,
  は: /^[は-ほハ-ホば-ぼバ-ボぱ-ぽパ-ポ]/,
  ま: /^[ま-もマ-モ]/,
  や: /^[や-よヤ-ヨ]/,
  ら: /^[ら-ろラ-ロ]/,
  わ: /^[わ-んワ-ン]/,
  A: /^[A-Za-z]/,
};

function matchesKana(nameYomi: string, kana: string): boolean {
  if (kana === "#") return !/^[あ-んア-ンA-Za-z]/.test(nameYomi);
  return KANA_RANGES[kana]?.test(nameYomi) ?? false;
}

function PortraitCard({ model }: { model: MhModel }) {
  return (
    <Link href={`/models/${model.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
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

type SortKey = "popular" | "covers" | "issues";

type Props = { models: MhModel[] };

export function ModelsClient({ models }: Props) {
  const [sort, setSort] = useState<SortKey>("popular");
  const [kana, setKana] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = kana
      ? models.filter((m) => matchesKana(m.nameYomi, kana))
      : models;

    if (sort === "covers") {
      list = [...list].sort((a, b) => b.stats.covers - a.stats.covers);
    } else if (sort === "issues") {
      list = [...list].sort((a, b) => b.stats.issues - a.stats.issues);
    }
    return list;
  }, [models, sort, kana]);

  const SORT_OPTS: Array<{ key: SortKey; label: string }> = [
    { key: "popular", label: "人気順" },
    { key: "covers", label: "表紙数" },
    { key: "issues", label: "出演数" },
  ];

  return (
    <>
      {/* Toolbar */}
      <div style={{ padding: "14px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {filtered.length !== models.length ? `${filtered.length}名表示 / 全${models.length}名` : `全${models.length}名`}
        </span>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {SORT_OPTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              style={{
                fontSize: 11,
                padding: "4px 12px",
                borderRadius: 999,
                border: "1px solid var(--line)",
                background: sort === key ? "var(--primary)" : "white",
                color: sort === key ? "white" : "var(--ink-2)",
                cursor: "pointer",
                fontFamily: '"Noto Serif JP",serif',
                letterSpacing: "0.08em",
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Kana index */}
      <div style={{ padding: "10px var(--pad)", background: "var(--paper)", borderBottom: "1px solid var(--line)", display: "flex", gap: 4, flexWrap: "wrap" }}>
        {KANA_INDEX.map((k) => (
          <button
            key={k}
            onClick={() => setKana(kana === k ? null : k)}
            style={{
              width: 36, height: 36,
              borderRadius: 6,
              border: "1px solid var(--line)",
              background: kana === k ? "var(--primary)" : "white",
              color: kana === k ? "white" : "var(--ink-2)",
              fontFamily: '"Noto Serif JP",serif',
              fontSize: 13,
              cursor: "pointer",
            }}
          >{k}</button>
        ))}
        {kana && (
          <button
            onClick={() => setKana(null)}
            style={{ height: 36, padding: "0 12px", borderRadius: 6, border: "1px solid var(--line)", background: "white", color: "var(--plum)", fontFamily: '"Noto Serif JP",serif', fontSize: 12, cursor: "pointer" }}
          >
            解除
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", padding: "var(--row-gap) var(--pad)", alignItems: "start" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)", fontFamily: '"Noto Serif JP",serif', fontSize: 13 }}>
            この行のモデルはいません
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap)" }}>
            {filtered.map((m) => <PortraitCard key={m.slug} model={m} />)}
          </div>
        )}
      </div>
    </>
  );
}
