import React from 'react';
import { EnhancedArticle } from '../types';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1504711432869-0df30a7e04f9?auto=format&fit=crop&q=80&w=800';

interface ArticleModalProps {
  article: EnhancedArticle | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  if (!article) return null;

  const title = article.headline || article.title;
  const contentHTML = article.fullArticleContent ||
    `<p>${article.summary || article.description || article.content}</p>`;
  const img = article.thumbnail || PLACEHOLDER;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-3xl animate-fade-up">

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Hero image */}
          <div className="relative h-56 sm:h-72">
            <img className="w-full h-full object-cover" src={img} alt={title}
              onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 sm:p-7 w-full z-10">
              {article.category && (
                <span className="category-tag mb-2 inline-block" style={{ background: 'hsl(22,90%,47%)', color: '#fff' }}>
                  {article.category}
                </span>
              )}
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                {title}
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-8">
            {/* Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                     style={{ background: 'linear-gradient(135deg, hsl(22,90%,47%), hsl(336,82%,50%))' }}>
                  KT
                </div>
                <span className="font-semibold text-slate-700">The Kongu Times Editorial</span>
                <span className="text-slate-300">·</span>
                <span>{new Date(article.pubDate).toLocaleDateString('ta-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {article.readingTime && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  {article.readingTime}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="article-prose font-tamil text-[15px] leading-relaxed"
                 dangerouslySetInnerHTML={{ __html: contentHTML }} />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Source link */}
            {article.link && (
              <div className="mt-4">
                <a href={article.link} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-slate-400 hover:text-orange-600 transition-colors flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  மூல செய்தி பார்க்க
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
