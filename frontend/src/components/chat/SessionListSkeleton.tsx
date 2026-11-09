'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/Skeleton';

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
      role="status"
      aria-label="대화 기록을 불러오는 중..."
      className={cn('flex flex-col gap-2 p-2', className)}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg px-3 py-2.5">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}
