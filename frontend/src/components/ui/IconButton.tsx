import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { BUTTON_VARIANT_CLASSES, type ButtonVariant, type ButtonSize } from './Button';

/** 모바일(<md) 44×44, md 이상 36×36 (`sm` 은 32×32). */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'size-11 md:size-8',
  md: 'size-11 md:size-9',
  lg: 'size-12 md:size-10',
};

export interface IconButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'aria-label' | 'aria-pressed'> {
  /** 접근 이름. `aria-label` 과 `title` 로 쓴다. */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 토글 버튼이면 지정한다. 주면 `aria-pressed` 가 붙는다. */
  pressed?: boolean;
}

/** 아이콘만 있는 버튼. */
export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  pressed,
  type = 'button',
  className,
  title,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={title ?? label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ease-standard disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANT_CLASSES[variant],
        pressed && variant === 'ghost' ? 'bg-accent-soft text-accent-soft-fg hover:bg-accent-soft' : null,
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      <span aria-hidden="true" className="inline-flex [&>svg]:size-5 md:[&>svg]:size-4">
        {icon}
      </span>
    </button>
  );
}

export default IconButton;
