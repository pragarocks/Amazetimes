import { GoogleGenAI, Type } from "@google/genai";
import { RSSItem, AIArticle, EnhancedArticle } from "../types";

const GEMINI_MODEL = "gemini-2.5-flash-preview-04-17";

/**
 * Rewrites raw RSS items into professional Tamil journalism using Gemini.
 * Used only in browser live-mode fallback (when news.json is unavailable).
 */
export const rewriteNewsWithGemini = async (items: RSSItem[]): Promise<EnhancedArticle[]> => {
  if (items.length === 0) return [];

  const apiKey = (process.env.API_KEY as string | undefined);
  if (!apiKey) {
    console.error("[Gemini] API_KEY is not set — cannot process articles");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey });

  const payload = items.map(item => ({
    originalLink: item.link,
    title:        item.title  || "",
    content:      (item.content || item.description || "")
      .replace(/<[^>]*>?/gm, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 1200),
  })).filter(p => p.title.length > 5);

  if (payload.length === 0) return [];

  const prompt = `You are the Chief Editor for 'Amazetime.in', a premium Tamil digital news platform.

TASK: Rewrite the following ${payload.length} news items into high-quality, professional Tamil journalism.

STRICT RULES:
1. OUTPUT LANGUAGE: Every field MUST be in Tamil script only.
2. TONE: Objective, authoritative, editorial-quality journalism.
3. BRANDING: NEVER mention external sources (BBC, Google, News18, PTI, ANI, etc.).
   Replace with "எமது செய்திக்குழு அறிகிறது" or "தகவல்கள் தெரிவிக்கின்றன".
4. CONTENT:
   - headline: Powerful, informative Tamil headline (15-25 words)
   - summary: Concise 2-sentence Tamil intro paragraph
   - fullArticleContent: HTML article with <p> and <h3> tags, minimum 3 paragraphs
   - category: Topic in Tamil (e.g., "அரசியல்", "விளையாட்டு", "சினிமா")
   - readingTime: e.g., "2 நிமிடம்"
   - sentiment: exactly "positive", "neutral", or "negative"
   - tags: exactly 3 relevant Tamil keyword tags
5. originalLink must exactly match the input link.

DATA: ${JSON.stringify(payload)}`;

  try {
    const response = await ai.models.generateContent({
      model:    GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
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
            required: ["originalLink", "headline", "summary", "fullArticleContent"],
          },
        },
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error("Empty Gemini response");

    const processedItems = JSON.parse(text) as AIArticle[];

    return processedItems.map(aiItem => {
      const original = items.find(o => o.link === aiItem.originalLink) || items[0];
      return {
        ...aiItem,
        pubDate:     original.pubDate  || new Date().toISOString(),
        thumbnail:   original.thumbnail || "",
        guid:        original.guid     || original.link,
        // UI compatibility aliases
        title:       aiItem.headline,
        description: aiItem.summary,
        link:        aiItem.originalLink,
        content:     aiItem.fullArticleContent,
        aiContent:   aiItem,
      };
    });

  } catch (error: any) {
    console.error("[Gemini] Processing failed:", error?.message || error);
    return [];
  }
};
