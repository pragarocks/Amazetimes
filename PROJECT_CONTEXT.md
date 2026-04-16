# Amazetime.in — Full Project Context
> Read this first in any new Claude session before touching any code.

---

## What This Project Is

**amazetime.in** — A Tamil-language news portal that:
- Scrapes Tamil news from Google News RSS, BBC Tamil, Dinamalar, and Daily Thanthi
- Rewrites all content into professional Tamil journalism via Gemini AI
- Deploys as a fully static React site on GitHub Pages
- Auto-refreshes every 3 hours via GitHub Actions cron

**Owner:** Cognizant developer (pragarocks on GitHub)  
**Live site:** amazetime.in (GitHub Pages with custom domain)  
**Main branch:** `main`

---

## Critical History — Why We Changed Sources

The original v1 used **News18 Tamil RSS feeds** directly. These started returning **403 errors** because News18 Tamil actively blocks GitHub Actions / cloud runner IP ranges. This broke both the static generation CI and the browser live-fallback mode.

**Fix in v2:** Replaced all sources with:
- **Google News RSS** — Google's own public API, never blocks any IP
- **BBC Tamil RSS** — Reliable public feed
- **Cheerio + Axios scraping** — For Dinamalar and Daily Thanthi with rotating User-Agent headers

Do NOT add any source that requires authentication or that is known to block cloud IPs (e.g., News18 Tamil, PTI feeds).

---

## Architecture

```
GitHub Actions (every 3h)
  └─ scripts/generate-news.js
       ├─ Fetches: Google News RSS (18 feeds)
       ├─ Fetches: BBC Tamil RSS (world feed)
       ├─ Scrapes: dinamalar.com (cheerio)
       ├─ Scrapes: dailythanthi.com (cheerio)
       ├─ Sends batches of 8 to Gemini AI
       └─ Writes: public/data/news.json
            └─ git commit + push to main
                 └─ vite build → GitHub Pages deploy
```

**Browser fallback** (when news.json is missing/stale):
```
React App
  └─ fetchRSSFeed() [rssService.ts]
       ├─ Proxy 1: corsproxy.io
       ├─ Proxy 2: allorigins.win
       ├─ Proxy 3: rss2json.com
       └─ Proxy 4: codetabs.com
            └─ rewriteNewsWithGemini() [geminiService.ts]
                 └─ Gemini API (browser-side, API_KEY injected at build)
```

---

## File Map

```
Amazetimes/
├── .github/workflows/update-news.yml  ← CI cron job
├── scripts/generate-news.js           ← Server-side news generator (Node.js)
├── services/
│   ├── geminiService.ts               ← Browser-side Gemini rewrite
│   └── rssService.ts                  ← Browser-side RSS fetch (4 CORS proxies)
├── components/
│   ├── Header.tsx                     ← Site header
│   ├── ArticleCard.tsx                ← News card grid item
│   ├── ArticleModal.tsx               ← Full-article overlay
│   └── SkeletonCard.tsx               ← Loading placeholder
├── App.tsx                            ← Main app logic + feed switcher
├── constants.ts                       ← FEED_SOURCES (browser live mode)
├── types.ts                           ← TypeScript interfaces
├── index.tsx                          ← React entry point
├── index.html                         ← HTML shell
├── vite.config.ts                     ← Build config (base:'', API_KEY inject)
├── public/data/news.json              ← Generated output (committed by CI)
├── CLAUDE.md                          ← Claude Code auto-loaded context
├── PROJECT_CONTEXT.md                 ← This file (session handoff context)
└── README.md                          ← Human-readable project docs
```

---

## Feed Sources (20 total)

