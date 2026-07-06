import "server-only";
import {
  getMhDb,
  colorFromHash,
  normalizeRetailUrl,
  resolveCardCoverImageUrl,
  getPerformerIconUrls,
  visibleImageBrandSql,
  cleanCardFeatureTitle,
  mapMagazineCardRow,
  type MagazineCardRow,
  type MhMagazine,
} from "./magazine-hub-db";

// ---------------------------------------------------------------------------
// Fable renewal data layer: trends, calendar, co-stars, birthdays, cover wall.
// Read-only aggregate queries over the mounted magazine-hub DB.
// ---------------------------------------------------------------------------

// Keys in performer tables that are section labels, not people.
const JUNK_KEY =
  /(追加|付録|特典|袋とじ|未公開|アザー|オフショ|グラビア|写真集|カレンダー|総集編|合本|セット付|ほか|その他|一覧|まとめ|読者|プレゼント)/;

function isPersonKey(key: string | null | undefined): key is string {
  return !!key && key.length >= 2 && !JUNK_KEY.test(key);
}

// --- tiny TTL cache -------------------------------------------------------

const cache = new Map<string, { at: number; val: unknown }>();

function cached<T>(key: string, ttlMs: number, compute: () => T): T {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.val as T;
  const val = compute();
  if (cache.size > 800) {
    // Keyed by page/model params, so sweep expired entries before growing.
    const cutoff = Date.now() - HOUR6;
    for (const [k, v] of cache) {
      if (v.at < cutoff) cache.delete(k);
    }
  }
  cache.set(key, { at: Date.now(), val });
  return val;
}

const MIN30 = 30 * 60_000;
const HOUR6 = 6 * 3600_000;

// --- JST date helpers -----------------------------------------------------

export function jstToday(): { y: number; m: number; d: number; iso: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = parts.split("-").map(Number);
  return { y, m, d, iso: parts };
}

