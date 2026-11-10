'use client';

import { useRef, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './IconButton';
import { TextField, type TextFieldProps } from './TextField';

export interface SearchFieldProps extends Omit<TextFieldProps, 'type' | 'onSubmit' | 'leadingIcon' | 'trailing'> {
  /** Enter 로 제출할 때 지금 입력값을 받는다. */
  onSubmit?: (value: string) => void;
  /** 주면 입력값이 있을 때 `검색어 지우기` 버튼을 그린다. */
  onClear?: () => void;
  /** `<form role="search">` 의 클래스. */
  formClassName?: string;
}

/** 검색창. `<form role="search">` + `type="search"` + 지우기 버튼. */
export function SearchField({ onSubmit, onClear, formClassName, value, label, ...rest }: SearchFieldProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector('input');
    onSubmit?.(input?.value ?? '');
  };

  const handleClear = () => {
    onClear?.();
    formRef.current?.querySelector('input')?.focus();
  };

  const hasValue = value === undefined ? true : String(value).length > 0;

  return (
    <form
      ref={formRef}
      role="search"
      onSubmit={handleSubmit}
      className={cn('min-w-0', formClassName)}
    >
      <TextField
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        label={label}
        value={value}
        leadingIcon={<Search />}
        trailing={
          onClear && hasValue ? (
            <IconButton label="검색어 지우기" icon={<X />} size="md" onClick={handleClear} />
          ) : undefined
        }
        className="[&::-webkit-search-cancel-button]:appearance-none"
        {...rest}
      />
    </form>
  );
}

export default SearchField;
