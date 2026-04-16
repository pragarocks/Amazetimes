
// Types for raw RSS feeds
export interface RSSItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
  content: string;
  author: string;
  thumbnail: string;
  enclosure: any;
  categories: string[];
}

export interface RSSFeed {
  status: string;
  feed: {
    url: string;
    title: string;
    link: string;
    author: string;
    description: string;
    image: string;
  };
  items: RSSItem[];
}

// Types for AI-processed articles
export interface AIArticle {
  originalLink: string;
  headline: string;
  summary: string;
  fullArticleContent: string;
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  readingTime: string;
}

// Unified article type used throughout the app
export interface EnhancedArticle extends AIArticle {
  guid: string;
  pubDate: string;
  thumbnail: string;
  title: string; // Raw fallback title
  description: string; // Raw fallback description
  link: string; // URL used for unique keys and links
  content: string; // Raw fallback content
  aiContent?: AIArticle; // Nested reference for components checking AI status
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
}
