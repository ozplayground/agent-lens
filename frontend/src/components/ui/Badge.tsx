import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-fg-muted',
  accent: 'bg-accent-soft text-accent-soft-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: ReactNode;
  /**
   * 배지 줄에서 줄어들 수 있게 한다. 기본 `false` 는 `shrink-0 max-w-full`.
   * `true` 면 그 둘 대신 `shrink` 만 붙이고, 폭 한계(`min-w-*`, `max-w-*`)는 호출자가 `className` 으로 준다.
   * `cn` 이 Tailwind 충돌을 풀지 않으므로 같은 속성 클래스를 두 번 붙이지 않으려는 것이다.
   */
  shrink?: boolean;
}

/** 상태·분류 표시. 상호작용하지 않는다. */
export function Badge({ tone = 'neutral', icon, shrink = false, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap',
        shrink ? 'shrink' : 'max-w-full shrink-0',
        TONE_CLASSES[tone],
        className
      )}
      {...rest}
    >
      {icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-3.5">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

export default Badge;
