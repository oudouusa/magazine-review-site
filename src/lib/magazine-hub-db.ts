import "server-only";
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";

let _db: DatabaseSync | null = null;
const HEAVY_CACHE_TTL_MS = 30 * 60_000;
const heavyCache = new Map<string, { at: number; val: unknown }>();
const JUNK_PERFORMER_KEY =
  /(追加|付録|特典|袋とじ|未公開|アザー|オフショ|グラビア|写真集|カレンダー|総集編|合本|セット付|ほか|その他|一覧|まとめ|読者|プレゼント)/;

function isDisplayPerformerKey(key: string | null | undefined): key is string {
  return !!key && !JUNK_PERFORMER_KEY.test(key);
}

function cachedHeavy<T>(key: string, load: () => T): T {
  const now = Date.now();
  const cached = heavyCache.get(key);
  if (cached && now - cached.at < HEAVY_CACHE_TTL_MS) return cached.val as T;
  const val = load();
  heavyCache.set(key, { at: now, val });
  return val;
}

function getDb(): DatabaseSync | null {
  if (_db) return _db;
  const path = process.env.MAGAZINE_HUB_DB_PATH;
  if (!path) return null;
  try {
    _db = new DatabaseSync(path, { readOnly: true });
    return _db;
  } catch {
    return null;
  }
}

function colorFromHash(key: string, saturation: number, lightness: number): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(h) % 360}, ${saturation}%, ${lightness}%)`;
}

export type MhModel = {
  slug: string;
  name: string;
  nameYomi: string;
  tags: string[];
  stats: { issues: number; covers: number };
  gradient: { c1: string; c2: string; c3: string; c4: string };
  imageUrl?: string;
};

export type MhMagazine = {
  slug: string;
  title: string;
  seriesName: string;
  issue: string;
  releaseDate: string;
  gradient: { c1: string; c2: string };
  badge?: "new" | "preorder" | "reissue";
  coverImageUrl?: string;
  amazonUrl?: string;
  rakutenUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  directLinkCount?: number;
};

type RetailUrls = {
  amazonUrl?: string;
  rakutenUrl?: string;
};

type ModelCoverLookup = {
  key: string;
  name: string;
};

type PerformerIconLookup = ModelCoverLookup & {
  portraitLocalPath?: string | null;
};

type ModelCardCoverFallbackOptions = {
  coverOnly?: boolean;
};

function localPathToUrl(localPath: string | null | undefined): string | undefined {
  if (!localPath) return undefined;
  const path = localPath.startsWith("/magazine-images/")
    ? localPath.replace("/magazine-images/", "/api/images/")
    : localPath;
  if (!path.startsWith("/api/images/")) return undefined;
  return path.split("/").map((part) => {
    if (!part) return part;
    try {
      return encodeURIComponent(decodeURIComponent(part));
    } catch {
      return encodeURIComponent(part);
    }
  }).join("/");
}

function cleanFeatureTitle(featureTitle: string): string {
  // REP\d+ is an internal scraper code, not a real title
  if (/^REP\d+$/.test(featureTitle)) return "";
  return featureTitle;
}

function filterCoverUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  // Only pass through HTTPS sources confirmed to not block hotlinking.
  // ivworld.xyz is HTTP-only — omitted here so URLs fall through to the local
  // xidol-covers volume cache (buildXidolCoversUrlIfExists) instead.
  if (url.includes("pixhost.to")) return url;
  return undefined;
}

function normalizeRetailUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("amazon.co.jp")) {
      parsed.searchParams.set("tag", "magazinelab-22");
    }
    return parsed.toString();
  } catch {
    return url
      .replace("tag=s-rocket-22", "tag=magazinelab-22")
      .replace("tag=dummy-22", "tag=magazinelab-22");
  }
}

// Derive a local xidol-covers path from a cover URL.
// Files are cached at xidol-covers/{brand}/{YYYY-MM}/{filename} in the volume,
// where filename is the last path segment of the original cover URL (pixhost or ivworld).
function buildXidolCoversUrl(coverUrl: string | null | undefined, brand: string, issueDate: string): string | undefined {
  if (!coverUrl) return undefined;
  let filename: string | undefined;
  // pixhost: https://tN.pixhost.to/thumbs/M/FILENAME
  const pixhostMatch = coverUrl.match(/\/thumbs\/\d+\/(.+)$/);
  if (pixhostMatch) {
    filename = pixhostMatch[1];
  } else {
    // ivworld: .../wp-content/gallery/YYYYMM/FILENAME
    const ivworldMatch = coverUrl.match(/\/gallery\/[^/]+\/(.+)$/);
    if (ivworldMatch) filename = ivworldMatch[1];
  }
  if (!filename) return undefined;
  const yearMonth = issueDate.slice(0, 7);
  // Spaces → underscores; strip trailing period (e.g. "B.L.T." → "B.L.T")
  const brandDir = brand.replace(/ /g, "_").replace(/\.$/, "");
  return `/api/images/xidol-covers/${brandDir}/${yearMonth}/${filename}`;
}

// Returns the xidol-covers API path only if the file actually exists on disk.
// MAGAZINE_IMAGES_PATH should be set to the volume mount root (e.g. /app/public/magazine-images).
const MAGAZINE_IMAGES_BASE = process.env.MAGAZINE_IMAGES_PATH ?? "/app/public/magazine-images";
const SUPPRESSED_IMAGE_BRANDS = new Set(["週刊大衆"]);
const SUPPRESSED_IMAGE_BRANDS_SQL = Array.from(SUPPRESSED_IMAGE_BRANDS)
  .map((brand) => `'${brand.replace(/'/g, "''")}'`)
  .join(",");

function shouldSuppressIssueImages(brand: string | null | undefined): boolean {
  return !!brand && SUPPRESSED_IMAGE_BRANDS.has(brand.trim());
}

function visibleImageBrandSql(alias: string): string {
  return SUPPRESSED_IMAGE_BRANDS_SQL
    ? `AND TRIM(${alias}.brand) NOT IN (${SUPPRESSED_IMAGE_BRANDS_SQL})`
    : "";
}

function buildXidolCoversUrlIfExists(coverUrl: string | null | undefined, brand: string, issueDate: string): string | undefined {
  const apiPath = buildXidolCoversUrl(coverUrl, brand, issueDate);
  if (!apiPath) return undefined;
  const relativePath = apiPath.replace("/api/images/", "");
  const fsPath = `${MAGAZINE_IMAGES_BASE}/${relativePath}`;
  return existsSync(fsPath) ? apiPath : undefined;
}

// Returns the URL only if the performer image file actually exists on disk.
function localPathToUrlIfExists(localPath: string | null | undefined): string | undefined {
  if (!localPath) return undefined;
  const relativePath = localPath
    .replace("/magazine-images/", "")
    .replace("/api/images/", "");
  const fsPath = `${MAGAZINE_IMAGES_BASE}/${relativePath}`;
  return existsSync(fsPath) ? localPathToUrl(localPath) : undefined;
}

function resolveCoverImageUrl(
  coverUrl: string | null | undefined,
  brand: string,
  issueDate: string,
  fallbackLocalPath?: string | null,
): string | undefined {
  if (shouldSuppressIssueImages(brand)) return undefined;
  const localCover = localPathToUrl(buildXidolCoversUrlIfExists(coverUrl, brand, issueDate));
  return localCover ?? filterCoverUrl(coverUrl) ?? localPathToUrlIfExists(fallbackLocalPath);
}

function resolveIssueCoverImageUrl(
  coverUrl: string | null | undefined,
  coverLocalPath: string | null | undefined,
  brand: string | null | undefined,
  issueDate: string | null | undefined,
): string | undefined {
  if (!brand || !issueDate || shouldSuppressIssueImages(brand)) return undefined;
  return localPathToUrlIfExists(coverLocalPath) ?? resolveCoverImageUrl(coverUrl, brand, issueDate);
}

function getModelCoverFallbacks(db: DatabaseSync, performerKeys: string[]): Map<string, string> {
  const uniqueKeys = Array.from(new Set(performerKeys.filter(Boolean)));
  if (uniqueKeys.length === 0) return new Map();
  const placeholders = uniqueKeys.map(() => "?").join(",");
  const rows = db.prepare(`
    WITH ranked AS (
      SELECT p.name_normalized AS performerKey, i.brand, i.issue_date_start, c.image_url, c.local_path,
        ROW_NUMBER() OVER (
          PARTITION BY p.name_normalized
          ORDER BY i.issue_date_start DESC,
            CASE WHEN c.local_path IS NOT NULL THEN 0 WHEN c.image_url LIKE '%pixhost%' THEN 1 ELSE 2 END,
            c.id ASC
        ) AS rn
      FROM performers p
      JOIN issue_performers ip ON ip.performer_id = p.id
      JOIN issues i ON i.id = ip.issue_id
      JOIN covers c ON c.issue_id = i.id AND c.position = 1
      WHERE p.name_normalized IN (${placeholders})
        AND i.issue_date_start IS NOT NULL
        AND i.brand IS NOT NULL
        AND i.brand NOT LIKE 'REP%'
        ${visibleImageBrandSql("i")}
    )
    SELECT performerKey, brand, issue_date_start, image_url, local_path
    FROM ranked
    WHERE rn <= 12
    ORDER BY performerKey, rn
  `).all(...uniqueKeys) as Array<{
    performerKey: string;
    brand: string;
    issue_date_start: string;
    image_url: string | null;
    local_path: string | null;
  }>;
  const covers = new Map<string, string>();
  for (const row of rows) {
    if (covers.has(row.performerKey)) continue;
    const url = resolveIssueCoverImageUrl(row.image_url, row.local_path, row.brand, row.issue_date_start);
    if (url) covers.set(row.performerKey, url);
  }
  return covers;
}

function resolveCardCoverImageUrl(
  coverUrl: string | null | undefined,
  localPath: string | null | undefined,
  brand: string,
): string | undefined {
  if (shouldSuppressIssueImages(brand)) return undefined;
  const localCover = localPathToUrlIfExists(localPath);
  if (localCover) return localCover;
  if (coverUrl?.startsWith("https://idolz.hubxhub.com/wp-content/uploads/")) return coverUrl;
  return filterCoverUrl(coverUrl);
}

