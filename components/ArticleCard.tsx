
import React from 'react';
import { EnhancedArticle } from '../types';

interface ArticleCardProps {
  article: EnhancedArticle;
  onReadMore: (article: EnhancedArticle) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onReadMore }) => {
  const title = article.headline || article.title;
  const description = article.summary || article.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
  
  // Prioritize the thumbnail provided by the generator, fallback to a news-themed placeholder only if empty
  const imageSrc = article.thumbnail || `https://images.unsplash.com/photo-1504711432869-0df30a7e04f9?auto=format&fit=crop&q=80&w=800`;

  return (
    <article className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => onReadMore(article)}>
        <img 
          src={imageSrc} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711432869-0df30a7e04f9?auto=format&fit=crop&q=80&w=800';
          }}
        />
        <div className="absolute top-2 right-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
          AI தொகுப்பு
        </div>
        {article.category && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            {article.category}
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-grow p-5">
        <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
              {new Date(article.pubDate).toLocaleDateString('ta-IN')}
            </span>
            {article.readingTime && (
               <span className="text-slate-400 text-[10px]">
                {article.readingTime}
               </span>
            )}
        </div>

        <h3 
          className="font-serif text-lg font-bold text-slate-900 leading-tight mb-3 group-hover:text-brand-600 transition-colors cursor-pointer"
          onClick={() => onReadMore(article)}
        >
          {title}
        </h3>
        
        <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow">
          {description}
        </p>

        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
          <div className="flex gap-2">
             {article.tags?.slice(0, 2).map(tag => (
                 <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">#{tag}</span>
             ))}
          </div>
          <button 
            onClick={() => onReadMore(article)}
            className="text-brand-600 hover:text-brand-800 text-xs font-bold flex items-center gap-1 hover:underline decoration-2 underline-offset-2"
          >
            முழு செய்தி
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
};
