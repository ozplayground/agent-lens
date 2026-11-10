'use client';

import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** 입력 요소 공통 모양. 모바일(<md) 44px·16px 글자(iOS 자동 확대 방지), md 이상 36px·14px. */
export const FIELD_CONTROL_CLASSES =
  'w-full min-w-0 rounded-lg border bg-surface text-base text-fg placeholder:text-fg-subtle transition-colors duration-150 ease-standard disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

/** 오류 여부에 따른 테두리. */
export function fieldBorderClasses(invalid: boolean): string {
  return invalid ? 'border-danger' : 'border-border-strong hover:border-fg-subtle';
}

export const FIELD_LABEL_CLASSES = 'text-sm font-medium text-fg';
export const FIELD_DESCRIPTION_CLASSES = 'text-xs text-fg-muted';
export const FIELD_ERROR_CLASSES = 'text-xs font-medium text-danger';

export interface FieldIds {
  controlId: string;
  descriptionId?: string;
  errorId?: string;
  /** 컨트롤에 줄 `aria-describedby` (설명·오류·호출자가 준 값). 없으면 undefined. */
  describedBy?: string;
}

/** 라벨·설명·오류 id 를 만든다. `id` 를 주면 그것을 컨트롤 id 로 쓴다. */
export function useFieldIds(
  id: string | undefined,
  hasDescription: boolean,
  hasError: boolean,
  extraDescribedBy?: string
): FieldIds {
  const generated = useId();
  const controlId = id ?? `field-${generated}`;
  const descriptionId = hasDescription ? `${controlId}-description` : undefined;
  const errorId = hasError ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId, extraDescribedBy].filter(Boolean).join(' ') || undefined;
  return { controlId, descriptionId, errorId, describedBy };
}

export interface FieldFrameProps {
  label: ReactNode;
  hideLabel?: boolean;
  description?: ReactNode;
  error?: ReactNode;
  ids: FieldIds;
  className?: string;
  children: ReactNode;
}

/** 라벨 + 컨트롤 + 설명 + 오류 문구 틀. `TextField`·`Textarea`·`Select` 가 같이 쓴다. */
export function FieldFrame({ label, hideLabel, description, error, ids, className, children }: FieldFrameProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={ids.controlId} className={hideLabel ? 'sr-only' : FIELD_LABEL_CLASSES}>
        {label}
      </label>
      {children}
      {description ? (
        <p id={ids.descriptionId} className={FIELD_DESCRIPTION_CLASSES}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={ids.errorId} className={FIELD_ERROR_CLASSES}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  label: ReactNode;
  /** 라벨을 화면에서 숨기고 `sr-only` 로 남긴다. */
  hideLabel?: boolean;
  description?: ReactNode;
  /** 오류 문구. 있으면 `aria-invalid` 와 `danger` 문구를 단다. */
  error?: ReactNode;
  leadingIcon?: ReactNode;
  /** 입력창 오른쪽 안에 두는 요소 (예: 지우기 버튼). */
  trailing?: ReactNode;
  /** 바깥 틀(라벨 포함)의 클래스. `className` 은 `<input>` 에 붙는다. */
  containerClassName?: string;
}

/** 한 줄 입력창. `<label htmlFor>` 로 연결한다. */
export function TextField({
  label,
  hideLabel = false,
  description,
  error,
  leadingIcon,
  trailing,
  containerClassName,
  className,
  id,
  type = 'text',
  'aria-describedby': ariaDescribedBy,
  ...rest
}: TextFieldProps) {
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
        {leadingIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 inline-flex text-fg-subtle [&>svg]:size-4"
          >
            {leadingIcon}
          </span>
        ) : null}
        <input
          id={ids.controlId}
          type={type}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cn(
            FIELD_CONTROL_CLASSES,
            fieldBorderClasses(invalid),
            'h-11 text-ellipsis md:h-9',
            leadingIcon ? 'pl-9' : 'pl-3',
            trailing ? 'pr-12 md:pr-10' : 'pr-3',
            className
          )}
          {...rest}
        />
        {trailing ? <div className="absolute right-0 inline-flex items-center">{trailing}</div> : null}
      </div>
    </FieldFrame>
  );
}

export default TextField;
