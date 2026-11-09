import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HotkeyListener from '@/components/HotkeyListener';
import { Dialog } from '@/components/ui/Dialog';
import { useOverlayOpen } from '@/lib/overlay-stack';

const handlers = {
  onNavigateFeed: vi.fn(),
  onOpenDetailModal: vi.fn(),
  onHandoverChat: vi.fn(),
  onToggleBookmark: vi.fn(),
  onFocusSearch: vi.fn(),
  onToggleTheme: vi.fn(),
};

/** 홈 화면과 같은 연결: 오버레이 스택이 비어 있지 않으면 단일 키를 막는다. */
function HomeLikeHarness({ dialogOpen }: { dialogOpen: boolean }) {
  const overlayOpen = useOverlayOpen();
  return (
    <>
      <HotkeyListener {...handlers} blockSingleKeys={overlayOpen} />
      <button type="button">카드 제목</button>
      <Dialog open={dialogOpen} onClose={() => {}} title="열린 대화상자">
        <p>내용</p>
      </Dialog>
    </>
  );
}

function pressOn(target: EventTarget, init: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('HotkeyListener gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores j/k/b/c/t while an overlay is open', () => {
    render(<HomeLikeHarness dialogOpen />);
    for (const key of ['j', 'k', 'b', 'c', 't', '/']) {
      fireEvent.keyDown(window, { key });
    }
    expect(handlers.onNavigateFeed).not.toHaveBeenCalled();
    expect(handlers.onToggleBookmark).not.toHaveBeenCalled();
    expect(handlers.onHandoverChat).not.toHaveBeenCalled();
    expect(handlers.onToggleTheme).not.toHaveBeenCalled();
    expect(handlers.onFocusSearch).not.toHaveBeenCalled();
  });

  it('handles j/k again when no overlay is open', () => {
    render(<HomeLikeHarness dialogOpen={false} />);
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'k' });
    expect(handlers.onNavigateFeed).toHaveBeenNthCalledWith(1, 1);
    expect(handlers.onNavigateFeed).toHaveBeenNthCalledWith(2, -1);
  });

  it('blockSingleKeys prop blocks single keys on its own', () => {
    render(<HotkeyListener {...handlers} blockSingleKeys />);
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 't' });
    expect(handlers.onNavigateFeed).not.toHaveBeenCalled();
    expect(handlers.onToggleTheme).not.toHaveBeenCalled();
  });

  it('does not preventDefault Enter/Space when a button has focus', () => {
    render(<HomeLikeHarness dialogOpen={false} />);
    const button = screen.getByRole('button', { name: '카드 제목' });
    button.focus();

    const enter = pressOn(button, { key: 'Enter' });
    const space = pressOn(button, { key: ' ' });

    expect(enter.defaultPrevented).toBe(false);
    expect(space.defaultPrevented).toBe(false);
    expect(handlers.onOpenDetailModal).not.toHaveBeenCalled();
  });

  it('opens the focused card on Enter only when the target is document.body', () => {
    render(<HomeLikeHarness dialogOpen={false} />);
    const event = pressOn(document.body, { key: 'Enter' });
    expect(event.defaultPrevented).toBe(true);
    expect(handlers.onOpenDetailModal).toHaveBeenCalledTimes(1);
  });

  it('matches letter keys by e.code when a Korean layout is active', () => {
    render(<HomeLikeHarness dialogOpen={false} />);
    fireEvent.keyDown(window, { key: 'ㅓ', code: 'KeyJ' });
    fireEvent.keyDown(window, { key: 'ㅏ', code: 'KeyK' });
    fireEvent.keyDown(window, { key: 'ㅠ', code: 'KeyB' });
    fireEvent.keyDown(window, { key: 'ㅅ', code: 'KeyT' });
    expect(handlers.onNavigateFeed).toHaveBeenNthCalledWith(1, 1);
    expect(handlers.onNavigateFeed).toHaveBeenNthCalledWith(2, -1);
    expect(handlers.onToggleBookmark).toHaveBeenCalledTimes(1);
    expect(handlers.onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('ignores keys during IME composition reported as keyCode 229', () => {
    render(<HomeLikeHarness dialogOpen={false} />);
    fireEvent.keyDown(window, { key: 'Process', code: 'KeyJ', keyCode: 229 });
    expect(handlers.onNavigateFeed).not.toHaveBeenCalled();
  });
});
