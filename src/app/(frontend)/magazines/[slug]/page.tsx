import type { Metadata } from "next";
import Link from "next/link";
import { LATEST_ISSUES, TOP10_MODELS } from "@/lib/mock-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mag = LATEST_ISSUES.find((m) => m.slug === slug) ?? LATEST_ISSUES[0];
  return {
    title: `${mag.seriesName} ${mag.issue}`,
    description: `${mag.title} — Amazon・楽天・FANZAの3社価格比較。`,
  };
}

const PRICES = [
  { partner: "amazon", name: "Amazon", price: 620, pointBonus: null, stock: "ok", shipping: "本日中に発送・翌日着 (Prime)", recommended: true, url: "#" },
  { partner: "rakuten", name: "楽天ブックス", price: 620, pointBonus: 6, stock: "ok", shipping: "通常1〜2日で発送", recommended: false, url: "#" },
  { partner: "fanza", name: "FANZA ブックス", price: 598, pointBonus: null, stock: "ok", shipping: "電子版のみ・即時配信", recommended: false, url: "#" },
];

const TOC = [
  { page: "P.001", tag: "巻頭", content: "朝比奈 結衣 ２０ページ独占グラビア", meta: "沖縄・宮古島ロケ" },
  { page: "P.022", tag: "特集", content: "夏のビキニ最前線 ５選", meta: "4名収録" },
  { page: "P.038", tag: "連載", content: "林 凛の「今月の一冊」", meta: "第6回" },
  { page: "P.044", tag: "中綴じ", content: "三浦 聖良 ８ページポスター", meta: "取り外し可" },
  { page: "P.056", tag: "特集", content: "グラビア新鋭 注目の6名", meta: "6名収録" },
  { page: "P.080", tag: "連載", content: "バックナンバー探訪", meta: "Luna Weekly 創刊特集号" },
  { page: "P.092", tag: "特集", content: "撮影監督インタビュー", meta: "今号の見どころ" },
  { page: "P.098", tag: "情報", content: "次号予告 · 定期購読案内", meta: "" },
];

