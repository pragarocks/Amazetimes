# Amazetime.in — AI-Powered Tamil News Portal

**Amazetime.in** is a Tamil news aggregator that scrapes multiple reliable sources, rewrites all content into professional Tamil journalism using **Google Gemini AI**, and auto-deploys to GitHub Pages every 3 hours.

---

## How It Works

1. **Fetch** — GitHub Actions pulls news from Google News RSS, BBC Tamil RSS, and scrapes Dinamalar & Daily Thanthi
2. **Rewrite** — Gemini AI rewrites every article in professional Tamil, removing all source branding
3. **Deploy** — Static `news.json` is committed and the site is rebuilt on GitHub Pages automatically
4. **Fallback** — If `news.json` is unavailable, the React app fetches RSS live via CORS proxies and calls Gemini in the browser

---

## Local Development

```bash
git clone <repository-url>
npm install
```

Create a `.env` file:
```env
API_KEY=your_gemini_api_key_here
```

```bash
npm run dev        # Start dev server
npm run generate   # Run the news generator locally
npm run build      # Production build
npm run deploy     # Build + push to gh-pages branch
```

---

## Adding New Sources

**For RSS feeds** — add to `FEED_SOURCES` in both files:
- `constants.ts` (browser live mode)
- `scripts/generate-news.js` (CI generation)

Use Google News RSS format:
```
https://news.google.com/rss/search?q=YOUR_QUERY&hl=ta-IN&gl=IN&ceid=IN:ta
```

**For scraped sites** — add a scraper function in `scripts/generate-news.js` and register it in the `SCRAPERS` map.

---

## GitHub Actions

The workflow (`.github/workflows/update-news.yml`) runs every 3 hours and:
1. Installs dependencies
2. Runs `npm run generate` (fetches + AI rewrites)
3. Commits `public/data/news.json` to `main`
4. Rebuilds and deploys to GitHub Pages

Required secret: `API_KEY` (Gemini API key) — set in GitHub Repository Settings → Secrets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS 3 |
| AI | Google Gemini (`gemini-2.5-flash-preview-04-17`) |
| Scraping | `cheerio` + `axios` (server-side only) |
| RSS | `rss-parser` |
| CI/CD | GitHub Actions → GitHub Pages |
| Domain | amazetime.in |

---

## Why Not News18 Tamil RSS?

News18 Tamil blocks GitHub Actions IP ranges with 403 responses. The current stack uses Google News RSS (Google's own infrastructure — never blocks) and direct scraping with browser-like headers.

---

*Built for the Tamil community by the Amazetime team.*
