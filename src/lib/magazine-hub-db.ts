import "server-only";
import { DatabaseSync } from "node:sqlite";

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
};

function localPathToUrl(localPath: string | null | undefined): string | undefined {
  if (!localPath) return undefined;
  return localPath.replace("/api/images/", "/magazine-images/");
}

function filterCoverUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  // Only pass through covers from hosts confirmed to not block hotlinking
  if (url.includes("pixhost.to")) return url;
  if (url.startsWith("http://ivworld.xyz") || url.startsWith("http://vworld.xyz")) return url;
  if (url.includes("xidol.net") || url.includes("x-idol.net")) return url;
  return undefined;
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
      imageUrl: localPathToUrl(r.imageLocalPath),
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

    const recentRows = db.prepare(`
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized,
        (SELECT c.image_url FROM covers c WHERE c.issue_id = i.id AND c.position = 1 LIMIT 1) AS coverImageUrl
      FROM issue_performers ip
      JOIN issues i ON i.id = ip.issue_id
      JOIN performers p ON p.id = ip.performer_id
      WHERE p.name_normalized = ? AND i.issue_date_start IS NOT NULL AND i.brand IS NOT NULL AND i.brand NOT LIKE 'REP%'
      ORDER BY i.issue_date_start DESC
      LIMIT 12
    `).all(performerKey) as Array<{ id: number; title: string; brand: string; issue_date_start: string; issue_no_normalized: string | null; coverImageUrl: string | null }>;

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
        title: featureTitle,
        seriesName: r.brand,
        issue: r.issue_no_normalized || r.issue_date_start,
        releaseDate: r.issue_date_start,
        gradient: { c1: colorFromHash(key, 35, 72), c2: colorFromHash(key + "2", 30, 58) },
        badge,
        coverImageUrl: filterCoverUrl(r.coverImageUrl),
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
      imageUrl: localPathToUrl(imageRow?.local_path),
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
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized
      FROM issues i
      WHERE i.brand = ? AND i.id != ? AND i.issue_date_start IS NOT NULL
      ORDER BY i.issue_date_start DESC
      LIMIT 9
    `).all(row.brand, issueId) as Array<{ id: number; title: string; brand: string; issue_date_start: string; issue_no_normalized: string | null }>;

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
      };
    });

    return {
      id: row.id,
      slug: `issue-${row.id}`,
      title: featureTitle,
      seriesName: row.brand,
      issue: row.issue_no_normalized || row.issue_date_start,
      releaseDate: row.issue_date_start,
      badge,
      gradient: { c1: colorFromHash(key, 35, 72), c2: colorFromHash(key + "2", 30, 58) },
      coverImageUrl: filterCoverUrl(row.coverImageUrl),
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
        imageUrl: localPathToUrl(p.imageLocalPath),
      })),
      backnumbers,
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
    const rows = db.prepare(`
      SELECT
        i.brand,
        COUNT(*) AS issue_count,
        MAX(i.issue_date_start) AS latest_date,
        (SELECT c.image_url FROM covers c
         JOIN issues i2 ON i2.id = c.issue_id
         WHERE i2.brand = i.brand AND c.position = 1
         ORDER BY i2.issue_date_start DESC
         LIMIT 1) AS cover_image_url
      FROM issues i
      WHERE i.brand IS NOT NULL AND i.issue_date_start IS NOT NULL AND i.brand NOT LIKE 'REP%'
      GROUP BY i.brand
      ORDER BY MAX(i.issue_date_start) DESC
    `).all() as Array<{
      brand: string;
      issue_count: number;
      latest_date: string;
      cover_image_url: string | null;
    }>;
    return rows.map((r) => ({
      name: r.brand,
      slug: encodeURIComponent(r.brand),
      issueCount: r.issue_count,
      latestDate: r.latest_date,
      coverImageUrl: filterCoverUrl(r.cover_image_url),
      gradient: { c1: colorFromHash(r.brand, 35, 72), c2: colorFromHash(r.brand + "2", 30, 58) },
    }));
  } catch {
    return [];
  }
}

export function getIssuesByBrand(brand: string, limit = 200): MhMagazine[] {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized,
        (SELECT c.image_url FROM covers c WHERE c.issue_id = i.id AND c.position = 1 LIMIT 1) AS coverImageUrl
      FROM issues i
      WHERE i.brand = ? AND i.issue_date_start IS NOT NULL
      ORDER BY i.issue_date_start DESC
      LIMIT ?
    `).all(brand, limit) as Array<{
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
        title: featureTitle,
        seriesName: r.brand,
        issue: r.issue_no_normalized || r.issue_date_start,
        releaseDate: r.issue_date_start,
        gradient: { c1: colorFromHash(key, 35, 72), c2: colorFromHash(key + "2", 30, 58) },
        badge,
        coverImageUrl: filterCoverUrl(r.coverImageUrl),
      };
    });
  } catch {
    return [];
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
      imageUrl: localPathToUrl(r.imageLocalPath),
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
        title: featureTitle,
        seriesName: r.brand,
        issue: r.issue_no_normalized || r.issue_date_start,
        releaseDate: r.issue_date_start,
        gradient: { c1: colorFromHash(key, 35, 72), c2: colorFromHash(key + "2", 30, 58) },
        badge,
        coverImageUrl: filterCoverUrl(r.coverImageUrl),
      };
    });
  } catch {
    return [];
  }
}

export function getRecentIssues(limit = 60): MhMagazine[] {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized,
        (SELECT c.image_url FROM covers c WHERE c.issue_id = i.id AND c.position = 1 LIMIT 1) AS coverImageUrl
      FROM issues i
      WHERE i.issue_date_start IS NOT NULL AND i.brand IS NOT NULL AND i.brand NOT LIKE 'REP%'
      ORDER BY i.issue_date_start DESC
      LIMIT ?
    `).all(limit) as Array<{
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
      // Strip brand prefix from title to get the model names
      const featureTitle = r.title.replace(
        new RegExp(`^\\[?${r.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]?\\s*[\\d.\\s-]*`, "u"),
        ""
      ).trim() || r.title;
      return {
        slug: `issue-${r.id}`,
        title: featureTitle,
        seriesName: r.brand,
        issue: r.issue_no_normalized || r.issue_date_start,
        releaseDate: r.issue_date_start,
        gradient: {
          c1: colorFromHash(key, 35, 72),
          c2: colorFromHash(key + "2", 30, 58),
        },
        badge,
        coverImageUrl: filterCoverUrl(r.coverImageUrl),
      };
    });
  } catch {
    return [];
  }
}
