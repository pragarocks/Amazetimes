import React from 'react';
import { EnhancedArticle } from '../types';

interface ArticleModalProps {
  article: EnhancedArticle | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  if (!article) return null;

  // The generate script flattens these properties to the top level
  const title = article.headline || article.title;
  const contentHTML = article.fullArticleContent || 
                      `<p>${article.summary || article.description || article.content}</p><p class="text-xs text-slate-400 mt-4 italic">Original content not yet processed by AI.</p>`;
  
  const imageSrc = article.thumbnail || `https://picsum.photos/seed/${encodeURIComponent(article.link)}/800/600`;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background backdrop */}
      <div className="fixed inset-0 bg-slate-900/75 transition-opacity backdrop-blur-sm" onClick={onClose}></div>

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl lg:max-w-4xl">
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="bg-white">
            <div className="relative h-64 sm:h-80 lg:h-96">
                <img className="h-full w-full object-cover" src={imageSrc} alt={title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
                     {article.category && (
                        <span className="inline-block px-3 py-1 bg-brand-600 text-white text-xs font-bold uppercase tracking-wide rounded-sm mb-3">
                            {article.category}
                        </span>
                     )}
                     <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white leading-tight shadow-sm">
                        {title}
                     </h2>
                </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-center justify-between text-sm text-slate-500 mb-8 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                             AZ
                        </div>
                        <span className="font-medium text-slate-900">Amazetime Editorial</span>
                        <span className="text-slate-300">•</span>
                        <span>{new Date(article.pubDate).toLocaleDateString('ta-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {article.readingTime && (
                        <div className="flex items-center gap-1">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75l4 1a.75.75 0 10.39-1.466l-3.64-9.1V5z" clipRule="evenodd" />
                              </svg>
                             {article.readingTime}
                        </div>
                    )}
                </div>

                {/* Article Content */}
                <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-a:text-brand-600 hover:prose-a:text-brand-500">
                    <div dangerouslySetInnerHTML={{ __html: contentHTML }} />
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">தலைப்புகள்</h4>
                        <div className="flex flex-wrap gap-2">
                            {article.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};