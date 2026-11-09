import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface KbdProps {
  children: ReactNode;
  className?: string;
}

/** 단축키 표시. 640px 미만에서는 숨긴다. */
export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'hidden h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-muted px-1 font-mono text-xs font-medium text-fg-muted sm:inline-flex',
        className
      )}
    >
      {children}
    </kbd>
  );
}

export default Kbd;
