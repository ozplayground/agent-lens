'use client';

import React from 'react';

export interface SessionListSkeletonProps {
  count?: number;
  className?: string;
}

export default function SessionListSkeleton({
  count = 5,
  className = '',
}: SessionListSkeletonProps) {
  return (
    <div
      data-testid="session-list-skeleton"
      aria-label="대화 기록을 불러오는 중..."
      className={`space-y-2 p-2 ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-2.5 rounded-lg border-l-4 border-l-transparent bg-slate-50 animate-pulse flex flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-3.5 bg-slate-200 rounded w-3/4" />
            <div className="h-3 w-3 bg-slate-200 rounded shrink-0" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 bg-slate-200 rounded w-12" />
            <div className="h-2.5 bg-slate-200 rounded w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}
