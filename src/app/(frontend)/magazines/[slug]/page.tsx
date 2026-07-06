import type { Metadata } from "next";
import Link from "next/link";
import {
  getAdjacentCards,
  getCardPerformers,
  getIssueDetail,
  getMagazineCardDetail,
  type MhIssueDetail,
  type MhMagazine,
} from "@/lib/magazine-hub-db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

type MagazineRef = { kind: "issue" | "card"; id: number };

function parseMagazineRef(slug: string): MagazineRef | null {
  const issue = slug.match(/^issue-(\d+)$/);
  if (issue) return { kind: "issue", id: parseInt(issue[1], 10) };
  const card = slug.match(/^card-(\d+)$/);
  if (card) return { kind: "card", id: parseInt(card[1], 10) };
  return null;
}

function getMagazineDetail(ref: MagazineRef) {
  return ref.kind === "card" ? getMagazineCardDetail(ref.id) : getIssueDetail(ref.id);
}

function purchaseQuery(issue: MhIssueDetail): string {
  return encodeURIComponent(`${issue.seriesName} ${issue.issue} ${issue.title}`.trim());
}

function amazonHref(issue: MhIssueDetail): string {
  return issue.amazonUrl ?? `https://www.amazon.co.jp/s?k=${purchaseQuery(issue)}&tag=magazinelab-22`;
}

function rakutenHref(issue: MhIssueDetail): string {
  return issue.rakutenUrl ?? `https://search.books.rakuten.co.jp/bks/genesis/search/?g=001&sitem=${purchaseQuery(issue)}`;
}

function badgeLabel(badge: MhIssueDetail["badge"]): string {
  if (badge === "new") return "新刊";
  if (badge === "preorder") return "予約受付中";
  if (badge === "reissue") return "再販";
  return "バックナンバー";
}