function getModelCardCoverFallbacksFromLinks(
  db: DatabaseSync,
  termToKey: Map<string, string>,
  options: ModelCardCoverFallbackOptions,
): Map<string, string> {
  const terms = Array.from(termToKey.keys());
  if (terms.length === 0) return new Map();

  let rows: Array<{
    performer_key: string;
    performer_name: string;
    brand: string;
    cover_url: string | null;
    local_path: string | null;
  }>;
  try {
    const placeholders = terms.map(() => "?").join(",");
    const coverOnlyClause = options.coverOnly ? "AND pml.is_cover = 1" : "";
    rows = db.prepare(`
      WITH ranked AS (
        SELECT pml.performer_key, pml.performer_name, pml.is_cover, mc.brand, mc.date, c.cover_url, c.local_path,
          ROW_NUMBER() OVER (
            PARTITION BY pml.performer_key
            ORDER BY pml.is_cover DESC,
              mc.date DESC,
              CASE
                WHEN c.local_path IS NOT NULL THEN 0
                WHEN c.cover_url LIKE 'https://idolz.hubxhub.com/wp-content/uploads/%' THEN 1
                ELSE 2
              END,
              c.position ASC,
              mc.id DESC
          ) AS rn
        FROM performer_magazine_links pml
        JOIN magazine_cards mc ON mc.id = pml.magazine_card_id
        JOIN magazine_card_covers c ON c.card_id = mc.id
        WHERE (pml.performer_key IN (${placeholders}) OR pml.performer_name IN (${placeholders}))
          ${coverOnlyClause}
          AND mc.source = 'idolz'
          AND mc.date IS NOT NULL
          AND mc.date != ''
          AND mc.brand IS NOT NULL
          ${visibleImageBrandSql("mc")}
      )
      SELECT performer_key, performer_name, brand, cover_url, local_path
      FROM ranked
      WHERE rn <= 12
      ORDER BY performer_key, rn
    `).all(...terms, ...terms) as typeof rows;
  } catch {
    return new Map();
  }

  const covers = new Map<string, string>();
  for (const row of rows) {
    const key = termToKey.get(row.performer_key) ?? termToKey.get(row.performer_name);
    if (!key || covers.has(key)) continue;
    const url = resolveCardCoverImageUrl(row.cover_url, row.local_path, row.brand);
    if (url) covers.set(key, url);
  }
  return covers;
}

function getModelCardCoverFallbacks(
  db: DatabaseSync,
  performers: ModelCoverLookup[],
  options: ModelCardCoverFallbackOptions = {},
): Map<string, string> {
  const termToKey = new Map<string, string>();
  for (const performer of performers) {
    if (performer.key) termToKey.set(performer.key, performer.key);
    if (performer.name) termToKey.set(performer.name, performer.key);
  }
  const terms = Array.from(termToKey.keys());
  if (terms.length === 0) return new Map();

  const linkCovers = getModelCardCoverFallbacksFromLinks(db, termToKey, options);
  if (options.coverOnly) return linkCovers;

  const unresolvedTerms = terms.filter((term) => !linkCovers.has(termToKey.get(term) ?? ""));
  if (unresolvedTerms.length === 0) return linkCovers;

  const placeholders = unresolvedTerms.map(() => "?").join(",");
  const rows = db.prepare(`
    WITH ranked AS (
      SELECT mp.performer_name AS term, mc.brand, mc.date, c.cover_url, c.local_path,
        ROW_NUMBER() OVER (
          PARTITION BY mp.performer_name
          ORDER BY mc.date DESC,
            CASE
              WHEN c.local_path IS NOT NULL THEN 0
              WHEN c.cover_url LIKE 'https://idolz.hubxhub.com/wp-content/uploads/%' THEN 1
              ELSE 2
            END,
            c.position ASC,
            mc.id DESC
        ) AS rn
      FROM magazine_card_performers mp
      JOIN magazine_cards mc ON mc.id = mp.card_id
      JOIN magazine_card_covers c ON c.card_id = mc.id
      WHERE mp.performer_name IN (${placeholders})
        AND mc.source = 'idolz'
        AND mc.date IS NOT NULL
        AND mc.date != ''
        AND mc.brand IS NOT NULL
        ${visibleImageBrandSql("mc")}
    )
    SELECT term, brand, cover_url, local_path
    FROM ranked
    WHERE rn <= 12
    ORDER BY term, rn
  `).all(...unresolvedTerms) as Array<{
    term: string;
    brand: string;
    cover_url: string | null;
    local_path: string | null;
  }>;

  const covers = new Map(linkCovers);
  for (const row of rows) {
    const key = termToKey.get(row.term);
    if (!key || covers.has(key)) continue;
    const url = resolveCardCoverImageUrl(row.cover_url, row.local_path, row.brand);
    if (url) covers.set(key, url);
  }
  return covers;
}

function getPerformerPortraitUrls(db: DatabaseSync, performers: PerformerIconLookup[]): Map<string, string> {
  const portraits = new Map<string, string>();
  const directPortraits = new Map<string, string>();
  const termToKey = new Map<string, string>();

  for (const performer of performers) {
    const directPortrait = localPathToUrlIfExists(performer.portraitLocalPath);
    if (directPortrait) directPortraits.set(performer.key, directPortrait);
    if (performer.key) termToKey.set(performer.key, performer.key);
    if (performer.name) termToKey.set(performer.name, performer.key);
  }

  const terms = Array.from(termToKey.keys());
  if (terms.length === 0) return directPortraits;

  const placeholders = terms.map(() => "?").join(",");
  const rows = db.prepare(`
    WITH ranked AS (
      SELECT p.name_normalized, p.name_jp, pi.canonical_name, pi.local_path,
        ROW_NUMBER() OVER (
          PARTITION BY COALESCE(p.name_normalized, pi.canonical_name)
          ORDER BY
            CASE pi.source WHEN 'mabui' THEN 0 WHEN 'cyoinatu' THEN 1 ELSE 2 END,
            pi.position ASC,
            COALESCE(sp.release_date, sp.post_date, pi.scraped_at) DESC,
            pi.id DESC
        ) AS rn
      FROM performer_images pi
      LEFT JOIN performers p ON p.id = pi.performer_id
      LEFT JOIN source_posts sp ON sp.source = pi.source AND sp.source_url = pi.post_url
      WHERE pi.source IN ('mabui', 'cyoinatu')
        AND pi.local_path IS NOT NULL
        AND pi.local_path != ''
        AND (
          p.name_normalized IN (${placeholders})
          OR p.name_jp IN (${placeholders})
          OR pi.canonical_name IN (${placeholders})
        )
    )
    SELECT name_normalized, name_jp, canonical_name, local_path
    FROM ranked
    WHERE rn <= 48
    ORDER BY rn ASC
  `).all(...terms, ...terms, ...terms) as Array<{
    name_normalized: string | null;
    name_jp: string | null;
    canonical_name: string;
    local_path: string | null;
  }>;

  for (const row of rows) {
    const url = localPathToUrlIfExists(row.local_path);
    if (!url) continue;
    for (const term of [row.name_normalized, row.name_jp, row.canonical_name]) {
      if (!term) continue;
      const key = termToKey.get(term);
      if (key && !portraits.has(key)) portraits.set(key, url);
    }
  }

  for (const [key, url] of directPortraits) {
    if (!portraits.has(key)) portraits.set(key, url);
  }

  return portraits;
}

function getPerformerIconUrls(db: DatabaseSync, performers: PerformerIconLookup[]): Map<string, string> {
  const urls = getPerformerPortraitUrls(db, performers);
  const withoutPortrait = performers.filter((performer) => !urls.get(performer.key));
  const coverCardUrls = getModelCardCoverFallbacks(db, withoutPortrait, { coverOnly: true });
  for (const [key, url] of coverCardUrls) {
    if (!urls.has(key)) urls.set(key, url);
  }

  const unresolved = performers.filter((performer) => !urls.get(performer.key));
  if (unresolved.length === 0) return urls;

  const termToKey = new Map<string, string>();
  for (const performer of unresolved) {
    if (performer.key) termToKey.set(performer.key, performer.key);
    if (performer.name) termToKey.set(performer.name, performer.key);
  }

  const issueCoverFallbacks = getModelCoverFallbacks(db, Array.from(termToKey.keys()));
  for (const [term, url] of issueCoverFallbacks) {
    const key = termToKey.get(term);
    if (key && !urls.has(key)) urls.set(key, url);
  }

  const stillUnresolved = unresolved.filter((performer) => !urls.get(performer.key));
  const cardCoverFallbacks = getModelCardCoverFallbacks(db, stillUnresolved);
  for (const [key, url] of cardCoverFallbacks) {
    if (!urls.has(key)) urls.set(key, url);
  }

  return urls;
}

function cleanCardFeatureTitle(title: string, brand: string): string {
  const withoutDate = title.replace(/^【[^】]+】\s*/, "").trim();
  const coverMatch = withoutDate.match(/表紙[：:]\s*(.+)$/u);
  if (coverMatch?.[1]) return coverMatch[1].trim();
  return withoutDate
    .replace(/^「/, "")
    .replace(/」$/, "")
    .replace(new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "u"), "")
    .trim();
}

type MagazineCardRow = {
  id: number;
  title: string;
  brand: string;
  issue_no: string | null;
  date: string;
  url: string | null;
  coverUrl: string | null;
  coverLocalPath: string | null;
  amazonUrl: string | null;
  rakutenUrl: string | null;
  directLinkCount: number;
};

function mapMagazineCardRow(row: MagazineCardRow): MhMagazine {
  const key = `${row.brand}-${row.id}`;
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const badge: MhMagazine["badge"] =
    row.date > today ? "preorder"
    : row.date >= thirtyDaysAgo ? "new"
    : undefined;
  return {
    slug: `card-${row.id}`,
    title: cleanCardFeatureTitle(row.title, row.brand),
    seriesName: row.brand,
    issue: row.issue_no || row.date,
    releaseDate: row.date,
    gradient: { c1: colorFromHash(key, 35, 72), c2: colorFromHash(key + "2", 30, 58) },
    badge,
    coverImageUrl: resolveCardCoverImageUrl(row.coverUrl, row.coverLocalPath, row.brand),
    amazonUrl: normalizeRetailUrl(row.amazonUrl),
    rakutenUrl: normalizeRetailUrl(row.rakutenUrl),
    sourceName: "idolz",
    sourceUrl: row.url ?? undefined,
    directLinkCount: row.directLinkCount,
  };
}

function normalizeCardPerformerRows(rows: Array<{ key: string | null; name: string | null }>): Array<{ key?: string; name: string }> {
  const performers: Array<{ key?: string; name: string }> = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const name = row.name?.trim();
    const key = row.key?.trim();
    if (!name) continue;
    if ((key && JUNK_PERFORMER_KEY.test(key)) || JUNK_PERFORMER_KEY.test(name)) continue;
    const dedupeKey = key || name;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    performers.push({ name, ...(key ? { key } : {}) });
  }

  return performers;
}

