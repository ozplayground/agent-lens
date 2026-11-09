'use client';

import { useEffect } from 'react';

// 참조 수. 대화상자·드로어가 겹쳐 열려도 마지막 하나가 닫힐 때만 풀린다.
let lockCount = 0;
let savedOverflow = '';

function lock() {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

function unlock() {
  if (typeof document === 'undefined' || lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
    savedOverflow = '';
  }
}

/** `active` 인 동안 `body` 스크롤을 잠근다 (참조 수). */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}

export default useScrollLock;
