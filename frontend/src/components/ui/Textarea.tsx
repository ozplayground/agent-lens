import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import { FIELD_CONTROL_CLASSES, FieldFrame, fieldBorderClasses, useFieldIds } from './TextField';

export interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  label: ReactNode;
  hideLabel?: boolean;
  description?: ReactNode;
  error?: ReactNode;
  /** 내용에 맞춰 높이를 늘린다 (기본 true). */
  autoResize?: boolean;
  /** 자동 높이의 최대값(px). 넘으면 세로 스크롤. */
  maxHeight?: number;
  containerClassName?: string;
}

/** 여러 줄 입력창. 라벨 규칙은 `TextField` 와 같다. */
export function Textarea({
  label,
  hideLabel = false,
  description,
  error,
  autoResize = true,
  maxHeight = 240,
  containerClassName,
  className,
  id,
  ref,
  value,
  rows = 3,
  onInput,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: TextareaProps) {
  const ids = useFieldIds(id, Boolean(description), Boolean(error), ariaDescribedBy);
  const invalid = Boolean(error);
  const innerRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

  const resize = useCallback(() => {
    const el = innerRef.current;
    if (!el || !autoResize) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [autoResize, maxHeight]);

  useLayoutEffect(() => {
    resize();
  }, [resize, value]);

  const handleInput: NonNullable<TextareaProps['onInput']> = (event) => {
    resize();
    onInput?.(event);
  };

  return (
    <FieldFrame
      label={label}
      hideLabel={hideLabel}
      description={description}
      error={error}
      ids={ids}
      className={containerClassName}
    >
      <textarea
        ref={innerRef}
        id={ids.controlId}
        rows={rows}
        value={value}
        onInput={handleInput}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(
          FIELD_CONTROL_CLASSES,
          fieldBorderClasses(invalid),
          'block resize-none px-3 py-2.5 leading-relaxed md:py-2',
          className
        )}
        {...rest}
      />
    </FieldFrame>
  );
}

export default Textarea;
