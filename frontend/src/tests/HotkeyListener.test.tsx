import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import HotkeyListener from '@/components/HotkeyListener';

describe('HotkeyListener Component (Cycle 2 - TDD)', () => {
  const defaultProps = {
    onNavigateFeed: vi.fn(),
    onOpenDetailModal: vi.fn(),
    onHandoverChat: vi.fn(),
    onToggleBookmark: vi.fn(),
    onFocusSearch: vi.fn(),
    onToggleTheme: vi.fn(),
    onCloseOverlays: vi.fn(),
    onToggleCommandPalette: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers onNavigateFeed when j or k key is pressed', () => {
    render(<HotkeyListener {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'j' });
    expect(defaultProps.onNavigateFeed).toHaveBeenCalledWith(1);

    fireEvent.keyDown(window, { key: 'k' });
    expect(defaultProps.onNavigateFeed).toHaveBeenCalledWith(-1);
  });

  it('triggers onFocusSearch and prevents default when / key is pressed', () => {
    render(<HotkeyListener {...defaultProps} />);

    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(defaultProps.onFocusSearch).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('triggers onToggleBookmark on b key and onHandoverChat on c key', () => {
    render(<HotkeyListener {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'b' });
    expect(defaultProps.onToggleBookmark).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'c' });
    expect(defaultProps.onHandoverChat).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleTheme on t key', () => {
    render(<HotkeyListener {...defaultProps} />);

    fireEvent.keyDown(window, { key: 't' });
    expect(defaultProps.onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('triggers onCloseOverlays on Escape key', () => {
    render(<HotkeyListener {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onCloseOverlays).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleCommandPalette on Cmd+K or Ctrl+K and prevents default', () => {
    render(<HotkeyListener {...defaultProps} />);

    const cmdEvent = new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true });
    const cmdSpy = vi.spyOn(cmdEvent, 'preventDefault');
    window.dispatchEvent(cmdEvent);

    expect(defaultProps.onToggleCommandPalette).toHaveBeenCalledTimes(1);
    expect(cmdSpy).toHaveBeenCalled();

    const ctrlEvent = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    const ctrlSpy = vi.spyOn(ctrlEvent, 'preventDefault');
    window.dispatchEvent(ctrlEvent);

    expect(defaultProps.onToggleCommandPalette).toHaveBeenCalledTimes(2);
    expect(ctrlSpy).toHaveBeenCalled();
  });

  it('enforces Input Isolation Rule: ignores single-key shortcuts when typing in an input element', () => {
    const { container } = render(
      <div>
        <input data-testid="test-input" type="text" />
        <HotkeyListener {...defaultProps} />
      </div>
    );

    const input = container.querySelector('input')!;

    // Typing inside input should NOT trigger navigation or actions
    fireEvent.keyDown(input, { key: 'j' });
    fireEvent.keyDown(input, { key: 'k' });
    fireEvent.keyDown(input, { key: '/' });
    fireEvent.keyDown(input, { key: 'b' });
    fireEvent.keyDown(input, { key: 'c' });
    fireEvent.keyDown(input, { key: 't' });

    expect(defaultProps.onNavigateFeed).not.toHaveBeenCalled();
    expect(defaultProps.onFocusSearch).not.toHaveBeenCalled();
    expect(defaultProps.onToggleBookmark).not.toHaveBeenCalled();
    expect(defaultProps.onHandoverChat).not.toHaveBeenCalled();
    expect(defaultProps.onToggleTheme).not.toHaveBeenCalled();

    // But Cmd+K and Escape should still work inside input!
    fireEvent.keyDown(input, { key: 'k', metaKey: true });
    expect(defaultProps.onToggleCommandPalette).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(defaultProps.onCloseOverlays).toHaveBeenCalledTimes(1);
  });

  it('ignores hotkeys during IME composition (isComposing = true)', () => {
    render(<HotkeyListener {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'c', isComposing: true });
    expect(defaultProps.onHandoverChat).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 't', isComposing: true });
    expect(defaultProps.onToggleTheme).not.toHaveBeenCalled();
  });
});
