'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FIELD_CONTROL_CLASSES, FieldFrame, fieldBorderClasses, useFieldIds } from './TextField';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'children' | 'multiple' | 'size'> {
  label: ReactNode;
  hideLabel?: boolean;
  description?: ReactNode;
  error?: ReactNode;
  options: readonly SelectOption[];
  containerClassName?: string;
}

/** 네이티브 `<select>`. 모바일 44px, md 이상 36px. */
export function Select({
  label,
  hideLabel = false,
  description,
  error,
  options,
  containerClassName,
  className,
  id,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: SelectProps) {
  const ids = useFieldIds(id, Boolean(description), Boolean(error), ariaDescribedBy);
  const invalid = Boolean(error);

  return (
    <FieldFrame
      label={label}
      hideLabel={hideLabel}
      description={description}
      error={error}
      ids={ids}
      className={containerClassName}
    >
      <div className="relative flex min-w-0 items-center">
        <select
          id={ids.controlId}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cn(
            FIELD_CONTROL_CLASSES,
            fieldBorderClasses(invalid),
            'h-11 cursor-pointer appearance-none pr-9 pl-3 md:h-9',
            className
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute right-3 size-4 text-fg-subtle"
        />
      </div>
    </FieldFrame>
  );
}

export default Select;
