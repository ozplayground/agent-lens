import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SwitchProps
  extends Omit<ComponentPropsWithRef<'button'>, 'onChange' | 'role' | 'aria-checked' | 'children' | 'value'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 접근 이름. `hideLabel` 이 아니면 스위치 왼쪽에 보이는 글자로 그린다. */
  label: string;
  hideLabel?: boolean;
  description?: ReactNode;
  /** 바깥 틀의 클래스. `className` 은 `<button>` 에 붙는다. */
  containerClassName?: string;
}

/** 켜고 끄는 스위치. `button role="switch" aria-checked`. 누르는 영역은 모바일 44px. */
export function Switch({
  checked,
  onChange,
  label,
  hideLabel = false,
  description,
  containerClassName,
  className,
  disabled,
  id,
  type = 'button',
  onClick,
  ...rest
}: SwitchProps) {
  const generated = useId();
  const baseId = id ?? `switch-${generated}`;
  const labelId = `${baseId}-label`;
  const descriptionId = description ? `${baseId}-description` : undefined;

  const button = (
    <button
      id={baseId}
      type={type}
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      aria-labelledby={hideLabel ? undefined : labelId}
      aria-describedby={descriptionId}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onChange(!checked);
      }}
      className={cn(
        'group inline-flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:min-w-9',
        className
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-6 w-10 items-center rounded-full border transition-colors duration-150 ease-standard',
          checked ? 'border-transparent bg-accent-solid' : 'border-border-strong bg-surface-muted'
        )}
      >
        <span
          className={cn(
            'inline-block size-4 rounded-full shadow-card transition-transform duration-150 ease-standard',
            checked ? 'translate-x-5 bg-on-accent' : 'translate-x-1 bg-fg-subtle'
          )}
        />
      </span>
    </button>
  );

  if (hideLabel && !description) return button;

  return (
    <div className={cn('flex min-w-0 items-center justify-between gap-3', containerClassName)}>
      <div className="min-w-0 flex-1">
        {hideLabel ? null : (
          <span id={labelId} className="block text-sm font-medium text-fg">
            {label}
          </span>
        )}
        {description ? (
          <p id={descriptionId} className="text-xs text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {button}
    </div>
  );
}

export default Switch;
