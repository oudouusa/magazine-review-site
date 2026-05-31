import "server-only";
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";

let _db: DatabaseSync | null = null;

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
