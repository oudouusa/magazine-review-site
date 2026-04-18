"""Generate data files for the magazine review site from magazine-hub DB."""

import json
import os
import sqlite3
from pathlib import Path

DB_PATH = os.environ.get(
    "MAGAZINE_DB_PATH",
    os.path.expanduser("~/runtime/magazine-hub/scraper-state/xidol_magazines_full.sqlite3"),
)
OUT_DIR = Path(__file__).resolve().parent.parent / "src" / "data"


NOISE_PERFORMERS = {
    "日号", "月号", "雑誌", "カット", "号", "＋", "未定",
}

GROUP_PATTERN_SUFFIXES = ("46", "48", "46G", "48G")

GRAVURE_BRANDS = {
    "週刊プレイボーイ", "ヤングジャンプ", "週刊ポスト", "週刊SPA!",
    "週刊ビッグコミックスピリッツ", "週刊実話", "ヤングマガジン",
    "週刊少年マガジン", "週刊少年チャンピオン", "週刊大衆", "週刊現代",
    "週刊少年サンデー", "週刊アサヒ芸能", "週刊文春", "ヤンマガWeb",
    "FRIDAY", "FLASH", "月刊ヤングマガジン", "月刊少年チャンピオン",
    "ENTAME", "月刊エンタメ", "マンスリーガール", "ヤングチャンピオン烈",
    "BOMB", "BUBKA", "EX大衆", "ヤングアニマル", "ヤングガンガン",
    "ヤングキング", "ヤングキングBULL", "サブラ", "sabra",
    "グラビアプレス", "EX-MAX!", "EX MAX", "ヤングチャンピオン",
    "グランジャンプ", "スポーツ報知", "月刊FANZA",
}

GRAVURE_BRAND_PREFIXES = (
    "週刊", "ヤング", "月刊", "FLASH", "FRIDAY", "BOMB", "BUBKA",
)


def _is_gravure_brand(brand: str) -> bool:
    if brand in GRAVURE_BRANDS:
        return True
    return any(brand.startswith(pfx) for pfx in GRAVURE_BRAND_PREFIXES)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def generate_brands(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute("""
        SELECT brand, cadence, publisher, COUNT(*) as total_issues,
               MAX(date) as latest_issue_date
        FROM magazine_cards
        WHERE cadence IS NOT NULL AND brand != '未分類' AND brand != 'Photobook'
        GROUP BY brand, cadence
        HAVING total_issues >= 10
        ORDER BY total_issues DESC
    """).fetchall()

    brands = []
    for r in rows:
        top_performers = conn.execute("""
            SELECT performer_name, COUNT(*) as cnt
            FROM performer_magazine_links pml
            JOIN magazine_cards mc ON mc.id = pml.magazine_card_id
            WHERE mc.brand = ?
            GROUP BY performer_name
            ORDER BY cnt DESC
            LIMIT 5
        """, (r["brand"],)).fetchall()

        brands.append({
            "name": r["brand"],
            "cadence": r["cadence"],
            "publisher": r["publisher"] or "",
            "total_issues": r["total_issues"],
            "latest_issue_date": r["latest_issue_date"] or "",
            "recent_performers": [p["performer_name"] for p in top_performers],
        })
    return brands


def _is_valid_performer(name: str) -> bool:
    if name in NOISE_PERFORMERS:
        return False
    if len(name) <= 1:
        return False
    if any(name.endswith(sfx) for sfx in GROUP_PATTERN_SUFFIXES):
        return False
    if name.isascii() and " " not in name:
        return False
    return True


def generate_top_performers(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute("""
        SELECT performer_name, appearance_count, cover_count, brand_count,
               first_date, last_date
        FROM performer_stats
        WHERE appearance_count >= 20
        ORDER BY appearance_count DESC
        LIMIT 100
    """).fetchall()

    performers = []
    for r in rows:
        if not _is_valid_performer(r["performer_name"]):
            continue
        top_brands = conn.execute("""
            SELECT brand, COUNT(*) as cnt
            FROM performer_magazine_links
            WHERE performer_name = ?
            GROUP BY brand
            ORDER BY cnt DESC
            LIMIT 5
        """, (r["performer_name"],)).fetchall()

        performers.append({
            "name": r["performer_name"],
            "appearance_count": r["appearance_count"],
            "cover_count": r["cover_count"],
            "brand_count": r["brand_count"],
            "first_date": r["first_date"] or "",
            "last_date": r["last_date"] or "",
            "top_brands": [b["brand"] for b in top_brands],
        })
        if len(performers) >= 50:
            break
    return performers


def generate_recent_releases(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute("""
        SELECT id, brand, title, date, publication_kind
        FROM magazine_cards
        WHERE date >= date('now', '-30 days')
          AND brand != '未分類'
          AND cadence IS NOT NULL
        ORDER BY date DESC
        LIMIT 200
    """).fetchall()

    return [
        {
            "id": r["id"],
            "brand": r["brand"],
            "title": r["title"],
            "date": r["date"],
            "publication_kind": r["publication_kind"] or "magazine",
        }
        for r in rows
        if _is_gravure_brand(r["brand"])
    ][:100]


def generate_series_stats(conn: sqlite3.Connection) -> list[dict]:
    rows = conn.execute("""
        SELECT series_name, COUNT(*) as total,
               MIN(release_date) as first_date,
               MAX(release_date) as last_date
        FROM publications
        WHERE series_name IS NOT NULL AND series_name != '' AND series_name != '未分類'
          AND publication_kind IN ('digital_photobook', 'photobook')
        GROUP BY series_name
        HAVING total >= 20
        ORDER BY total DESC
    """).fetchall()

    series = []
    for r in rows:
        top_performers = conn.execute("""
            SELECT spp.name_normalized as name, COUNT(*) as cnt
            FROM publication_memberships pm
            JOIN source_post_performers spp ON spp.source_post_id = pm.source_id
            JOIN publications p ON p.id = pm.publication_id
            WHERE p.series_name = ? AND pm.source_name = 'source_post'
            GROUP BY spp.name_normalized
            ORDER BY cnt DESC
            LIMIT 5
        """, (r["series_name"],)).fetchall()

        series.append({
            "name": r["series_name"],
            "total": r["total"],
            "first_date": r["first_date"] or "",
            "last_date": r["last_date"] or "",
            "top_performers": [p["name"] for p in top_performers],
        })
    return series


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    conn = get_db()

    data = {
        "brands.json": generate_brands(conn),
        "top-performers.json": generate_top_performers(conn),
        "recent-releases.json": generate_recent_releases(conn),
        "series-stats.json": generate_series_stats(conn),
    }

    for filename, content in data.items():
        path = OUT_DIR / filename
        path.write_text(json.dumps(content, ensure_ascii=False, indent=2))
        print(f"  {filename}: {len(content)} records")

    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
