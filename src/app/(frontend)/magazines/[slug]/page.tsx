import type { Metadata } from "next";
import Link from "next/link";
import { getIssueDetail } from "@/lib/magazine-hub-db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function parseIssueId(slug: string): number | null {
  const m = slug.match(/^issue-(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = parseIssueId(slug);
  if (!id) return { title: "雑誌が見つかりません" };
  const issue = getIssueDetail(id);
  if (!issue) return { title: "雑誌が見つかりません" };
  const desc = `${issue.title} — ${issue.releaseDate}発売。登場モデル: ${issue.performers.map((p) => p.name).slice(0, 5).join("、")}`;
  return {
    title: `${issue.seriesName} ${issue.issue}`,
    description: desc,
    openGraph: {
      title: `${issue.seriesName} ${issue.issue} | MODEL HUB`,
      description: desc,
      url: `https://magazine.happyharem.com/magazines/${slug}`,
      ...(issue.coverImageUrl ? { images: [{ url: issue.coverImageUrl, alt: `${issue.seriesName} ${issue.issue}` }] } : {}),
    },
  };
}

export default async function MagazineDetailPage({ params }: Props) {
  const { slug } = await params;
  const id = parseIssueId(slug);
  if (!id) notFound();
  const issue = getIssueDetail(id);
  if (!issue) notFound();

  const quickFacts = [
    { label: "発売日", value: issue.releaseDate },
    { label: "登場モデル", value: `${issue.performers.length}名` },
  ];
  if (issue.issue) quickFacts.push({ label: "号数", value: issue.issue });

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ padding: "10px var(--pad)", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 6, alignItems: "center" }}>
        <Link href="/" style={{ color: "var(--ink-3)", textDecoration: "none" }}>ホーム</Link>
        <span>›</span>
        <Link href="/magazines" style={{ color: "var(--ink-3)", textDecoration: "none" }}>雑誌・写真集</Link>
        <span>›</span>
        <span style={{ color: "var(--ink-2)" }}>{issue.seriesName} {issue.issue}</span>
      </div>

      <div style={{ padding: "var(--row-gap) var(--pad)" }}>
        {/* Issue Hero */}
        <div className="issue-hero" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 36, marginBottom: "var(--row-gap)" }}>
          {/* Cover */}
          <div>
            <div style={{
              width: 320,
              aspectRatio: "3/4",
              borderRadius: 6,
              background: issue.coverImageUrl
                ? `url("${issue.coverImageUrl}") center / cover no-repeat, linear-gradient(160deg, ${issue.gradient.c1}, ${issue.gradient.c2})`
                : `linear-gradient(160deg, ${issue.gradient.c1}, ${issue.gradient.c2})`,
              boxShadow: "0 30px 60px rgba(80,50,40,.22)",
              position: "relative",
              overflow: "hidden",
              transform: "rotate(-1.5deg)",
            }}>
              {!issue.coverImageUrl && <>
                <div style={{ position: "absolute", top: 18, left: 18, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontWeight: 700, fontSize: 24, letterSpacing: "0.12em" }}>{issue.seriesName}</div>
                <div style={{ position: "absolute", bottom: 20, left: 18, right: 18, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.96)", fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{issue.title}</div>
              </>}
            </div>
          </div>

          {/* Meta */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ background: "var(--primary-2)", color: "var(--primary)", fontFamily: '"Noto Serif JP",serif', fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", padding: "3px 10px", borderRadius: 4 }}>
                {issue.badge === "new" ? "新刊" : issue.badge === "preorder" ? "予約受付中" : "バックナンバー"}
              </span>
            </div>
            <h1 style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 32, fontWeight: 600, letterSpacing: "0.06em", margin: "0 0 6px", color: "var(--ink)", lineHeight: 1.2 }}>
              {issue.seriesName}<br />{issue.issue}
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 16, fontFamily: '"Noto Serif JP",serif', lineHeight: 1.6 }}>{issue.title}</p>

            {/* Quick facts */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {quickFacts.map(({ label, value }) => (
                <div key={label} style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 6, padding: "6px 12px", fontSize: 11, color: "var(--ink-2)" }}>
                  <span style={{ color: "var(--ink-3)", marginRight: 6, fontFamily: '"Noto Serif JP",serif' }}>{label}</span>
                  <b style={{ color: "var(--ink)" }}>{value}</b>
                </div>
              ))}
            </div>

            {/* Purchase links */}
            {(() => {
              const q = encodeURIComponent(`${issue.seriesName} ${issue.issue}`);
              const amazonUrl = `https://www.amazon.co.jp/s?k=${q}&tag=magazinelab-22`;
              const rakutenUrl = issue.rakutenUrl ?? `https://search.books.rakuten.co.jp/bks/genesis/search/=?sitem=${q}&g=001&p=0&s=1&o=0&e=0&f=A`;
              return (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a href={amazonUrl} target="_blank" rel="nofollow sponsored noopener" className="btn btn-amazon" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.72a17.75 17.75 0 01-4.973.7c-3.57 0-6.795-.886-9.674-2.66-.163-.1-.245-.234-.18-.404l.14-.3zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>
                    Amazonで見る <span style={{ fontSize: 9, opacity: 0.7 }}>PR</span>
                  </a>
                  <a href={rakutenUrl} target="_blank" rel="nofollow sponsored noopener" className="btn btn-rakuten" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    楽天ブックス <span style={{ fontSize: 9, opacity: 0.7 }}>PR</span>
                  </a>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Featured models */}
        {issue.performers.length > 0 && (
          <div style={{ marginBottom: "var(--row-gap)" }}>
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">MODELS</div>
                <h2 className="sh-title">登場モデル</h2>
              </div>
              <div className="sh-rule" />
              <span style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{issue.performers.length}名</span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {issue.performers.map((model) => (
                <Link key={model.key} href={`/models/${model.slug}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px 8px 8px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: model.imageUrl ? `url("${model.imageUrl}") center / cover no-repeat, radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)` : `radial-gradient(at 30% 25%, ${model.gradient.c1} 0%, transparent 55%), linear-gradient(180deg, ${model.gradient.c3} 0%, ${model.gradient.c4} 100%)` }} />
                  <div style={{ fontFamily: '"Noto Serif JP",serif', fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{model.name}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Backnumbers */}
        {issue.backnumbers.length > 0 && (
          <div>
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">BACKNUMBERS</div>
                <h2 className="sh-title">バックナンバー</h2>
              </div>
              <div className="sh-rule" />
              <Link href={`/magazines?brand=${encodeURIComponent(issue.seriesName)}`} style={{ fontSize: 11, color: "var(--ink-3)", textDecoration: "none", whiteSpace: "nowrap" }}>
                {issue.seriesName}一覧 →
              </Link>
            </div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
              {issue.backnumbers.map((bn) => (
                <Link key={bn.slug} href={`/magazines/${bn.slug}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                  <div style={{
                    width: 100,
                    aspectRatio: "3/4",
                    borderRadius: 4,
                    background: `linear-gradient(160deg, ${bn.gradient.c1}, ${bn.gradient.c2})`,
                    border: "1px solid var(--line)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, fontFamily: '"Noto Serif JP",serif', color: "rgba(255,255,255,.9)", fontSize: 9, lineHeight: 1.3 }}>{bn.issue}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: '"Noto Serif JP",serif', marginTop: 4, textAlign: "center" }}>{bn.releaseDate.slice(0, 7)}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .issue-hero { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
      `}</style>
    </>
  );
}
