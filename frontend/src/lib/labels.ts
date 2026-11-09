/**
 * 카테고리·소스 표시 라벨. 화면의 카테고리 문구는 모두 이 모듈에서 나온다.
 * - 긴 라벨 `CATEGORY_LABELS`: 피드 필터 칩, 상세 배지, 소스 등록 선택지.
 * - 짧은 라벨 `CATEGORY_SHORT_LABELS`: 카드 머리줄, 챗 기사 칩, 인용 팝오버, 포커스 캡슐.
 * - 레이더 카테고리 라벨 `RADAR_CATEGORY_LABELS`: 트렌드 레이더 분포. 키는 레이더 응답의 영문 카테고리 이름이다.
 * 소스 `rss` 는 피드 필터의 화면 문구(`Global Blogs`)를 쓴다.
 * - `ALL_CATEGORY_LABEL`: 카테고리 '전체' 의 화면 문구. 피드 `전체 소식` 칩, 챗 포커스 캡슐 기본값, 포커스 시트 `all` 칩.
 * - 검색 범위 라벨 `SCOPE_LABELS`: 챗 모드 탭, 대화 목록 배지·접근 이름, 없는 기사 알림.
 * - 카드 통계 지표 표 `SOURCE_SCORE_METRICS`·`SCORE_METRIC_LABELS`·`COUNT_METRIC_LABELS`: 원천 점수는
 *   원천이 실제 지표를 주는 소스(GitHub 스타, HackerNews 포인트, Reddit 추천)만 그린다. GitHub 의 개수는 포크 수다.
 *   아이콘은 이 모듈에 두지 않는다 (React 를 모른다).
 */
import type { ScopeMode } from '@/types/chat';

export const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  harness: '하네스 & 벤치마크',
  mcp_plugins_skills: 'MCP & 생태계',
  agent_tech: '에이전트 아키텍처',
  ai_news: '최신 AI 동향',
};

export const CATEGORY_SHORT_LABELS: Readonly<Record<string, string>> = {
  harness: '하네스',
  mcp_plugins_skills: 'MCP',
  agent_tech: '에이전트',
  ai_news: 'AI 동향',
};

export const RADAR_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  'Harness & Benchmark': '하네스 & 벤치마크',
  'Protocols & Tooling': '프로토콜 & 도구',
  'Models & Reasoning': '모델 & 추론',
  'Infra & Runtime': '인프라 & 런타임',
};

export const SOURCE_LABELS: Readonly<Record<string, string>> = {
  rss_kr: '국내 테크',
  github: 'GitHub',
  hackernews: 'HackerNews',
  arxiv: 'arXiv',
  huggingface: 'HuggingFace',
  reddit: 'Reddit',
  rss: 'Global Blogs',
};

function lookup(table: Readonly<Record<string, string>>, id: string): string {
  return Object.prototype.hasOwnProperty.call(table, id) && table[id] ? table[id] : id;
}

/** 카테고리 id 의 긴 라벨 (필터 칩·상세 배지). 모르는 id 는 그대로 돌려준다. */
export function categoryLabel(id: string): string {
  return lookup(CATEGORY_LABELS, id);
}

/** 카테고리 id 의 짧은 라벨 (카드 머리줄·챗 칩). 모르는 id 는 그대로 돌려준다. */
export function categoryShortLabel(id: string): string {
  return lookup(CATEGORY_SHORT_LABELS, id);
}

/** 트렌드 레이더 카테고리 이름의 한국어 라벨. 모르는 이름은 그대로 돌려준다. */
export function radarCategoryLabel(name: string): string {
  return lookup(RADAR_CATEGORY_LABELS, name);
}

/** 소스 id 의 표시 라벨. 모르는 id 는 그대로 돌려준다. */
export function sourceLabel(id: string): string {
  return lookup(SOURCE_LABELS, id);
}

/** 카테고리 '전체' 의 화면 문구 (피드 칩, 챗 포커스 캡슐 기본값, 포커스 시트 칩). */
export const ALL_CATEGORY_LABEL = '전체 소식';

/** 검색 범위(scope) 라벨. `global` 은 카테고리 '전체' 와 같은 말을 쓴다. */
export const SCOPE_LABELS: Readonly<Record<ScopeMode, string>> = {
  scoped: '단일 기사',
  global: ALL_CATEGORY_LABEL,
};

/** 검색 범위의 화면 라벨 (`단일 기사`·`전체 소식`). */
export function scopeLabel(mode: ScopeMode): string {
  return SCOPE_LABELS[mode];
}

/** 카드 원천 점수의 지표 종류. */
export type ScoreMetric = 'stars' | 'points' | 'upvotes';

/** 원천이 실제 지표를 주는 소스만 둔다. 그 밖 소스의 `raw_score` 는 수집기가 만든 합성 값이다. */
export const SOURCE_SCORE_METRICS: Readonly<Record<string, ScoreMetric>> = {
  github: 'stars',
  hackernews: 'points',
  reddit: 'upvotes',
};

export const SCORE_METRIC_LABELS: Readonly<Record<ScoreMetric, string>> = {
  stars: '스타',
  points: '포인트',
  upvotes: '추천',
};

/** 소스의 원천 점수 지표. 표에 없는 소스(프로토타입 키 포함)는 `null` 이다. */
export function scoreMetric(source: string): ScoreMetric | null {
  return Object.prototype.hasOwnProperty.call(SOURCE_SCORE_METRICS, source)
    ? SOURCE_SCORE_METRICS[source]
    : null;
}

/** 카드 개수 통계(`comments_count`)의 종류. */
export type CountMetric = 'comments' | 'forks';

export const COUNT_METRIC_LABELS: Readonly<Record<CountMetric, string>> = {
  comments: '댓글',
  forks: '포크',
};

/** 소스의 개수 통계 종류. GitHub 의 `comments_count` 는 포크 수다. */
export function countMetric(source: string): CountMetric {
  return source === 'github' ? 'forks' : 'comments';
}
