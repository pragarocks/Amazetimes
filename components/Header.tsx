import React, { useState, useEffect } from 'react';
import { FEED_SOURCES } from '../constants';

interface HeaderProps {
  selectedFeedId: string;
  onSelectFeed: (id: string) => void;
  lastUpdated: string | null;
  onRefresh: () => void;
  generating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedFeedId, onSelectFeed, lastUpdated, onRefresh, generating
}) => {
  const [now, setNow] = useState(new Date());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString('ta-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  const visibleFeeds = FEED_SOURCES.slice(0, 7);
  const hiddenFeeds  = FEED_SOURCES.slice(7);
  const isHiddenActive = hiddenFeeds.some(f => f.id === selectedFeedId);
  const activeHiddenName = hiddenFeeds.find(f => f.id === selectedFeedId)?.name;

  return (
    <header className="site-header">
      {/* Top bar */}
      <div style={{ background: 'hsl(22,90%,47%)' }} className="text-white text-[11px] px-4 py-1 flex items-center justify-between">
        <span className="font-semibold opacity-90">{dateStr}</span>
        <span className="opacity-75 hidden sm:block font-tamil">கொங்கு மண்டலத்தின் குரல்</span>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="opacity-75">
              புதுப்பிக்கப்பட்டது: {new Date(lastUpdated).toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={onRefresh}
            className="opacity-80 hover:opacity-100 transition-opacity"
            title="புதுப்பி"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
              className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* Brand row */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-between h-14">
        <a href="./" className="flex items-center shrink-0">
          <img
            src="./images/kongu-times-logo.png"
            alt="The Kongu Times · கொங்கு டைம்ஸ்"
            className="h-10 md:h-12 w-auto"
          />
        </a>

        {/* Desktop: feed tab bar */}
        <nav className="hidden lg:flex items-center gap-1.5 flex-1 justify-center overflow-x-auto scrollbar-hide">
          {visibleFeeds.map(f => (
            <button
              key={f.id}
              onClick={() => onSelectFeed(f.id)}
              className={`feed-tab ${selectedFeedId === f.id ? 'active' : ''}`}
            >
              {f.name}
            </button>
          ))}
          {hiddenFeeds.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`feed-tab flex items-center gap-1 ${isHiddenActive || dropdownOpen ? 'active' : ''}`}
              >
                {isHiddenActive ? activeHiddenName : 'மேலும்'}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                  className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-20 p-2 grid grid-cols-2 gap-1">
                    {hiddenFeeds.map(f => (
                      <button
                        key={f.id}
                        onClick={() => { onSelectFeed(f.id); setDropdownOpen(false); }}
                        className={`px-3 py-2 rounded-lg text-sm text-left transition-colors truncate ${
                          selectedFeedId === f.id
                            ? 'text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        style={selectedFeedId === f.id ? { background: 'hsl(22,90%,47%)' } : {}}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Mobile burger */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen
            ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          }
        </button>
      </div>

      {/* Mobile feed list */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 px-4 py-3 animate-fade-up">
          <div className="flex flex-wrap gap-2">
            {FEED_SOURCES.map(f => (
              <button
                key={f.id}
                onClick={() => { onSelectFeed(f.id); setMobileOpen(false); }}
                className={`feed-tab ${selectedFeedId === f.id ? 'active' : ''}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
