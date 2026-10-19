import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme, ThemeMode } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

// Helper component to inspect context values
function TestConsumer() {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolvedTheme">{resolvedTheme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
      <button data-testid="set-dark-btn" onClick={() => setTheme('dark')}>Set Dark</button>
      <button data-testid="set-system-btn" onClick={() => setTheme('system')}>Set System</button>
      <button data-testid="set-light-btn" onClick={() => setTheme('light')}>Set Light</button>
    </div>
  );
}

describe('Global Theme System (Cycle 1 - TDD)', () => {
  let matchMediaListeners: Array<(e: MediaQueryListEvent) => void> = [];
  let matchesDark = false;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    matchMediaListeners = [];
    matchesDark = false;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: matchesDark,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((type: string, listener: any) => {
        if (type === 'change') matchMediaListeners.push(listener);
      }),
      removeEventListener: vi.fn((type: string, listener: any) => {
        if (type === 'change') {
          matchMediaListeners = matchMediaListeners.filter((l) => l !== listener);
        }
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with defaultTheme system and resolves OS preference', () => {
    matchesDark = true;
    render(
      <ThemeProvider defaultTheme="system">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('loads saved theme from localStorage if present', () => {
    localStorage.setItem('agentlens_theme', 'light');
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('cycles through light -> dark -> system -> light when toggleTheme is called', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');

    // Currently light
    expect(screen.getByTestId('theme').textContent).toBe('light');

    // 1st toggle: light -> dark
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('dark');
    expect(localStorage.getItem('agentlens_theme')).toBe('dark');

    // 2nd toggle: dark -> system
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(localStorage.getItem('agentlens_theme')).toBe('system');

    // 3rd toggle: system -> light
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light');
    expect(localStorage.getItem('agentlens_theme')).toBe('light');
  });

  it('updates resolvedTheme when OS theme changes in system mode', () => {
    matchesDark = false;
    render(
      <ThemeProvider defaultTheme="system">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light');

    // Simulate OS switching to dark mode
    act(() => {
      matchesDark = true;
      matchMediaListeners.forEach((l) => l({ matches: true } as MediaQueryListEvent));
    });

    expect(screen.getByTestId('resolvedTheme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('renders ThemeToggle button with proper aria-label and accessible title', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle size="md" />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /테마 전환/i });
    expect(button).toBeInTheDocument();

    // In light mode, clicking cycles to dark
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
