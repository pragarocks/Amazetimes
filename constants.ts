import { FeedSource } from "./types";

/**
 * FEED_SOURCES — single source of truth for all feed categories.
 *
 * Source strategy (browser live-mode):
 *  - Google News RSS: reliable, never blocks CORS proxies
 *  - BBC Tamil RSS:   high-quality world/national Tamil content
 *
 * Keep IDs in sync with scripts/generate-news.js FEED_SOURCES.
 */
export const FEED_SOURCES: FeedSource[] = [
  // ── Primary feeds ─────────────────────────────────────────────────────────
  {
    id: 'top-news',
    name: 'தலைப்புச் செய்திகள்',
    url: 'https://news.google.com/rss/search?q=tamil+nadu+latest+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'tamil-nadu',
    name: 'தமிழ்நாடு',
    url: 'https://news.google.com/rss/search?q=tamilnadu+government+CM+DMK+AIADMK&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'india',
    name: 'இந்தியா',
    url: 'https://news.google.com/rss/search?q=india+national+news+modi+parliament&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'sports',
    name: 'விளையாட்டு',
    url: 'https://news.google.com/rss/search?q=cricket+IPL+sports+india+2025&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'cinema',
    name: 'சினிமா',
    url: 'https://news.google.com/rss/search?q=kollywood+tamil+cinema+movies+box+office&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'world',
    name: 'உலகம்',
    // BBC Tamil: premium quality, extremely reliable
    url: 'https://feeds.bbci.co.uk/tamil/rss.xml',
  },
  {
    id: 'technology',
    name: 'தொழில்நுட்பம்',
    url: 'https://news.google.com/rss/search?q=technology+AI+india+tech+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'business',
    name: 'வணிகம்',
    url: 'https://news.google.com/rss/search?q=india+business+economy+market+stocks&hl=ta-IN&gl=IN&ceid=IN:ta',
  },

  // ── Scraped sources (live mode falls back to Google News) ──────────────────
  {
    id: 'dinamalar',
    name: 'தினமலர்',
    url: 'https://news.google.com/rss/search?q=site:dinamalar.com&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'thanthi',
    name: 'தினத்தந்தி',
    url: 'https://news.google.com/rss/search?q=site:dailythanthi.com&hl=ta-IN&gl=IN&ceid=IN:ta',
  },

  // ── City-specific feeds ───────────────────────────────────────────────────
  {
    id: 'chennai',
    name: 'சென்னை',
    url: 'https://news.google.com/rss/search?q=chennai+news+today&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'coimbatore',
    name: 'கோயம்புத்தூர்',
    url: 'https://news.google.com/rss/search?q=coimbatore+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'madurai',
    name: 'மதுரை',
    url: 'https://news.google.com/rss/search?q=madurai+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'tiruchirappalli',
    name: 'திருச்சி',
    url: 'https://news.google.com/rss/search?q=tiruchirappalli+trichy+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'salem',
    name: 'சேலம்',
    url: 'https://news.google.com/rss/search?q=salem+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'tirunelveli',
    name: 'திருநெல்வேலி',
    url: 'https://news.google.com/rss/search?q=tirunelveli+nellai+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'erode',
    name: 'ஈரோடு',
    url: 'https://news.google.com/rss/search?q=erode+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'vellore',
    name: 'வேலூர்',
    url: 'https://news.google.com/rss/search?q=vellore+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'thanjavur',
    name: 'தஞ்சாவூர்',
    url: 'https://news.google.com/rss/search?q=thanjavur+tanjore+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'kanyakumari',
    name: 'கன்னியாகுமரி',
    url: 'https://news.google.com/rss/search?q=kanyakumari+news+tamilnadu&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
];
