/**
 * The Kongu Times News Generator v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Sources (all RSS — public endpoints that never block cloud-runner IPs):
 *   1. Google News RSS  — primary for every category & district
 *   2. BBC Tamil RSS    — high-quality world / national news in Tamil
 *
 * Why not News18 Tamil RSS or homepage scraping?
 *   News18 Tamil blocks GitHub Actions IP ranges (403). Homepage scrapers
 *   (Dinamalar/Daily Thanthi) only yield headline text with no article body,
 *   which produces low-quality AI rewrites — so we rely solely on RSS feeds
 *   that carry real article snippets.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { GoogleGenAI, Type } from "@google/genai";
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

// ── AI provider selection (first match wins) ──────────────────────────────────
//   OPENAI_API_KEY (sk-...)            → OpenAI  gpt-4o-mini
//   GEMINI_API_KEY / API_KEY           → Gemini  gemini-2.5-flash
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
const OPENAI_MODEL   = 'gpt-4o-mini';
const GEMINI_MODEL   = 'gemini-2.5-flash';

let AI_PROVIDER;
if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-')) {
  AI_PROVIDER = 'openai';
} else if (GEMINI_API_KEY) {
  AI_PROVIDER = 'gemini';
} else {
  console.error("FATAL: No AI key set. Provide OPENAI_API_KEY or GEMINI_API_KEY (or API_KEY). Exiting.");
  process.exit(1);
}

// Gemini client is created lazily only when that provider is active.
const ai = AI_PROVIDER === 'gemini' ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const OUTPUT_DIR  = './public/data';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'news.json');
const ITEMS_PER_FEED = 5;    // max NEW items processed per run (keeps free-tier API costs low)
const CACHE_PER_FEED = 30;   // max cached articles kept per feed
const AI_BATCH_SIZE  = 5;    // articles sent to the AI provider per API call
const KEEP_DAYS      = 7;    // articles older than this are pruned from cache

// ── Utilities ─────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise(r => setTimeout(r, ms));

/** Exponential-backoff retry */
async function withRetry(fn, retries = 3, baseDelayMs = 1500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = baseDelayMs * Math.pow(2, attempt);
      console.warn(`    ↻ Retry ${attempt + 1}/${retries} in ${wait}ms — ${err.message}`);
      await delay(wait);
    }
  }
}

// Rotate user-agents so RSS endpoints see a normal browser
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];
const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// ── Feed Sources ──────────────────────────────────────────────────────────────
//
// Every source is an RSS feed fetched with rss-parser (Google News / BBC Tamil).
//
// For every RSS source we use Google News RSS search queries or BBC Tamil.
// These are PUBLIC endpoints that do not block crawler IPs.
//
// Google News RSS query format:
//   https://news.google.com/rss/search?q=QUERY&hl=ta-IN&gl=IN&ceid=IN:ta

