
import { GoogleGenAI, Type } from "@google/genai";
import { RSSItem, AIArticle, EnhancedArticle } from "../types";

/**
 * Rewrites raw news data using Gemini AI for a professional editorial tone in Tamil.
 */
export const rewriteNewsWithGemini = async (items: RSSItem[]): Promise<EnhancedArticle[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }
    
    // Create instance right before call
    const ai = new GoogleGenAI({ apiKey });
    
    const payload = items.map(item => ({
      originalLink: item.link,
      title: item.title,
      content: (item.content || item.description || "").replace(/<[^>]*>?/gm, ' ').substring(0, 1200)
    }));

    const prompt = `
      You are the Chief Editor for 'Amazetime.in', a premium digital news platform.
      TASK: Rewrite the provided raw news feed into high-quality, professional Tamil journalism.
      
      RULES:
      1. OUTPUT LANGUAGE: MUST BE TAMIL.
      2. TONE: Objective, professional, and authoritative.
      3. BRANDING: Never mention external news agencies like 'News18', 'PTI', or 'ANI'. 
         Replace them with phrases like "எமது செய்திக்குழு அறிகிறது" or "தகவல்கள் தெரிவிக்கின்றன".
      4. STRUCTURE:
         - headline: Powerful, informative Tamil headline.
         - summary: Concise 2-sentence intro in Tamil.
         - fullArticleContent: Engaging, detailed HTML (<p>, <h3>) in Tamil.
         - category: The topic name in Tamil.
         - readingTime: e.g. "2 நிமிடம் வாசிப்பு".
         - sentiment: "positive", "neutral", or "negative".
         - tags: Array of 3 relevant Tamil tags.
      
      DATA: ${JSON.stringify(payload)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
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
              readingTime: { type: Type.STRING },
            },
            required: ["headline", "summary", "fullArticleContent", "originalLink"],
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const processedItems = JSON.parse(jsonText.trim()) as AIArticle[];
    
    return processedItems.map(aiItem => {
      const original = items.find(o => o.link === aiItem.originalLink) || items[0];
      return {
        ...aiItem,
        pubDate: original.pubDate || new Date().toISOString(),
        thumbnail: original.thumbnail,
        guid: original.guid || original.link,
        title: aiItem.headline, // UI Compatibility
        description: aiItem.summary, // UI Compatibility
        link: aiItem.originalLink, // UI Compatibility
        content: aiItem.fullArticleContent // UI Compatibility
      };
    });

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return [];
  }
};
