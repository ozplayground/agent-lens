import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'failed';

/** 상태별 버튼 문구. */
export const COPY_STATUS_LABELS: Readonly<Record<CopyStatus, string>> = {
  idle: '복사',
  copied: '복사됨',
  failed: '복사 실패',
};

/** 숨긴 textarea + `document.execCommand('copy')` 로 복사한다. 실패하면 false. */
function copyWithExecCommand(text: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function' || !document.body) {
    return false;
  }
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  let ok = false;
  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    textarea.remove();
    previousFocus?.focus();
  }
  return ok;
}

/**
 * 글자를 클립보드에 복사한다.
 * `navigator.clipboard.writeText` → 없거나 실패하면 `execCommand('copy')` 로 한 번 더 → 그래도 실패하면 false.
 */
export async function copyText(text: string): Promise<boolean> {
  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // 권한 거부·비보안 출처 등: 아래 대체 방식으로 넘어간다.
    }
  }
  return copyWithExecCommand(text);
}

export interface UseCopyToClipboardResult {
  status: CopyStatus;
  /** 지금 상태의 버튼 문구 (`복사`/`복사됨`/`복사 실패`). */
  label: string;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * 복사하고 결과 상태(`copied`/`failed`)를 `resetMs`(기본 2초) 동안 유지한 뒤 `idle` 로 돌아간다.
 */
export function useCopyToClipboard(resetMs = 2000): UseCopyToClipboardResult {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setStatus('idle');
  }, [clearTimer]);

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyText(text);
      if (!mountedRef.current) return ok;
      clearTimer();
      setStatus(ok ? 'copied' : 'failed');
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setStatus('idle');
      }, resetMs);
      return ok;
    },
    [clearTimer, resetMs]
  );

  return { status, label: COPY_STATUS_LABELS[status], copy, reset };
}

export default useCopyToClipboard;
