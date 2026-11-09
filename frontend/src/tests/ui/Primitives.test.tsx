import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import { Star } from 'lucide-react';
import { Button, buttonClasses } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Spinner } from '@/components/ui/Spinner';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Badge } from '@/components/ui/Badge';
import { Kbd } from '@/components/ui/Kbd';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';

describe('cn', () => {
  it('joins truthy class names and skips falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b', 'c')).toBe('a b c');
  });
});

describe('Button', () => {
  it('defaults to type="button"', () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toHaveAttribute('type', 'button');
  });

  it('keeps an explicit type', () => {
    render(<Button type="submit">보내기</Button>);
    expect(screen.getByRole('button', { name: '보내기' })).toHaveAttribute('type', 'submit');
  });

  it('is disabled and aria-busy while loading', () => {
    render(<Button loading>저장</Button>);
    const button = screen.getByRole('button', { name: '저장' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('has no aria-busy when not loading', () => {
    render(<Button>저장</Button>);
    const button = screen.getByRole('button', { name: '저장' });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('exposes buttonClasses for links styled as buttons', () => {
    const classes = buttonClasses('primary', 'md');
    expect(classes).toContain('bg-accent-solid');
    expect(classes).toContain('h-11');
    expect(classes).toContain('md:h-9');
  });
});

describe('IconButton', () => {
  it('uses label for aria-label and title', () => {
    render(<IconButton label="새로고침" icon={<Star />} />);
    const button = screen.getByRole('button', { name: '새로고침' });
    expect(button).toHaveAttribute('aria-label', '새로고침');
    expect(button).toHaveAttribute('title', '새로고침');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('aria-pressed');
  });

  it('sets aria-pressed when pressed is given', () => {
    const { rerender } = render(<IconButton label="북마크" icon={<Star />} pressed />);
    expect(screen.getByRole('button', { name: '북마크' })).toHaveAttribute('aria-pressed', 'true');
    rerender(<IconButton label="북마크" icon={<Star />} pressed={false} />);
    expect(screen.getByRole('button', { name: '북마크' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('display primitives', () => {
  it('Spinner renders an sr-only label', () => {
    render(<Spinner label="불러오는 중" />);
    expect(screen.getByText('불러오는 중')).toHaveClass('sr-only');
  });

  it('InlineAlert uses role="alert" for danger and role="status" otherwise', () => {
    const { rerender } = render(<InlineAlert tone="danger">실패했습니다</InlineAlert>);
    expect(screen.getByRole('alert')).toHaveTextContent('실패했습니다');
    rerender(<InlineAlert tone="success">저장했습니다</InlineAlert>);
    expect(screen.getByRole('status')).toHaveTextContent('저장했습니다');
  });

  it('Badge renders its text', () => {
    render(<Badge tone="warning">Must-Read</Badge>);
    expect(screen.getByText('Must-Read')).toHaveClass('text-xs');
  });

  it('Badge shrink replaces shrink-0 and max-w-full with shrink and leaves the width limits to className', () => {
    const { rerender } = render(
      <Badge shrink className="min-w-12 max-w-32">
        LangGraph
      </Badge>
    );
    const shrinking = screen.getByText('LangGraph');
    expect(shrinking.classList.contains('shrink')).toBe(true);
    expect(shrinking.classList.contains('min-w-12')).toBe(true);
    expect(shrinking.classList.contains('max-w-32')).toBe(true);
    expect(shrinking.classList.contains('shrink-0')).toBe(false);
    expect(shrinking.classList.contains('max-w-full')).toBe(false);

    rerender(<Badge>LangGraph</Badge>);
    const fixed = screen.getByText('LangGraph');
    expect(fixed.classList.contains('shrink-0')).toBe(true);
    expect(fixed.classList.contains('max-w-full')).toBe(true);
    expect(fixed.classList.contains('shrink')).toBe(false);
  });

  it('Kbd renders a kbd element hidden below 640px', () => {
    render(<Kbd>⌘K</Kbd>);
    const kbd = screen.getByText('⌘K');
    expect(kbd.tagName).toBe('KBD');
    expect(kbd).toHaveClass('hidden', 'sm:inline-flex');
  });
});

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('follows the default desktop (1280px) matchMedia mock', () => {
    expect(renderHook(() => useMediaQuery('(min-width: 1024px)')).result.current).toBe(true);
    expect(renderHook(() => useMediaQuery('(max-width: 767px)')).result.current).toBe(false);
    expect(renderHook(() => useMediaQuery('(prefers-color-scheme: dark)')).result.current).toBe(false);
  });

  it('returns the value of a matchMedia mock set by the test', () => {
    window.matchMedia = ((query: string) =>
      ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList) as typeof window.matchMedia;
    expect(renderHook(() => useMediaQuery('(max-width: 767px)')).result.current).toBe(true);
  });

  it('returns false when matchMedia is not a function', () => {
    // jsdom 기본 상태(matchMedia 없음)를 흉내낸다
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(renderHook(() => useMediaQuery('(min-width: 1024px)')).result.current).toBe(false);
  });
});