function isoDaysAgo(days: number): string {
  const t = new Date(Date.now() - days * 86400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(t);
}

// --- shared SQL fragments (same shape as getIdolzMagazines rows) ----------

const CARD_ROW_SELECT = `
  SELECT mc.id, mc.title, mc.brand, mc.issue_no, mc.date, mc.url,
    (SELECT c.cover_url FROM magazine_card_covers c
     WHERE c.card_id = mc.id ORDER BY c.position ASC LIMIT 1) AS coverUrl,
    (SELECT c.local_path FROM magazine_card_covers c
     WHERE c.card_id = mc.id AND c.local_path IS NOT NULL ORDER BY c.position ASC LIMIT 1) AS coverLocalPath,
    (SELECT l.url FROM magazine_card_links l
     WHERE l.card_id = mc.id AND l.link_kind = 'retail' AND l.provider IN ('amazon', 'amazon-kindle')
     ORDER BY CASE WHEN l.provider = 'amazon' THEN 0 ELSE 1 END, l.position ASC LIMIT 1) AS amazonUrl,
    (SELECT l.url FROM magazine_card_links l
     WHERE l.card_id = mc.id AND l.link_kind = 'retail' AND l.provider IN ('rakuten-books', 'rakuten-product', 'rakuten-kobo')
     ORDER BY CASE l.provider WHEN 'rakuten-books' THEN 0 WHEN 'rakuten-product' THEN 1 ELSE 2 END, l.position ASC LIMIT 1) AS rakutenUrl,
    0 AS directLinkCount
`;

const CARD_ROW_BASE_WHERE = `
    mc.date IS NOT NULL AND mc.date != ''
    AND mc.brand IS NOT NULL
    AND mc.brand NOT LIKE 'REP%'
`;

// --- site stats -----------------------------------------------------------

export type MhSiteStats = { models: number; cards: number; covers: number; brands: number };

export function getSiteStats(): MhSiteStats {
  return cached("siteStats", HOUR6, () => {
    const db = getMhDb();
    if (!db) return { models: 0, cards: 0, covers: 0, brands: 0 };
    try {
      const one = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
      return {
        models: one("SELECT COUNT(*) AS n FROM performer_stats"),
        cards: one("SELECT COUNT(*) AS n FROM magazine_cards"),
        covers: one("SELECT COUNT(*) AS n FROM magazine_card_covers"),
        brands: one(
          "SELECT COUNT(DISTINCT brand) AS n FROM magazine_cards WHERE brand IS NOT NULL AND brand != '' AND brand NOT LIKE 'REP%'",
        ),
      };
    } catch {
      return { models: 0, cards: 0, covers: 0, brands: 0 };
    }
  });
}

// --- upcoming releases (calendar) ------------------------------------------

export type MhUpcoming = {
  date: string;
  title: string;
  brand: string;
  kind: "magazine" | "photobook" | "digital_photobook";
  publisher?: string;
  performerKey?: string;
  performerName?: string;
  coverImageUrl?: string;
  amazonUrl?: string;
  rakutenUrl?: string;
  cardId?: number;
};

export function getUpcomingReleases(days = 210): MhUpcoming[] {
  return cached(`upcoming:${days}`, MIN30, () => {
    const db = getMhDb();
    if (!db) return [];
    const { iso: today } = jstToday();
    const until = new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
    try {
      const rows = db.prepare(`
        SELECT p.release_date AS date,
          COALESCE(NULLIF(p.official_title,''), NULLIF(p.jpo_title,''), NULLIF(p.work_title,''), p.title) AS title,
          COALESCE(NULLIF(p.display_brand,''), p.canonical_brand) AS brand,
          p.publication_kind AS kind,
          COALESCE(NULLIF(p.publisher_official,''), NULLIF(p.jpo_publisher,''), NULLIF(p.publisher,'')) AS publisher,
          NULLIF(p.performer_key,'') AS performerKey,
          ps.performer_name AS performerName,
          p.asin_print, p.asin_ebook,
          mc.id AS cardId,
          (SELECT c.cover_url FROM magazine_card_covers c WHERE c.card_id = mc.id ORDER BY c.position ASC LIMIT 1) AS coverUrl,
          (SELECT c.local_path FROM magazine_card_covers c WHERE c.card_id = mc.id AND c.local_path IS NOT NULL ORDER BY c.position ASC LIMIT 1) AS coverLocalPath,
          (SELECT l.url FROM magazine_card_links l
           WHERE l.card_id = mc.id AND l.link_kind = 'retail' AND l.provider IN ('amazon', 'amazon-kindle')
           ORDER BY CASE WHEN l.provider = 'amazon' THEN 0 ELSE 1 END, l.position ASC LIMIT 1) AS cardAmazonUrl,
          (SELECT l.url FROM magazine_card_links l
           WHERE l.card_id = mc.id AND l.link_kind = 'retail' AND l.provider IN ('rakuten-books', 'rakuten-product', 'rakuten-kobo')
           ORDER BY CASE l.provider WHEN 'rakuten-books' THEN 0 WHEN 'rakuten-product' THEN 1 ELSE 2 END, l.position ASC LIMIT 1) AS cardRakutenUrl
        FROM publications p
        LEFT JOIN performer_stats ps ON ps.performer_key = p.performer_key
        LEFT JOIN magazine_cards mc ON mc.publication_id = p.id
        WHERE p.release_date > ? AND p.release_date <= ?
        ORDER BY p.release_date ASC, brand ASC
      `).all(today, until) as Array<{
        date: string;
        title: string | null;
        brand: string | null;
        kind: string;
        publisher: string | null;
        performerKey: string | null;
        performerName: string | null;
        asin_print: string | null;
        asin_ebook: string | null;
        cardId: number | null;
        coverUrl: string | null;
        coverLocalPath: string | null;
        cardAmazonUrl: string | null;
        cardRakutenUrl: string | null;
      }>;

      const seen = new Set<string>();
      const out: MhUpcoming[] = [];
      for (const r of rows) {
        const brand = r.brand && r.brand !== "未分類" ? r.brand : "";
        const performerName = r.performerName ?? (isPersonKey(r.performerKey) ? r.performerKey! : undefined);
        const kindLabel = r.kind === "magazine" ? "雑誌" : r.kind === "digital_photobook" ? "デジタル写真集" : "写真集";
        let title = r.title && r.title !== "未分類" ? r.title : "";
        if (!title) {
          if (!performerName) continue;
          title = `${performerName} 新作${kindLabel}`;
        }
        const dedupeKey = `${r.date}|${brand}|${title}|${performerName ?? ""}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        const asin = r.asin_print ?? r.asin_ebook;
        const amazonUrl =
          normalizeRetailUrl(r.cardAmazonUrl) ??
          (asin ? `https://www.amazon.co.jp/dp/${asin}?tag=magazinelab-22` : undefined);
        out.push({
          date: r.date,
          title,
          brand: brand || kindLabel,
          kind: (r.kind as MhUpcoming["kind"]) ?? "magazine",
          publisher: r.publisher ?? undefined,
          performerKey: isPersonKey(r.performerKey) ? r.performerKey! : undefined,
          performerName,
          coverImageUrl: brand ? resolveCardCoverImageUrl(r.coverUrl, r.coverLocalPath, brand) : undefined,
          amazonUrl,
          rakutenUrl: normalizeRetailUrl(r.cardRakutenUrl),
          cardId: r.cardId ?? undefined,
        });
      }
      return out;
    } catch {
      return [];
    }
  });
}

// --- fresh releases -------------------------------------------------------

export function getNewThisWeek(limit = 20): MhMagazine[] {
  return cached(`newWeek:${limit}`, MIN30, () => {
    const db = getMhDb();
    if (!db) return [];
    const { iso: today } = jstToday();
    const since = isoDaysAgo(14);
    try {
      const rows = db.prepare(`
        ${CARD_ROW_SELECT}
        FROM magazine_cards mc
        WHERE ${CARD_ROW_BASE_WHERE}
          AND mc.date >= ? AND mc.date <= ?
          ${visibleImageBrandSql("mc")}
        ORDER BY mc.date DESC, mc.id DESC
        LIMIT ?
      `).all(since, today, limit * 3) as MagazineCardRow[];
      const seen = new Set<string>();
      const out: MhMagazine[] = [];
      for (const row of rows) {
        const key = `${row.brand}|${row.date}|${row.issue_no ?? ""}|${cleanCardFeatureTitle(row.title, row.brand)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(mapMagazineCardRow(row));
        if (out.length >= limit) break;
      }
      return out;
    } catch {
      return [];
    }
  });
}

// --- trending models ------------------------------------------------------

export type MhTrending = {
  key: string;
  slug: string;
  name: string;
  imageUrl?: string;
  c1: string;
  c2: string;
  totalPubs: number;
  firstDate?: string;
  recent6: number;
  prior6: number;
  score: number;
  monthly: number[]; // last 24 months, oldest first
  isNewFace: boolean; // first appearance within ~18 months
};

export function getTrendingModels(limit = 30): MhTrending[] {
  return cached(`trending:${limit}`, MIN30, () => {
    const db = getMhDb();
    if (!db) return [];
    const { iso: today } = jstToday();
    const d183 = isoDaysAgo(183);
    const d366 = isoDaysAgo(366);
    const newFaceSince = isoDaysAgo(548);
    try {
      const rows = db.prepare(`
        SELECT pml.performer_key AS key, ps.performer_name AS name,
          ps.appearance_count AS totalPubs, ps.first_date AS firstDate,
          SUM(CASE WHEN mc.date >= ? THEN 1 ELSE 0 END) AS recent6,
          SUM(CASE WHEN mc.date >= ? AND mc.date < ? THEN 1 ELSE 0 END) AS prior6
        FROM performer_magazine_links pml
        JOIN magazine_cards mc ON mc.id = pml.magazine_card_id
        JOIN performer_stats ps ON ps.performer_key = pml.performer_key
        WHERE mc.date IS NOT NULL AND mc.date != '' AND mc.date <= ?
        GROUP BY pml.performer_key
        HAVING recent6 >= 4
      `).all(d183, d366, d183, today) as Array<{
        key: string;
        name: string;
        totalPubs: number;
        firstDate: string | null;
        recent6: number;
        prior6: number;
      }>;

      const scored = rows
        .filter((r) => isPersonKey(r.key))
        .map((r) => ({
          ...r,
          score: Math.round((r.recent6 / Math.max(r.prior6, 1)) * 10) / 10,
        }))
        .sort((a, b) => b.score - a.score || b.recent6 - a.recent6)
        .slice(0, limit);

      if (scored.length === 0) return [];

      // Monthly buckets for sparklines (last 24 months).
      const start = `${new Date(Date.now() - 730 * 86400_000).toISOString().slice(0, 7)}-01`;
      const placeholders = scored.map(() => "?").join(",");
      const buckets = db.prepare(`
        SELECT pml.performer_key AS key, substr(mc.date, 1, 7) AS ym, COUNT(DISTINCT pml.magazine_card_id) AS n
        FROM performer_magazine_links pml
        JOIN magazine_cards mc ON mc.id = pml.magazine_card_id
        WHERE pml.performer_key IN (${placeholders})
          AND mc.date >= ? AND mc.date <= ?
        GROUP BY pml.performer_key, ym
      `).all(...scored.map((r) => r.key), start, today) as Array<{ key: string; ym: string; n: number }>;

      const months: string[] = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        months.push(d.toISOString().slice(0, 7));
      }
      const byKey = new Map<string, Map<string, number>>();
      for (const b of buckets) {
        if (!byKey.has(b.key)) byKey.set(b.key, new Map());
        byKey.get(b.key)!.set(b.ym, b.n);
      }

      const icons = getPerformerIconUrls(
        db,
        scored.map((r) => ({ key: r.key, name: r.name })),
      );

      return scored.map((r) => ({
        key: r.key,
        slug: encodeURIComponent(r.key),
        name: r.name,
        imageUrl: icons.get(r.key),
        c1: colorFromHash(r.key, 42, 40),
        c2: colorFromHash(r.key + "2", 38, 28),
        totalPubs: r.totalPubs,
        firstDate: r.firstDate ?? undefined,
        recent6: r.recent6,
        prior6: r.prior6,
        score: r.score,
        monthly: months.map((m) => byKey.get(r.key)?.get(m) ?? 0),
        isNewFace: !!r.firstDate && r.firstDate >= newFaceSince,
      }));
    } catch {
      return [];
    }
  });
}

// --- career timeline ------------------------------------------------------

export function getModelYearCounts(performerKey: string): { year: number; count: number }[] {
  const db = getMhDb();
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT CAST(substr(mc.date, 1, 4) AS INTEGER) AS year, COUNT(DISTINCT pml.magazine_card_id) AS count
      FROM performer_magazine_links pml
      JOIN magazine_cards mc ON mc.id = pml.magazine_card_id
      WHERE pml.performer_key = ? AND mc.date IS NOT NULL AND mc.date != ''
      GROUP BY year ORDER BY year ASC
    `).all(performerKey) as Array<{ year: number; count: number }>;
    if (rows.length === 0) return [];
    const thisYear = jstToday().y;
    const first = rows[0].year;
    const byYear = new Map(rows.map((r) => [r.year, r.count]));
    const out: { year: number; count: number }[] = [];
    for (let y = first; y <= thisYear; y++) out.push({ year: y, count: byYear.get(y) ?? 0 });
    return out;
  } catch {
    return [];
  }
}

// --- co-stars and related models -------------------------------------------

export type MhCoStar = {
  key: string;
  slug: string;
  name: string;
  count: number;
  imageUrl?: string;
  c1: string;
  c2: string;
};

function toCoStar(db: NonNullable<ReturnType<typeof getMhDb>>, rows: Array<{ key: string; name: string; count: number }>): MhCoStar[] {
  const icons = getPerformerIconUrls(db, rows.map((r) => ({ key: r.key, name: r.name })));
  return rows.map((r) => ({
    key: r.key,
    slug: encodeURIComponent(r.key),
    name: r.name,
    count: r.count,
    imageUrl: icons.get(r.key),
    c1: colorFromHash(r.key, 42, 40),
    c2: colorFromHash(r.key + "2", 38, 28),
  }));
}

function queryCoStars(db: NonNullable<ReturnType<typeof getMhDb>>, performerKey: string, limit: number) {
  // Materialized CTE lets SQLite build an ephemeral index over the target's
  // cards; a direct pml self-join has no card_id index and runs ~100x slower.
  const rows = db.prepare(`
    WITH target_cards AS (
      SELECT magazine_card_id FROM performer_magazine_links WHERE performer_key = ?
    )
    SELECT other.performer_key AS key, ps.performer_name AS name, COUNT(DISTINCT other.magazine_card_id) AS count
    FROM performer_magazine_links other
    JOIN target_cards tc ON tc.magazine_card_id = other.magazine_card_id
    JOIN performer_stats ps ON ps.performer_key = other.performer_key
    WHERE other.performer_key != ?
    GROUP BY other.performer_key
    ORDER BY count DESC
    LIMIT ?
  `).all(performerKey, performerKey, limit) as Array<{ key: string; name: string; count: number }>;
  return rows.filter((r) => isPersonKey(r.key));
}

export function getCoStars(performerKey: string, limit = 8): MhCoStar[] {
  return cached(`coStars:${performerKey}:${limit}`, MIN30, () => {
    const db = getMhDb();
    if (!db) return [];
    try {
      return toCoStar(db, queryCoStars(db, performerKey, limit * 2).slice(0, limit));
    } catch {
      return [];
    }
  });
}

export function getRelatedModels(performerKey: string, limit = 6): MhCoStar[] {
  return cached(`related:${performerKey}:${limit}`, MIN30, () => {
    const db = getMhDb();
    if (!db) return [];
    try {
      const coStars = queryCoStars(db, performerKey, 40);
    const excluded = new Set([performerKey, ...coStars.slice(0, 3).map((c) => c.key)]);
    const coStarCount = new Map(coStars.map((c) => [c.key, c.count]));

    const topBrands = db.prepare(`
      SELECT mc.brand AS brand, COUNT(*) AS n
      FROM performer_magazine_links pml
      JOIN magazine_cards mc ON mc.id = pml.magazine_card_id
      WHERE pml.performer_key = ? AND mc.brand IS NOT NULL AND mc.brand != '' AND mc.brand NOT LIKE 'REP%'
      GROUP BY mc.brand ORDER BY n DESC LIMIT 3
    `).all(performerKey) as Array<{ brand: string; n: number }>;

    let brandMates: Array<{ key: string; name: string; count: number }> = [];
    if (topBrands.length > 0) {
      const placeholders = topBrands.map(() => "?").join(",");
      brandMates = (db.prepare(`
        SELECT pml.performer_key AS key, ps.performer_name AS name, COUNT(DISTINCT pml.magazine_card_id) AS count
        FROM performer_magazine_links pml
        JOIN magazine_cards mc ON mc.id = pml.magazine_card_id
        JOIN performer_stats ps ON ps.performer_key = pml.performer_key
        WHERE mc.brand IN (${placeholders}) AND pml.performer_key != ?
        GROUP BY pml.performer_key
        ORDER BY count DESC LIMIT 60
      `).all(...topBrands.map((b) => b.brand), performerKey) as Array<{ key: string; name: string; count: number }>)
        .filter((r) => isPersonKey(r.key));
    }

    const scores = new Map<string, { key: string; name: string; score: number }>();
    for (const b of brandMates) {
      scores.set(b.key, { key: b.key, name: b.name, score: b.count + (coStarCount.get(b.key) ?? 0) * 3 });
    }
    for (const c of coStars) {
      if (!scores.has(c.key)) scores.set(c.key, { key: c.key, name: c.name, score: c.count * 3 });
    }

      const picked = Array.from(scores.values())
        .filter((s) => !excluded.has(s.key))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => ({ key: s.key, name: s.name, count: coStarCount.get(s.key) ?? 0 }));
      return toCoStar(db, picked);
    } catch {
      return [];
    }
  });
}

// --- birthdays --------------------------------------------------------------

export type MhBirthday = {
  key: string;
  slug: string;
  name: string;
  birthday: string;
  month: number;
  day: number;
  pubCount: number;
  imageUrl?: string;
  c1: string;
  c2: string;
};

function getAllBirthdays(): Array<Omit<MhBirthday, "imageUrl">> {
  return cached("birthdays", HOUR6, () => {
    const db = getMhDb();
    if (!db) return [];
    try {
      const rows = db.prepare(`
        SELECT p.name_normalized AS key, ps.performer_name AS name, pp.birthday, ps.appearance_count AS pubCount
        FROM performer_profiles pp
        JOIN performers p ON p.id = pp.performer_id
        JOIN performer_stats ps ON ps.performer_key = p.name_normalized
        WHERE pp.birthday IS NOT NULL AND pp.birthday != ''
      `).all() as Array<{ key: string; name: string; birthday: string; pubCount: number }>;
      const out: Array<Omit<MhBirthday, "imageUrl">> = [];
      const seen = new Set<string>();
      for (const r of rows) {
        if (!isPersonKey(r.key) || seen.has(r.key)) continue;
        const m = r.birthday.match(/(\d{1,2})月(\d{1,2})日/);
        if (!m) continue;
        seen.add(r.key);
        out.push({
          key: r.key,
          slug: encodeURIComponent(r.key),
          name: r.name,
          birthday: r.birthday,
          month: Number(m[1]),
          day: Number(m[2]),
          pubCount: r.pubCount,
          c1: colorFromHash(r.key, 42, 40),
          c2: colorFromHash(r.key + "2", 38, 28),
        });
      }
      return out;
    } catch {
      return [];
    }
  });
}

function withIcons(rows: Array<Omit<MhBirthday, "imageUrl">>): MhBirthday[] {
  const db = getMhDb();
  if (!db || rows.length === 0) return rows as MhBirthday[];
  try {
    const icons = getPerformerIconUrls(db, rows.map((r) => ({ key: r.key, name: r.name })));
    return rows.map((r) => ({ ...r, imageUrl: icons.get(r.key) }));
  } catch {
    return rows as MhBirthday[];
  }
}

export function getTodayBirthdays(limit = 12): MhBirthday[] {
  const { m, d } = jstToday();
  const rows = getAllBirthdays()
    .filter((b) => b.month === m && b.day === d)
    .sort((a, b) => b.pubCount - a.pubCount)
    .slice(0, limit);
  return withIcons(rows);
}

export function getBirthdaysForMonth(month: number): MhBirthday[] {
  const rows = getAllBirthdays()
    .filter((b) => b.month === month)
    .sort((a, b) => a.day - b.day || b.pubCount - a.pubCount);
  return withIcons(rows.slice(0, 120));
}

// --- on this day ------------------------------------------------------------

export function getOnThisDay(limit = 4): MhMagazine[] {
  const { y, iso } = jstToday();
  return cached(`onThisDay:${iso}:${limit}`, HOUR6, () => {
    const db = getMhDb();
    if (!db) return [];
    // Release dates are sparse per exact day, so match a ±2-day window
    // around today's month-day across past years.
    const mmdds: string[] = [];
    for (let off = -2; off <= 2; off++) {
      const t = new Date(new Date(`${iso}T00:00:00Z`).getTime() + off * 86400_000);
      mmdds.push(t.toISOString().slice(5, 10));
    }
    try {
      const placeholders = mmdds.map(() => "?").join(",");
      const query = (maxYear: string): MhMagazine[] => {
        const rows = db.prepare(`
          ${CARD_ROW_SELECT}
          FROM magazine_cards mc
          WHERE ${CARD_ROW_BASE_WHERE}
            AND substr(mc.date, 6, 5) IN (${placeholders})
            AND substr(mc.date, 1, 4) <= ?
            ${visibleImageBrandSql("mc")}
            AND EXISTS (
              SELECT 1 FROM magazine_card_covers c
              WHERE c.card_id = mc.id AND (
                c.local_path IS NOT NULL
                OR c.cover_url LIKE 'https://idolz.hubxhub.com/wp-content/uploads/%'
                OR c.cover_url LIKE '%pixhost%'
              )
            )
          ORDER BY (mc.id * 2654435761) % 997, mc.id
          LIMIT ?
        `).all(...mmdds, maxYear, limit * 10) as MagazineCardRow[];
        return rows.map(mapMagazineCardRow).filter((r) => r.coverImageUrl);
      };
      // Prefer covers from 3+ years back; older cards often lack resolvable
      // covers, so fall back to anything up to last year.
      let items = query(String(y - 3));
      if (items.length < limit) {
        const seen = new Set(items.map((r) => r.slug));
        for (const r of query(String(y - 1))) {
          if (!seen.has(r.slug)) items.push(r);
        }
      }
      return items.slice(0, limit);
    } catch {
      return [];
    }
  });
}

// --- cover wall --------------------------------------------------------------

export type MhCoverWallResult = { items: MhMagazine[]; total: number };

const ERA_RANGES: Record<string, [string, string]> = {
  "1990s": ["1990-01-01", "1999-12-31"],
  "2000s": ["2000-01-01", "2009-12-31"],
  "2010s": ["2010-01-01", "2019-12-31"],
  "2020s": ["2020-01-01", "2029-12-31"],
};

export function getCoverWall(opts: { era?: string; brand?: string; page?: number; pageSize?: number } = {}): MhCoverWallResult {
  const { era, brand } = opts;
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(200, opts.pageSize ?? 96);
  return cached(`wall:${era ?? ""}:${brand ?? ""}:${page}:${pageSize}`, MIN30, () => {
    const db = getMhDb();
    if (!db) return { items: [], total: 0 };
    try {
      const conds: string[] = [];
      const params: (string | number)[] = [];
      if (era && ERA_RANGES[era]) {
        conds.push("mc.date >= ? AND mc.date <= ?");
        params.push(ERA_RANGES[era][0], ERA_RANGES[era][1]);
      }
      if (brand) {
        conds.push("mc.brand = ?");
        params.push(brand);
      }
      const where = `
        ${CARD_ROW_BASE_WHERE}
        ${conds.length ? `AND ${conds.join(" AND ")}` : ""}
        ${visibleImageBrandSql("mc")}
        AND EXISTS (
          SELECT 1 FROM magazine_card_covers c
          WHERE c.card_id = mc.id AND (
            c.local_path IS NOT NULL
            OR c.cover_url LIKE 'https://idolz.hubxhub.com/wp-content/uploads/%'
            OR c.cover_url LIKE '%pixhost%'
          )
        )
      `;
      const total = (db.prepare(`SELECT COUNT(*) AS n FROM magazine_cards mc WHERE ${where}`).get(...params) as { n: number }).n;
      const rows = db.prepare(`
        ${CARD_ROW_SELECT}
        FROM magazine_cards mc
        WHERE ${where}
        ORDER BY mc.date DESC, mc.id DESC
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, (page - 1) * pageSize) as MagazineCardRow[];
      return { items: rows.map(mapMagazineCardRow).filter((r) => r.coverImageUrl), total };
    } catch {
      return { items: [], total: 0 };
    }
  });
}
