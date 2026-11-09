import React from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * 카드 자리 표시. `NewsCard` 와 같은 틀(머리줄 1, 제목 2줄, 본문 2줄, 바닥 1)과
 * 같은 높이 클래스를 써서 로딩 → 카드 전환 때 높이가 흔들리지 않는다.
 */
export default function NewsCardSkeleton() {
  return (
    <Card aria-hidden="true" className="flex h-full flex-col gap-3">
      {/* 머리줄 */}
      <div className="flex h-11 items-center gap-2 md:h-8">
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="ml-auto size-8 rounded-lg" />
      </div>
      {/* 제목 2줄 (leading-6 × 2 = 48px) */}
      <div className="flex min-h-12 flex-col justify-center gap-2">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      {/* 본문 2줄 */}
      <div className="flex min-h-12 flex-col justify-center gap-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>
      {/* 바닥 */}
      <div className="mt-auto border-t border-border pt-2">
        <div className="flex h-11 items-center justify-between md:h-8">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
    </Card>
  );
}
