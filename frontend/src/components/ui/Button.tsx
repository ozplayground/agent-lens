import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE_CLASSES =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap select-none transition-colors duration-150 ease-standard disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent-solid text-on-accent hover:bg-accent-solid-hover',
  secondary: 'border border-border-strong bg-surface text-fg hover:bg-surface-muted',
  ghost: 'bg-transparent text-fg-muted hover:bg-surface-muted hover:text-fg',
  danger: 'bg-danger-solid text-on-accent hover:bg-danger-solid-hover',
};

/** 모바일(<md) 44px, md 이상 36px. `sm` 은 md 이상에서만 32px 이다. */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-11 px-3 text-sm md:h-8 md:px-2.5',
  md: 'h-11 px-4 text-sm md:h-9 md:px-3',
  lg: 'h-12 px-5 text-base md:h-10 md:px-4',
};

/**
 * 버튼 모양 클래스. `<Link>`·`<a>` 를 버튼처럼 보이게 할 때 쓴다.
 */
export function buttonClasses(
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  className?: string
): string {
  return cn(BASE_CLASSES, BUTTON_VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 진행 중이면 `disabled` + `aria-busy="true"` 이고 아이콘 자리에 스피너를 그린다. */
  loading?: boolean;
  leadingIcon?: ReactNode;
}

/** 글자가 있는 버튼. 아이콘만 있는 버튼은 `IconButton` 을 쓴다. */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  leadingIcon,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? true : undefined}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {loading ? (
        <Spinner />
      ) : leadingIcon ? (
        <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
          {leadingIcon}
        </span>
      ) : null}
      {children}
    </button>
  );
}

export default Button;
