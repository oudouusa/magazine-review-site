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

### content.config.ts スキーマ確認

**What:** Phase 1 マネーページを書く前に `src/content.config.ts` を確認し、money-page コレクションが必要か判断する。

**Why:** 既存の article スキーマは category enum が固定。マネーページには `performerName`, `amazonSearchUrl` 等のフィールドが必要な可能性があり、スキーマ不一致は20ページ書いた後に発覚すると痛い。

**Context:** article スキーマの frontmatter: title, description, pubDate, category (enum), heroImage。マネーページに必要なフィールドがカバーされていれば修正不要。必要なら `money-page` コレクションを追加。

**Effort:** XS
**Priority:** P0 (Phase 1 着手前に確認)
**Depends on:** None

---

### アウトバウンドクリックトラッキング

**What:** 全 Amazon アフィリエイトリンクに UTM パラメータを追加する。`?utm_source=magazine-site&utm_medium=affiliate&utm_campaign={slug}`

**Why:** Phase 2 で 200+ ページに拡大する前に、どのページが実際にクリックを生んでいるか分かる必要がある。UTM なしだと Amazon レポートは全リンクを同一視する。

**Context:** `AmazonLink.astro` の href に `&utm_campaign=` を追加。markdown 内の生 Amazon 検索リンクにも追加。`AmazonLink.astro` に `campaign` prop を追加するか、`slug` を自動インジェクトする方法を選択。

**Effort:** S
**Priority:** P1
**Depends on:** None

---

### ASIN ベースのリリースページ (Creators API 後)

**What:** Creators API 取得後、`/releases/[asin].astro` を ASIN をキーとして実装する。

**Why:** 内部スクレイパー ID (現在の `mc.id`) は DB 再構築時に変わる可能性があり、パブリック URL として不安定。ASIN なら Amazon と同期した安定識別子。

**Context:** 当初 Phase 2B で `/releases/[id].astro` を計画したが、内部 ID の不安定性とシンコンテンツリスクにより延期。Creators API で ASIN・価格・KU フラグ・画像が取得可能になった後に実装。

**Effort:** M
**Priority:** P2
**Depends on:** Creators API 申請完了

---

## Completed

(なし)
