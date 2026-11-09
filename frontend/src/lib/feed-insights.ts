import type { NewsItem } from '@/types/news';

/** 비교 키로 쓰는 끝 글자 수. backend 가 `{기술} 기반 구현에서 ` 접두를 붙인 변형도 같은 문장으로 끝난다. */
const INSIGHT_KEY_LENGTH = 40;
/** 이보다 짧은 시사점은 반복으로 보지 않는다. */
const INSIGHT_MIN_LENGTH = 20;

function normalize(text: unknown): string {
  return typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
}

/**
 * 현재 목록에서 같은 시사점 문장이 2번 이상 나온 기사 id.
 * `why_it_matters` 를 공백 정리(연속 공백 하나로, 앞뒤 제거)한 문자열의 끝 40자를 키로 센다.
 * 정리한 길이가 20자 미만이거나 비어 있으면 세지 않는다.
 */
export function findRepeatedInsights(items: NewsItem[]): Set<number> {
  const idsByKey = new Map<string, number[]>();
  for (const item of items) {
    const text = normalize(item.why_it_matters);
    if (text.length < INSIGHT_MIN_LENGTH) continue;
    // 서로게이트 쌍이 갈리지 않도록 코드 포인트 단위로 자른다.
    const key = Array.from(text).slice(-INSIGHT_KEY_LENGTH).join('');
    const ids = idsByKey.get(key);
    if (ids) ids.push(item.id);
    else idsByKey.set(key, [item.id]);
  }

  const repeated = new Set<number>();
  for (const ids of idsByKey.values()) {
    if (ids.length >= 2) ids.forEach((id) => repeated.add(id));
  }
  return repeated;
}