const FEED_SOURCES = [
  // ── Primary category feeds (Google News RSS) ────────────────────────────
  {
    id: 'top-news',
    name: 'தலைப்புச் செய்திகள்',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=tamil+nadu+latest+news&hl=ta-IN&gl=IN&ceid=IN:ta',
    fallbackUrl: 'https://news.google.com/rss/search?q=tamilnadu+today&hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    id: 'tamil-nadu',
    name: 'தமிழ்நாடு',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=tamilnadu+government+CM+DMK+AIADMK&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'india',
    name: 'இந்தியா',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=india+national+news+modi+parliament&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'sports',
    name: 'விளையாட்டு',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=cricket+IPL+sports+india+2025&hl=ta-IN&gl=IN&ceid=IN:ta',
    fallbackUrl: 'https://news.google.com/rss/search?q=tamil+sports+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'cinema',
    name: 'சினிமா',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=kollywood+tamil+cinema+movies+box+office&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'world',
    name: 'உலகம்',
    type: 'rss',
    // BBC Tamil is a premium, highly reliable Tamil news source
    url: 'https://feeds.bbci.co.uk/tamil/rss.xml',
    fallbackUrl: 'https://news.google.com/rss/search?q=world+international+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'technology',
    name: 'தொழில்நுட்பம்',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=technology+AI+india+tech+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'business',
    name: 'வணிகம்',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=india+business+economy+market+stocks&hl=ta-IN&gl=IN&ceid=IN:ta',
  },

  // ── City-specific feeds (Google News RSS) ───────────────────────────────
  {
    id: 'chennai',
    name: 'சென்னை',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=chennai+news+today&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'coimbatore',
    name: 'கோயம்புத்தூர்',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=coimbatore+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'madurai',
    name: 'மதுரை',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=madurai+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'tiruchirappalli',
    name: 'திருச்சி',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=tiruchirappalli+trichy+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'salem',
    name: 'சேலம்',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=salem+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'tirunelveli',
    name: 'திருநெல்வேலி',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=tirunelveli+nellai+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'erode',
    name: 'ஈரோடு',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=erode+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'vellore',
    name: 'வேலூர்',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=vellore+district+tamilnadu+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'thanjavur',
    name: 'தஞ்சாவூர்',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=thanjavur+tanjore+news&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
  {
    id: 'kanyakumari',
    name: 'கன்னியாகுமரி',
    type: 'rss',
    url: 'https://news.google.com/rss/search?q=kanyakumari+news+tamilnadu&hl=ta-IN&gl=IN&ceid=IN:ta',
  },
];

// ── RSS Fetching ──────────────────────────────────────────────────────────────

function buildRSSParser() {
  return new Parser({
    timeout: 20000,
    headers: {
      'User-Agent': randomUA(),
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      'Accept-Language': 'ta-IN,ta;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    },
    customFields: {
      item: [
        ['media:content',   'mediaContent',   { keepArray: false }],
        ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
        ['enclosure',       'enclosure'],
      ],
    },
  });
}

/** Extract best available thumbnail from an RSS item */
function extractThumbnail(item) {
  if (item.mediaContent?.$.url)   return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url)        return item.enclosure.url;

  // Scan description / content HTML for <img src="...">
  const html = item.content || item.contentSnippet || item.description || '';
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];

  return '';
}

/** Fetch an RSS feed with retry + optional fallback URL */
async function fetchRSSSource(source) {
  const tryParse = (url) => withRetry(() => buildRSSParser().parseURL(url), 3, 1500);

  try {
    return await tryParse(source.url);
  } catch (primaryErr) {
    console.warn(`    Primary RSS failed (${primaryErr.message})`);
    if (source.fallbackUrl) {
      console.log(`    Trying fallback URL...`);
      return await tryParse(source.fallbackUrl);
    }
    throw primaryErr;
  }
}

/** Normalise an rss-parser item to our internal shape */
function normaliseRSSItem(item) {
  return {
    link:        item.link        || item.guid || '',
    guid:        item.guid        || item.link || '',
    title:       (item.title      || '').trim(),
    content:     item.content     || item.contentSnippet || item.description || '',
    description: item.description || item.contentSnippet || '',
    pubDate:     item.pubDate     || new Date().toISOString(),
    thumbnail:   extractThumbnail(item),
  };
}

// ── AI Processing (provider-agnostic) ──────────────────────────────────────────

