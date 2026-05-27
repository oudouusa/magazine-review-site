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
};

export type MhMagazine = {
  slug: string;
  title: string;
  seriesName: string;
  issue: string;
  releaseDate: string;
  gradient: { c1: string; c2: string };
  badge?: "new" | "preorder" | "reissue";
};

export function getTopModels(limit = 100): MhModel[] {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT performer_key, performer_name, appearance_count, cover_count
      FROM performer_stats
      ORDER BY appearance_count DESC
      LIMIT ?
    `).all(limit) as Array<{
      performer_key: string;
      performer_name: string;
      appearance_count: number;
      cover_count: number;
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
    }));
  } catch {
    return [];
  }
}

export function getRecentIssues(limit = 60): MhMagazine[] {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db.prepare(`
      SELECT i.id, i.title, i.brand, i.issue_date_start, i.issue_no_normalized
      FROM issues i
      WHERE i.issue_date_start IS NOT NULL AND i.brand IS NOT NULL
      ORDER BY i.issue_date_start DESC
      LIMIT ?
    `).all(limit) as Array<{
      id: number;
      title: string;
      brand: string;
      issue_date_start: string;
      issue_no_normalized: string | null;
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
      };
    });
  } catch {
    return [];
  }
}
