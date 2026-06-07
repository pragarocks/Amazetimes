
import { useState, useEffect, useCallback } from 'react';
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
  const [selectedArticle, setSelectedArticle] = useState<EnhancedArticle | null>(null);

  const generateLiveFeed = async (feedId: string) => {
    setGenerating(true);
    setError(null);
    try {
      const source = FEED_SOURCES.find(f => f.id === feedId);
      if (!source) return;
      const rssData = await fetchRSSFeed(source.url);
      const aiProcessed = await rewriteNewsWithGemini(rssData.items.slice(0, 5));
      if (aiProcessed.length === 0) throw new Error('AI செய்திகளை உருவாக்கவில்லை.');
      setAllFeeds(prev => ({ ...prev, [feedId]: aiProcessed }));
      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      setError(err.message || 'நேரடி செய்தி சேகரிப்பில் சிக்கல்.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const fetchStaticData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('./data/news.json');
      if (!response.ok) {
        if (response.status === 404) { generateLiveFeed(selectedFeedId); return; }
        throw new Error('செய்திகளைப் பதிவிறக்க முடியவில்லை.');
      }
      const data = await response.json();
      setAllFeeds(data.feeds || {});
      setLastUpdated(data.updatedAt);
    } catch {
      generateLiveFeed(selectedFeedId);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaticData(); }, []);
  useEffect(() => {
    if (!loading && !allFeeds[selectedFeedId]) generateLiveFeed(selectedFeedId);
  }, [selectedFeedId, allFeeds, loading]);

  const articles = allFeeds[selectedFeedId] || [];
  const heroArticle   = articles[0] ?? null;
  const sideArticles  = articles.slice(1, 5);
  const trendingItems = articles.slice(5, 9);
  const latestItems   = articles.slice(9, 18);
  const remainingItems = articles.slice(18);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header
        selectedFeedId={selectedFeedId}
        onSelectFeed={setSelectedFeedId}
        lastUpdated={lastUpdated}
        onRefresh={() => generateLiveFeed(selectedFeedId)}
        generating={generating}
      />

      <main>
        {/* Breaking ticker */}
        {heroArticle && !loading && !generating && (
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-3 pb-1">
            <div className="flex items-center gap-2 animate-fade-up">
              <span className="flex items-center gap-1 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded animate-pulse"
                    style={{ background: 'hsl(0,84%,60%)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                முக்கிய
              </span>
              <p className="text-sm font-semibold truncate font-tamil">{heroArticle.headline || heroArticle.title}</p>
            </div>
          </div>
        )}

        {/* Hero Grid */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-4">
          {loading || generating ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8"><div className="skeleton-pulse aspect-video" /></div>
              <div className="lg:col-span-4 flex flex-col gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton-pulse h-20 rounded-xl" />)}
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-6 py-10 text-center">
              <p className="font-bold mb-4 font-tamil">{error}</p>
              <button
                onClick={() => generateLiveFeed(selectedFeedId)}
                className="px-6 py-2 text-white rounded-full text-sm font-bold"
                style={{ background: 'hsl(0,84%,60%)' }}
              >
                மீண்டும் முயற்சி
              </button>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-tamil">
              <p className="text-lg mb-4">செய்திகள் தயாராகி வருகின்றன...</p>
              <button onClick={() => generateLiveFeed(selectedFeedId)}
                      className="text-orange-600 font-bold hover:underline">
                நேரடியாகச் செய்திகளை உருவாக்கவும்
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Main hero */}
              {heroArticle && (
                <div className="lg:col-span-8 animate-fade-up">
                  <ArticleCard
                    article={heroArticle}
                    onReadMore={setSelectedArticle}
                    variant="hero"
                    index={0}
                  />
                </div>
              )}

              {/* Side compact list */}
              <div className="lg:col-span-4 flex flex-col gap-2">
                {sideArticles.map((article, i) => (
                  <ArticleCard
                    key={article.guid || article.link}
                    article={article}
                    onReadMore={setSelectedArticle}
                    variant="compact"
                    index={i + 1}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Trending strip */}
        {trendingItems.length > 0 && !loading && !generating && (
          <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center gap-2 mb-3 animate-fade-up">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                   className="w-4 h-4" style={{ color: 'hsl(22,90%,47%)' }}>
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              <h2 className="section-heading text-lg">இப்போது பிரபலமானவை</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {trendingItems.map((article, i) => (
                <button
                  key={article.guid || article.link}
                  onClick={() => setSelectedArticle(article)}
                  className="flex items-start gap-2.5 p-3 rounded-xl hover:bg-slate-50 transition-colors animate-fade-up text-left group"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <span className="font-display text-2xl font-black leading-none mt-0.5"
                        style={{ color: 'rgba(220,90,40,0.2)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-xs font-bold leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors font-tamil">
                      {article.headline || article.title}
                    </h3>
                    {article.category && (
                      <span className="category-tag mt-1">{article.category}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Latest news grid */}
        {latestItems.length > 0 && !loading && !generating && (
          <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-6">
            <div className="flex items-center justify-between mb-4 animate-fade-up">
              <h2 className="section-heading text-lg">சமீபத்திய செய்திகள்</h2>
              <span className="text-xs font-semibold flex items-center gap-1"
                    style={{ color: 'hsl(22,90%,47%)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                அனைத்தும்
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestItems.map((article, i) => (
                <ArticleCard
                  key={article.guid || article.link}
                  article={article}
                  onReadMore={setSelectedArticle}
                  variant="default"
                  index={i}
                />
              ))}
            </div>
          </section>
        )}

        {/* Remaining articles (overflow) */}
        {remainingItems.length > 0 && !loading && !generating && (
          <section className="max-w-[1280px] mx-auto px-4 md:px-6 pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {remainingItems.map((article, i) => (
                <ArticleCard
                  key={article.guid || article.link}
                  article={article}
                  onReadMore={setSelectedArticle}
                  variant="default"
                  index={i}
                />
              ))}
            </div>
          </section>
        )}

        {/* Skeleton grid (loading) */}
        {(loading || generating) && (
          <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-display font-black text-base"
                 style={{ background: 'linear-gradient(135deg, hsl(22,90%,47%), hsl(336,82%,50%))' }}>
              அ
            </div>
            <div>
              <div className="font-display font-bold text-slate-900 text-base">
                Amazetime<span style={{ color: 'hsl(22,90%,47%)' }}>.in</span>
              </div>
              <div className="text-[10px] text-slate-400">Gemini AI மூலம் இயக்கப்படுகிறது</div>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} Amazetime. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            {/* Social placeholders */}
            {[
              { label: 'Facebook', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
              { label: 'Twitter', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
            ].map(s => (
              <a key={s.label} href="#" aria-label={s.label}
                 className="hover:text-orange-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </footer>

      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
};

export default App;
