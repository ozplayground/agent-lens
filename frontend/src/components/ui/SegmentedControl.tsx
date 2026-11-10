'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** 보이는 글자와 다른 접근 이름이 필요할 때. */
  ariaLabel?: string;
  title?: string;
}

export interface SegmentedControlProps<T extends string> {
  /** 그룹의 접근 이름. */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** 둘~넷 중 하나를 고르는 토글. `role="group"` + 버튼 `aria-pressed`. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex min-w-0 items-center gap-0.5 rounded-lg bg-surface-muted p-0.5', className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={option.ariaLabel}
            title={option.title}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 ease-standard disabled:cursor-not-allowed disabled:opacity-50 md:h-8',
              selected ? 'bg-surface text-fg shadow-card' : 'text-fg-muted hover:text-fg'
            )}
          >
            {option.icon ? (
              <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
                {option.icon}
              </span>
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
