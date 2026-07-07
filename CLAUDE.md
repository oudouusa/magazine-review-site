# magazine-review-site

グラビア雑誌・デジタル写真集の総合ガイドサイト。Amazon Associates 取得 + Creators API アクセスを目的とするコンテンツサイト。

- **URL**: https://magazine.happyharem.com
- **GitHub**: https://github.com/oudouusa/magazine-review-site
- **Hosting**: VPS の Docker(vps-infra compose の `magazine-review-site` サービス。
  ローカルビルドしたイメージ `local/magazine-review-site:<sha>` を pin)
- **Associates tag**: `magazinelab-22`

## Tech Stack

- Next.js 15 (App Router, standalone) + Payload CMS 3 + node:sqlite
- Package manager: **npm**(`.npmrc` の `legacy-peer-deps=true` 必須。無いと `npm ci` が
  payload/next の peer conflict で失敗する)
- データ: magazine-hub の本番 SQLite を **read-only** で直接読む(`src/lib/magazine-hub-db.ts`
  と `src/lib/mh-insights.ts`)。生成 JSON 方式(旧 Astro 時代の generate-data.py)は廃止。

## Commands

```bash
npm ci
# dev / build / smoke は 2 つの env が必須(無いと画像が全部グラデ表示になり
# smoke の cover 系 assert が落ちる):
export MAGAZINE_HUB_DB_PATH=/home/oudou/runtime/magazine-hub/scraper-state/xidol_magazines_full.sqlite3
export MAGAZINE_IMAGES_PATH=/home/oudou/runtime/magazine-hub/magazine-images

npm run dev          # dev server (http://localhost:3000)
npm run build        # production build
node scripts/smoke.mjs   # next start を起動して全ページ 200 + データ閾値を検証(PORT=3200)
MH_TIMING=1 npm run start  # 遅いページ調査用: mh-insights の関数別タイミングをログ出力
```

## Git Workflow

- `master` = base branch。作業は feature branch → PR → merge。
- **デプロイは手動**(merge しても自動では出ない):

```bash
# 1. merge 済み master でイメージビルド
cd ~/dev/magazine-review-site && git switch master && git pull
docker build -t local/magazine-review-site:$(git rev-parse --short HEAD) .
# 2. runtime .env の pin を更新(バックアップを取ってから)
#    /home/oudou/runtime/vps-infra/.env の MAGAZINE_REVIEW_SITE_REF=local/magazine-review-site:<sha>
# 3. コンテナ再作成 + 検証
docker compose --project-directory /home/oudou/deploy/vps-infra up -d magazine-review-site
curl -s -o /dev/null -w '%{http_code}' https://magazine.happyharem.com/
# ロールバック: .env の REF を旧 sha に戻して up -d(旧イメージは消さない)
```

## Testing

`scripts/smoke.mjs` が実データ検証(全ページ 200 + `/api/smoke` のデータ件数閾値 +
サンプルカード詳細)。unit test は無し。`.gstack/no-test-bootstrap`。

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
- KB 参照、教訓記録 → invoke kb
