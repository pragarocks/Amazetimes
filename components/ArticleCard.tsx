import React from 'react';
import { EnhancedArticle } from '../types';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1504711432869-0df30a7e04f9?auto=format&fit=crop&q=80&w=800';

interface ArticleCardProps {
  article: EnhancedArticle;
  onReadMore: (article: EnhancedArticle) => void;
  variant?: 'default' | 'hero' | 'compact';
  index?: number;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article, onReadMore, variant = 'default', index = 0
}) => {
  const title = article.headline || article.title;
  const summary = article.summary || article.description?.replace(/<[^>]*>?/gm, '').substring(0, 120);
  const img = article.thumbnail || PLACEHOLDER;
  const dateLabel = article.pubDate
    ? new Date(article.pubDate).toLocaleDateString('ta-IN', { day: 'numeric', month: 'short' })
    : '';

  if (variant === 'hero') {
    return (
      <div
        className="hero-card aspect-video cursor-pointer"
        onClick={() => onReadMore(article)}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <img src={img} alt={title} onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 md:p-7">
          <div className="flex gap-2 mb-2">
            {article.category && <span className="category-tag bg-white/20 text-white">{article.category}</span>}
          </div>
          <h2 className="font-display text-xl md:text-2xl lg:text-3xl font-black text-white leading-tight mb-2">
            {title}
          </h2>
          <p className="text-sm text-white/80 line-clamp-2 max-w-lg">{summary}</p>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/60">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
            <span>{dateLabel}</span>
            {article.readingTime && <span>· {article.readingTime}</span>}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className="news-card-v2 flex gap-3 p-3 cursor-pointer group animate-fade-up"
        onClick={() => onReadMore(article)}
        style={{ animationDelay: `${index * 0.06}s` }}
      >
        <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={img}
            alt=""
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
          />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          {article.category && (
            <span className="category-tag w-fit mb-1">{article.category}</span>
          )}
          <h3 className="font-display text-[12px] font-bold leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
            {title}
          </h3>
          <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
            {dateLabel}
          </span>
        </div>
      </div>
    );
  }

  // default card
  return (
    <article
      className="news-card-v2 flex flex-col cursor-pointer group animate-fade-up"
      onClick={() => onReadMore(article)}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="aspect-video overflow-hidden relative">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
        />
        <div className="absolute top-2 left-2 flex gap-1">
          {article.category && <span className="category-tag bg-white/90">{article.category}</span>}
        </div>
        <div className="absolute top-2 right-2">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, hsl(270,43%,44%), hsl(336,82%,50%))' }}>
            AI
          </span>
        </div>
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="font-display text-sm font-bold leading-snug mb-1.5 group-hover:text-orange-600 transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 flex-1">{summary}</p>
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <div className="flex gap-1.5">
            {article.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">#{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
            {dateLabel}
            {article.readingTime && <span>· {article.readingTime}</span>}
          </div>
        </div>
      </div>
    </article>
  );
};
