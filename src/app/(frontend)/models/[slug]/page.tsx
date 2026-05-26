import type { Metadata } from "next";
import Link from "next/link";
import { TOP10_MODELS, LATEST_ISSUES, EDITOR_PICKS } from "@/lib/mock-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const model = TOP10_MODELS.find((m) => m.slug === slug) ?? TOP10_MODELS[0];
  return {
    title: `${model.name} — モデル詳細`,
    description: `${model.name}（${model.nameYomi}）のグラビア出演情報・写真集一覧。`,
  };
}

export default async function ModelDetailPage({ params }: Props) {
  const { slug } = await params;
  const model = TOP10_MODELS.find((m) => m.slug === slug) ?? TOP10_MODELS[0];

  const profileItems = [
    { label: "生年月日", value: "1999/08/15" },
    { label: "出身地", value: "東京都" },
    { label: "身長", value: "163cm" },
    { label: "BWH", value: "B85 W59 H86" },
    { label: "血液型", value: "A型" },
    { label: "趣味", value: "水泳・ヨガ" },
    { label: "所属", value: "サンシャイン プロダクション" },
    { label: "デビュー", value: "2021/06 Luna Weekly No.382" },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ padding: "10px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 6, alignItems: "center" }}>
        <Link href="/" style={{ color: "var(--ink-3)", textDecoration: "none" }}>ホーム</Link>
        <span>›</span>
        <Link href="/models" style={{ color: "var(--ink-3)", textDecoration: "none" }}>モデル</Link>
        <span>›</span>
        <span style={{ color: "var(--ink-2)" }}>{model.name}</span>
      </div>

      <div style={{ padding: "var(--row-gap) var(--pad)" }}>
        {/* Model Hero */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 32, marginBottom: "var(--row-gap)" }}>
          {/* Portrait */}
          <div>
            <div style={{
              aspectRatio: "3/4",
              borderRadius: 14,
              background: `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), radial-gradient(at 70% 60%, ${model.gradient.c2} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)`,
              boxShadow: "0 30px 60px rgba(120,60,80,.22)",
              display: "grid",
              placeItems: "center",
              color: "rgba(255,255,255,.55)",
              fontFamily: '"Noto Serif JP",serif',
              letterSpacing: "0.3em",
              fontSize: 14,
            }}>PORTRAIT</div>
          </div>

          {/* Profile */}
          <div>
            <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 10, letterSpacing: "0.32em", color: "var(--ink-3)", marginBottom: 4 }}>MODEL PROFILE</div>
            <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 42, fontWeight: 600, letterSpacing: "0.14em", color: "var(--ink)", lineHeight: 1.05, margin: "0 0 4px" }}>{model.name}</h1>
            <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 14, color: "var(--ink-2)", letterSpacing: "0.25em", marginBottom: 16 }}>{model.nameYomi}</div>

            <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
              {model.tags.map((t) => <span key={t} className="tag">{t}</span>)}
            </div>

            <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.85, letterSpacing: "0.04em", maxWidth: 420, marginBottom: 22 }}>
              デビュー以来、その透明感ある容姿と自然体の表情で多くのファンを魅了し続けている。週刊誌から月刊誌まで幅広く活躍し、初写真集は発売初週にランキング1位を獲得。
            </p>

            {/* Profile grid */}
            <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr auto 1fr", gap: "8px 20px", fontSize: 12, marginBottom: 22 }}>
              {profileItems.map(({ label, value }) => (
                <>
                  <dt key={`dt-${label}`} style={{ color: "var(--ink-3)", letterSpacing: "0.08em", fontFamily: '"Noto Serif JP",serif', whiteSpace: "nowrap" }}>{label}</dt>
                  <dd key={`dd-${label}`} style={{ color: "var(--ink)", margin: 0 }}>{value}</dd>
                </>
              ))}
            </dl>

            {/* Stats */}
            <div style={{ display: "flex", gap: 26, padding: "16px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
              {[
                { n: model.stats.issues, l: "出演誌" },
                { n: model.stats.photobooks, l: "写真集" },
                { n: model.stats.covers, l: "表紙回数" },
                { n: model.rank ?? "-", l: "今月ランキング" },
                { n: 1248, l: "お気に入り" },
              ].map(({ n, l }) => (
                <div key={l}>
                  <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 24, fontWeight: 600, color: "var(--ink)" }}>{n}</div>
                  <div style={{ fontSize: 9.5, letterSpacing: "0.25em", color: "var(--ink-3)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary">お気に入りに追加</button>
              <button className="btn btn-ghost">新刊通知を設定</button>
            </div>
          </div>
        </div>

        {/* Recent appearances */}
        <div style={{ marginBottom: "var(--row-gap)" }}>
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">APPEARANCES</div>
              <h2 className="sh-title">最近の出演誌</h2>
            </div>
            <div className="sh-rule" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "var(--gap)" }}>
            {LATEST_ISSUES.map((mag) => (
              <Link key={mag.slug} href={`/magazines/${mag.slug}`} style={{ textDecoration: "none" }}>
                <div style={{
                  aspectRatio: "3/4",
                  borderRadius: 5,
                  background: `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})`,
                  position: "relative",
                  overflow: "hidden",
                  marginBottom: 9,
                  boxShadow: "0 10px 24px rgba(80,50,40,.12)",
                }}>
                  <div style={{ position: "absolute", top: 14, left: 14, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em" }}>{mag.seriesName}</div>
                  <div style={{ position: "absolute", bottom: 12, left: 10, right: 10, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{mag.issue}</div>
                </div>
                <div style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: '"Noto Serif JP",serif', marginBottom: 2 }}>{mag.releaseDate}</div>
                <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{mag.seriesName}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular photobooks */}
        <div style={{ marginBottom: "var(--row-gap)" }}>
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">PHOTOBOOKS</div>
              <h2 className="sh-title">人気写真集</h2>
            </div>
            <div className="sh-rule" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "var(--gap)" }}>
            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", display: "grid", gridTemplateColumns: "1.05fr 1fr" }}>
              <div style={{ background: "var(--hero-grad)", display: "grid", placeItems: "center", padding: "26px 14px" }}>
                <div style={{ width: 220, aspectRatio: "3/4", borderRadius: 5, background: `linear-gradient(160deg, ${model.gradient.c1}, ${model.gradient.c2})`, transform: "rotate(-3deg)", boxShadow: "0 22px 44px rgba(80,50,40,.20)" }} />
              </div>
              <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 9.5, letterSpacing: "0.32em", color: "var(--pr)", marginBottom: 8 }}>★ BEST PHOTOBOOK</div>
                <h3 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 20, fontWeight: 600, letterSpacing: "0.06em", margin: "0 0 8px", color: "var(--ink)" }}>{model.name}<br />ファースト写真集</h3>
                <p style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 12.5, lineHeight: 1.85, color: "var(--ink-2)", borderLeft: "2px solid var(--rose-2)", paddingLeft: 10, margin: "0 0 14px" }}>デビュー作にして代表作。発売初週ランキング1位を獲得した話題の一冊。</p>
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <a href="#" className="btn btn-amazon" style={{ fontSize: 12, padding: "9px 14px" }}>Amazon <span className="pr-mini">PR</span></a>
                  <a href="#" className="btn btn-rakuten" style={{ fontSize: 12, padding: "9px 14px" }}>楽天 <span className="pr-mini">PR</span></a>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
              {EDITOR_PICKS.slice(1, 4).map((book, i) => (
                <Link key={book.slug} href={`/magazines/${book.slug}`} style={{ textDecoration: "none", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "var(--card-pad)", display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, alignItems: "center", flex: 1 }}>
                  <div style={{ aspectRatio: "3/4", borderRadius: 4, background: `linear-gradient(160deg, ${book.gradient.c1}, ${book.gradient.c2})` }} />
                  <div>
                    <div style={{ fontSize: 9, color: "var(--pr)", letterSpacing: "0.2em", fontFamily: '"Noto Serif JP",serif', marginBottom: 4 }}>0{i + 2}</div>
                    <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{book.title}</div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontFamily: '"Noto Serif JP",serif' }}>￥{book.price.toLocaleString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Appearance timeline */}
        <div>
          <div className="section-head">
            <div>
              <div className="sh-eyebrow">TIMELINE</div>
              <h2 className="sh-title">出演履歴</h2>
            </div>
            <div className="sh-rule" />
            <Link href="#" className="sh-more">全248件を見る</Link>
          </div>
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
            {LATEST_ISSUES.map((mag, i) => (
              <div key={mag.slug} style={{ display: "grid", gridTemplateColumns: "100px 56px 1fr auto", gap: 16, alignItems: "center", padding: "12px 16px", borderBottom: i < LATEST_ISSUES.length - 1 ? "1px solid var(--line-2)" : undefined }}>
                <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 11, color: "var(--ink-3)" }}>{mag.releaseDate}</div>
                <div style={{ width: 56, aspectRatio: "3/4", borderRadius: 3, background: `linear-gradient(160deg, ${mag.gradient.c1}, ${mag.gradient.c2})` }} />
                <div>
                  <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{mag.seriesName} {mag.issue}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{mag.title}</div>
                </div>
                <a href="#" className="btn btn-primary" style={{ fontSize: 11, padding: "6px 12px" }}>Amazon <span className="pr-mini">PR</span></a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
