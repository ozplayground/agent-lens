/** `cn()` 이 받는 값. 거짓 값은 건너뛴다 (`cond && 'class'` 형태를 그대로 넘길 수 있다). */
export type ClassValue = string | number | false | null | undefined;

/**
 * 클래스 이름을 공백으로 이어 붙인다. 빈 문자열·거짓 값은 뺀다.
 * Tailwind 클래스 충돌을 풀지는 않는다 — 공통 부품은 `className` 을 맨 뒤에 붙이고,
 * 색 클래스를 덮어쓰는 데 `className` 을 쓰지 않는다 (design-system 규칙).
 */
export function cn(...values: ClassValue[]): string {
  let out = '';
  for (const value of values) {
    if (!value && value !== 0) continue;
    const text = String(value).trim();
    if (!text) continue;
    out = out ? `${out} ${text}` : text;
  }
  return out;
}
