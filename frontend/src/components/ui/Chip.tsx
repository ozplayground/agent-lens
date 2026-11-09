import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ScrollRow } from './ScrollRow';

export type ChipTone = 'accent' | 'warning';

const SELECTED_CLASSES: Record<ChipTone, string> = {
  accent: 'border-transparent bg-accent-soft text-accent-soft-fg',
  warning: 'border-warning bg-warning-soft text-warning',
};

const SELECTED_COUNT_CLASSES: Record<ChipTone, string> = {
  accent: 'text-accent-soft-fg',
  warning: 'text-warning',
};

export interface ChipProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-pressed'> {
  selected: boolean;
  /** 선택 상태의 색. 기본 `accent`, Must-Read 같은 강조는 `warning`. */
  tone?: ChipTone;
  /** 건수. 칩 글자 뒤에 작게 붙는다. */
  count?: number;
  icon?: ReactNode;
  /** 아이콘 감싸개(`data-chip-icon`)에 붙는 클래스. 예: `max-xl:hidden`. */
  iconClassName?: string;
}

/** 필터 칩. `button aria-pressed`. 모바일 44px, md 이상 32px. */
export function Chip({
  selected,
  tone = 'accent',
  count,
  icon,
  iconClassName,
  type = 'button',
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 ease-standard disabled:cursor-not-allowed disabled:opacity-50 md:h-8',
        selected
          ? SELECTED_CLASSES[tone]
          : 'border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg',
        className
      )}
      {...rest}
    >
      {icon ? (
        <span aria-hidden="true" data-chip-icon="" className={cn('inline-flex shrink-0 [&>svg]:size-4', iconClassName)}>
          {icon}
        </span>
      ) : null}
      {children}
      {count !== undefined ? (
        <span className={cn('text-xs tabular-nums', selected ? SELECTED_COUNT_CLASSES[tone] : 'text-fg-subtle')}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

export interface ChipGroupProps {
  /** 그룹의 접근 이름 (`aria-label`). 스크롤 버튼 이름에도 쓴다. */
  label: string;
  /**
   * 한 줄 가로 스크롤 (`ScrollRow`). 넘칠 때만 넘친 쪽을 흐리고, 768 이상에서 넘친 쪽에 스크롤 버튼(그룹 밖)을 둔다.
   * 아니면 줄바꿈한다.
   */
  scrollable?: boolean;
  /**
   * `scrollable` 일 때 768 미만에서 줄을 화면 끝까지 늘인다.
   * `true` 는 좌우 둘 다, `'start'` 는 왼쪽만 (오른쪽에 다른 컨트롤이 있을 때).
   */
  bleed?: boolean | 'start';
  /** `scrollable` 이면 바깥 감싸개(레이아웃 항목)에, 아니면 그룹에 붙는다. */
  className?: string;
  /** `scrollable` 일 때 스크롤 줄(그룹 요소)에 붙는 클래스. */
  rowClassName?: string;
  /** `scrollable` 일 때 처음 그릴 때와 바뀔 때 보이게 할 선택 칩의 선택자. 주지 않으면 `[aria-pressed="true"]`. */
  selectedSelector?: string;
  children: ReactNode;
}

/** 칩 묶음. `role="group" aria-label`. `scrollable` 이면 스크롤 줄이 그룹이다. */
export function ChipGroup({
  label,
  scrollable = false,
  bleed = false,
  className,
  rowClassName,
  selectedSelector,
  children,
}: ChipGroupProps) {
  if (scrollable) {
    return (
      <ScrollRow
        role="group"
        aria-label={label}
        label={label}
        bleed={bleed}
        className={className}
        rowClassName={rowClassName}
        {...(selectedSelector === undefined ? {} : { selectedSelector })}
      >
        {children}
      </ScrollRow>
    );
  }
  return (
    <div role="group" aria-label={label} className={cn('flex min-w-0 flex-wrap items-center gap-2', className)}>
      {children}
    </div>
  );
}

export default Chip;
