import { FeedSource } from "./types";

/**
 * FEED_SOURCES — single source of truth for the browser UI tabs and live mode.
 *
 * 5 categories + the 8 Kongu-region districts. All Google News RSS
 * (reliable, never blocks CORS proxies / CI runner IPs).
 *
 * Keep IDs in sync with scripts/generate-news.js FEED_SOURCES.
 */
export const FEED_SOURCES: FeedSource[] = [
  // ── Categories ─────────────────────────────────────────────────────────────
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
    url: 'https://news.google.com/rss/search?q=cricket+IPL+sports+india&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'cinema',
    name: 'சினிமா',
    url: 'https://news.google.com/rss/search?q=kollywood+tamil+cinema+movies+box+office&hl=ta-IN&gl=IN&ceid=IN:ta',
  },

  // ── Kongu-region districts ───────────────────────────────────────────────────
  {
    id: 'coimbatore',
    name: 'கோயம்புத்தூர்',
    url: 'https://news.google.com/rss/search?q=coimbatore+district+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'erode',
    name: 'ஈரோடு',
    url: 'https://news.google.com/rss/search?q=erode+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'tiruppur',
    name: 'திருப்பூர்',
    url: 'https://news.google.com/rss/search?q=tiruppur+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'salem',
    name: 'சேலம்',
    url: 'https://news.google.com/rss/search?q=salem+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'namakkal',
    name: 'நாமக்கல்',
    url: 'https://news.google.com/rss/search?q=namakkal+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'nilgiris',
    name: 'நீலகிரி',
    url: 'https://news.google.com/rss/search?q=nilgiris+ooty+district+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'karur',
    name: 'கரூர்',
    url: 'https://news.google.com/rss/search?q=karur+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'dharmapuri',
    name: 'தர்மபுரி',
    url: 'https://news.google.com/rss/search?q=dharmapuri+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
];
