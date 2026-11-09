import type { HTMLAttributes, Ref } from 'react';
import { cn } from '@/lib/cn';

export type CardPadding = 'none' | 'sm' | 'md';

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-5',
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
  /** 누를 수 있는 카드: hover 테두리 `border-strong`, `focus-within` 링. */
  interactive?: boolean;
  padding?: CardPadding;
  ref?: Ref<HTMLElement>;
}

/** 카드 틀. `rounded-xl`, 테두리, `shadow-card`. */
export function Card({ as: Tag = 'div', interactive = false, padding = 'md', className, ref, ...rest }: CardProps) {
  return (
    <Tag
      ref={ref as Ref<HTMLDivElement>}
      className={cn(
        'min-w-0 rounded-xl border border-border bg-surface shadow-card',
        PADDING_CLASSES[padding],
        interactive
          ? 'transition-colors duration-150 ease-standard hover:border-border-strong focus-within:ring-2 focus-within:ring-accent'
          : null,
        className
      )}
      {...rest}
    />
  );
}

export default Card;
