'use client';

import type { ReactNode } from 'react';
import { CircleAlert, RotateCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface ErrorStateProps {
  title: ReactNode;
  message: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  /** 재시도 중이면 버튼에 스피너. */
  retrying?: boolean;
  className?: string;
}

/** 불러오기 실패 안내. `role="alert"`, 재시도 버튼. */
export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = '다시 시도',
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 px-4 py-12 text-center', className)}>
      <span
        aria-hidden="true"
        className="inline-flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger [&>svg]:size-6"
      >
        <CircleAlert />
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-base font-semibold text-fg break-keep [overflow-wrap:anywhere]">{title}</p>
        <p className="text-sm leading-relaxed text-fg-muted">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" leadingIcon={<RotateCw />} loading={retrying} onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default ErrorState;
