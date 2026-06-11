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

Local generation requires a `.env` file with **one** AI key: `OPENAI_API_KEY=sk-...` or `GEMINI_API_KEY=...` (or the legacy `API_KEY=` for Gemini).

## Architecture

**The Kongu Times** is a Tamil news aggregator. Two independent subsystems share a single `public/data/news.json` data file:

### AI provider selection (first match wins)
Both the CI script and the browser fallback pick a provider from env at startup:
- `OPENAI_API_KEY` starts with `sk-` → OpenAI `gpt-4o-mini`
- `GEMINI_API_KEY` or legacy `API_KEY` set → Gemini `gemini-2.5-flash`
- none set (or `NO_AI=1`) → **passthrough mode**: copies RSS as-is, no rewriting, no tokens (for testing the pipeline locally for free — `NO_AI=1 npm run generate`)

The two providers share `buildInstructions()` (the editorial prompt) and return the same article shape. Gemini uses native `responseSchema`; OpenAI uses `response_format: json_object` and returns `{ "articles": [...] }`. OpenAI is called via plain `fetch` (no SDK dependency).

### Generation subsystem (Node.js, server/CI only)
`scripts/generate-news.js` — the entire pipeline in one file:
1. Loads the existing `news.json` cache
2. Prunes articles older than `KEEP_DAYS` (7)
3. Fetches raw items from 13 Google News RSS sources (5 categories + 8 Kongu districts)
4. Deduplicates against the cache (by `link`), caps at `ITEMS_PER_FEED` new items
5. **Image enrichment** (`enrichImage`): Google News RSS has no images and its `CBMi…`
   redirect links can't be followed directly. So each new item's link is decoded to
   the real publisher URL via Google's `batchexecute` endpoint (`decodeGoogleNewsUrl`),
   then that page's `og:image`/`twitter:image` is scraped (`scrapeOgImage`). Per-run
   cached in `IMG_CACHE`; ~90%+ hit rate. Failures leave `thumbnail` blank → UI placeholder.
6. Sends **only new** items to the active provider (`processBatch`) in batches of `AI_BATCH_SIZE`
7. Merges results back into the cache, sorts by `pubDate`, trims to `CACHE_PER_FEED`
8. Writes the updated `news.json` (dropping feed keys no longer in `FEED_SOURCES`)

Key constants at the top of the script:
- `ITEMS_PER_FEED = 5` — max NEW items processed per run (keeps free-tier cost low)
- `CACHE_PER_FEED = 30` — max articles kept per feed in the JSON
- `AI_BATCH_SIZE = 5` — articles per AI call
- `KEEP_DAYS = 7` — articles older than this are pruned each run

### Frontend subsystem (React, browser)
Static-first: `App.tsx` fetches `./data/news.json` on load. If the file is missing or stale, it falls back to live mode: `services/rssService.ts` fetches RSS via CORS proxies, then `services/geminiService.ts` rewrites items in the browser.

`constants.ts` (browser live mode) and the `FEED_SOURCES` array in `generate-news.js` (CI) each list the feed IDs, Tamil names, and URLs. **Both places must be updated when adding a feed.**

### Data shape
`public/data/news.json`:
```json
{ "updatedAt": "ISO string", "feeds": { "[feedId]": EnhancedArticle[] }, "meta": { ... } }
```

`EnhancedArticle` (see `types.ts`): AI fields (`headline`, `summary`, `fullArticleContent`, `category`, `sentiment`, `tags`, `readingTime`) plus raw fallback mirrors (`title`, `description`, `content`, `link`, `guid`, `pubDate`, `thumbnail`).

### News sources
13 Google News RSS feeds — 5 categories (`top-news`, `tamil-nadu`, `india`, `sports`, `cinema`) + 8 Kongu-region districts (`coimbatore`, `erode`, `tiruppur`, `salem`, `namakkal`, `nilgiris`, `karur`, `dharmapuri`). No homepage scrapers (those only yielded title text → poor AI rewrites). Defined in `constants.ts` (UI) and `generate-news.js` `FEED_SOURCES` (CI).

### CI/CD
`.github/workflows/update-news.yml` runs every 3 hours: install → generate → commit `news.json` to `main` → build → deploy to GitHub Pages. Secrets (set whichever provider you use): `OPENAI_API_KEY`, `GEMINI_API_KEY`, or legacy `API_KEY`.

The commit step pushes to `main` via `git push origin HEAD:main`.

### AI output rules
- Never mention external sources in output — attribution replaced with `"எமது செய்திக்குழு அறிகிறது"`
- All output fields must be in Tamil script
- Article fields: `headline`, `summary`, `fullArticleContent` (HTML `<p>`/`<h3>`), `category`, `readingTime`, `sentiment`, `tags` (3)

### UI
- Feed tabs: first 5 visible as pills, remaining 15 in a dropdown
- Article display: 3-column grid of `ArticleCard` components
- Modal: `ArticleModal` renders `fullArticleContent` HTML (`<p>`, `<h3>` tags)
- Missing thumbnails → Unsplash placeholder (Google News items never have thumbnails)
- Colors: Tailwind `slate` + custom `brand` (sky-based) defined in Tailwind config
