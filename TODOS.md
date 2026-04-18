# TODOS

## Content

### Amazon リンクを記事に追加する

**What:** 各記事に `<AmazonLink>` コンポーネントで実際の商品リンクを挿入する。

**Why:** Associates タグ取得済み (`magazinelab-22`)。リンクがなければ売上は発生しない。180 日以内に 3 件が Creators API 申請の条件。

**Context:** `src/components/AmazonLink.astro` は `asin` と `title` を受け取る。記事ごとに関連する雑誌・写真集の ASIN を Amazon で調べて追加する。週プレ、ヤングジャンプ、FRIDAY 等の最新号が対象。

**Effort:** M
**Priority:** P0
**Depends on:** None

---

### データ鮮度の維持

**What:** `scripts/generate-data.py` を magazine-hub の定期パイプラインに組み込む。

**Why:** `recent-releases.json` は直近 30 日のデータ。更新しないと古くなる。

**Context:** magazine-hub の scraper-runner が定期実行されている。そこに `python ~/dev/magazine-review-site/scripts/generate-data.py && git -C ~/dev/magazine-review-site add src/data && git -C ~/dev/magazine-review-site commit -m "chore: refresh data" && git push` を追加。Cloudflare Pages が自動再デプロイ。

**Effort:** S
**Priority:** P1
**Depends on:** None

---

## SEO / Growth

### Google Search Console 登録

**What:** `magazine.happyharem.com` を Google Search Console に登録し sitemap を送信。

**Why:** インデックス化を早める。Associates 審査継続のためにオーガニックトラフィックが必要。

**Context:** sitemap は `https://magazine.happyharem.com/sitemap-index.xml` に自動生成済み。

**Effort:** S
**Priority:** P1
**Depends on:** None

---

### OG 画像の追加

**What:** ソーシャルシェア用の OG 画像を各記事に設定する。

**Why:** SNS シェア時のクリック率が上がる。Associates 審査でも有利。

**Context:** `BaseLayout.astro` の `ogImage` prop は実装済み。記事の MDX frontmatter に `ogImage` フィールドを追加してパスを指定するだけ。シンプルなテキスト + ブランドカラーの PNG を `public/og/` に置く。

**Effort:** M
**Priority:** P2
**Depends on:** None

---

## Infrastructure

### Creators API 申請

**What:** 180 日以内に 3 件の売上達成後、Amazon Creators API に申請する。

**Why:** Creators API で商品メタデータ（タイトル・価格・画像）を取得できるようになる。magazine-hub の 7,073 件の未エンリッチ Amazon リンクの解決が本来の目標。

**Context:** Associates ダッシュボードから申請。magazine-hub の `scripts/enrich_amazon.py` (未作成) を Creators API 向けに実装する。

**Effort:** L
**Priority:** P1
**Depends on:** Associates 3 件売上達成

---

## Completed

(なし)