/** Strip HTML/whitespace and cap length for each raw item before sending to the AI. */
function buildPayload(items) {
  return items
    .map(item => ({
      link:    item.link,
      title:   item.title || '',
      content: (item.content || item.description || '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 1200),
    }))
    .filter(p => p.title.length > 5);
}

/** Shared editorial instructions used by every provider. */
function buildInstructions(count) {
  return `You are the Chief Editor for 'The Kongu Times', a premium Tamil digital news platform.

TASK: Rewrite the following ${count} news items into high-quality, professional Tamil journalism.

STRICT RULES:
1. OUTPUT LANGUAGE: Every field MUST be in Tamil script only.
2. TONE: Objective, authoritative, editorial-quality journalism.
3. BRANDING: NEVER mention external sources (BBC, Google, News18, PTI, ANI, Dinamalar, etc.).
   Replace attributions with "எமது செய்திக்குழு அறிகிறது" or "தகவல்கள் தெரிவிக்கின்றன".
4. CONTENT RULES (per article object):
   - originalLink: MUST exactly match the input link
   - headline: Powerful, informative Tamil headline (15-25 words)
   - summary: Concise 2-sentence Tamil intro paragraph
   - fullArticleContent: Detailed HTML article using <p> and <h3> tags, minimum 3 paragraphs, no placeholder text
   - category: Topic name in Tamil (e.g., "அரசியல்", "விளையாட்டு", "சினிமா")
   - readingTime: e.g., "2 நிமிடம்"
   - sentiment: exactly one of "positive", "neutral", or "negative"
   - tags: exactly 3 relevant Tamil keyword tags`;
}

/** Route a batch to the active provider. Returns an array of AI article objects. */
async function processBatch(items) {
  const payload = buildPayload(items);
  if (payload.length === 0) return [];
  return AI_PROVIDER === 'openai'
    ? processWithOpenAI(payload)
    : processWithGemini(payload);
}

async function processWithGemini(payload) {
  const response = await withRetry(
    () => ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${buildInstructions(payload.length)}\n\nDATA: ${JSON.stringify(payload)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              originalLink:       { type: Type.STRING },
              headline:           { type: Type.STRING },
              summary:            { type: Type.STRING },
              fullArticleContent: { type: Type.STRING },
              category:           { type: Type.STRING },
              sentiment:          { type: Type.STRING },
              tags:               { type: Type.ARRAY, items: { type: Type.STRING } },
              readingTime:        { type: Type.STRING },
            },
            required: ['originalLink', 'headline', 'summary', 'fullArticleContent'],
          },
        },
      },
    }),
    3, 3000
  );

  const text = response.text?.trim();
  if (!text) throw new Error('Empty response from Gemini');
  return JSON.parse(text);
}

