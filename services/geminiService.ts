import { GoogleGenAI, Type } from "@google/genai";
import { RSSItem, AIArticle, EnhancedArticle } from "../types";

const GEMINI_MODEL = "gemini-2.5-flash";
const OPENAI_MODEL = "gpt-4o-mini";

// Keys are injected at build time by vite (see vite.config.ts `define`).
// API_KEY is kept as a backward-compatible alias for the Gemini key.
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY as string | undefined);
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY as string | undefined) || (process.env.API_KEY as string | undefined);

/** Shared editorial instructions used by every provider. */
function buildInstructions(count: number): string {
  return `You are the Chief Editor for 'The Kongu Times', a premium Tamil digital news platform.

TASK: Rewrite the following ${count} news items into high-quality, professional Tamil journalism.

STRICT RULES:
1. OUTPUT LANGUAGE: Every field MUST be in Tamil script only.
2. TONE: Objective, authoritative, editorial-quality journalism.
3. BRANDING: NEVER mention external sources (BBC, Google, News18, PTI, ANI, etc.).
   Replace with "எமது செய்திக்குழு அறிகிறது" or "தகவல்கள் தெரிவிக்கின்றன".
4. CONTENT (per article object):
   - originalLink: MUST exactly match the input link
   - headline: Powerful, informative Tamil headline (15-25 words)
   - summary: Concise 2-sentence Tamil intro paragraph
   - fullArticleContent: HTML article with <p> and <h3> tags, minimum 3 paragraphs
   - category: Topic in Tamil (e.g., "அரசியல்", "விளையாட்டு", "சினிமா")
   - readingTime: e.g., "2 நிமிடம்"
   - sentiment: exactly "positive", "neutral", or "negative"
   - tags: exactly 3 relevant Tamil keyword tags`;
}

function buildPayload(items: RSSItem[]) {
  return items.map(item => ({
    link:    item.link,
    title:   item.title || "",
    content: (item.content || item.description || "")
      .replace(/<[^>]*>?/gm, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 1200),
  })).filter(p => p.title.length > 5);
}

async function processWithGemini(payload: ReturnType<typeof buildPayload>): Promise<AIArticle[]> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model:    GEMINI_MODEL,
    contents: `${buildInstructions(payload.length)}\n\nDATA: ${JSON.stringify(payload)}`,
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
  return JSON.parse(text) as AIArticle[];
}

async function processWithOpenAI(payload: ReturnType<typeof buildPayload>): Promise<AIArticle[]> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildInstructions(payload.length) },
        {
          role: "user",
          content: `Return ONLY a JSON object {"articles": [ ... ]} where each element has the fields: ` +
            `originalLink, headline, summary, fullArticleContent, category, readingTime, sentiment, tags (array of 3).` +
            `\n\nDATA: ${JSON.stringify(payload)}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).substring(0, 200)}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty OpenAI response");
  const parsed = JSON.parse(text);
  return (Array.isArray(parsed) ? parsed : (parsed.articles || parsed.items || [])) as AIArticle[];
}

/**
 * Rewrites raw RSS items into professional Tamil journalism.
 * Used only in browser live-mode fallback (when news.json is unavailable).
 * Provider auto-selected: OpenAI if OPENAI_API_KEY is present, else Gemini.
 */
export const rewriteNewsWithGemini = async (items: RSSItem[]): Promise<EnhancedArticle[]> => {
  if (items.length === 0) return [];

  const useOpenAI = !!(OPENAI_API_KEY && OPENAI_API_KEY.startsWith("sk-"));
  if (!useOpenAI && !GEMINI_API_KEY) {
    console.error("[AI] No API key set (OPENAI_API_KEY / GEMINI_API_KEY) — cannot process articles");
    return [];
  }

  const payload = buildPayload(items);
  if (payload.length === 0) return [];

  try {
    const processedItems = useOpenAI
      ? await processWithOpenAI(payload)
      : await processWithGemini(payload);

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
    console.error("[AI] Processing failed:", error?.message || error);
    return [];
  }
};
