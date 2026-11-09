import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** 다음 행동 버튼 등. */
  action?: ReactNode;
  className?: string;
}

/** 결과가 없을 때의 안내. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-4 py-12 text-center', className)}>
      {icon ? (
        <span
          aria-hidden="true"
          className="inline-flex size-12 items-center justify-center rounded-full bg-surface-muted text-fg-subtle [&>svg]:size-6"
        >
          {icon}
        </span>
      ) : null}
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-base font-semibold text-fg break-keep [overflow-wrap:anywhere]">{title}</p>
        {description ? <p className="text-sm leading-relaxed text-fg-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
