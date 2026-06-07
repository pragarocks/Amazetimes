import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="news-card-v2 overflow-hidden">
    <div className="skeleton-pulse aspect-video" />
    <div className="p-3.5">
      <div className="skeleton-pulse h-3 w-1/4 mb-3" />
      <div className="skeleton-pulse h-4 w-full mb-2" />
      <div className="skeleton-pulse h-4 w-3/4 mb-3" />
      <div className="skeleton-pulse h-3 w-full mb-2" />
      <div className="skeleton-pulse h-3 w-2/3" />
    </div>
  </div>
);
