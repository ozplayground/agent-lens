import { describe, it, expect, vi, afterEach } from 'vitest';
import { StrictMode, useState } from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { overlayStack, useOverlayOpen, useOverlayLayer } from '@/lib/overlay-stack';
import { Dialog } from '@/components/ui/Dialog';

function Layer({ open = true, kind = 'modal' as const, onEscape }: { open?: boolean; kind?: 'modal' | 'popover'; onEscape: () => void }) {
  useOverlayLayer({ open, kind, onEscape });
  return null;
}

function OpenProbe() {
  const open = useOverlayOpen();
  return <span data-testid="probe">{open ? 'open' : 'closed'}</span>;
}

afterEach(() => {
  for (const layer of overlayStack.getLayers()) overlayStack.remove(layer.id);
});

describe('overlayStack', () => {
  it('push / remove keeps order and the top layer', () => {
    overlayStack.push({ id: 'a', kind: 'modal' });
    overlayStack.push({ id: 'b', kind: 'popover' });
    expect(overlayStack.getLayers().map((l) => l.id)).toEqual(['a', 'b']);
    expect(overlayStack.isTop('b')).toBe(true);

    overlayStack.remove('b');
    expect(overlayStack.getLayers().map((l) => l.id)).toEqual(['a']);
    expect(overlayStack.isTop('a')).toBe(true);

    overlayStack.remove('a');
    expect(overlayStack.getLayers()).toHaveLength(0);
  });

  it('calls only the top layer onEscape and prevents default', () => {
    const bottom = vi.fn();
    const top = vi.fn();
    overlayStack.push({ id: 'bottom', kind: 'modal', onEscape: bottom });
    overlayStack.push({ id: 'top', kind: 'popover', onEscape: top });

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    window.dispatchEvent(event);

    expect(top).toHaveBeenCalledTimes(1);
    expect(bottom).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores Escape while IME composition is in progress', () => {
    const onEscape = vi.fn();
    overlayStack.push({ id: 'a', kind: 'modal', onEscape });

    fireEvent.keyDown(window, { key: 'Escape', isComposing: true });
    fireEvent.keyDown(window, { key: 'Escape', keyCode: 229 });
    expect(onEscape).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('attaches the window listener only while the stack is non-empty', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    overlayStack.push({ id: 'a', kind: 'modal' });
    overlayStack.push({ id: 'b', kind: 'modal' });
    expect(addSpy.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);

    overlayStack.remove('a');
    expect(removeSpy.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(0);
    overlayStack.remove('b');
    expect(removeSpy.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('sets inert on #app-shell while a modal is open and removes it after', () => {
    const shell = document.createElement('div');
    shell.id = 'app-shell';
    document.body.appendChild(shell);

    overlayStack.push({ id: 'p', kind: 'popover' });
    expect(shell).not.toHaveAttribute('inert');

    overlayStack.push({ id: 'm', kind: 'modal' });
    expect(shell).toHaveAttribute('inert');

    overlayStack.remove('m');
    expect(shell).not.toHaveAttribute('inert');
    overlayStack.remove('p');
    shell.remove();
  });
});

describe('useOverlayLayer / useOverlayOpen', () => {
  it('useOverlayOpen follows the stack', () => {
    const { result } = renderHook(() => useOverlayOpen());
    expect(result.current).toBe(false);

    act(() => overlayStack.push({ id: 'x', kind: 'popover' }));
    expect(result.current).toBe(true);

    act(() => overlayStack.remove('x'));
    expect(result.current).toBe(false);
  });

  it('a component layer handles window Escape and leaves the stack on unmount', () => {
    const onEscape = vi.fn();
    const { unmount } = render(
      <>
        <Layer onEscape={onEscape} />
        <OpenProbe />
      </>
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('open');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);

    unmount();
    expect(overlayStack.getLayers()).toHaveLength(0);
  });

  it('removes the layer when open becomes false', () => {
    const onEscape = vi.fn();
    const { rerender } = render(
      <>
        <Layer onEscape={onEscape} />
        <OpenProbe />
      </>
    );
    rerender(
      <>
        <Layer open={false} onEscape={onEscape} />
        <OpenProbe />
      </>
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('closed');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('calls the latest onEscape after re-render', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Layer onEscape={first} />);
    rerender(<Layer onEscape={second} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

// 부모·자식 대화상자를 같은 렌더에서 함께 연다 (spec 14.7 C-5, R25).
function NestedOpenDialogs() {
  const [parentOpen, setParentOpen] = useState(true);
  const [childOpen, setChildOpen] = useState(true);
  return (
    <Dialog open={parentOpen} onClose={() => setParentOpen(false)} title="부모 대화상자">
      <p>부모 본문</p>
      <Dialog open={childOpen} onClose={() => setChildOpen(false)} title="자식 대화상자">
        <p>자식 본문</p>
      </Dialog>
    </Dialog>
  );
}

function dialogByTitle(title: string): HTMLElement | null {
  const heading = screen.queryByRole('heading', { name: title, hidden: true });
  return heading ? (heading.closest('[role="dialog"]') as HTMLElement | null) : null;
}

describe('같은 렌더에서 함께 열린 부모·자식 대화상자 (R25)', () => {
  function expectChildOnTop() {
    const parent = dialogByTitle('부모 대화상자');
    const child = dialogByTitle('자식 대화상자');
    expect(parent).not.toBeNull();
    expect(child).not.toBeNull();

    // 맨 위 레이어는 자식이다: 정렬된 스택의 마지막 레이어 요소가 자식 대화상자.
    const top = overlayStack.getTop();
    expect(top?.element).toBe(child);
    // 자식이 열린 동안 부모 대화상자는 inert, 자식은 아니다.
    expect(parent).toHaveAttribute('inert');
    expect(child).not.toHaveAttribute('inert');

    // Escape 한 번에 자식만 닫힌다.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(dialogByTitle('자식 대화상자')).toBeNull();
    const parentAfter = dialogByTitle('부모 대화상자');
    expect(parentAfter).not.toBeNull();
    expect(parentAfter).not.toHaveAttribute('inert');

    // 다음 Escape 는 부모를 닫는다.
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(dialogByTitle('부모 대화상자')).toBeNull();
    expect(overlayStack.getLayers()).toHaveLength(0);
  }

  it('자식이 맨 위이고 Escape 한 번에 자식만 닫히며 부모는 inert 다', () => {
    render(<NestedOpenDialogs />);
    expectChildOnTop();
  });

  it('StrictMode 이중 렌더에서도 자식이 맨 위다', () => {
    render(
      <StrictMode>
        <NestedOpenDialogs />
      </StrictMode>
    );
    expectChildOnTop();
  });
});