| ID | Name | Type | Source |
|---|---|---|---|
| `top-news` | தலைப்புச் செய்திகள் | RSS | Google News |
| `tamil-nadu` | தமிழ்நாடு | RSS | Google News |
| `india` | இந்தியா | RSS | Google News |
| `sports` | விளையாட்டு | RSS | Google News |
| `cinema` | சினிமா | RSS | Google News |
| `world` | உலகம் | RSS | BBC Tamil |
| `technology` | தொழில்நுட்பம் | RSS | Google News |
| `business` | வணிகம் | RSS | Google News |
| `dinamalar` | தினமலர் | Scrape | dinamalar.com |
| `thanthi` | தினத்தந்தி | Scrape | dailythanthi.com |
| `chennai` | சென்னை | RSS | Google News |
| `coimbatore` | கோயம்புத்தூர் | RSS | Google News |
| `madurai` | மதுரை | RSS | Google News |
| `tiruchirappalli` | திருச்சி | RSS | Google News |
| `salem` | சேலம் | RSS | Google News |
| `tirunelveli` | திருநெல்வேலி | RSS | Google News |
| `erode` | ஈரோடு | RSS | Google News |
| `vellore` | வேலூர்  | RSS | Google News |
| `thanjavur` | தஞ்சாவூர் | RSS | Google News |
| `kanyakumari` | கன்னியாகுமரி | RSS | Google News |

**When adding a new feed:** update both `constants.ts` AND `scripts/generate-news.js`.

---

## Key Interfaces (types.ts)

```ts
EnhancedArticle {
  // AI-generated
  originalLink, headline, summary, fullArticleContent,
  category, sentiment ('positive'|'neutral'|'negative'), tags[], readingTime,
  // UI compatibility aliases
  guid, pubDate, thumbnail, title, description, link, content, aiContent
}
```

`public/data/news.json`:
```json
{
  "updatedAt": "ISO timestamp",
  "feeds": { "[feedId]": EnhancedArticle[] },
  "meta": { "version": 2, "totalSources": 20, "succeeded": N, "failed": N }
}
```

---

## Environment

| Variable | Where set | Purpose |
|---|---|---|
| `API_KEY` | `.env` (local) / GitHub Secret (CI) | Gemini API key |

- `.env` is git-ignored — never commit it
- `vite.config.ts` injects `API_KEY` at build time for browser live mode
- GitHub Actions uses `secrets.API_KEY`

---

## npm Scripts

```bash
npm run dev        # Vite dev server (localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview the dist/ build
npm run generate   # Run generate-news.js (needs API_KEY in .env)
npm run deploy     # build + gh-pages push (manual deploy)
```

---

## AI Config

- **Model:** `gemini-2.5-flash-preview-04-17`
- **Output format:** JSON via `responseMimeType: "application/json"` + `responseSchema`
- **Batch size:** 8 articles per Gemini call (avoids token limits)
- **Retry:** 3 attempts with exponential backoff on every call
- **Rules:** Tamil only, no external branding, min 3 paragraphs HTML

---

## What Each Session Should Know

### Before making changes
1. Read `CLAUDE.md` (auto-loaded by Claude Code)
2. Read this file for context
3. Run `npm run build` to confirm baseline builds clean

### Common tasks

**Change update frequency:**
```yaml
# .github/workflows/update-news.yml
schedule:
  - cron: '0 */3 * * *'   # change this
```

**Add a new feed:**
1. Add to `FEED_SOURCES` in `constants.ts`
2. Add identical entry in `FEED_SOURCES` in `scripts/generate-news.js`
3. For scraping: add function in generate-news.js + register in `SCRAPERS` map

**Test generation locally:**
```bash
echo "API_KEY=your_key" > .env
npm run generate
```
Note: On corporate networks (SSL inspection) you may get cert errors for Google News.
This is a local-only issue — GitHub Actions works fine.

**Deploy manually:**
```bash
npm run deploy
```

---

## Known Issues & Notes

| Issue | Status | Detail |
|---|---|---|
| Google News SSL error locally | By design | Corporate proxy SSL inspection; fine in GitHub Actions |
| No thumbnails on Google News items | By design | Unsplash placeholder used; BBC Tamil has real thumbnails |
| Scrape selectors for Dinamalar/Thanthi | Monitor | CSS selectors may break if site redesigns |
| `gemini-2.5-flash-preview-04-17` | May expire | Update model ID in `generate-news.js` and `geminiService.ts` |

---

## Do Not

- Do not add News18 Tamil RSS URLs — they 403-block cloud IPs
- Do not commit `.env`
- Do not commit `dist/` — it is git-ignored and CI builds it fresh
- Do not change `base: ''` in `vite.config.ts` — required for GitHub Pages subdirectory paths
- Do not skip updating both `constants.ts` AND `generate-news.js` when adding feeds