export function getAdjacentCards(cardId: number): { prev?: MhMagazine; next?: MhMagazine } {
  const db = getDb();
  if (!db) return {};
  try {
    const current = db.prepare(`
      SELECT id, brand, date
      FROM magazine_cards
      WHERE id = ? AND source = 'idolz' AND brand IS NOT NULL AND date IS NOT NULL AND date != ''
      LIMIT 1
    `).get(cardId) as { id: number; brand: string; date: string } | undefined;
    if (!current) return {};

    const prev = db.prepare(`
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
        (SELECT COUNT(*) FROM magazine_card_links l
         WHERE l.card_id = mc.id AND l.link_kind = 'retail'
           AND l.provider IN ('amazon', 'amazon-kindle', 'rakuten-books', 'rakuten-product', 'rakuten-kobo')) AS directLinkCount
      FROM magazine_cards mc
      WHERE mc.source = 'idolz'
        AND mc.brand = ?
        AND mc.date IS NOT NULL
        AND mc.date != ''
        AND (mc.date < ? OR (mc.date = ? AND mc.id < ?))
      ORDER BY mc.date DESC, mc.id DESC
      LIMIT 1
    `).get(current.brand, current.date, current.date, current.id) as MagazineCardRow | undefined;

    const next = db.prepare(`
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
        (SELECT COUNT(*) FROM magazine_card_links l
         WHERE l.card_id = mc.id AND l.link_kind = 'retail'
           AND l.provider IN ('amazon', 'amazon-kindle', 'rakuten-books', 'rakuten-product', 'rakuten-kobo')) AS directLinkCount
      FROM magazine_cards mc
      WHERE mc.source = 'idolz'
        AND mc.brand = ?
        AND mc.date IS NOT NULL
        AND mc.date != ''
        AND (mc.date > ? OR (mc.date = ? AND mc.id > ?))
      ORDER BY mc.date ASC, mc.id ASC
      LIMIT 1
    `).get(current.brand, current.date, current.date, current.id) as MagazineCardRow | undefined;

    return {
      ...(prev ? { prev: mapMagazineCardRow(prev) } : {}),
      ...(next ? { next: mapMagazineCardRow(next) } : {}),
    };
  } catch {
    return {};
  }
}

export function getCardPerformers(cardId: number): Array<{ key?: string; name: string }> {
  const db = getDb();
  if (!db) return [];
  try {
    const linkRows = db.prepare(`
      SELECT
        CASE WHEN ps.performer_key IS NOT NULL THEN pml.performer_key ELSE NULL END AS key,
        COALESCE(NULLIF(pml.performer_name, ''), pml.performer_key) AS name
      FROM performer_magazine_links pml
      LEFT JOIN performer_stats ps ON ps.performer_key = pml.performer_key
      WHERE pml.magazine_card_id = ?
        AND COALESCE(NULLIF(pml.performer_name, ''), pml.performer_key) IS NOT NULL
      GROUP BY COALESCE(NULLIF(pml.performer_key, ''), pml.performer_name)
      ORDER BY MAX(COALESCE(pml.is_cover, 0)) DESC, name ASC
      LIMIT 48
    `).all(cardId) as Array<{ key: string | null; name: string | null }>;

    const linked = normalizeCardPerformerRows(linkRows);
    if (linked.length > 0) return linked;

    const fallbackRows = db.prepare(`
      SELECT
        (SELECT ps.performer_key
         FROM performer_stats ps
         WHERE ps.performer_key = mcp.performer_name OR ps.performer_name = mcp.performer_name
         ORDER BY ps.appearance_count DESC
         LIMIT 1) AS key,
        mcp.performer_name AS name
      FROM magazine_card_performers mcp
      WHERE mcp.card_id = ?
      ORDER BY mcp.position ASC
      LIMIT 48
    `).all(cardId) as Array<{ key: string | null; name: string | null }>;

    return normalizeCardPerformerRows(fallbackRows);
  } catch {
    return [];
  }
}

function getIdolzMagazines(limit = 60, brand?: string | null): MhMagazine[] {
  const db = getDb();
  if (!db) return [];
  try {
    const whereBrand = brand ? "AND mc.brand = ?" : "";
    const params = brand ? [brand, limit] : [limit];
    const rows = db.prepare(`
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
        (SELECT COUNT(*) FROM magazine_card_links l
         WHERE l.card_id = mc.id AND l.link_kind = 'retail'
           AND l.provider IN ('amazon', 'amazon-kindle', 'rakuten-books', 'rakuten-product', 'rakuten-kobo')) AS directLinkCount
      FROM magazine_cards mc
      WHERE mc.source = 'idolz'
        AND mc.date IS NOT NULL
        AND mc.brand IS NOT NULL
        AND mc.brand NOT LIKE 'REP%'
        ${whereBrand}
      ORDER BY
        CASE WHEN (
          SELECT COUNT(*) FROM magazine_card_links l
          WHERE l.card_id = mc.id AND l.link_kind = 'retail'
            AND l.provider IN ('amazon', 'amazon-kindle', 'rakuten-books', 'rakuten-product', 'rakuten-kobo')
        ) > 0 THEN 0 ELSE 1 END,
        mc.date DESC,
        mc.id DESC
      LIMIT ?
    `).all(...params) as MagazineCardRow[];
    return rows.map(mapMagazineCardRow);
  } catch {
    return [];
  }
}

