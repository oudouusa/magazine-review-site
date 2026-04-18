# magazine-review-site

グラビア雑誌・デジタル写真集の総合ガイドサイト。Amazon Associates 取得 + Creators API アクセスを目的とするコンテンツサイト。

- **URL**: https://magazine.happyharem.com
- **GitHub**: https://github.com/oudouusa/magazine-review-site
- **Hosting**: Cloudflare Pages (auto-deploy from `master`)
- **Associates tag**: `magazinelab-22`

## Tech Stack

- Astro 6.1.7 + Tailwind CSS v4 (`@tailwindcss/vite`) + MDX
- Package manager: **npm** (bun install hangs on this project)
- Build: `npm run build` → `dist/`
- Data: `scripts/generate-data.py` → `src/data/*.json` (reads magazine-hub SQLite DB)

## Commands

```bash
npm run dev         # dev server (http://localhost:4321)
npm run build       # static build → dist/
npm run preview     # preview built site

# Data refresh
MAGAZINE_DB_PATH=~/runtime/magazine-hub/scraper-state/xidol_magazines_full.sqlite3 \
  python scripts/generate-data.py
```

## Git Workflow

- `master` = base branch. Always deployable. Cloudflare Pages auto-deploys on push.
- All work goes on feature branches: `feat/`, `fix/`, `chore/`
- Use `/ship` to create PRs from feature branches → `master`

## Testing

This is a static content site with no application logic to unit-test.
Test bootstrap is skipped: `.gstack/no-test-bootstrap`

Manual verification: `npm run build && npm run preview` — check that all 11 pages render.

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