function AdjacentLink({ label, item }: { label: string; item: MhMagazine }) {
  return (
    <Link href={`/magazines/${item.slug}`} className="mag-adjacent-link">
      <span>{label}</span>
      <strong>{item.seriesName}</strong>
      <time>{item.releaseDate}</time>
    </Link>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ref = parseMagazineRef(slug);
  if (!ref) return { title: "雑誌が見つかりません" };
  const issue = getMagazineDetail(ref);
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
  const ref = parseMagazineRef(slug);
  if (!ref) notFound();
  const issue = getMagazineDetail(ref);
  if (!issue) notFound();

  const cardPerformers = ref.kind === "card" ? getCardPerformers(ref.id) : [];
  const performers = ref.kind === "card"
    ? cardPerformers
    : issue.performers.map((performer) => ({ key: performer.key, name: performer.name }));
  const adjacent = ref.kind === "card" ? getAdjacentCards(ref.id) : {};
  const performerCount = performers.length || issue.performers.length;
  const quickFacts = [
    { label: "発売日", value: issue.releaseDate },
    { label: "登場モデル", value: `${performerCount}名` },
  ];
  if (issue.issue) quickFacts.push({ label: "号数", value: issue.issue });
  if (issue.directLinkCount) quickFacts.push({ label: "購入先", value: `${issue.directLinkCount}件` });

  return (
    <>
      <div className="mag-detail-breadcrumb">
        <Link href="/">ホーム</Link>
        <span>/</span>
        <Link href="/magazines">雑誌・写真集</Link>
        <span>/</span>
        <span>{issue.seriesName} {issue.issue}</span>
      </div>

      <main className="mag-detail-page">
        <section className="mag-hero">
          <div className="mag-cover-wrap">
            <div
              className="mag-cover"
              style={{
                background: issue.coverImageUrl
                  ? `url("${issue.coverImageUrl}") center / cover no-repeat, linear-gradient(160deg, ${issue.gradient.c1}, ${issue.gradient.c2})`
                  : `linear-gradient(160deg, ${issue.gradient.c1}, ${issue.gradient.c2})`,
              }}
            >
              {!issue.coverImageUrl && (
                <>
                  <strong>{issue.seriesName}</strong>
                  <span>{issue.title}</span>
                </>
              )}
            </div>
          </div>

          <div className="mag-meta">
            <span className="mag-badge">{badgeLabel(issue.badge)}</span>
            <h1>{issue.seriesName}<br />{issue.issue}</h1>
            <p>{issue.title}</p>

            <div className="mag-facts">
              {quickFacts.map(({ label, value }) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            {issue.sourceUrl && (
              <a href={issue.sourceUrl} target="_blank" rel="noopener" className="btn btn-ghost mag-source-link">
                記事を見る
              </a>
            )}
          </div>

          <aside className="mag-buy-card" aria-label="購入リンク">
            <div>
              <span>PR</span>
              <h2>このアイテムを買う</h2>
            </div>
            <a href={amazonHref(issue)} target="_blank" rel="nofollow sponsored noopener" className="btn btn-amazon">
              {issue.amazonUrl ? "Amazon商品ページ" : "Amazonで見る"} <span className="pr-mini">PR</span>
            </a>
            <a href={rakutenHref(issue)} target="_blank" rel="nofollow sponsored noopener" className="btn btn-rakuten">
              {issue.rakutenUrl ? "楽天商品ページ" : "楽天ブックス"} <span className="pr-mini">PR</span>
            </a>
            <p>価格・在庫はリンク先で確認してください。</p>
          </aside>
        </section>

        {performerCount > 0 && (
          <section className="mag-detail-section">
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">MODELS</div>
                <h2 className="sh-title">登場モデル</h2>
              </div>
              <div className="sh-rule" />
              <span className="mag-section-count">{performerCount}名</span>
            </div>
            <div className="mag-performer-chips">
              {(performers.length > 0 ? performers : issue.performers).map((performer) => {
                const key = "key" in performer ? performer.key : undefined;
                const chip = <span>{performer.name}</span>;
                return key ? (
                  <Link key={`${key}-${performer.name}`} href={`/models/${encodeURIComponent(key)}`} className="mag-performer-chip">
                    {chip}
                  </Link>
                ) : (
                  <span key={performer.name} className="mag-performer-chip plain">
                    {chip}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {issue.backnumbers.length > 0 && (
          <section className="mag-detail-section">
            <div className="section-head">
              <div>
                <div className="sh-eyebrow">BACKNUMBERS</div>
                <h2 className="sh-title">バックナンバー</h2>
              </div>
              <div className="sh-rule" />
              <Link href={`/magazines?brand=${encodeURIComponent(issue.seriesName)}`} className="sh-more">
                {issue.seriesName}一覧
              </Link>
            </div>
            <div className="mag-backnumber-rail">
              {issue.backnumbers.map((bn) => (
                <Link key={bn.slug} href={`/magazines/${bn.slug}`} className="mag-backnumber-card">
                  <span
                    style={{
                      background: bn.coverImageUrl
                        ? `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,.72) 100%), url("${bn.coverImageUrl}") center top / cover no-repeat`
                        : `linear-gradient(160deg, ${bn.gradient.c1}, ${bn.gradient.c2})`,
                    }}
                  >
                    <em>{bn.issue}</em>
                  </span>
                  <time>{bn.releaseDate}</time>
                </Link>
              ))}
            </div>
          </section>
        )}

        {(adjacent.prev || adjacent.next) && (
          <nav className="mag-adjacent" aria-label="前後の号">
            {adjacent.prev ? <AdjacentLink label="← 前の号" item={adjacent.prev} /> : <span />}
            {adjacent.next ? <AdjacentLink label="次の号 →" item={adjacent.next} /> : <span />}
          </nav>
        )}
      </main>

      <style>{`
        .mag-detail-breadcrumb {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 10px var(--pad);
          border-bottom: 1px solid var(--line);
          background: var(--paper-2);
          color: var(--ink-3);
          font-size: 11px;
        }
        .mag-detail-breadcrumb a {
          color: var(--ink-3);
          text-decoration: none;
        }
        .mag-detail-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--row-gap) var(--pad);
        }
        .mag-hero {
          display: grid;
          grid-template-columns: minmax(240px, 320px) minmax(0, 1fr) minmax(240px, 290px);
          gap: clamp(18px, 3vw, 34px);
          align-items: start;
          margin-bottom: calc(var(--row-gap) * 1.25);
        }
        .mag-cover-wrap {
          padding: 10px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--paper);
          box-shadow: 0 24px 58px rgba(0,0,0,.3);
        }
        .mag-cover {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 100%;
          aspect-ratio: 3 / 4;
          border-radius: 6px;
          overflow: hidden;
          padding: 18px;
          color: rgba(255,255,255,.94);
        }
        .mag-cover strong,
        .mag-cover span {
          font-family: "Noto Serif JP", serif;
          font-weight: 900;
          line-height: 1.35;
          text-shadow: 0 2px 14px rgba(0,0,0,.32);
        }
        .mag-cover strong {
          font-size: 24px;
        }
        .mag-cover span {
          font-size: 14px;
        }
        .mag-meta {
          min-width: 0;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--paper);
          padding: clamp(18px, 3vw, 28px);
        }
        .mag-badge {
          display: inline-flex;
          margin-bottom: 14px;
          border: 1px solid rgba(232,84,111,.28);
          border-radius: 999px;
          background: var(--primary-2);
          color: var(--primary);
          font-family: "Noto Serif JP", serif;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .16em;
          line-height: 1;
          padding: 7px 10px;
        }
        .mag-meta h1 {
          margin: 0;
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: clamp(30px, 4.8vw, 48px);
          font-weight: 900;
          letter-spacing: 0;
          line-height: 1.18;
        }
        .mag-meta p {
          margin: 14px 0 20px;
          color: var(--ink-2);
          font-family: "Noto Serif JP", serif;
          font-size: 14px;
          line-height: 1.8;
        }
        .mag-facts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .mag-facts div {
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--bg-2);
          padding: 10px 12px;
        }
        .mag-facts span {
          display: block;
          color: var(--ink-3);
          font-size: 10px;
          margin-bottom: 4px;
        }
        .mag-facts strong {
          display: block;
          color: var(--ink);
          font-size: 13px;
          line-height: 1.35;
        }
        .mag-source-link {
          margin-top: 18px;
        }
        .mag-buy-card {
          display: grid;
          gap: 10px;
          border: 1px solid rgba(245,184,61,.32);
          border-radius: 8px;
          background: linear-gradient(180deg, rgba(245,184,61,.10), var(--paper) 42%);
          padding: 18px;
          box-shadow: 0 18px 48px rgba(0,0,0,.24);
        }
        .mag-buy-card div span {
          display: inline-flex;
          margin-bottom: 8px;
          border-radius: 3px;
          background: rgba(245,184,61,.14);
          color: var(--accent);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .14em;
          padding: 2px 6px;
        }
        .mag-buy-card h2 {
          margin: 0;
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.25;
        }
        .mag-buy-card .btn {
          justify-content: center;
          width: 100%;
        }
        .mag-buy-card p {
          margin: 4px 0 0;
          color: var(--ink-3);
          font-size: 11px;
          line-height: 1.55;
        }
        .mag-detail-section {
          margin-top: var(--row-gap);
        }
        .mag-section-count {
          flex-shrink: 0;
          color: var(--ink-3);
          font-size: 11px;
        }
        .mag-performer-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .mag-performer-chip {
          display: inline-flex;
          min-height: 36px;
          align-items: center;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: var(--paper);
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
          padding: 8px 14px;
        }
        .mag-performer-chip.plain {
          color: var(--ink-2);
        }
        .mag-backnumber-rail {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .mag-backnumber-card {
          flex: 0 0 112px;
          color: inherit;
          text-align: center;
          text-decoration: none;
        }
        .mag-backnumber-card span {
          position: relative;
          display: block;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 8px;
          box-shadow: 0 10px 28px rgba(0,0,0,.20);
        }
        .mag-backnumber-card em {
          position: absolute;
          inset: auto 8px 8px;
          color: rgba(255,255,255,.9);
          font-family: "Noto Serif JP", serif;
          font-size: 10px;
          font-style: normal;
          font-weight: 900;
          line-height: 1.35;
          text-shadow: 0 2px 8px rgba(0,0,0,.38);
        }
        .mag-backnumber-card time {
          display: block;
          margin-top: 6px;
          color: var(--ink-3);
          font-size: 10px;
        }
        .mag-adjacent {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--gap);
          margin-top: calc(var(--row-gap) * 1.2);
        }
        .mag-adjacent-link {
          display: block;
          min-height: 92px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--paper);
          color: var(--ink);
          text-decoration: none;
          padding: 16px;
        }
        .mag-adjacent-link span {
          display: block;
          color: var(--accent);
          font-family: "Noto Serif JP", serif;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 8px;
        }
        .mag-adjacent-link strong {
          display: block;
          overflow: hidden;
          color: var(--ink);
          font-family: "Noto Serif JP", serif;
          font-size: 16px;
          font-weight: 900;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .mag-adjacent-link time {
          display: block;
          margin-top: 4px;
          color: var(--ink-3);
          font-size: 11px;
        }
        @media (max-width: 980px) {
          .mag-hero {
            grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
          }
          .mag-buy-card {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 700px) {
          .mag-detail-page {
            padding-left: 12px;
            padding-right: 12px;
          }
          .mag-hero {
            grid-template-columns: 1fr;
          }
          .mag-cover-wrap {
            max-width: 340px;
          }
          .mag-facts,
          .mag-adjacent {
            grid-template-columns: 1fr;
          }
          .mag-adjacent > span {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
