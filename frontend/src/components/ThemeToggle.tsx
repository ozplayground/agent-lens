'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { IconButton } from '@/components/ui/IconButton';
import { ThemeMenu } from '@/components/ui/ThemeMenu';

export interface ThemeToggleProps {
  /** 추가 클래스 (색을 덮어쓰는 데 쓰지 않는다) */
  className?: string;
  /** 버튼 크기 변형. 모바일(<md)은 모두 44px 이상, md 이상 'sm' 32px · 'md' 36px · 'lg' 40px */
  size?: 'sm' | 'md' | 'lg';
  /** true 면 테마 선택 메뉴(라이트·다크·시스템)를 그린다. false 면 단일 버튼 순환 토글 */
  showDropdown?: boolean;
}

export default function ThemeToggle({ className = '', size = 'md', showDropdown = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  if (showDropdown) {
    return <ThemeMenu className={className} />;
  }

  const currentLabel =
    theme === 'system'
      ? '시스템 테마 (현재 ' + (resolvedTheme === 'dark' ? '다크' : '라이트') + ')'
      : theme === 'dark'
        ? '다크 모드'
        : '라이트 모드';

  const nextActionLabel =
    theme === 'light' ? '다크 모드로 전환' : theme === 'dark' ? '시스템 테마로 전환' : '라이트 모드로 전환';

  const icon = theme === 'system' ? <Laptop /> : theme === 'dark' ? <Moon /> : <Sun />;

  return (
    <IconButton
      label="테마 전환"
      title={`${currentLabel} - 클릭하여 ${nextActionLabel}`}
      icon={icon}
      variant="secondary"
      size={size}
      onClick={toggleTheme}
      className={className}
    />
  );
}
