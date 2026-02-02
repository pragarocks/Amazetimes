import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-48 bg-slate-200 w-full"></div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between mb-4">
          <div className="h-3 bg-slate-200 w-1/4 rounded"></div>
          <div className="h-3 bg-slate-200 w-1/6 rounded"></div>
        </div>
        <div className="h-6 bg-slate-200 w-3/4 rounded mb-2"></div>
        <div className="h-6 bg-slate-200 w-1/2 rounded mb-4"></div>
        
        <div className="h-3 bg-slate-200 w-full rounded mb-2"></div>
        <div className="h-3 bg-slate-200 w-full rounded mb-2"></div>
        <div className="h-3 bg-slate-200 w-2/3 rounded"></div>
        
        <div className="mt-auto pt-4 flex justify-between">
           <div className="h-4 bg-slate-200 w-1/3 rounded"></div>
           <div className="h-4 bg-slate-200 w-1/4 rounded"></div>
        </div>
      </div>
    </div>
  );
};