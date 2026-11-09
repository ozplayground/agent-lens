import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SpinnerProps {
  /** 화면 낭독기용 글자. 있으면 `sr-only` 로 함께 그린다. */
  label?: string;
  className?: string;
}

/** 진행 표시. 회전 아이콘은 `aria-hidden` 이다. */
export function Spinner({ label, className }: SpinnerProps) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', className)}>
      <LoaderCircle aria-hidden="true" focusable="false" className="size-4 animate-spin" />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

export default Spinner;
