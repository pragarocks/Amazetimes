import { RSSFeed, RSSItem } from "../types";

// Helper: Parse XML String
const parseXML = (xmlString: string, rssUrl: string): RSSFeed => {
  // Check for HTML error responses hidden in 200 OK
  // Many proxies return a 200 OK with an HTML body when they fail or hit a captcha
  if (xmlString.trim().toLowerCase().startsWith("<!doctype html") || xmlString.includes("<html")) {
    throw new Error("Received HTML content (likely a blocking page or captcha) instead of XML");
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`XML Parse Error: ${parseError.textContent}`);
  }

  const channel = xmlDoc.querySelector("channel");
  const items = Array.from(xmlDoc.querySelectorAll("item"));

  if (items.length === 0) {
    throw new Error("No items found in feed");
  }

  const parsedItems: RSSItem[] = items.map(item => {
    const getVal = (tag: string) => item.querySelector(tag)?.textContent?.trim() || "";
    
    const title = getVal("title") || "Untitled Article";
    const link = getVal("link");
    const description = getVal("description");
    const pubDate = getVal("pubDate") || new Date().toISOString();
    const guid = getVal("guid") || link;
    
    const contentEncoded = item.getElementsByTagNameNS("*", "encoded")[0]?.textContent?.trim();
    const content = contentEncoded || description;

    // Image Extraction
    let thumbnail = "";
    const mediaContent = item.getElementsByTagNameNS("*", "content");
    if (mediaContent.length > 0) thumbnail = mediaContent[0].getAttribute("url") || "";
    
    if (!thumbnail) {
      const mediaThumb = item.getElementsByTagNameNS("*", "thumbnail");
      if (mediaThumb.length > 0) thumbnail = mediaThumb[0].getAttribute("url") || "";
    }

    if (!thumbnail) {
      const enclosure = item.querySelector("enclosure");
      if (enclosure) thumbnail = enclosure.getAttribute("url") || "";
    }

    if (!thumbnail) {
      const imgMatch = (content || description).match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) thumbnail = imgMatch[1];
    }

    return {
      title,
      link,
      guid,
      pubDate,
      description,
      content, 
      author: "",
      thumbnail,
      enclosure: {},
      categories: []
    };
  });

  return {
    status: 'ok',
    feed: {
      url: rssUrl,
      title: channel?.querySelector("title")?.textContent || "News Feed",
      link: channel?.querySelector("link")?.textContent || "",
      author: "",
      description: channel?.querySelector("description")?.textContent || "",
      image: ""
    },
    items: parsedItems
  };
};

// Helper: Map RSS2JSON response
const mapRss2Json = (data: any, rssUrl: string): RSSFeed => {
   const items: RSSItem[] = data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      guid: item.guid,
      pubDate: item.pubDate,
      description: item.description,
      content: item.content,
      author: item.author,
      thumbnail: item.thumbnail || item.enclosure?.link || "",
      enclosure: item.enclosure,
      categories: item.categories
   }));

   return {
     status: 'ok',
     feed: {
       url: rssUrl,
       title: data.feed.title,
       link: data.feed.link,
       author: "",
       description: data.feed.description,
       image: data.feed.image
     },
     items
   };
};

export const fetchRSSFeed = async (rssUrl: string): Promise<RSSFeed> => {
  const errors: string[] = [];
  const timestamp = new Date().getTime();

  // Strategy 1: CorsProxy.io
  // CACHE BUSTING: Append query param to the proxy URL to force a fresh fetch
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}&_t=${timestamp}`;
    console.log(`[RSS] Strategy 1 (CorsProxy): ${proxyUrl}`);
    
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const text = await response.text();
    return parseXML(text, rssUrl);
  } catch (e: any) {
    console.warn("[RSS] Strategy 1 failed:", e.message);
    errors.push(`CorsProxy: ${e.message}`);
  }

  // Strategy 2: AllOrigins (JSON Mode)
  // CACHE BUSTING: Use 'disableCache=true' which AllOrigins explicitly supports
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}&disableCache=true`;
    console.log(`[RSS] Strategy 2 (AllOrigins): ${proxyUrl}`);
    
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (data.contents) {
        return parseXML(data.contents, rssUrl);
    } else {
        throw new Error("Empty contents from AllOrigins");
    }
  } catch (e: any) {
    console.warn("[RSS] Strategy 2 failed:", e.message);
    errors.push(`AllOrigins: ${e.message}`);
  }

  // Strategy 3: RSS2JSON API
  // CACHE BUSTING: RSS2JSON caches based on the 'rss_url' parameter.
  // We append a dummy parameter to the actual RSS URL so it looks like a new feed to them.
  try {
     const bustedRssUrl = `${rssUrl}${rssUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
     const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(bustedRssUrl)}`;
     console.log(`[RSS] Strategy 3 (RSS2JSON): ${apiUrl}`);
     
     const response = await fetch(apiUrl);
     if (!response.ok) throw new Error(`HTTP ${response.status}`);
     
     const data = await response.json();
     if (data.status === 'ok') {
         return mapRss2Json(data, rssUrl);
     } else {
         throw new Error(data.message || "RSS2JSON status not ok");
     }
  } catch (e: any) {
      console.warn("[RSS] Strategy 3 failed:", e.message);
      errors.push(`RSS2JSON: ${e.message}`);
  }

  // Strategy 4: CodeTabs
  // CACHE BUSTING: Append random param
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}&_cb=${timestamp}`;
    console.log(`[RSS] Strategy 4 (CodeTabs): ${proxyUrl}`);
    
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const text = await response.text();
    return parseXML(text, rssUrl);
  } catch (e: any) {
      console.warn("[RSS] Strategy 4 failed:", e.message);
      errors.push(`CodeTabs: ${e.message}`);
  }

  console.error("All fetch strategies failed:", errors);
  // Throw a user-friendly error, but log the details above
  throw new Error("Unable to retrieve news feeds from any source. The feed may be down or blocking access.");
};