export function getTopModels(limit = 100): MhModel[] {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT ps.performer_key, ps.performer_name, ps.appearance_count, ps.cover_count,
        (SELECT pi.local_path FROM performer_images pi
         JOIN performers p ON p.id = pi.performer_id
         WHERE p.name_normalized = ps.performer_key AND pi.position = 0
         LIMIT 1) AS imageLocalPath
      FROM performer_stats ps
      ORDER BY ps.appearance_count DESC
      LIMIT ?
    `).all(limit) as Array<{
      performer_key: string;
      performer_name: string;
      appearance_count: number;
      cover_count: number;
      imageLocalPath: string | null;
    }>;
    const performers = rows.map((r) => ({ key: r.performer_key, name: r.performer_name, portraitLocalPath: r.imageLocalPath }));
    const portraitUrls = getPerformerPortraitUrls(db, performers);
    const rowsWithoutPortrait = rows.filter((r) => !portraitUrls.get(r.performer_key));
    const coverCardFallbacks = getModelCardCoverFallbacks(
      db,
      rowsWithoutPortrait.map((r) => ({ key: r.performer_key, name: r.performer_name })),
      { coverOnly: true },
    );
    const rowsWithoutPrimary = rows.filter((r) => !coverCardFallbacks.get(r.performer_key) && !portraitUrls.get(r.performer_key));
    const coverFallbacks = getModelCoverFallbacks(
      db,
      rowsWithoutPrimary.map((r) => r.performer_key),
    );
    const cardCoverFallbacks = getModelCardCoverFallbacks(
      db,
      rowsWithoutPrimary
        .filter((r) => !coverFallbacks.get(r.performer_key))
        .map((r) => ({ key: r.performer_key, name: r.performer_name })),
    );
    return rows.map((r) => ({
      slug: encodeURIComponent(r.performer_key),
      name: r.performer_name,
      nameYomi: r.performer_key,
      tags: [],
      stats: { issues: r.appearance_count, covers: r.cover_count },
      gradient: {
        c1: colorFromHash(r.performer_key, 42, 78),
        c2: colorFromHash(r.performer_key + "2", 38, 68),
        c3: colorFromHash(r.performer_key + "3", 40, 73),
        c4: colorFromHash(r.performer_key + "4", 36, 63),
      },
      imageUrl: portraitUrls.get(r.performer_key) ?? coverCardFallbacks.get(r.performer_key) ?? coverFallbacks.get(r.performer_key) ?? cardCoverFallbacks.get(r.performer_key),
    }));
  } catch {
    return [];
  }
}

export type MhModelDetail = {
  slug: string;
  name: string;
  nameYomi: string;
  tags: string[];
  stats: { issues: number; covers: number; brands: number; firstDate: string | null; lastDate: string | null };
  profile: { birthday?: string; height?: string; bust?: string; waist?: string; hip?: string; birthplace?: string; debutYear?: string };
  gradient: { c1: string; c2: string; c3: string; c4: string };
  imageUrl?: string;
  recentIssues: MhMagazine[];
};

export function getModelDetail(performerKey: string): MhModelDetail | null {
  const db = getDb();
  if (!db) return null;
  try {
    const stat = db.prepare(`
      SELECT performer_key, performer_name, appearance_count, cover_count, brand_count, first_date, last_date
      FROM performer_stats WHERE performer_key = ?
    `).get(performerKey) as { performer_key: string; performer_name: string; appearance_count: number; cover_count: number; brand_count: number; first_date: string | null; last_date: string | null } | undefined;
    if (!stat) return null;

    const profile = db.prepare(`
      SELECT pp.yomigana, pp.birthday, pp.height, pp.bust, pp.waist, pp.hip, pp.birthplace, pp.debut_year
      FROM performer_profiles pp
      JOIN performers p ON p.id = pp.performer_id
      WHERE p.name_normalized = ?
      LIMIT 1
    `).get(performerKey) as { yomigana: string | null; birthday: string | null; height: string | null; bust: string | null; waist: string | null; hip: string | null; birthplace: string | null; debut_year: string | null } | undefined;

    const imageRow = db.prepare(`
      SELECT pi.local_path FROM performer_images pi
      JOIN performers p ON p.id = pi.performer_id
      WHERE p.name_normalized = ? AND pi.position = 0
      LIMIT 1
    `).get(performerKey) as { local_path: string | null } | undefined;

    const coverRows = db.prepare(`
      SELECT i.brand, i.issue_date_start, c.image_url, c.local_path
      FROM issue_performers ip
      JOIN performers p ON p.id = ip.performer_id
      JOIN issues i ON i.id = ip.issue_id
      JOIN covers c ON c.issue_id = i.id AND c.position = 1
      WHERE p.name_normalized = ?
        AND i.issue_date_start IS NOT NULL
        AND i.brand IS NOT NULL
        AND i.brand NOT LIKE 'REP%'
        ${visibleImageBrandSql("i")}
      ORDER BY i.issue_date_start DESC,
        CASE WHEN c.local_path IS NOT NULL THEN 0 WHEN c.image_url LIKE '%pixhost%' THEN 1 ELSE 2 END,
        c.id ASC
      LIMIT 12
    `).all(performerKey) as Array<{ brand: string; issue_date_start: string; image_url: string | null; local_path: string | null }>;

    const portraitUrl = getPerformerPortraitUrls(db, [{
      key: stat.performer_key,
      name: stat.performer_name,
      portraitLocalPath: imageRow?.local_path,
    }]).get(stat.performer_key);
    const coverCardImageUrl = portraitUrl
      ? undefined
      : getModelCardCoverFallbacks(db, [{ key: stat.performer_key, name: stat.performer_name }], { coverOnly: true }).get(stat.performer_key);
    const coverImageUrl = coverRows
      .map((r) => resolveIssueCoverImageUrl(r.image_url, r.local_path, r.brand, r.issue_date_start))
      .find((url): url is string => !!url);
    const cardCoverImageUrl = (coverCardImageUrl || portraitUrl || coverImageUrl)
      ? undefined
      : getModelCardCoverFallbacks(db, [{ key: stat.performer_key, name: stat.performer_name }]).get(stat.performer_key);

    const recentRows = db.prepare(`
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized,
        (SELECT c.image_url FROM covers c WHERE c.issue_id = i.id AND c.position = 1 LIMIT 1) AS coverImageUrl,
        (SELECT REPLACE(REPLACE(e.url, 's-rocket-22', 'magazinelab-22'), 'dummy-22', 'magazinelab-22')
         FROM source_post_external_links e
         JOIN source_posts sp ON sp.id = e.source_post_id
         WHERE e.provider = 'amazon' AND e.asin IS NOT NULL AND e.asin != ''
           AND UPPER(sp.brand_normalized) = UPPER(i.brand)
           AND sp.title LIKE '%' || p.name_jp || '%'
         ORDER BY sp.release_date DESC
         LIMIT 1) AS amazonUrl,
        COALESCE(
          (SELECT e.url
           FROM source_post_external_links e
           JOIN source_posts sp ON sp.id = e.source_post_id
           WHERE e.provider = 'rakuten-books'
             AND UPPER(sp.brand_normalized) = UPPER(i.brand)
             AND sp.title LIKE '%' || p.name_jp || '%'
           ORDER BY sp.release_date DESC
           LIMIT 1),
          (SELECT e.url FROM issue_external_links e
           WHERE e.issue_id = i.id AND e.provider = 'rakuten-books' LIMIT 1)
        ) AS rakutenUrl
      FROM issue_performers ip
      JOIN issues i ON i.id = ip.issue_id
      JOIN performers p ON p.id = ip.performer_id
      WHERE p.name_normalized = ? AND i.issue_date_start IS NOT NULL AND i.brand IS NOT NULL AND i.brand NOT LIKE 'REP%'
      ORDER BY i.issue_date_start DESC
      LIMIT 12
    `).all(performerKey) as Array<{
      id: number;
      title: string;
      brand: string;
      issue_date_start: string;
      issue_no_normalized: string | null;
      coverImageUrl: string | null;
      amazonUrl: string | null;
      rakutenUrl: string | null;
    }>;

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

    const recentIssues: MhMagazine[] = recentRows.map((r) => {
      const key = `${r.brand}-${r.id}`;
      const badge: MhMagazine["badge"] =
        r.issue_date_start > today ? "preorder"
        : r.issue_date_start >= thirtyDaysAgo ? "new"
        : undefined;
      const featureTitle = r.title.replace(
        new RegExp(`^\\[?${r.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]?\\s*[\\d.\\s-]*`, "u"),
        ""
      ).trim() || r.title;
      return {
        slug: `issue-${r.id}`,
        title: cleanFeatureTitle(featureTitle),
        seriesName: r.brand,
        issue: r.issue_no_normalized || r.issue_date_start,
        releaseDate: r.issue_date_start,
        gradient: { c1: colorFromHash(key, 35, 72), c2: colorFromHash(key + "2", 30, 58) },
        badge,
        coverImageUrl: resolveCoverImageUrl(r.coverImageUrl, r.brand, r.issue_date_start),
        amazonUrl: normalizeRetailUrl(r.amazonUrl),
        rakutenUrl: normalizeRetailUrl(r.rakutenUrl),
      };
    });

    const key = stat.performer_key;
    return {
      slug: encodeURIComponent(key),
      name: stat.performer_name,
      nameYomi: profile?.yomigana || key,
      tags: [],
      stats: {
        issues: stat.appearance_count,
        covers: stat.cover_count,
        brands: stat.brand_count,
        firstDate: stat.first_date,
        lastDate: stat.last_date,
      },
      profile: {
        birthday: profile?.birthday || undefined,
        height: profile?.height || undefined,
        bust: profile?.bust || undefined,
        waist: profile?.waist || undefined,
        hip: profile?.hip || undefined,
        birthplace: profile?.birthplace || undefined,
        debutYear: profile?.debut_year || undefined,
      },
      gradient: {
        c1: colorFromHash(key, 42, 78),
        c2: colorFromHash(key + "2", 38, 68),
        c3: colorFromHash(key + "3", 40, 73),
        c4: colorFromHash(key + "4", 36, 63),
      },
      imageUrl: portraitUrl ?? coverCardImageUrl ?? coverImageUrl ?? cardCoverImageUrl,
      recentIssues,
    };
  } catch {
    return null;
  }
}

export type MhIssueDetail = {
  id: number;
  slug: string;
  title: string;
  seriesName: string;
  issue: string;
  releaseDate: string;
  badge?: "new" | "preorder" | "reissue";
  gradient: { c1: string; c2: string };
  coverImageUrl?: string;
  rakutenUrl?: string;
  amazonUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  directLinkCount?: number;
  performers: Array<{ key: string; name: string; slug: string; gradient: { c1: string; c2: string; c3: string; c4: string }; imageUrl?: string }>;
  backnumbers: MhMagazine[];
};

export function getIssueDetail(issueId: number): MhIssueDetail | null {
  const db = getDb();
  if (!db) return null;
  try {
    const row = db.prepare(`
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized,
        (SELECT c.image_url FROM covers c WHERE c.issue_id = i.id AND c.position = 1 LIMIT 1) AS coverImageUrl
      FROM issues i WHERE i.id = ?
    `).get(issueId) as { id: number; title: string; brand: string; issue_date_start: string; issue_no_normalized: string | null; coverImageUrl: string | null } | undefined;
    if (!row) return null;

    const performers = db.prepare(`
      SELECT p.name_normalized as performer_key, p.name_jp as performer_name,
        (SELECT pi.local_path FROM performer_images pi WHERE pi.performer_id = p.id AND pi.position = 0 LIMIT 1) AS imageLocalPath
      FROM issue_performers ip
      JOIN performers p ON p.id = ip.performer_id
      WHERE ip.issue_id = ?
      ORDER BY ip.position ASC
    `).all(issueId) as Array<{ performer_key: string; performer_name: string; imageLocalPath: string | null }>;

    const backnumberRows = db.prepare(`
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized,
        (SELECT c.image_url FROM covers c WHERE c.issue_id = i.id AND c.position = 1 LIMIT 1) AS coverImageUrl
      FROM issues i
      WHERE i.brand = ? AND i.id != ? AND i.issue_date_start IS NOT NULL
      ORDER BY i.issue_date_start DESC
      LIMIT 9
    `).all(row.brand, issueId) as Array<{ id: number; title: string; brand: string; issue_date_start: string; issue_no_normalized: string | null; coverImageUrl: string | null }>;

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

    const badge: MhMagazine["badge"] =
      row.issue_date_start > today ? "preorder"
      : row.issue_date_start >= thirtyDaysAgo ? "new"
      : undefined;

    const key = `${row.brand}-${row.id}`;
    const featureTitle = row.title.replace(
      new RegExp(`^\\[?${row.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]?\\s*[\\d.\\s-]*`, "u"),
      ""
    ).trim() || row.title;

    const backnumbers: MhMagazine[] = backnumberRows.map((r) => {
      const bKey = `${r.brand}-${r.id}`;
      const bBadge: MhMagazine["badge"] =
        r.issue_date_start > today ? "preorder"
        : r.issue_date_start >= thirtyDaysAgo ? "new"
        : undefined;
      const bTitle = r.title.replace(
        new RegExp(`^\\[?${r.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]?\\s*[\\d.\\s-]*`, "u"),
        ""
      ).trim() || r.title;
      return {
        slug: `issue-${r.id}`,
        title: bTitle,
        seriesName: r.brand,
        issue: r.issue_no_normalized || r.issue_date_start,
        releaseDate: r.issue_date_start,
        gradient: { c1: colorFromHash(bKey, 35, 72), c2: colorFromHash(bKey + "2", 30, 58) },
        badge: bBadge,
        coverImageUrl: resolveCoverImageUrl(r.coverImageUrl, r.brand, r.issue_date_start),
      };
    });

    // Match Amazon and Rakuten via performer names in idolz source_post titles.
    // More accurate than date-based matching because issue_date_start is the cover date
    // while source_post.release_date is the sale date (offset ~14 days for weekly magazines).
    const amazonRow = db.prepare(`
      SELECT REPLACE(REPLACE(e.url, 's-rocket-22', 'magazinelab-22'), 'dummy-22', 'magazinelab-22') AS url
      FROM source_post_external_links e
      JOIN source_posts sp ON sp.id = e.source_post_id
      JOIN issue_performers ip ON ip.issue_id = ?
      JOIN performers p ON p.id = ip.performer_id
      WHERE e.provider = 'amazon' AND e.asin IS NOT NULL AND e.asin != ''
        AND UPPER(sp.brand_normalized) = UPPER(?)
        AND sp.title LIKE '%' || p.name_jp || '%'
      ORDER BY ip.position ASC
      LIMIT 1
    `).get(issueId, row.brand) as { url: string } | undefined;

    const rakutenPerformerRow = db.prepare(`
      SELECT e.url
      FROM source_post_external_links e
      JOIN source_posts sp ON sp.id = e.source_post_id
      JOIN issue_performers ip ON ip.issue_id = ?
      JOIN performers p ON p.id = ip.performer_id
      WHERE e.provider = 'rakuten-books'
        AND UPPER(sp.brand_normalized) = UPPER(?)
        AND sp.title LIKE '%' || p.name_jp || '%'
      ORDER BY ip.position ASC
      LIMIT 1
    `).get(issueId, row.brand) as { url: string } | undefined;

    const rakutenRow = rakutenPerformerRow ?? (db.prepare(
      `SELECT url FROM issue_external_links WHERE issue_id = ? AND provider = 'rakuten-books' LIMIT 1`
    ).get(issueId) as { url: string } | undefined);
    const performerIconUrls = getPerformerIconUrls(
      db,
      performers.map((p) => ({
        key: p.performer_key,
        name: p.performer_name || p.performer_key,
        portraitLocalPath: p.imageLocalPath,
      })),
    );

    return {
      id: row.id,
      slug: `issue-${row.id}`,
      title: cleanFeatureTitle(featureTitle),
      seriesName: row.brand,
      issue: row.issue_no_normalized || row.issue_date_start,
      releaseDate: row.issue_date_start,
      badge,
      gradient: { c1: colorFromHash(key, 35, 72), c2: colorFromHash(key + "2", 30, 58) },
      coverImageUrl: resolveCoverImageUrl(row.coverImageUrl, row.brand, row.issue_date_start),
      rakutenUrl: normalizeRetailUrl(rakutenRow?.url),
      amazonUrl: normalizeRetailUrl(amazonRow?.url),
      performers: performers.map((p) => ({
        key: p.performer_key,
        name: p.performer_name || p.performer_key,
        slug: encodeURIComponent(p.performer_key),
        gradient: {
          c1: colorFromHash(p.performer_key, 42, 78),
          c2: colorFromHash(p.performer_key + "2", 38, 68),
          c3: colorFromHash(p.performer_key + "3", 40, 73),
          c4: colorFromHash(p.performer_key + "4", 36, 63),
        },
        imageUrl: performerIconUrls.get(p.performer_key),
      })),
      backnumbers,
    };
  } catch {
    return null;
  }
}

export function getMagazineCardDetail(cardId: number): MhIssueDetail | null {
  const db = getDb();
  if (!db) return null;
  try {
    const row = db.prepare(`
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
        (SELECT COUNT(*) FROM magazine_card_links l
         WHERE l.card_id = mc.id AND l.link_kind = 'retail'
           AND l.provider IN ('amazon', 'amazon-kindle', 'rakuten-books', 'rakuten-product', 'rakuten-kobo')) AS directLinkCount
      FROM magazine_cards mc
      WHERE mc.id = ? AND mc.source = 'idolz'
      LIMIT 1
    `).get(cardId) as MagazineCardRow | undefined;
    if (!row) return null;

    const performerRows = db.prepare(`
      SELECT performer_name
      FROM magazine_card_performers
      WHERE card_id = ?
      ORDER BY position ASC
      LIMIT 24
    `).all(cardId) as Array<{ performer_name: string }>;

    const backnumberRows = db.prepare(`
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
        (SELECT COUNT(*) FROM magazine_card_links l
         WHERE l.card_id = mc.id AND l.link_kind = 'retail'
           AND l.provider IN ('amazon', 'amazon-kindle', 'rakuten-books', 'rakuten-product', 'rakuten-kobo')) AS directLinkCount
      FROM magazine_cards mc
      WHERE mc.source = 'idolz' AND mc.brand = ? AND mc.id != ? AND mc.date IS NOT NULL
      ORDER BY mc.date DESC, mc.id DESC
      LIMIT 9
    `).all(row.brand, cardId) as MagazineCardRow[];

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    const badge: MhMagazine["badge"] =
      row.date > today ? "preorder"
      : row.date >= thirtyDaysAgo ? "new"
      : undefined;
    const key = `${row.brand}-${row.id}`;
    const performerIconUrls = getPerformerIconUrls(
      db,
      performerRows.map((p) => ({ key: p.performer_name, name: p.performer_name })),
    );

    return {
      id: row.id,
      slug: `card-${row.id}`,
      title: cleanCardFeatureTitle(row.title, row.brand),
      seriesName: row.brand,
      issue: row.issue_no || row.date,
      releaseDate: row.date,
      badge,
      gradient: { c1: colorFromHash(key, 35, 72), c2: colorFromHash(key + "2", 30, 58) },
      coverImageUrl: resolveCardCoverImageUrl(row.coverUrl, row.coverLocalPath, row.brand),
      rakutenUrl: normalizeRetailUrl(row.rakutenUrl),
      amazonUrl: normalizeRetailUrl(row.amazonUrl),
      sourceName: "idolz",
      sourceUrl: row.url ?? undefined,
      directLinkCount: row.directLinkCount,
      performers: performerRows.map((p) => ({
        key: p.performer_name,
        name: p.performer_name,
        slug: encodeURIComponent(p.performer_name),
        gradient: {
          c1: colorFromHash(p.performer_name, 42, 78),
          c2: colorFromHash(p.performer_name + "2", 38, 68),
          c3: colorFromHash(p.performer_name + "3", 40, 73),
          c4: colorFromHash(p.performer_name + "4", 36, 63),
        },
        imageUrl: performerIconUrls.get(p.performer_name),
      })),
      backnumbers: backnumberRows.map(mapMagazineCardRow),
    };
  } catch {
    return null;
  }
}

export type MhBrand = {
  name: string;
  slug: string;
  issueCount: number;
  latestDate: string;
  coverImageUrl?: string;
  gradient: { c1: string; c2: string };
};

export function getBrands(): MhBrand[] {
  const db = getDb();
  if (!db) return [];
  try {
    // Three separate queries are faster than correlated subqueries over 70k covers.

    // 1. Aggregated brand stats
    const rows = db.prepare(`
      SELECT i.brand, COUNT(*) AS issue_count, MAX(i.issue_date_start) AS latest_date
      FROM issues i
      WHERE i.brand IS NOT NULL AND i.issue_date_start IS NOT NULL AND i.brand NOT LIKE 'REP%'
      GROUP BY i.brand
      ORDER BY MAX(i.issue_date_start) DESC
    `).all() as Array<{ brand: string; issue_count: number; latest_date: string }>;

    // 2. Latest cover per brand (single table scan using SQLite GROUP BY + MAX trick)
    const latestCoverRows = db.prepare(`
      SELECT i.brand, c.image_url, MAX(i.issue_date_start) AS issue_date_start
      FROM covers c
      JOIN issues i ON i.id = c.issue_id
      WHERE c.position = 1 AND i.brand IS NOT NULL AND i.brand NOT LIKE 'REP%'
      GROUP BY i.brand
    `).all() as Array<{ brand: string; image_url: string; issue_date_start: string }>;
    const latestCover = new Map(latestCoverRows.map((r) => [r.brand, r]));

    // 3. Latest pixhost cover per brand (single scan with LIKE filter)
    const pixhostRows = db.prepare(`
      SELECT i.brand, c.image_url, MAX(i.issue_date_start) AS issue_date_start
      FROM covers c
      JOIN issues i ON i.id = c.issue_id
      WHERE c.position = 1 AND c.image_url LIKE '%pixhost%' AND i.brand IS NOT NULL
      GROUP BY i.brand
    `).all() as Array<{ brand: string; image_url: string; issue_date_start: string }>;
    const pixhostCover = new Map(pixhostRows.map((r) => [r.brand, r]));

    return rows.map((r) => {
      const cover = latestCover.get(r.brand);
      if (shouldSuppressIssueImages(r.brand)) {
        return {
          name: r.brand,
          slug: encodeURIComponent(r.brand),
          issueCount: r.issue_count,
          latestDate: r.latest_date,
          gradient: { c1: colorFromHash(r.brand, 35, 72), c2: colorFromHash(r.brand + "2", 30, 58) },
        };
      }
      const xidolFromLatest = buildXidolCoversUrlIfExists(cover?.image_url, r.brand, cover?.issue_date_start ?? r.latest_date);
      const directCover = xidolFromLatest ? undefined : filterCoverUrl(cover?.image_url);
      const pixhostData = pixhostCover.get(r.brand);
      const pixhostDirect = (directCover || xidolFromLatest) ? undefined : filterCoverUrl(pixhostData?.image_url);
      return {
        name: r.brand,
        slug: encodeURIComponent(r.brand),
        issueCount: r.issue_count,
        latestDate: r.latest_date,
        coverImageUrl: localPathToUrl(xidolFromLatest) ?? directCover ?? pixhostDirect,
        gradient: { c1: colorFromHash(r.brand, 35, 72), c2: colorFromHash(r.brand + "2", 30, 58) },
      };
    });
  } catch {
    return [];
  }
}

export function getIssuesByBrand(brand: string, limit = 200): MhMagazine[] {
  const idolz = getIdolzMagazines(limit, brand);
  const fallbackLimit = Math.max(0, limit - idolz.length);
  if (fallbackLimit === 0) return idolz;

  const db = getDb();
  if (!db) return idolz;
  try {
    const rows = db.prepare(`
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized,
        (SELECT c.image_url FROM covers c WHERE c.issue_id = i.id AND c.position = 1 LIMIT 1) AS coverImageUrl,
        (SELECT pi.local_path FROM performer_images pi
         JOIN performers p ON p.id = pi.performer_id
         JOIN issue_performers ip ON ip.performer_id = p.id
         WHERE ip.issue_id = i.id AND pi.position = 0
         ORDER BY ip.position ASC LIMIT 1) AS performerImagePath,
        (SELECT e.url FROM issue_external_links e
         WHERE e.issue_id = i.id AND e.provider = 'rakuten-books' LIMIT 1) AS rakutenDirectUrl
      FROM issues i
      WHERE i.brand = ? AND i.issue_date_start IS NOT NULL
      ORDER BY i.issue_date_start DESC
      LIMIT ?
    `).all(brand, fallbackLimit) as Array<{
      id: number;
      title: string;
      brand: string;
      issue_date_start: string;
      issue_no_normalized: string | null;
      coverImageUrl: string | null;
      performerImagePath: string | null;
      rakutenDirectUrl: string | null;
    }>;

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

    const fallback = rows.map((r) => {
      const key = `${r.brand}-${r.id}`;
      const badge: MhMagazine["badge"] =
        r.issue_date_start > today ? "preorder"
        : r.issue_date_start >= thirtyDaysAgo ? "new"
        : undefined;
      const featureTitle = r.title.replace(
        new RegExp(`^\\[?${r.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]?\\s*[\\d.\\s-]*`, "u"),
        ""
      ).trim() || r.title;
      return {
        slug: `issue-${r.id}`,
        title: cleanFeatureTitle(featureTitle),
        seriesName: r.brand,
        issue: r.issue_no_normalized || r.issue_date_start,
        releaseDate: r.issue_date_start,
        gradient: { c1: colorFromHash(key, 35, 72), c2: colorFromHash(key + "2", 30, 58) },
        badge,
        coverImageUrl: resolveCoverImageUrl(r.coverImageUrl, r.brand, r.issue_date_start, r.performerImagePath),
        rakutenUrl: r.rakutenDirectUrl ?? undefined,
      };
    });
    return [...idolz, ...fallback].slice(0, limit);
  } catch {
    return idolz;
  }
}

export function getAllModelSlugs(): string[] {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db.prepare(
      `SELECT performer_key FROM performer_stats ORDER BY appearance_count DESC`
    ).all() as Array<{ performer_key: string }>;
    return rows.map((r) => encodeURIComponent(r.performer_key));
  } catch {
    return [];
  }
}

export function getAllIssueIds(): Array<{ id: number; date: string }> {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db.prepare(
      `SELECT id, issue_date_start FROM issues WHERE issue_date_start IS NOT NULL AND brand IS NOT NULL AND brand NOT LIKE 'REP%' ORDER BY issue_date_start DESC`
    ).all() as Array<{ id: number; issue_date_start: string }>;
    return rows.map((r) => ({ id: r.id, date: r.issue_date_start }));
  } catch {
    return [];
  }
}

export function searchModels(query: string, limit = 30): MhModel[] {
  const db = getDb();
  if (!db || !query.trim()) return [];
  try {
    const q = `%${query}%`;
    const rows = db.prepare(`
      SELECT ps.performer_key, ps.performer_name, ps.appearance_count, ps.cover_count,
        (SELECT pi.local_path FROM performer_images pi
         JOIN performers p ON p.id = pi.performer_id
         WHERE p.name_normalized = ps.performer_key AND pi.position = 0
         LIMIT 1) AS imageLocalPath
      FROM performer_stats ps
      WHERE ps.performer_name LIKE ? OR ps.performer_key LIKE ?
      ORDER BY ps.appearance_count DESC
      LIMIT ?
    `).all(q, q, limit) as Array<{
      performer_key: string;
      performer_name: string;
      appearance_count: number;
      cover_count: number;
      imageLocalPath: string | null;
    }>;
    const performers = rows.map((r) => ({ key: r.performer_key, name: r.performer_name, portraitLocalPath: r.imageLocalPath }));
    const portraitUrls = getPerformerPortraitUrls(db, performers);
    const rowsWithoutPortrait = rows.filter((r) => !portraitUrls.get(r.performer_key));
    const coverCardFallbacks = getModelCardCoverFallbacks(
      db,
      rowsWithoutPortrait.map((r) => ({ key: r.performer_key, name: r.performer_name })),
      { coverOnly: true },
    );
    const rowsWithoutPrimary = rows.filter((r) => !coverCardFallbacks.get(r.performer_key) && !portraitUrls.get(r.performer_key));
    const coverFallbacks = getModelCoverFallbacks(
      db,
      rowsWithoutPrimary.map((r) => r.performer_key),
    );
    const cardCoverFallbacks = getModelCardCoverFallbacks(
      db,
      rowsWithoutPrimary
        .filter((r) => !coverFallbacks.get(r.performer_key))
        .map((r) => ({ key: r.performer_key, name: r.performer_name })),
    );
    return rows.map((r) => ({
      slug: encodeURIComponent(r.performer_key),
      name: r.performer_name,
      nameYomi: r.performer_key,
      tags: [],
      stats: { issues: r.appearance_count, covers: r.cover_count },
      gradient: {
        c1: colorFromHash(r.performer_key, 42, 78),
        c2: colorFromHash(r.performer_key + "2", 38, 68),
        c3: colorFromHash(r.performer_key + "3", 40, 73),
        c4: colorFromHash(r.performer_key + "4", 36, 63),
      },
      imageUrl: portraitUrls.get(r.performer_key) ?? coverCardFallbacks.get(r.performer_key) ?? coverFallbacks.get(r.performer_key) ?? cardCoverFallbacks.get(r.performer_key),
    }));
  } catch {
    return [];
  }
}

export function searchIssues(query: string, limit = 30): MhMagazine[] {
  const db = getDb();
  if (!db || !query.trim()) return [];
  try {
    const q = `%${query}%`;
    const rows = db.prepare(`
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized,
        (SELECT c.image_url FROM covers c WHERE c.issue_id = i.id AND c.position = 1 LIMIT 1) AS coverImageUrl
      FROM issues i
      WHERE (i.title LIKE ? OR i.brand LIKE ?) AND i.issue_date_start IS NOT NULL AND i.brand IS NOT NULL AND i.brand NOT LIKE 'REP%'
      ORDER BY i.issue_date_start DESC
      LIMIT ?
    `).all(q, q, limit) as Array<{
      id: number;
      title: string;
      brand: string;
      issue_date_start: string;
      issue_no_normalized: string | null;
      coverImageUrl: string | null;
    }>;

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

    return rows.map((r) => {
      const key = `${r.brand}-${r.id}`;
      const badge: MhMagazine["badge"] =
        r.issue_date_start > today ? "preorder"
        : r.issue_date_start >= thirtyDaysAgo ? "new"
        : undefined;
      const featureTitle = r.title.replace(
        new RegExp(`^\\[?${r.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]?\\s*[\\d.\\s-]*`, "u"),
        ""
      ).trim() || r.title;
      return {
        slug: `issue-${r.id}`,
        title: cleanFeatureTitle(featureTitle),
        seriesName: r.brand,
        issue: r.issue_no_normalized || r.issue_date_start,
        releaseDate: r.issue_date_start,
        gradient: { c1: colorFromHash(key, 35, 72), c2: colorFromHash(key + "2", 30, 58) },
        badge,
        coverImageUrl: resolveCoverImageUrl(r.coverImageUrl, r.brand, r.issue_date_start),
      };
    });
  } catch {
    return [];
  }
}

export function getRecentIssues(limit = 60): MhMagazine[] {
  const idolz = getIdolzMagazines(limit);
  const fallbackLimit = Math.max(0, limit - idolz.length);
  if (fallbackLimit === 0) return idolz;

  const db = getDb();
  if (!db) return idolz;
  try {
    const rows = db.prepare(`
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized,
        (SELECT c.image_url FROM covers c WHERE c.issue_id = i.id AND c.position = 1 LIMIT 1) AS coverImageUrl,
        (SELECT pi.local_path FROM performer_images pi
         JOIN performers p ON p.id = pi.performer_id
         JOIN issue_performers ip ON ip.performer_id = p.id
         WHERE ip.issue_id = i.id AND pi.position = 0
         ORDER BY ip.position ASC LIMIT 1) AS performerImagePath,
        (SELECT e.url FROM issue_external_links e
         WHERE e.issue_id = i.id AND e.provider = 'rakuten-books' LIMIT 1) AS rakutenDirectUrl
      FROM issues i
      WHERE i.issue_date_start IS NOT NULL AND i.brand IS NOT NULL AND i.brand NOT LIKE 'REP%'
      ORDER BY i.issue_date_start DESC
      LIMIT ?
    `).all(fallbackLimit) as Array<{
      id: number;
      title: string;
      brand: string;
      issue_date_start: string;
      issue_no_normalized: string | null;
      coverImageUrl: string | null;
      performerImagePath: string | null;
      rakutenDirectUrl: string | null;
    }>;

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

    const fallback = rows.map((r) => {
      const key = `${r.brand}-${r.id}`;
      const badge: MhMagazine["badge"] =
        r.issue_date_start > today ? "preorder"
        : r.issue_date_start >= thirtyDaysAgo ? "new"
        : undefined;
      // Strip brand prefix from title to get the model names
      const featureTitle = r.title.replace(
        new RegExp(`^\\[?${r.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]?\\s*[\\d.\\s-]*`, "u"),
        ""
      ).trim() || r.title;
      return {
        slug: `issue-${r.id}`,
        title: cleanFeatureTitle(featureTitle),
        seriesName: r.brand,
        issue: r.issue_no_normalized || r.issue_date_start,
        releaseDate: r.issue_date_start,
        gradient: {
          c1: colorFromHash(key, 35, 72),
          c2: colorFromHash(key + "2", 30, 58),
        },
        badge,
        coverImageUrl: resolveCoverImageUrl(r.coverImageUrl, r.brand, r.issue_date_start, r.performerImagePath),
        rakutenUrl: r.rakutenDirectUrl ?? undefined,
      };
    });
    return [...idolz, ...fallback].slice(0, limit);
  } catch {
    return idolz;
  }
}

export type MhSiteStats = {
  models: number;
  issues: number;
  covers: number;
  brands: number;
};

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

export type MhTrending = {
  key: string;
  name: string;
  imageUrl?: string;
  c1: string;
  c2: string;
  totalPubs: number;
  firstDate?: string;
  recent6: number;
  prior6: number;
  score: number;
  monthly: number[];
};

export type MhModelRelation = {
  model: MhModel;
  count: number;
};

export type MhBirthday = {
  key: string;
  name: string;
  birthday: string;
  month: number;
  day: number;
  imageUrl?: string;
  c1: string;
  c2: string;
  pubCount: number;
};

type RelatedModelRow = {
  performer_key: string;
  performer_name: string;
  appearance_count: number | null;
  cover_count: number | null;
  relation_count: number;
  imageLocalPath?: string | null;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDateAtDelta(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
}

function addYearsIso(isoDate: string, years: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year + years, month - 1, day));
  return date.toISOString().slice(0, 10);
}

function recentMonthKeys(count: number): string[] {
  const today = todayIso();
  const [year, month] = today.slice(0, 7).split("-").map(Number);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(year, month - 1 - i, 1));
    months.push(date.toISOString().slice(0, 7));
  }
  return months;
}

function normalizePublicationKind(kind: string | null | undefined): MhUpcoming["kind"] {
  if (kind === "photobook" || kind === "digital_photobook") return kind;
  return "magazine";
}

function buildAmazonAsinUrl(asin: string | null | undefined): string | undefined {
  const clean = asin?.trim();
  if (!clean) return undefined;
  return normalizeRetailUrl(`https://www.amazon.co.jp/dp/${encodeURIComponent(clean)}?tag=magazinelab-22`);
}

function buildRakutenProductUrl(productId: string | null | undefined): string | undefined {
  const clean = productId?.trim();
  if (!clean) return undefined;
  if (/^\d+$/.test(clean)) return `https://item.rakuten.co.jp/book/${encodeURIComponent(clean)}/`;
  return `https://product.rakuten.co.jp/product/-/${encodeURIComponent(clean)}/`;
}

function mapModelRelationRows(db: DatabaseSync, rows: RelatedModelRow[]): MhModelRelation[] {
  const performers = rows.map((row) => ({
    key: row.performer_key,
    name: row.performer_name || row.performer_key,
    portraitLocalPath: row.imageLocalPath,
  }));
  const imageUrls = getPerformerIconUrls(db, performers);

  return rows.map((row) => {
    const key = row.performer_key;
    return {
      count: row.relation_count,
      model: {
        slug: encodeURIComponent(key),
        name: row.performer_name || key,
        nameYomi: key,
        tags: [],
        stats: {
          issues: row.appearance_count ?? row.relation_count,
          covers: row.cover_count ?? 0,
        },
        gradient: {
          c1: colorFromHash(key, 42, 78),
          c2: colorFromHash(`${key}2`, 38, 68),
          c3: colorFromHash(`${key}3`, 40, 73),
          c4: colorFromHash(`${key}4`, 36, 63),
        },
        imageUrl: imageUrls.get(key),
      },
    };
  });
}

function getPopularModelRelations(db: DatabaseSync, excludeKeys: string[], limit: number): MhModelRelation[] {
  if (limit <= 0) return [];
  const uniqueExcludes = Array.from(new Set(excludeKeys.filter(Boolean)));
  const placeholders = uniqueExcludes.map(() => "?").join(",");
  const excludeClause = placeholders ? `WHERE ps.performer_key NOT IN (${placeholders})` : "";
  const queryLimit = Math.max(limit * 3, limit + 12);
  const rows = db.prepare(`
    SELECT ps.performer_key, ps.performer_name, ps.appearance_count, ps.cover_count, 0 AS relation_count,
      (SELECT pi.local_path FROM performer_images pi
       JOIN performers p ON p.id = pi.performer_id
       WHERE p.name_normalized = ps.performer_key AND pi.position = 0
       LIMIT 1) AS imageLocalPath
    FROM performer_stats ps
    ${excludeClause}
    ORDER BY ps.appearance_count DESC
    LIMIT ?
  `).all(...uniqueExcludes, queryLimit) as RelatedModelRow[];
  return mapModelRelationRows(db, rows)
    .filter((item) => isDisplayPerformerKey(item.model.nameYomi))
    .slice(0, limit);
}

function parseJapaneseBirthday(value: string): { month: number; day: number } | null {
  const match = value.match(/(\d{1,2})月(\d{1,2})日/u);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

function getBirthdays(month: number, day?: number): MhBirthday[] {
  if (month < 1 || month > 12) return [];
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT p.name_normalized AS performer_key,
        COALESCE(ps.performer_name, pp.name, p.name_jp) AS performer_name,
        pp.birthday,
        COALESCE(pa.pub_count, ps.appearance_count, 0) AS pub_count,
        (SELECT pi.local_path FROM performer_images pi
         WHERE pi.performer_id = p.id AND pi.position = 0
         LIMIT 1) AS imageLocalPath
      FROM performer_profiles pp
      JOIN performers p ON p.id = pp.performer_id
      JOIN performer_stats ps ON ps.performer_key = p.name_normalized
      LEFT JOIN performer_appearances pa ON pa.performer_id = p.id
      WHERE p.name_normalized IS NOT NULL
        AND p.name_normalized != ''
        AND pp.birthday IS NOT NULL
        AND pp.birthday != ''
    `).all() as Array<{
      performer_key: string;
      performer_name: string;
      birthday: string;
      pub_count: number;
      imageLocalPath: string | null;
    }>;

    const filtered = rows
      .map((row) => ({ row, parsed: parseJapaneseBirthday(row.birthday) }))
      .filter((item): item is { row: typeof rows[number]; parsed: { month: number; day: number } } => {
        return isDisplayPerformerKey(item.row.performer_key)
          && !!item.parsed
          && item.parsed.month === month
          && (day === undefined || item.parsed.day === day);
      })
      .sort((a, b) => b.row.pub_count - a.row.pub_count);

    const imageUrls = getPerformerPortraitUrls(
      db,
      filtered.map(({ row }) => ({
        key: row.performer_key,
        name: row.performer_name,
        portraitLocalPath: row.imageLocalPath,
      })),
    );

    return filtered.map(({ row, parsed }) => ({
      key: row.performer_key,
      name: row.performer_name,
      birthday: row.birthday,
      month: parsed.month,
      day: parsed.day,
      imageUrl: imageUrls.get(row.performer_key),
      c1: colorFromHash(row.performer_key, 42, 78),
      c2: colorFromHash(`${row.performer_key}2`, 38, 68),
      pubCount: row.pub_count,
    }));
  } catch {
    return [];
  }
}

export function getSiteStats(): MhSiteStats {
  return cachedHeavy("getSiteStats", () => {
    const db = getDb();
    if (!db) return { models: 0, issues: 0, covers: 0, brands: 0 };
    try {
      const models = db.prepare("SELECT COUNT(*) AS n FROM performer_appearances").get() as { n: number };
      const issues = db.prepare("SELECT COUNT(*) AS n FROM magazine_cards").get() as { n: number };
      const covers = db.prepare("SELECT COUNT(*) AS n FROM magazine_card_covers").get() as { n: number };
      const brands = db.prepare(`
        SELECT COUNT(DISTINCT brand) AS n
        FROM magazine_cards
        WHERE brand IS NOT NULL AND brand != ''
      `).get() as { n: number };
      return {
        models: models.n,
        issues: issues.n,
        covers: covers.n,
        brands: brands.n,
      };
    } catch {
      return { models: 0, issues: 0, covers: 0, brands: 0 };
    }
  });
}

export function getUpcomingReleases(days = 210): MhUpcoming[] {
  return cachedHeavy(`getUpcomingReleases:${days}`, () => {
    const db = getDb();
    if (!db) return [];
    try {
      const today = todayIso();
      const maxDate = isoDateAtDelta(days);
      const rows = db.prepare(`
        SELECT p.id AS publicationId,
          p.release_date AS date,
          COALESCE(NULLIF(p.official_title, ''), NULLIF(p.jpo_title, ''), p.title, '') AS title,
          COALESCE(NULLIF(p.display_brand, ''), p.canonical_brand, '') AS brand,
          p.publication_kind AS kind,
          COALESCE(NULLIF(p.publisher, ''), NULLIF(p.publisher_official, ''), NULLIF(p.jpo_publisher, '')) AS publisher,
          NULLIF(p.performer_key, '') AS performerKey,
          p.asin_print AS asinPrint,
          p.asin_ebook AS asinEbook,
          p.rakuten_product_id AS rakutenProductId,
          mc.id AS cardId,
          mc.brand AS cardBrand,
          (SELECT c.cover_url FROM magazine_card_covers c
           WHERE c.card_id = mc.id ORDER BY c.position ASC LIMIT 1) AS coverUrl,
          (SELECT c.local_path FROM magazine_card_covers c
           WHERE c.card_id = mc.id AND c.local_path IS NOT NULL ORDER BY c.position ASC LIMIT 1) AS coverLocalPath,
          (SELECT l.url FROM magazine_card_links l
           WHERE l.card_id = mc.id AND l.link_kind = 'retail' AND l.provider IN ('amazon', 'amazon-kindle')
           ORDER BY CASE WHEN l.provider = 'amazon' THEN 0 ELSE 1 END, l.position ASC LIMIT 1) AS cardAmazonUrl,
          (SELECT l.url FROM magazine_card_links l
           WHERE l.card_id = mc.id AND l.link_kind = 'retail' AND l.provider IN ('rakuten-books', 'rakuten-product', 'rakuten-kobo')
           ORDER BY CASE l.provider WHEN 'rakuten-books' THEN 0 WHEN 'rakuten-product' THEN 1 ELSE 2 END, l.position ASC LIMIT 1) AS cardRakutenUrl,
          (SELECT pml.performer_key FROM performer_magazine_links pml
           WHERE pml.publication_id = p.id
           ORDER BY pml.is_cover DESC, pml.date DESC, pml.magazine_card_id DESC LIMIT 1) AS linkPerformerKey,
          (SELECT pml.performer_name FROM performer_magazine_links pml
           WHERE pml.publication_id = p.id
           ORDER BY pml.is_cover DESC, pml.date DESC, pml.magazine_card_id DESC LIMIT 1) AS linkPerformerName
        FROM publications p
        LEFT JOIN magazine_cards mc ON mc.id = (
          SELECT mc2.id FROM magazine_cards mc2
          WHERE mc2.publication_id = p.id
          ORDER BY mc2.date DESC, mc2.id DESC
          LIMIT 1
        )
        WHERE p.release_date > ? AND p.release_date <= ?
        ORDER BY p.release_date ASC, p.id ASC
      `).all(today, maxDate) as Array<{
        publicationId: number;
        date: string;
        title: string;
        brand: string;
        kind: string | null;
        publisher: string | null;
        performerKey: string | null;
        asinPrint: string | null;
        asinEbook: string | null;
        rakutenProductId: string | null;
        cardId: number | null;
        cardBrand: string | null;
        coverUrl: string | null;
        coverLocalPath: string | null;
        cardAmazonUrl: string | null;
        cardRakutenUrl: string | null;
        linkPerformerKey: string | null;
        linkPerformerName: string | null;
      }>;

      const performerKeys = Array.from(new Set(rows
        .map((row) => row.performerKey || row.linkPerformerKey)
        .filter((key): key is string => !!key)));
      const nameMap = new Map<string, string>();
      if (performerKeys.length > 0) {
        const placeholders = performerKeys.map(() => "?").join(",");
        const nameRows = db.prepare(`
          SELECT performer_key, performer_name FROM performer_stats
          WHERE performer_key IN (${placeholders})
        `).all(...performerKeys) as Array<{ performer_key: string; performer_name: string }>;
        for (const row of nameRows) nameMap.set(row.performer_key, row.performer_name);
      }

      const mapped: MhUpcoming[] = [];
      for (const row of rows) {
        const performerKey = row.performerKey || row.linkPerformerKey || undefined;
        const performerName = performerKey
          ? nameMap.get(performerKey) ?? row.linkPerformerName ?? performerKey
          : undefined;
        const kind = normalizePublicationKind(row.kind);
        const kindLabel = kind === "magazine" ? "雑誌" : kind === "digital_photobook" ? "デジタル写真集" : "写真集";
        // "未分類" is an ingest placeholder, not a real title/brand.
        let title = row.title && row.title !== "未分類" ? row.title : "";
        if (!title) {
          if (!performerName) continue;
          title = `${performerName} 新作${kindLabel}`;
        }
        const brand = row.brand && row.brand !== "未分類" ? row.brand : kindLabel;
        mapped.push({
          date: row.date,
          title,
          brand,
          kind,
          publisher: row.publisher || undefined,
          performerKey,
          performerName,
          coverImageUrl: resolveCardCoverImageUrl(row.coverUrl, row.coverLocalPath, row.cardBrand || row.brand),
          amazonUrl: normalizeRetailUrl(row.cardAmazonUrl) ?? buildAmazonAsinUrl(row.asinPrint || row.asinEbook),
          rakutenUrl: normalizeRetailUrl(row.cardRakutenUrl) ?? buildRakutenProductUrl(row.rakutenProductId),
          cardId: row.cardId ?? undefined,
        });
      }
      return mapped;
    } catch {
      return [];
    }
  });
}

export function getNewThisWeek(limit = 20): MhMagazine[] {
  const db = getDb();
  if (!db) return [];
  try {
    const today = todayIso();
    const minDate = isoDateAtDelta(-14);
    const rows = db.prepare(`
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
        (SELECT COUNT(*) FROM magazine_card_links l
         WHERE l.card_id = mc.id AND l.link_kind = 'retail'
           AND l.provider IN ('amazon', 'amazon-kindle', 'rakuten-books', 'rakuten-product', 'rakuten-kobo')) AS directLinkCount
      FROM magazine_cards mc
      WHERE mc.date >= ? AND mc.date <= ?
        AND mc.brand IS NOT NULL
        AND mc.brand != ''
      ORDER BY mc.date DESC, mc.id DESC
      LIMIT ?
    `).all(minDate, today, limit) as MagazineCardRow[];
    return rows.map(mapMagazineCardRow);
  } catch {
    return [];
  }
}

export function getTrendingModels(limit = 30): MhTrending[] {
  return cachedHeavy(`getTrendingModels:${limit}`, () => {
    const db = getDb();
    if (!db) return [];
    try {
      const today = todayIso();
      const recentStart = isoDateAtDelta(-183);
      const priorStart = isoDateAtDelta(-366);
      const queryLimit = Math.max(limit * 3, limit + 24);
      const trendRows = db.prepare(`
        SELECT pml.performer_key,
          MAX(COALESCE(ps.performer_name, pml.performer_name)) AS performer_name,
          COALESCE(ps.appearance_count, COUNT(pml.magazine_card_id)) AS total_pubs,
          ps.first_date,
          SUM(CASE WHEN mc.date >= ? AND mc.date <= ? THEN 1 ELSE 0 END) AS recent6,
          SUM(CASE WHEN mc.date >= ? AND mc.date < ? THEN 1 ELSE 0 END) AS prior6
        FROM performer_magazine_links pml
        JOIN magazine_cards mc ON mc.id = pml.magazine_card_id
        LEFT JOIN performer_stats ps ON ps.performer_key = pml.performer_key
        WHERE mc.date >= ? AND mc.date <= ?
          AND mc.date IS NOT NULL
          AND mc.date != ''
          AND pml.performer_key IS NOT NULL
          AND pml.performer_key != ''
        GROUP BY pml.performer_key
        HAVING recent6 >= 4
        ORDER BY (recent6 * 1.0 / CASE WHEN prior6 > 0 THEN prior6 ELSE 1 END) DESC, recent6 DESC
        LIMIT ?
      `).all(recentStart, today, priorStart, recentStart, priorStart, today, queryLimit) as Array<{
        performer_key: string;
        performer_name: string;
        total_pubs: number;
        first_date: string | null;
        recent6: number;
        prior6: number;
      }>;

      const cleanRows = trendRows
        .filter((row) => isDisplayPerformerKey(row.performer_key))
        .slice(0, limit);
      const keys = cleanRows.map((row) => row.performer_key);
      const months = recentMonthKeys(24);
      const monthlyByKey = new Map<string, Map<string, number>>();
      if (keys.length > 0) {
        const placeholders = keys.map(() => "?").join(",");
        const monthRows = db.prepare(`
          SELECT pml.performer_key, substr(mc.date, 1, 7) AS ym, COUNT(*) AS count
          FROM performer_magazine_links pml
          JOIN magazine_cards mc ON mc.id = pml.magazine_card_id
          WHERE pml.performer_key IN (${placeholders})
            AND mc.date >= ?
            AND mc.date <= ?
            AND mc.date IS NOT NULL
            AND mc.date != ''
          GROUP BY pml.performer_key, ym
        `).all(...keys, `${months[0]}-01`, today) as Array<{ performer_key: string; ym: string; count: number }>;
        for (const row of monthRows) {
          const monthly = monthlyByKey.get(row.performer_key) ?? new Map<string, number>();
          monthly.set(row.ym, row.count);
          monthlyByKey.set(row.performer_key, monthly);
        }
      }

      const portraitUrls = getPerformerPortraitUrls(
        db,
        cleanRows.map((row) => ({ key: row.performer_key, name: row.performer_name })),
      );

      return cleanRows.map((row) => {
        const key = row.performer_key;
        const prior6 = row.prior6 || 0;
        return {
          key,
          name: row.performer_name || key,
          imageUrl: portraitUrls.get(key),
          c1: colorFromHash(key, 42, 78),
          c2: colorFromHash(`${key}2`, 38, 68),
          totalPubs: row.total_pubs,
          firstDate: row.first_date ?? undefined,
          recent6: row.recent6,
          prior6,
          score: row.recent6 / Math.max(prior6, 1),
          monthly: months.map((ym) => monthlyByKey.get(key)?.get(ym) ?? 0),
        };
      });
    } catch {
      return [];
    }
  });
}

export function getModelYearCounts(performerKey: string): { year: number; count: number }[] {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT CAST(substr(mc.date, 1, 4) AS INTEGER) AS year, COUNT(*) AS count
      FROM performer_magazine_links pml
      JOIN magazine_cards mc ON mc.id = pml.magazine_card_id
      WHERE pml.performer_key = ?
        AND mc.date IS NOT NULL
        AND mc.date != ''
      GROUP BY year
      ORDER BY year ASC
    `).all(performerKey) as Array<{ year: number; count: number }>;
    if (rows.length === 0) return [];
    const counts = new Map(rows.map((row) => [row.year, row.count]));
    const firstYear = rows[0].year;
    const currentYear = Number(todayIso().slice(0, 4));
    const lastYear = Math.max(currentYear, rows[rows.length - 1].year);
    const filled: { year: number; count: number }[] = [];
    for (let year = firstYear; year <= lastYear; year++) {
      filled.push({ year, count: counts.get(year) ?? 0 });
    }
    return filled;
  } catch {
    return [];
  }
}

export function getCoStars(performerKey: string, limit = 8): MhModelRelation[] {
  const db = getDb();
  if (!db) return [];
  try {
    const queryLimit = Math.max(limit * 3, limit + 12);
    const rows = db.prepare(`
      WITH target_cards AS (
        SELECT magazine_card_id
        FROM performer_magazine_links
        WHERE performer_key = ?
      )
      SELECT other.performer_key,
        MAX(COALESCE(ps.performer_name, other.performer_name)) AS performer_name,
        ps.appearance_count,
        ps.cover_count,
        COUNT(*) AS relation_count,
        (SELECT pi.local_path FROM performer_images pi
         JOIN performers p ON p.id = pi.performer_id
         WHERE p.name_normalized = other.performer_key AND pi.position = 0
         LIMIT 1) AS imageLocalPath
      FROM performer_magazine_links other
      JOIN target_cards tc ON tc.magazine_card_id = other.magazine_card_id
      LEFT JOIN performer_stats ps ON ps.performer_key = other.performer_key
      WHERE other.performer_key != ?
        AND other.performer_key IS NOT NULL
        AND other.performer_key != ''
      GROUP BY other.performer_key
      ORDER BY relation_count DESC, COALESCE(ps.appearance_count, 0) DESC
      LIMIT ?
    `).all(performerKey, performerKey, queryLimit) as RelatedModelRow[];
    return mapModelRelationRows(db, rows)
      .filter((item) => isDisplayPerformerKey(item.model.nameYomi))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function getRelatedModels(performerKey: string, limit = 6): MhModelRelation[] {
  const db = getDb();
  if (!db) return [];
  try {
    const topBrands = (db.prepare(`
      SELECT brand
      FROM performer_magazine_links
      WHERE performer_key = ?
        AND brand IS NOT NULL
        AND brand != ''
      GROUP BY brand
      ORDER BY COUNT(*) DESC
      LIMIT 3
    `).all(performerKey) as Array<{ brand: string }>).map((row) => row.brand);

    const coStarExcludes = (db.prepare(`
      WITH target_cards AS (
        SELECT magazine_card_id
        FROM performer_magazine_links
        WHERE performer_key = ?
      )
      SELECT other.performer_key
      FROM performer_magazine_links other
      JOIN target_cards tc ON tc.magazine_card_id = other.magazine_card_id
      WHERE other.performer_key != ?
      GROUP BY other.performer_key
      ORDER BY COUNT(*) DESC
      LIMIT 3
    `).all(performerKey, performerKey) as Array<{ performer_key: string }>).map((row) => row.performer_key);

    const excludeKeys = Array.from(new Set([performerKey, ...coStarExcludes]));
    const excludePlaceholders = excludeKeys.map(() => "?").join(",");
    const excludeClause = excludePlaceholders ? `AND pml.performer_key NOT IN (${excludePlaceholders})` : "";
    const brandScoreSql = topBrands.length > 0
      ? `SUM(CASE WHEN pml.brand IN (${topBrands.map(() => "?").join(",")}) THEN 1 ELSE 0 END)`
      : "0";
    const queryLimit = Math.max(limit * 3, limit + 12);

    const rows = db.prepare(`
      WITH target_cards AS (
        SELECT magazine_card_id
        FROM performer_magazine_links
        WHERE performer_key = ?
      ),
      co_counts AS (
        SELECT other.performer_key, COUNT(*) AS co_count
        FROM performer_magazine_links other
        JOIN target_cards tc ON tc.magazine_card_id = other.magazine_card_id
        WHERE other.performer_key != ?
        GROUP BY other.performer_key
      )
      SELECT pml.performer_key,
        MAX(COALESCE(ps.performer_name, pml.performer_name)) AS performer_name,
        ps.appearance_count,
        ps.cover_count,
        (COALESCE(cc.co_count, 0) * 3 + ${brandScoreSql}) AS relation_count,
        (SELECT pi.local_path FROM performer_images pi
         JOIN performers p ON p.id = pi.performer_id
         WHERE p.name_normalized = pml.performer_key AND pi.position = 0
         LIMIT 1) AS imageLocalPath
      FROM performer_magazine_links pml
      LEFT JOIN co_counts cc ON cc.performer_key = pml.performer_key
      LEFT JOIN performer_stats ps ON ps.performer_key = pml.performer_key
      WHERE pml.performer_key != ?
        AND pml.performer_key IS NOT NULL
        AND pml.performer_key != ''
        ${excludeClause}
      GROUP BY pml.performer_key
      HAVING relation_count > 0
      ORDER BY relation_count DESC, COALESCE(ps.appearance_count, 0) DESC
      LIMIT ?
    `).all(performerKey, performerKey, ...topBrands, performerKey, ...excludeKeys, queryLimit) as RelatedModelRow[];

    const related = mapModelRelationRows(db, rows)
      .filter((item) => isDisplayPerformerKey(item.model.nameYomi))
      .slice(0, limit);
    if (related.length >= limit) return related;

    const existingKeys = related.map((item) => item.model.nameYomi);
    const fill = getPopularModelRelations(db, [...excludeKeys, ...existingKeys], limit - related.length);
    return [...related, ...fill].slice(0, limit);
  } catch {
    return [];
  }
}

export function getTodayBirthdays(): MhBirthday[] {
  const today = todayIso();
  return getBirthdays(Number(today.slice(5, 7)), Number(today.slice(8, 10)));
}

export function getBirthdaysForMonth(month: number): MhBirthday[] {
  return getBirthdays(month);
}

export function getOnThisDay(limit = 4): MhMagazine[] {
  return cachedHeavy(`getOnThisDay:${limit}`, () => {
    const db = getDb();
    if (!db) return [];
    try {
      const today = todayIso();
      const cutoff = addYearsIso(today, -4);
      const rows = db.prepare(`
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
          (SELECT COUNT(*) FROM magazine_card_links l
           WHERE l.card_id = mc.id AND l.link_kind = 'retail'
             AND l.provider IN ('amazon', 'amazon-kindle', 'rakuten-books', 'rakuten-product', 'rakuten-kobo')) AS directLinkCount
        FROM magazine_cards mc
        WHERE substr(mc.date, 6, 5) = substr(?, 6, 5)
          AND mc.date <= ?
          AND EXISTS (
            SELECT 1 FROM magazine_card_covers c
            WHERE c.card_id = mc.id AND (c.cover_url IS NOT NULL OR c.local_path IS NOT NULL)
          )
        ORDER BY (mc.id * 2654435761) % 997
        LIMIT ?
      `).all(today, cutoff, limit) as MagazineCardRow[];
      return rows.map(mapMagazineCardRow);
    } catch {
      return [];
    }
  });
}

export function getCoverWall(opts: {
  era?: "1990s" | "2000s" | "2010s" | "2020s";
  brand?: string;
  offset?: number;
  limit?: number;
}): { items: MhMagazine[]; total: number } {
  const db = getDb();
  if (!db) return { items: [], total: 0 };
  try {
    const where: string[] = [
      "mc.date IS NOT NULL",
      "mc.date != ''",
      `EXISTS (
        SELECT 1 FROM magazine_card_covers c
        WHERE c.card_id = mc.id
          AND (
            c.local_path IS NOT NULL
            OR c.cover_url LIKE 'https://idolz.hubxhub.com/wp-content/uploads/%'
            OR c.cover_url LIKE '%pixhost%'
          )
      )`,
    ];
    const params: Array<string | number> = [];

    if (opts.era) {
      const startYear = Number(opts.era.slice(0, 4));
      where.push("mc.date >= ?");
      params.push(`${startYear}-01-01`);
      where.push("mc.date < ?");
      params.push(`${startYear + 10}-01-01`);
    }

    if (opts.brand?.trim()) {
      where.push("mc.brand = ?");
      params.push(opts.brand.trim());
    }

    const whereSql = where.join(" AND ");
    const totalRow = db.prepare(`
      SELECT COUNT(*) AS n
      FROM magazine_cards mc
      WHERE ${whereSql}
    `).get(...params) as { n: number };

    const limit = opts.limit ?? 96;
    const offset = opts.offset ?? 0;
    const rows = db.prepare(`
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
        (SELECT COUNT(*) FROM magazine_card_links l
         WHERE l.card_id = mc.id AND l.link_kind = 'retail'
           AND l.provider IN ('amazon', 'amazon-kindle', 'rakuten-books', 'rakuten-product', 'rakuten-kobo')) AS directLinkCount
      FROM magazine_cards mc
      WHERE ${whereSql}
      ORDER BY mc.date DESC, mc.id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as MagazineCardRow[];

    return {
      items: rows.map(mapMagazineCardRow).filter((item) => !!item.coverImageUrl),
      total: totalRow.n,
    };
  } catch {
    return { items: [], total: 0 };
  }
}
