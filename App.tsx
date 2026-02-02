
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ArticleCard } from './components/ArticleCard';
import { SkeletonCard } from './components/SkeletonCard';
import { ArticleModal } from './components/ArticleModal';
import { FEED_SOURCES } from './constants';
import { EnhancedArticle } from './types';
import { fetchRSSFeed } from './services/rssService';
import { rewriteNewsWithGemini } from './services/geminiService';

const App: React.FC = () => {
  const [selectedFeedId, setSelectedFeedId] = useState<string>(FEED_SOURCES[0].id);
  const [allFeeds, setAllFeeds] = useState<Record<string, EnhancedArticle[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<EnhancedArticle | null>(null);

  // Function to perform live fetch + AI processing for a specific feed
  const generateLiveFeed = async (feedId: string) => {
    setGenerating(true);
    setError(null);
    try {
      const source = FEED_SOURCES.find(f => f.id === feedId);
      if (!source) return;

      const rssData = await fetchRSSFeed(source.url);
      const itemsToProcess = rssData.items.slice(0, 6);
      const aiProcessed = await rewriteNewsWithGemini(itemsToProcess);

      setAllFeeds(prev => ({
        ...prev,
        [feedId]: aiProcessed
      }));
      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      console.error("Live Generation Error:", err);
      setError("நேரடி செய்தி சேகரிப்பில் சிக்கல். மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const fetchStaticData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = (import.meta as any).env?.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const dataUrl = `${cleanBase}data/news.json`.replace(/\/+/g, '/');
      
      const response = await fetch(dataUrl);
      if (!response.ok) {
        if (response.status === 404) {
          // If 404, we are likely on the first run or AI Studio. Trigger live generation!
          console.log("Static file missing. Switching to Live Generation Mode...");
          generateLiveFeed(selectedFeedId);
          return;
        }
        throw new Error("செய்திகளைப் பதிவிறக்க முடியவில்லை.");
      }
      
      const data = await response.json();
      setAllFeeds(data.feeds || {});
      setLastUpdated(data.updatedAt);
    } catch (err: any) {
      console.error("Data fetch error:", err);
      // Fallback to live if static fetch fails for any reason
      generateLiveFeed(selectedFeedId);
    } finally {
      setLoading(false);
    }
  }, [selectedFeedId]);

  useEffect(() => {
    fetchStaticData();
  }, []); // Initial run only

  // If user switches tab and we don't have data for it, fetch it live
  useEffect(() => {
    if (!loading && !allFeeds[selectedFeedId]) {
      generateLiveFeed(selectedFeedId);
    }
  }, [selectedFeedId, allFeeds, loading]);

  const articles = allFeeds[selectedFeedId] || [];

  const t = {
    more: "கூடுதல் பிரிவுகள்",
    updated: "புதுப்பிக்கப்பட்டது",
    refresh: "புதிய செய்திகள்",
    tryAgain: "மீண்டும் முயற்சி செய்",
    noNews: "செய்திகள் தயாராகி வருகின்றன...",
    powered: "Gemini AI மூலம் இயக்கப்படுகிறது",
    generating: "செயற்கை நுண்ணறிவு செய்திகளைத் தொகுக்கிறது...",
    liveMode: "நேரடி ஏஐ செய்தி"
  };

  const visibleFeeds = FEED_SOURCES.slice(0, 5);
  const hiddenFeeds = FEED_SOURCES.slice(5);
  const isHiddenActive = hiddenFeeds.some(f => f.id === selectedFeedId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 relative z-30">
            {visibleFeeds.map(source => (
              <button
                key={source.id}
                onClick={() => setSelectedFeedId(source.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedFeedId === source.id
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {source.name}
              </button>
            ))}

            {hiddenFeeds.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                    isHiddenActive || isDropdownOpen
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.more}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-20 p-2 grid grid-cols-2 gap-1 max-h-96 overflow-y-auto">
                      {hiddenFeeds.map(source => (
                        <button
                          key={source.id}
                          onClick={() => {
                            setSelectedFeedId(source.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`px-3 py-2 rounded-lg text-sm text-left transition-colors truncate ${
                            selectedFeedId === source.id
                              ? 'bg-brand-50 text-brand-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {source.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-500 ml-auto md:ml-0">
             {generating && (
               <span className="flex items-center gap-2 text-brand-600 animate-pulse font-medium">
                 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 {t.generating}
               </span>
             )}
             {lastUpdated && !generating && (
               <span className="hidden sm:inline bg-slate-100 px-3 py-1 rounded-full border border-slate-200 text-[10px] font-bold uppercase tracking-tight">
                 {t.updated}: {new Date(lastUpdated).toLocaleTimeString('ta-IN')}
               </span>
             )}
             <button 
               onClick={() => generateLiveFeed(selectedFeedId)}
               className="p-2 hover:bg-slate-200 rounded-full transition-colors"
               title={t.refresh}
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${generating ? 'animate-spin text-brand-500' : 'text-slate-600'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
             </button>
          </div>
        </div>

        {error && !generating && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-xl mb-8 text-center shadow-sm">
            <p className="font-bold mb-4">{error}</p>
            <button onClick={() => generateLiveFeed(selectedFeedId)} className="px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold shadow-lg shadow-red-500/30">
              {t.tryAgain}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {loading || generating ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            articles.map((article, idx) => (
              <ArticleCard 
                key={`${article.guid}-${idx}`} 
                article={article} 
                onReadMore={setSelectedArticle}
              />
            ))
          )}
        </div>
        
        {!loading && !generating && !error && articles.length === 0 && (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                  </svg>
                </div>
                <p className="text-slate-400 font-medium italic">{t.noNews}</p>
                <button 
                  onClick={() => generateLiveFeed(selectedFeedId)}
                  className="mt-6 text-brand-600 font-bold hover:underline"
                >
                  நேரடியாகச் செய்திகளை உருவாக்கவும்
                </button>
            </div>
        )}

      </main>

      <ArticleModal 
        article={selectedArticle} 
        onClose={() => setSelectedArticle(null)} 
      />

      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
             <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center text-white font-serif font-bold text-xs">A</div>
             <span className="font-serif font-bold text-slate-900">Amazetime<span className="text-brand-600">.in</span></span>
          </div>
          <p className="text-slate-400 text-xs tracking-wide">
            © {new Date().getFullYear()} Amazetime. {t.powered}.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
