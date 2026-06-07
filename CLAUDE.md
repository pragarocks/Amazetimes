# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # Production build → dist/
npm run preview    # Preview dist/
npm run deploy     # build + gh-pages push (requires GITHUB_TOKEN)
npm run generate   # Run scripts/generate-news.js locally
```

Local generation requires a `.env` file with `API_KEY=your_gemini_key`.

## Architecture

**Amazetime.in** is a Tamil news aggregator. Two independent subsystems share a single `public/data/news.json` data file:

### Generation subsystem (Node.js, server/CI only)
`scripts/generate-news.js` — the entire pipeline in one file:
1. Loads the existing `news.json` cache
2. Fetches raw items from 20 sources (RSS or cheerio scrape)
3. Deduplicates against the cache (by `link`)
4. Sends **only new** items to Gemini in batches of `AI_BATCH_SIZE` (8)
5. Merges results back into the cache, sorts by `pubDate`, trims to `CACHE_PER_FEED` (40)
6. Writes the updated `news.json`

Key constants at the top of the script:
- `ITEMS_PER_FEED = 20` — max raw items fetched per run
- `CACHE_PER_FEED = 40` — max articles kept per feed in the JSON
- `AI_BATCH_SIZE = 8` — articles per Gemini call

### Frontend subsystem (React, browser)
Static-first: `App.tsx` fetches `./data/news.json` on load. If the file is missing or stale, it falls back to live mode: `services/rssService.ts` fetches RSS via CORS proxies, then `services/geminiService.ts` rewrites items in the browser.

`constants.ts` is the single source of truth for all 20 feed IDs, Tamil names, and URLs used by both the browser live mode and (separately) the generation script. **Both places must be updated when adding a feed.**

### Data shape
`public/data/news.json`:
```json
{ "updatedAt": "ISO string", "feeds": { "[feedId]": EnhancedArticle[] }, "meta": { ... } }
```

`EnhancedArticle` (see `types.ts`): AI fields (`headline`, `summary`, `fullArticleContent`, `category`, `sentiment`, `tags`, `readingTime`) plus raw fallback mirrors (`title`, `description`, `content`, `link`, `guid`, `pubDate`, `thumbnail`).

### News sources
20 feeds split across three types:
- **Google News RSS** (primary, 18 feeds) — never blocks CI runners
- **BBC Tamil RSS** (`world` feed) — premium Tamil source
- **Cheerio scrapers** (`dinamalar`, `thanthi`) — use rotating User-Agents + exponential backoff

### CI/CD
`.github/workflows/update-news.yml` runs every 3 hours: install → generate → commit `news.json` to `master` → build → deploy to GitHub Pages. Required secret: `API_KEY`.

Workflow pushes to `master` branch (not `main`).

### Gemini integration
- Model: `gemini-2.5-flash-preview-04-17`
- Structured output via `responseMimeType: 'application/json'` + `responseSchema`
- Never mention external sources in output — attribution replaced with `"எமது செய்திக்குழு அறிகிறது"`
- All output fields must be in Tamil script

### UI
- Feed tabs: first 5 visible as pills, remaining 15 in a dropdown
- Article display: 3-column grid of `ArticleCard` components
- Modal: `ArticleModal` renders `fullArticleContent` HTML (`<p>`, `<h3>` tags)
- Missing thumbnails → Unsplash placeholder (Google News items never have thumbnails)
- Colors: Tailwind `slate` + custom `brand` (sky-based) defined in Tailwind config
