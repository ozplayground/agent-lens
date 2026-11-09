'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { MenuButton, type MenuItem } from './Menu';
import type { ButtonVariant } from './Button';

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: '라이트' },
  { mode: 'dark', label: '다크' },
  { mode: 'system', label: '시스템' },
];

export interface ThemeMenuProps {
  align?: 'start' | 'end';
  variant?: ButtonVariant;
  className?: string;
}

/** 테마 선택 메뉴: `MenuButton label="테마 선택"` + `menuitemradio` 3개(라이트·다크·시스템). */
export function ThemeMenu({ align = 'end', variant, className }: ThemeMenuProps) {
  const { theme, setTheme } = useTheme();
  const icon = theme === 'system' ? <Laptop /> : theme === 'dark' ? <Moon /> : <Sun />;
  const items: MenuItem[] = THEME_OPTIONS.map(({ mode, label }) => ({
    type: 'radio',
    label,
    checked: theme === mode,
    onSelect: () => setTheme(mode),
  }));

  return <MenuButton label="테마 선택" icon={icon} items={items} align={align} variant={variant} className={className} />;
}

export default ThemeMenu;
