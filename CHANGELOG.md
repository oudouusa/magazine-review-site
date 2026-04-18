# CHANGELOG

All notable changes to this project will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [0.1.0.0] - 2026-04-18

### Added
- 10 original Japanese articles covering gravure magazines and digital photobooks
  - Weekly magazine guide (週刊グラビア雑誌 完全ガイド)
  - Monthly magazine guide (月刊グラビア雑誌 完全ガイド)
  - Digital photobook vs magazine comparison
  - New release calendar with live DB data
  - Popular performers guide with top-50 ranking
  - Kindle Unlimited gravure guide
  - Beginner's purchase guide
  - Publisher guide
  - Rising stars 2026
  - Series comparison (FRIDAY, FLASH, 週プレ, YJ)
- Data pipeline (`scripts/generate-data.py`) extracting brands, performers, releases, series from magazine-hub SQLite DB
- Rich homepage with hero section, stats strip (26誌/50人/95件), and 3-column article grid
- Article pages with dark header, breadcrumb, and prose layout
- 3-column footer with quick links and Associates disclosure
- Colored category badges (guide/calendar/comparison/beginner)
- Sticky header with backdrop blur
- `AmazonLink` component ready for Associates tag
- Sitemap generation via `@astrojs/sitemap`

### Changed
- Associates tag `magazinelab-22` added to all Amazon links

### Infrastructure
- Astro 6.1.7 + Tailwind CSS v4 (`@tailwindcss/vite`) + MDX
- Cloudflare Pages deployment at `magazine.happyharem.com`
- GitHub: `oudouusa/magazine-review-site`
