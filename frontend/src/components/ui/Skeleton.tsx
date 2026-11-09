import { cn } from '@/lib/cn';

export interface SkeletonProps {
  className?: string;
}

/** 불러오는 동안의 자리 표시. 화면 낭독기에서 숨긴다. 크기는 `className` 으로 준다. */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('rounded-md bg-surface-muted motion-safe:animate-pulse', className)} />;
}

export default Skeleton;
