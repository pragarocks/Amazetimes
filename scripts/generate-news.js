
import 'dotenv/config';
import { GoogleGenAI, Type } from "@google/genai";
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

// Configure parser to recognize News18's media tags
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure']
    ],
  }
});

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("FATAL ERROR: process.env.API_KEY is not defined.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const FEED_SOURCES = [
  { id: 'top-news', name: 'தலைப்புச் செய்திகள்', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/live-updates.xml' },
  { id: 'tamil-nadu', name: 'தமிழ்நாடு', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/tamil-nadu.xml' },
  { id: 'sports', name: 'விளையாட்டு', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/sports.xml' },
  { id: 'cinema', name: 'சினிமா', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/cinema.xml' },
  { id: 'chennai', name: 'சென்னை', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/chennai.xml' },
  { id: 'coimbatore', name: 'கோயம்புத்தூர்', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/coimbatore.xml' },
  { id: 'madurai', name: 'மதுரை', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/madurai.xml' },
  { id: 'tiruchirappalli', name: 'திருச்சி', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/tiruchirappalli.xml' },
  { id: 'salem', name: 'சேலம்', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/salem.xml' },
  { id: 'tirunelveli', name: 'திருநெல்வேலி', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/tirunelveli.xml' },
  { id: 'erode', name: 'ஈரோடு', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/erode-district.xml' },
  { id: 'vellore', name: 'வேலூர்', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/vellore-district.xml' },
  { id: 'thanjavur', name: 'தஞ்சாவூர்', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/thanjavur-district.xml' },
  { id: 'kanyakumari', name: 'கன்னியாகுமரி', url: 'https://tamil.news18.com/commonfeeds/v1/tam/rss/kanniyakumari-district.xml' }
];

const OUTPUT_DIR = './public/data';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'news.json');

async function generateNews() {
  console.log("🚀 Starting Incremental News Generation...");
  
  let existingData = { feeds: {}, updatedAt: null };
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch (e) {
      console.warn("⚠️ news.json corrupted.");
    }
  }

  const allData = { ...existingData.feeds };

  for (const source of FEED_SOURCES) {
    try {
      console.log(`📡 Fetching: ${source.name}...`);
      const feed = await parser.parseURL(source.url);
      
      const feedItems = feed.items.slice(0, 20); 
      const existingItems = allData[source.id] || [];
      const newItems = feedItems.filter(item => !existingItems.some(ex => ex.link === item.link));
      
      if (newItems.length === 0) {
        console.log(`✅ ${source.name}: No new news.`);
        continue;
      }

      console.log(`🧠 ${source.name}: Processing ${newItems.length} items...`);

      const payload = newItems.map(item => ({
        link: item.link,
        title: item.title,
        content: (item.content || item.contentSnippet || "").replace(/<[^>]*>?/gm, ' ').substring(0, 1000)
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Rewrite these ${newItems.length} Tamil news items professionally. Language: Tamil. Remove branding. Data: ${JSON.stringify(payload)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalLink: { type: Type.STRING },
                headline: { type: Type.STRING },
                summary: { type: Type.STRING },
                fullArticleContent: { type: Type.STRING },
                category: { type: Type.STRING },
                sentiment: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                readingTime: { type: Type.STRING }
              },
              required: ["headline", "summary", "fullArticleContent", "originalLink"]
            }
          }
        }
      });

      const processedItems = JSON.parse(response.text);
      
      const newProcessed = processedItems.map((aiItem) => {
        const original = newItems.find(o => o.link === aiItem.originalLink) || newItems[0];
        
        // BETTER IMAGE EXTRACTION
        let thumbnail = "";
        
        // 1. Try media:content (Best quality)
        if (original.mediaContent && original.mediaContent.$ && original.mediaContent.$.url) {
          thumbnail = original.mediaContent.$.url;
        } 
        // 2. Try media:thumbnail
        else if (original.mediaThumbnail && original.mediaThumbnail.$ && original.mediaThumbnail.$.url) {
          thumbnail = original.mediaThumbnail.$.url;
        }
        // 3. Try standard enclosure
        else if (original.enclosure && original.enclosure.url) {
          thumbnail = original.enclosure.url;
        }
        // 4. Fallback to scraping content
        else if (original.content) {
          const match = original.content.match(/src="([^">]+)"/);
          if (match) thumbnail = match[1];
        }

        return {
          ...aiItem,
          pubDate: original.pubDate || new Date().toISOString(),
          thumbnail: thumbnail,
          guid: original.guid || original.link,
          title: aiItem.headline,
          description: aiItem.summary,
          link: aiItem.originalLink,
          content: aiItem.fullArticleContent
        };
      });

      const combined = [...newProcessed, ...existingItems]
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .filter((v, i, a) => a.findIndex(t => (t.link === v.link)) === i)
        .slice(0, 40);

      allData[source.id] = combined;
    } catch (error) {
      console.error(`❌ Error in ${source.name}:`, error.message);
    }
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const finalOutput = {
    updatedAt: new Date().toISOString(),
    feeds: allData
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalOutput, null, 2));
  console.log(`🏁 Generation Finished.`);
}

generateNews();
