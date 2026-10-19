'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export interface ThemeToggleProps {
  /** 추가 Tailwind 커스텀 클래스 */
  className?: string;
  /** 버튼 크기 변형 ('sm': 28px, 'md': 32px, 'lg': 40px) */
  size?: 'sm' | 'md' | 'lg';
  /** 드롭다운 메뉴 사용 여부 (false일 경우 단일 버튼 순환 토글) */
  showDropdown?: boolean;
}

export default function ThemeToggle({
  className = '',
  size = 'md',
  showDropdown = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  const getLabel = () => {
    if (theme === 'system') return '시스템 테마 (현재 ' + (resolvedTheme === 'dark' ? '다크' : '라이트') + ')';
    if (theme === 'dark') return '다크 모드';
    return '라이트 모드';
  };

  const getNextActionLabel = () => {
    if (theme === 'light') return '다크 모드로 전환';
    if (theme === 'dark') return '시스템 테마로 전환';
    return '라이트 모드로 전환';
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`flex items-center justify-center rounded-md bg-white hover:bg-slate-100 dark:bg-[#161b22] dark:hover:bg-[#21262d] border border-slate-200 dark:border-[#30363d] text-slate-700 dark:text-[#f0f6fc] transition-colors shadow-xs cursor-pointer ${sizeClasses} ${className}`}
      title={`${getLabel()} - 클릭하여 ${getNextActionLabel()}`}
      aria-label="테마 전환"
    >
      {theme === 'system' ? (
        <Laptop className={`${iconSizes} text-blue-500 transition-transform`} />
      ) : theme === 'dark' ? (
        <Moon className={`${iconSizes} text-indigo-400 transition-transform hover:-rotate-12`} />
      ) : (
        <Sun className={`${iconSizes} text-amber-500 transition-transform hover:rotate-45`} />
      )}
    </button>
  );
}
