import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg shadow-brand-500/30">
              A
            </div>
            <span className="font-serif text-xl font-bold text-slate-900 tracking-tight">
              Amazetime<span className="text-brand-600">.in</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Live AI Feed
            </span>
            <div className="text-sm text-slate-500">
               Powered by Gemini 2.5 Flash
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};