async function processWithOpenAI(payload) {
  const response = await withRetry(
    () => fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildInstructions(payload.length) },
          {
            role: 'user',
            content: `Return ONLY a JSON object of the form {"articles": [ ... ]} where each element ` +
              `has the fields: originalLink, headline, summary, fullArticleContent, category, ` +
              `readingTime, sentiment, tags (array of 3).\n\nDATA: ${JSON.stringify(payload)}`,
          },
        ],
      }),
    }).then(async res => {
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).substring(0, 200)}`);
      return res.json();
    }),
    3, 3000
  );

  const text = response.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from OpenAI');
  const parsed = JSON.parse(text);
  // json_object mode returns an object; accept either {articles:[...]} or a bare array.
  return Array.isArray(parsed) ? parsed : (parsed.articles || parsed.items || []);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function generateNews() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  The Kongu Times News Generator v2');
  console.log(`  ${new Date().toISOString()}`);
  console.log(`  AI provider: ${AI_PROVIDER === 'openai' ? `OpenAI (${OPENAI_MODEL})` : `Gemini (${GEMINI_MODEL})`}`);
  console.log('═══════════════════════════════════════════════════');

  // Load cached data
  let existingData = { feeds: {}, updatedAt: null };
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      const feedCount = Object.keys(existingData.feeds || {}).length;
      console.log(`\n📂 Loaded cache: ${feedCount} feeds\n`);
    } catch {
      console.warn('⚠️  Corrupted news.json — starting fresh.\n');
    }
  }

  const allData     = { ...(existingData.feeds || {}) };

  // Prune articles older than KEEP_DAYS from every feed
  const cutoffMs = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  let prunedTotal = 0;
  for (const feedId of Object.keys(allData)) {
    const before = allData[feedId].length;
    allData[feedId] = allData[feedId].filter(a => {
      const ts = new Date(a.pubDate).getTime();
      return isNaN(ts) || ts >= cutoffMs;
    });
    prunedTotal += before - allData[feedId].length;
  }
  if (prunedTotal > 0) console.log(`🗑  Pruned ${prunedTotal} articles older than ${KEEP_DAYS} days\n`);

  let successCount  = 0;
  let skipCount     = 0;
  let failCount     = 0;

  for (const source of FEED_SOURCES) {
    console.log(`\n┌─ [${source.id}] ${source.name}`);

    try {
      // ── Step 1: Fetch raw items (all sources are Google News / BBC RSS) ──
      console.log(`│  📡 RSS: ${source.url.substring(0, 80)}...`);
      const feed = await fetchRSSSource(source);
      let rawItems = feed.items
        .slice(0, ITEMS_PER_FEED)
        .map(normaliseRSSItem)
        .filter(i => i.link && i.title);

      console.log(`│  ✓ Fetched ${rawItems.length} items`);

      // ── Step 2: Deduplicate against cache, cap at ITEMS_PER_FEED new items ─
      const existing     = allData[source.id] || [];
      const existingLinks = new Set(existing.map(e => e.link));
      const newItems     = rawItems
        .filter(i => !existingLinks.has(i.link))
        .slice(0, ITEMS_PER_FEED);   // only process the N newest items per run

      if (newItems.length === 0) {
        console.log(`│  ⏭  No new articles — skipping AI step`);
        console.log(`└─ ✅ Up to date`);
        skipCount++;
        successCount++;
        continue;
      }

      console.log(`│  🆕 ${newItems.length} new articles to process`);

      // ── Step 3: AI rewrite in batches ────────────────────────────────────
      const processedItems = [];

      for (let i = 0; i < newItems.length; i += AI_BATCH_SIZE) {
        const batch = newItems.slice(i, i + AI_BATCH_SIZE);
        const batchNum = Math.floor(i / AI_BATCH_SIZE) + 1;
        console.log(`│  🧠 AI batch ${batchNum} (${batch.length} items)...`);

        if (i > 0) await delay(1000); // rate-limit between Gemini calls

        try {
          const aiBatch = await processBatch(batch);

          for (const aiItem of aiBatch) {
            const original = batch.find(o => o.link === aiItem.originalLink) || batch[0];
            processedItems.push({
              // AI fields
              ...aiItem,
              // UI compatibility / raw fallback fields
              pubDate:     original.pubDate || new Date().toISOString(),
              thumbnail:   original.thumbnail || '',
              guid:        original.guid || original.link,
              title:       aiItem.headline,
              description: aiItem.summary,
              link:        aiItem.originalLink,
              content:     aiItem.fullArticleContent,
              aiContent:   aiItem,
            });
          }
        } catch (batchErr) {
          console.error(`│  ❌ AI batch ${batchNum} failed: ${batchErr.message}`);
          // continue with remaining batches
        }
      }

      // ── Step 4: Merge, deduplicate, trim ────────────────────────────────
      allData[source.id] = [...processedItems, ...existing]
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .filter((v, i, arr) => arr.findIndex(t => t.link === v.link) === i)
        .slice(0, CACHE_PER_FEED);

      console.log(`│  +${processedItems.length} new  |  ${allData[source.id].length} total cached`);
      console.log(`└─ ✅ Done`);
      successCount++;

    } catch (err) {
      console.error(`│  ❌ FATAL ERROR: ${err.message}`);
      console.log(`└─ ✗ Skipped (existing cache preserved)`);
      failCount++;
      // Continue — never let one failed source kill the whole run
    }

    await delay(300); // short pause between sources
  }

  // ── Write output ─────────────────────────────────────────────────────────
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const output = {
    updatedAt:   new Date().toISOString(),
    feeds:       allData,
    meta: {
      version:      2,
      totalSources: FEED_SOURCES.length,
      succeeded:    successCount,
      skipped:      skipCount,
      failed:       failCount,
    },
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Generation complete`);
  console.log(`  ✅ Success: ${successCount}  ⏭  Skipped: ${skipCount}  ❌ Failed: ${failCount}`);
  console.log('═══════════════════════════════════════════════════\n');

  // Fail the CI step only if ALL sources failed (total blackout)
  if (failCount > 0 && successCount === 0) {
    console.error('CRITICAL: Every source failed. Exiting with error code.');
    process.exit(1);
  }
}

generateNews()
  .then(() => {
    // Explicitly exit: the AI HTTP client / keep-alive sockets keep Node's
    // event loop alive, so the process would otherwise hang until CI times out
    // (and the commit/push step would never run). The file is already written.
    process.exit(0);
  })
  .catch(err => {
    console.error('Unhandled fatal error:', err);
    process.exit(1);
  });
