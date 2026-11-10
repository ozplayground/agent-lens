'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

/**
 * 라우트 오류 경계 (홈·챗 공용). 렌더 중 예외가 나도 레이아웃은 남기고 안내와 다시 시도를 보인다.
 * 예외 원문은 화면에 쓰지 않고 콘솔에만 남긴다.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 md:px-6 lg:px-8">
      <ErrorState
        title="화면을 그리지 못했습니다"
        message="일시적인 문제일 수 있습니다. 다시 시도해도 같으면 페이지를 새로 고쳐 주세요."
        onRetry={reset}
        className="rounded-xl border border-dashed border-border bg-surface"
      />
    </main>
  );
}
