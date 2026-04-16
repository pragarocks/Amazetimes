import { RSSFeed, RSSItem } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// XML / RSS parsing helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse raw XML text → RSSFeed. Works with Google News RSS, BBC Tamil, and others. */
const parseXML = (xmlString: string, rssUrl: string): RSSFeed => {
  // Reject HTML error pages disguised as XML (captcha pages, proxy errors, etc.)
  const trimmed = xmlString.trim().toLowerCase();
  if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
    throw new Error("Received HTML page instead of RSS XML — likely a block or captcha");
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  if (xmlDoc.querySelector("parsererror")) {
    throw new Error("XML parse error — malformed feed");
  }

  const items = Array.from(xmlDoc.querySelectorAll("item"));
  if (items.length === 0) throw new Error("Feed returned 0 items");

  const parsedItems: RSSItem[] = items.map(item => {
    const text = (tag: string) => item.querySelector(tag)?.textContent?.trim() || "";

    const rawTitle  = text("title");
    // Google News appends " - Source Name" to every title — strip it
    const title     = rawTitle.replace(/\s[-–]\s[^-–]+$/, "").trim() || "Untitled";
    const link      = text("link");
    const pubDate   = text("pubDate") || new Date().toISOString();
    const guid      = text("guid") || link;

    // content:encoded > description for full-text sources (BBC, etc.)
    const contentEncoded =
      item.getElementsByTagNameNS("*", "encoded")[0]?.textContent?.trim() || "";
    const description = text("description");
    const content     = contentEncoded || description;

    // Thumbnail extraction — multiple fallback strategies
    let thumbnail = "";

    // 1. media:content
    const mediaContent = item.getElementsByTagNameNS("*", "content");
    if (mediaContent.length > 0) thumbnail = mediaContent[0].getAttribute("url") || "";

    // 2. media:thumbnail
    if (!thumbnail) {
      const mediaThumb = item.getElementsByTagNameNS("*", "thumbnail");
      if (mediaThumb.length > 0) thumbnail = mediaThumb[0].getAttribute("url") || "";
    }

    // 3. enclosure
    if (!thumbnail) {
      const enclosure = item.querySelector("enclosure");
      if (enclosure) thumbnail = enclosure.getAttribute("url") || "";
    }

    // 4. <img> inside content or description HTML
    if (!thumbnail) {
      const imgMatch = (content || description).match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) thumbnail = imgMatch[1];
    }

    // 5. Google News item description sometimes has a linked image URL
    if (!thumbnail && description.includes("http") && description.includes(".jpg")) {
      const urlMatch = description.match(/(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp))/i);
      if (urlMatch) thumbnail = urlMatch[1];
    }

    return {
      title, link, guid, pubDate, description, content,
      author: text("author") || text("dc:creator") || "",
      thumbnail,
      enclosure: {},
      categories: Array.from(item.querySelectorAll("category")).map(c => c.textContent?.trim() || ""),
    };
  });

  const channel = xmlDoc.querySelector("channel");
  return {
    status: "ok",
    feed: {
      url:         rssUrl,
      title:       channel?.querySelector("title")?.textContent || "News Feed",
      link:        channel?.querySelector("link")?.textContent || "",
      author:      "",
      description: channel?.querySelector("description")?.textContent || "",
      image:       channel?.querySelector("image url")?.textContent || "",
    },
    items: parsedItems,
  };
};

/** Map RSS2JSON API response → RSSFeed */
const mapRss2Json = (data: any, rssUrl: string): RSSFeed => {
  const items: RSSItem[] = (data.items || []).map((item: any) => ({
    title:       (item.title || "").replace(/\s[-–]\s[^-–]+$/, "").trim(),
    link:        item.link        || "",
    guid:        item.guid        || item.link || "",
    pubDate:     item.pubDate     || new Date().toISOString(),
    description: item.description || "",
    content:     item.content     || item.description || "",
    author:      item.author      || "",
    thumbnail:   item.thumbnail   || item.enclosure?.link || "",
    enclosure:   item.enclosure   || {},
    categories:  item.categories  || [],
  }));

  return {
    status: "ok",
    feed: {
      url: rssUrl,
      title: data.feed?.title || "News Feed",
      link:  data.feed?.link  || "",
      author: "",
      description: data.feed?.description || "",
      image:       data.feed?.image || "",
    },
    items,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Public fetch function — tries four CORS proxy strategies in order
// ─────────────────────────────────────────────────────────────────────────────

export const fetchRSSFeed = async (rssUrl: string): Promise<RSSFeed> => {
  const ts     = Date.now();
  const errors: string[] = [];

  // ── Strategy 1: corsproxy.io ─────────────────────────────────────────────
  try {
    const url = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}&_t=${ts}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseXML(await res.text(), rssUrl);
  } catch (e: any) {
    errors.push(`corsproxy.io: ${e.message}`);
  }

  // ── Strategy 2: allorigins.win ───────────────────────────────────────────
  try {
    const url = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}&disableCache=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.contents) throw new Error("Empty contents");
    return parseXML(data.contents, rssUrl);
  } catch (e: any) {
    errors.push(`allorigins: ${e.message}`);
  }

  // ── Strategy 3: rss2json.com ─────────────────────────────────────────────
  try {
    // Append timestamp to bust rss2json's internal cache
    const busted = `${rssUrl}${rssUrl.includes("?") ? "&" : "?"}_t=${ts}`;
    const url    = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(busted)}`;
    const res    = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== "ok") throw new Error(data.message || "Non-ok status");
    return mapRss2Json(data, rssUrl);
  } catch (e: any) {
    errors.push(`rss2json: ${e.message}`);
  }

  // ── Strategy 4: codetabs.com ─────────────────────────────────────────────
  try {
    const url = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}&_cb=${ts}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseXML(await res.text(), rssUrl);
  } catch (e: any) {
    errors.push(`codetabs: ${e.message}`);
  }

  console.error("[RSS] All proxy strategies failed:", errors);
  throw new Error("செய்திகளை எடுக்க முடியவில்லை. அனைத்து proxy கூட தோல்வியடைந்தன.");
};
