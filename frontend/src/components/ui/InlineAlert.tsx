import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

export type InlineAlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONE_CLASSES: Record<InlineAlertTone, string> = {
  info: 'border-border bg-accent-soft text-accent-soft-fg',
  success: 'border-border bg-success-soft text-success',
  warning: 'border-border bg-warning-soft text-warning',
  danger: 'border-border bg-danger-soft text-danger',
};

const TONE_ICONS: Record<InlineAlertTone, ReactNode> = {
  info: <Info className="size-4" />,
  success: <CircleCheck className="size-4" />,
  warning: <TriangleAlert className="size-4" />,
  danger: <CircleAlert className="size-4" />,
};

export interface InlineAlertProps {
  tone?: InlineAlertTone;
  title?: ReactNode;
  children?: ReactNode;
  /** 오른쪽(모바일은 아래)에 두는 동작 버튼. */
  action?: ReactNode;
  className?: string;
}

/**
 * 대화상자·영역 안의 결과·오류 표시. 오류(`danger`)는 `role="alert"`, 나머지는 `role="status"`.
 */
export function InlineAlert({ tone = 'info', title, children, action, className }: InlineAlertProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-3 text-sm sm:flex-row sm:items-start',
        TONE_CLASSES[tone],
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <span aria-hidden="true" className="mt-0.5 inline-flex shrink-0">
          {TONE_ICONS[tone]}
        </span>
        <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
          {title ? <p className="font-semibold">{title}</p> : null}
          {children ? <div className={cn(title ? 'mt-0.5' : null, 'leading-relaxed')}>{children}</div> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export default InlineAlert;
