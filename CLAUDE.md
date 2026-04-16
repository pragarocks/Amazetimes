# Amazetime.in — CLAUDE.md

## Project Overview
Tamil-language news aggregator at **amazetime.in**. Fetches/scrapes news from multiple reliable sources, rewrites in professional Tamil using **Gemini AI**, and serves a static React frontend.

## Why we moved away from News18 Tamil RSS
News18 Tamil actively blocks GitHub Actions and cloud runner IP ranges with 403 responses. The new architecture uses **Google News RSS** (Google's own infrastructure — never blocks), **BBC Tamil RSS**, and **direct web scraping** of major Tamil dailies.

## Architecture

### Static Mode (production — used 99% of the time)
1. GitHub Actions cron runs `scripts/generate-news.js` every 3 hours
2. Script fetches from Google News RSS / BBC Tamil / scrapes Dinamalar & Daily Thanthi
3. Gemini AI rewrites all content in professional Tamil
4. Output written to `public/data/news.json`
5. Site is rebuilt and deployed to GitHub Pages

### Live Mode (browser fallback — when news.json is 404 or stale)
1. React app fetches RSS feeds directly through CORS proxies
2. Items are sent to Gemini AI via browser-side `geminiService.ts`
3. Results displayed immediately without a server

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS 3
- **AI**: `@google/genai` — model `gemini-2.5-flash-preview-04-17`
- **RSS**: `rss-parser` (Node.js)
- **Scraping**: `cheerio` + `axios` (Node.js generation script only)
- **Deploy**: `gh-pages` → GitHub Pages; custom domain `amazetime.in`
- **CI**: GitHub Actions (`.github/workflows/update-news.yml`) — cron every 3 hours

## News Sources

### Primary: Google News RSS (extremely reliable)
URL pattern: `https://news.google.com/rss/search?q=QUERY&hl=ta-IN&gl=IN&ceid=IN:ta`

Used for: top-news, tamil-nadu, india, sports, cinema, technology, business, and all 11 city feeds.

**Why this works:** Google News is a public aggregation API. It pulls from Dinamalar, Vikatan, The Hindu Tamil, etc. internally. GitHub Actions IPs are never blocked.

### Secondary: BBC Tamil RSS
`https://feeds.bbci.co.uk/tamil/rss.xml` — used for `world` feed. Premium quality, highly reliable.

### Direct Web Scraping (generation script only)
| Feed ID | Site | Method |
|---|---|---|
| `dinamalar` | dinamalar.com | cheerio + axios |
| `thanthi` | dailythanthi.com | cheerio + axios |

Scrapers use rotating User-Agent headers and retry with exponential backoff. Failures are isolated — a broken scraper does not stop other feeds.

## Key Files
| File | Purpose |
|---|---|
| `scripts/generate-news.js` | Node.js — fetches all sources, calls Gemini, writes `public/data/news.json` |
| `services/geminiService.ts` | Browser-side Gemini rewrite (live fallback mode) |
| `services/rssService.ts` | Browser-side RSS fetch via 4 CORS proxy strategies |
| `constants.ts` | `FEED_SOURCES` — source of truth for feed IDs, Tamil names, URLs |
| `types.ts` | TypeScript interfaces for all data shapes |
| `App.tsx` | Main React app — feed selection, static/live switching |
| `public/data/news.json` | Generated output: `{ updatedAt, feeds, meta }` |
| `vite.config.ts` | `base: ''` for relative paths; injects `API_KEY` at build |

## Feed IDs (20 total)
`top-news` `tamil-nadu` `india` `sports` `cinema` `world` `technology` `business` `dinamalar` `thanthi` `chennai` `coimbatore` `madurai` `tiruchirappalli` `salem` `tirunelveli` `erode` `vellore` `thanjavur` `kanyakumari`

## Environment & Secrets
- `API_KEY` — Gemini API key. Set as **GitHub Repository Secret** for CI.
- Local: create `.env` with `API_KEY=your_key_here`
- Vite exposes it at build time via `define: { 'process.env.API_KEY': ... }`

## npm Scripts
```
npm run dev        # Vite dev server
npm run build      # Production build → dist/
npm run preview    # Preview dist/
npm run deploy     # build + gh-pages push
npm run generate   # Run scripts/generate-news.js locally
```

## Data Schema (`EnhancedArticle`)
```ts
{
  // AI-generated fields
  originalLink, headline, summary, fullArticleContent,
  category, sentiment ('positive'|'neutral'|'negative'), tags[], readingTime,
  // Raw/compat fields (mirrors AI fields for UI)
  guid, pubDate, thumbnail, title, description, link, content, aiContent
}
```
`fullArticleContent` is HTML with `<p>` and `<h3>` tags.

`public/data/news.json` shape:
```json
{ "updatedAt": "ISO string", "feeds": { "[feedId]": EnhancedArticle[] }, "meta": { ... } }
```

## AI Prompting Rules
- **Output language**: Tamil only
- **Tone**: Professional, objective, authoritative
- **No source branding**: Never mention BBC/Google/News18/PTI/ANI/Dinamalar
- **Response format**: Structured JSON via `responseMimeType + responseSchema`
- **Model**: `gemini-2.5-flash-preview-04-17`

## Common Tasks

**Add a new feed:**
1. Add entry to `FEED_SOURCES` in `constants.ts` (browser live mode)
2. Add matching entry in `scripts/generate-news.js` `FEED_SOURCES` array
3. For web scraping: add scraper function + register in `SCRAPERS` map

**Change cron frequency:**
Edit `schedule.cron` in `.github/workflows/update-news.yml`.

**Run generation locally:**
```bash
echo "API_KEY=your_key" > .env
npm install
npm run generate
# writes to public/data/news.json
```

**Test single source:**
```bash
# Edit generate-news.js to temporarily set FEED_SOURCES to a single entry
npm run generate
```

## UI Notes
- First 8 feeds show as pill tabs; remaining in a "கூடுதல் பிரிவுகள்" dropdown
- Colors: Tailwind `slate` + `brand` (sky-based custom color)
- Fonts: Inter (UI), Merriweather (article content)
- Missing thumbnails → Unsplash news placeholder
- Google News items have no thumbnails — placeholder always used
- BBC Tamil items usually have thumbnails via `media:content`