export default async function MagazineDetailPage({ params }: Props) {
  const { slug } = await params;
  const mag = LATEST_ISSUES.find((m) => m.slug === slug) ?? LATEST_ISSUES[0];

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ padding: "10px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 6, alignItems: "center" }}>
        <Link href="/" style={{ color: "var(--ink-3)", textDecoration: "none" }}>ホーム</Link>
        <span>›</span>
        <Link href="/magazines" style={{ color: "var(--ink-3)", textDecoration: "none" }}>雑誌・写真集</Link>
        <span>›</span>
        <Link href="/magazines?type=weekly" style={{ color: "var(--ink-3)", textDecoration: "none" }}>週刊グラビア誌</Link>
        <span>›</span>
        <Link href="/magazines?series=luna-weekly" style={{ color: "var(--ink-3)", textDecoration: "none" }}>{mag.seriesName}</Link>
        <span>›</span>
        <span style={{ color: "var(--ink-2)" }}>{mag.issue}</span>
      </div>

      <div style={{ padding: "var(--row-gap) var(--pad)" }}>
        {/* Mag Hero */}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 36, marginBottom: "var(--row-gap)" }}>
          {/* Cover + gallery */}
          <div>
            <div style={{
              width: 360,
              aspectRatio: "3/4",
              borderRadius: 6,
              background: `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`,
              boxShadow: "0 30px 60px rgba(80,50,40,.22)",
              position: "relative",
              overflow: "hidden",
              transform: "rotate(-1.5deg)",
            }}>
              <div style={{ position: "absolute", top: 18, left: 18, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontWeight: 700, fontSize: 28, letterSpacing: "0.12em" }}>{mag.seriesName}</div>
              <div style={{ position: "absolute", bottom: 20, left: 18, right: 18, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontSize: 16, fontWeight: 600, letterSpacing: "0.08em", lineHeight: 1.4 }}>{mag.title}</div>
            </div>
            {/* Thumbnail gallery */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{
                  width: 78,
                  aspectRatio: "3/4",
                  borderRadius: 4,
                  background: `linear-gradient(160deg, ${mag.gradient.c1}${i * 22 + 80}%, ${mag.gradient.c2})`,
                  border: i === 0 ? "2px solid var(--primary)" : "2px solid transparent",
                  cursor: "pointer",
                }} />
              ))}
            </div>
          </div>

          {/* Meta + price comparison */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ background: "var(--primary-2)", color: "var(--primary)", fontFamily: '"Noto Serif JP",serif', fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", padding: "3px 10px", borderRadius: 4 }}>週刊</span>
              <span style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, color: "var(--plum)", fontWeight: 600 }}>{mag.publisher}</span>
            </div>
            <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 32, fontWeight: 600, letterSpacing: "0.06em", margin: "0 0 6px", color: "var(--ink)", lineHeight: 1.2 }}>{mag.seriesName}<br />{mag.issue}</h1>
            <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 16, fontFamily: '"Noto Serif JP",serif' }}>{mag.title}</p>

            {/* Quick facts */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {[
                { label: "発売日", value: mag.releaseDate },
                { label: "判型", value: "B5判 平とじ" },
                { label: "ページ数", value: "104P" },
                { label: "掲載モデル数", value: "8名" },
                { label: "電子版", value: "あり" },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 6, padding: "6px 12px", fontSize: 11, color: "var(--ink-2)" }}>
                  <span style={{ color: "var(--ink-3)", marginRight: 6, fontFamily: '"Noto Serif JP",serif' }}>{label}</span>
                  <b style={{ color: "var(--ink)" }}>{value}</b>
                </div>
              ))}
            </div>

            {/* Price comparison table */}
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>価格比較</span>
                <span style={{ fontSize: 10, color: "var(--ink-3)" }}>9分前に更新</span>
              </div>
              {PRICES.map((offer) => (
                <div key={offer.partner} style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr auto auto",
                  gap: 16,
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--line-2)",
                  alignItems: "center",
                  background: offer.recommended ? "rgba(108,91,140,.04)" : undefined,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: offer.partner === "amazon" ? "#ff9900" : offer.partner === "rakuten" ? "#bf0000" : "#f43c4d", display: "grid", placeItems: "center" }}>
                      <span style={{ color: "white", fontSize: 9, fontWeight: 700 }}>{offer.partner === "amazon" ? "a" : offer.partner === "rakuten" ? "R" : "F"}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{offer.name}</div>
                      <div style={{ fontSize: 10, color: offer.stock === "ok" ? "var(--leaf)" : "var(--amber)" }}>
                        {offer.stock === "ok" ? "● 在庫あり" : "△ 残り少ない"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>
                      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>￥</span>{offer.price.toLocaleString()}
                      {offer.pointBonus && <span style={{ fontSize: 10, color: "var(--leaf)", marginLeft: 6 }}>+{offer.pointBonus}pt</span>}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>{offer.shipping}</div>
                  </div>
                  <span style={{ fontSize: 9, color: "var(--pr)" }}>PR</span>
                  <a href={offer.url} className={`btn btn-${offer.partner}`} style={{ fontSize: 12, padding: "9px 16px" }}>
                    購入 <span className="pr-mini">PR</span>
                  </a>
                </div>
              ))}
              <div style={{ padding: "10px 18px", fontSize: 10, color: "var(--ink-3)", borderTop: "1px solid var(--line)" }}>
                本ページのリンクは広告を含みます — <span style={{ color: "var(--pr)" }}>PR</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost">♡ お気に入り</button>
              <button className="btn btn-ghost">🔖 あとで読む</button>
              <button className="btn btn-ghost">共有</button>
            </div>
          </div>
        </div>

        {/* Featured models */}
        <div style={{ marginBottom: "var(--row-gap)" }}>
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">MODELS</div>
              <h2 className="sh-title">登場モデル</h2>
            </div>
            <div className="sh-rule" />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {TOP10_MODELS.slice(0, 4).map((model) => (
              <Link key={model.slug} href={`/models/${model.slug}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px 8px 8px" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)` }} />
                <div>
                  <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{model.name}</div>
                  <div style={{ fontSize: 10, color: "var(--ink-3)" }}>P.00{model.rank * 3}〜 ({model.rank * 4}ページ)</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Table of contents */}
        <div style={{ marginBottom: "var(--row-gap)" }}>
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">TABLE OF CONTENTS</div>
              <h2 className="sh-title">目次</h2>
            </div>
            <div className="sh-rule" />
          </div>
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
            {TOC.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "60px auto 1fr auto", gap: 14, alignItems: "center", padding: "12px 18px", borderBottom: i < TOC.length - 1 ? "1px solid var(--line-2)" : undefined }}>
                <span style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 11, color: "var(--ink-3)" }}>{item.page}</span>
                <span style={{ background: "var(--primary-2)", color: "var(--primary)", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontFamily: '"Noto Serif JP",serif', fontWeight: 600, whiteSpace: "nowrap" }}>{item.tag}</span>
                <span style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, color: "var(--ink)" }}>{item.content}</span>
                <span style={{ fontSize: 10, color: "var(--ink-3)" }}>{item.meta}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Backnumber carousel */}
        <div>
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">BACKNUMBERS</div>
              <h2 className="sh-title">バックナンバー</h2>
            </div>
            <div className="sh-rule" />
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {[...Array(9)].map((_, i) => (
              <div key={i} style={{ flexShrink: 0 }}>
                <div style={{
                  width: 100,
                  aspectRatio: "3/4",
                  borderRadius: 4,
                  background: `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`,
                  border: i === 0 ? "2px solid var(--primary)" : "1px solid var(--line)",
                  cursor: "pointer",
                }} />
                <div style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: '"Noto Serif JP",serif', marginTop: 4, textAlign: "center" }}>No.{482 - i}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
