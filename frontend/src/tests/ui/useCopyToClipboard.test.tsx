import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCopyToClipboard, copyText } from '@/hooks/useCopyToClipboard';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalExecCommand = Object.getOwnPropertyDescriptor(document, 'execCommand');

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value });
}

function setExecCommand(value: unknown) {
  Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value });
}

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else delete (navigator as { clipboard?: unknown }).clipboard;
    if (originalExecCommand) Object.defineProperty(document, 'execCommand', originalExecCommand);
    else delete (document as { execCommand?: unknown }).execCommand;
  });

  it('copies with navigator.clipboard and shows 복사됨 for 2 seconds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const execCommand = vi.fn(() => true);
    setExecCommand(execCommand);

    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.status).toBe('idle');
    expect(result.current.label).toBe('복사');

    let ok = false;
    await act(async () => {
      ok = await result.current.copy('hello');
    });

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(execCommand).not.toHaveBeenCalled();
    expect(result.current.status).toBe('copied');
    expect(result.current.label).toBe('복사됨');

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(result.current.status).toBe('copied');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.status).toBe('idle');
  });

  it('falls back to execCommand("copy") when navigator.clipboard is missing', async () => {
    setClipboard(undefined);
    let copiedText: string | null = null;
    const execCommand = vi.fn((command: string) => {
      const active = document.activeElement;
      if (command === 'copy' && active instanceof HTMLTextAreaElement) copiedText = active.value;
      return true;
    });
    setExecCommand(execCommand);

    const { result } = renderHook(() => useCopyToClipboard());
    let ok = false;
    await act(async () => {
      ok = await result.current.copy('fallback text');
    });

    expect(ok).toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(copiedText).toBe('fallback text');
    expect(result.current.status).toBe('copied');
    // 임시 textarea 는 지운다
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('falls back to execCommand when navigator.clipboard.writeText rejects', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    const execCommand = vi.fn(() => true);
    setExecCommand(execCommand);

    await expect(copyText('x')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('reports failed (복사 실패) for 2 seconds when both methods fail', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    setExecCommand(vi.fn(() => false));

    const { result } = renderHook(() => useCopyToClipboard());
    let ok = true;
    await act(async () => {
      ok = await result.current.copy('nope');
    });

    expect(ok).toBe(false);
    expect(result.current.status).toBe('failed');
    expect(result.current.label).toBe('복사 실패');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.status).toBe('idle');
  });

  it('reports failed when there is no clipboard and no execCommand', async () => {
    setClipboard(undefined);
    setExecCommand(undefined);

    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy('nope');
    });
    expect(result.current.status).toBe('failed');
  });
});
