#!/usr/bin/env node
/**
 * ui-audit — 폭별 화면 검증 (ui-redesign spec 설계 11.4).
 *
 * 실행 중인 앱(기본 http://localhost:3001)과 로컬 Chrome(CHROME_PATH)이 필요하다.
 * `make check` 에 들어가지 않는 수동 검사다. puppeteer-core 만 쓴다.
 *
 * 조합: 경로 `/`, `/chat` × 테마 light, dark × 뷰포트 5개.
 * 추가로 `/` 에서 대화상자 7종과 초기화 확인 창을 폭·테마마다 하나씩 열어 같은 측정을 한다.
 *
 * 측정
 *   R3 가로 넘침 없음      document.documentElement.scrollWidth <= innerWidth (모든 측정 상태: 기본·대화상자·탭·추가 상태)
 *   R4 헤더 한 줄          <header> 높이 <= 64, 자식들이 한 줄(세로 구간이 겹침)
 *   R5 첫 화면 카드        390x844: 첫 [data-feed-card] h3 이 화면 안, 1440x900: 첫 줄 카드 전체가 화면 안
 *   R6 터치 영역           768 미만에서 주요 조작 요소 >= 44x44 (마크다운 본문 링크 제외)
 *   R7 대화상자            role, aria-modal, aria-labelledby/aria-label, Escape 한 번에 맨 위만 닫힘
 *   R8 확대 허용           viewport 메타에 user-scalable=no 와 maximum-scale 없음
 *   R9 기능 위치           폭마다 spec 설계 9 의 진입점이 접근 이름으로 찾아짐 (더보기 메뉴 포함)
 *
 * 2차 판정 (spec 14.8, R29~R31). 측정 상태마다 checks.<이름> = { pass, targets, failures[] }
 *   clip          조작 요소·글자 요소가 부모 clip 상자 밖·화면 밖으로 나감, 말줄임 없는 글자 넘침
 *   placeholder   빈 입력의 자리표시가 입력 내용 폭보다 김 (canvas measureText)
 *   occluded      조작 요소의 가운데·네 모서리 안쪽 다섯 점이 다른 요소에 가려짐
 *   rowAlign      같은 줄 뉴스 카드의 h3 top·카드 높이 차, 머리줄 줄바꿈 (/, 768 이상)
 *   scrollRow     넘친 스크롤 줄의 data-overflow·흐림·스크롤 버튼, 1440 의 카테고리·소스 넘침
 *   ariaControls  aria-controls 가 문서에 없는 id 를 가리킴
 *   keepAll       두 줄 이상 한국어 글자의 word-break 가 keep-all 이 아님 (.markdown-viewer 밖)
 *   vRhythm       요약 바 → 검색 영역 → 필터 영역 첫 칩 줄, 마지막 칩 줄 → 목록 머리줄 세로 간격 12~16px (/, 보정 9)
 *   chatAlign     챗 사이드바 머리 영역·맥락 줄 아래 경계, 맥락 줄·메시지 열·입력 영역 왼쪽 끝 (/chat, 1024 이상)
 *   toast         챗 경고 알림이 입력 영역 바로 위, 메시지 열 안 (/chat?sourceId=999999999)
 * 보정 7 판정 (spec 14.15): toolbarLayout(보정 9 로 바뀜), cardMetric, chatScope, terms(보정 9 로 넓힘), modelPicker, focusLabels
 * 보정 9 판정 (spec 14.17, R42~R48)
 *   feedAreas     피드 세 영역: 검색 영역·필터 영역·목록 머리줄의 수·순서·겹침·높이·끝 맞춤·머리줄 한 줄 (/ 처음 상태)
 *   chatHeader    챗 헤더 첫 조작 요소가 '피드로 돌아가기' 링크이고 가장 왼쪽 (/chat 기본)
 *   pictograph    보이는 라벨·제목 글자의 그림 이모지 (/chat 기본·포커스 필터, 뉴스 상세 두 탭, 일일 브리핑)
 *   briefing      일일 브리핑 설정 진입 하나, 헤드라인 한 번, 분야 머리글이 긴 라벨 (일일 브리핑)
 *   cardFooter    카드 바닥 이관 버튼 글자 보임, 버튼 묶음이 카드 안, 통계 묶음과 겹치지 않음 (/ 처음 상태)
 * 측정 상태: / 와 /chat 기본, / 의 DIALOGS 9개(뉴스 상세는 탭 2개), / 레이더 펼침, /chat 포커스 필터 열림(보정 7),
 *            /chat?sourceId={첫 기사 id}, /chat?sourceId=999999999
 *
 * 출력: <out>/report.json, PNG (key: `/`·`/chat` × 5개 폭 × light·dark 20장 + 뉴스 상세·일일 브리핑 × 390x844·1440x900 light 4장,
 *       all: 모든 조합, none: 없음)
 * --self-test: 앱 없이 scripts/ui-audit-fixtures/*.html 로 판정 자체를 검증한다.
 * 종료 코드: 0 모두 통과, 1 실패 하나 이상, 2 사용법·환경 오류 (개발 서버 표시기 nextjs-portal 포함)
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const DEFAULT_BASE = 'http://localhost:3001';
const DEFAULT_OUT = path.join(REPO_ROOT, 'docs', 'qa-engineer', 'ui-audit');
const THEME_STORAGE_KEY = 'agentlens_theme';

const ROUTES = [
  { id: 'feed', path: '/' },
  { id: 'chat', path: '/chat' },
];
const THEMES = ['light', 'dark'];
const VIEWPORTS = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];
// 대표 스크린샷 (R31): 대화상자는 라이트 테마의 이 두 폭만 찍는다
const KEY_DIALOG_VIEWPORTS = new Set(['390x844', '1440x900']);
const KEY_DIALOG_SHOTS = { 'news-detail': 'detail', 'daily-briefing': 'briefing' };

const HEADER_MAX_HEIGHT = 64;
const TOUCH_MIN = 44;
const TOUCH_TOLERANCE = 0.5; // 서브픽셀 반올림 허용
const MENU_ROLES = ['menuitem', 'menuitemradio', 'menuitemcheckbox'];

// 2차 판정 기준값 (spec 14.8). 판정을 고칠 때 이 값을 느슨하게 바꾸지 않는다.
const K = {
  clipTolerance: 1, // 부모 상자·화면 밖, 글자 넘침 허용 (px)
  placeholderTolerance: 1, // 자리표시 너비 허용 (px)
  occludeInset: 4, // 다섯 점 중 모서리 점의 안쪽 거리 (px)
  rowGroupTolerance: 2, // 같은 줄 카드로 묶는 top 차 (px)
  rowAlignTolerance: 1, // 같은 줄 h3 top·카드 높이 허용 차 (px)
  rowAlignMinWidth: 768,
  scrollTolerance: 1, // scrollWidth > clientWidth + 1 이면 넘침
  scrollButtonMinWidth: 768, // 이 폭 이상에서 넘친 쪽 스크롤 버튼이 보여야 한다
  r14Width: 1440, // 이 폭 이상에서 아래 그룹은 넘치면 안 된다 (R14)
  r14Groups: ['카테고리', '소스'],
  vRhythmMin: 12,
  vRhythmMax: 16,
  vRhythmTolerance: 0.5, // 서브픽셀
  chatAlignTolerance: 1,
  chatAlignMinWidth: 1024,
  toastGapMax: 16,
  toastTolerance: 1,
  toastColumnMinWidth: 768, // 이 폭 이상에서 알림이 메시지 열 좌우 안에 있어야 한다
  touchMin: TOUCH_MIN, // R6 터치 영역 (위 상수와 같은 값, in-page 판정용)
  touchTolerance: TOUCH_TOLERANCE,
  maskWidth: 24, // 스크롤 줄 흐림 폭 = 스냅 여백(scroll-padding) = 선택 칩 보이기 여백 (ScrollRow 와 같은 값, spec 14.3 보정 3)
  maxFailures: 40, // 검사·상태마다 report 에 남기는 실패 수 (넘으면 truncated 로 센다)
};

// 모든 측정 상태에서 돌리는 검사
const STATE_CHECKS = ['clip', 'placeholder', 'occluded', 'scrollRow', 'ariaControls', 'keepAll'];
// 14.8 검사 전체 (self-test 는 모두 돌린다)
// 보정 7 (spec 14.15, R35~R40) 검사
const R7_CHECKS = ['toolbarLayout', 'cardMetric', 'chatScope', 'terms', 'modelPicker', 'focusLabels'];
// 보정 9 (spec 14.17, R42~R48) 새 검사
const R9_CHECKS = ['feedAreas', 'chatHeader', 'pictograph', 'briefing', 'cardFooter'];
const ALL_CHECKS = [...STATE_CHECKS, 'rowAlign', 'vRhythm', 'chatAlign', 'toast', ...R7_CHECKS, ...R9_CHECKS];

// 보정 7 기대값 (lib/labels.ts 와 같은 값. 바뀌면 함께 고친다)
const EXPECT7 = {
  // 소스 id → 화면 라벨 (lib/labels.ts SOURCE_LABELS). 카드 머리줄 둘째 조각으로 소스를 거꾸로 찾는다
  sourceLabels: { rss_kr: '국내 테크', github: 'GitHub', hackernews: 'HackerNews', arxiv: 'arXiv', huggingface: 'HuggingFace', reddit: 'Reddit', rss: 'Global Blogs' },
  // 원천 지표가 있는 소스와 그 점수 라벨 (R36)
  scoreMetricLabels: { github: '스타', hackernews: '포인트', reddit: '추천' },
  scoreLabels: ['점수', '스타', '포인트', '추천'],
  statLabels: ['점수', '스타', '포인트', '추천', '포크', '댓글', '인기 점수'],
  // 챗 포커스 필터 '도메인 카테고리' 칩 (R40: 피드 카테고리 칩과 같은 말·같은 순서)
  focusLabels: ['전체 소식', '하네스 & 벤치마크', 'MCP & 생태계', '에이전트 아키텍처', '최신 AI 동향'],
  scopeGlobalLabel: '전체 소식', // R38
  pagePadding: 16, // 768 미만 페이지 좌우 여백 (toolbarLayout: 보정 9 의 보이는 폭 식에 쓴다, EXPECT9 참고)
  minVisibleSourceChips: 2,
};

// 보정 9 기준값 (spec 14.17. lib/labels.ts 와 컴포넌트 토큰과 같은 값. 판정을 고칠 때 느슨하게 바꾸지 않는다)
const EXPECT9 = {
  wideMinWidth: 768, // 이 폭부터 입력·칩 토큰이 데스크톱 높이
  inputHeightNarrow: 44, // 검색 입력·정렬 (h-11)
  inputHeightWide: 36, // (md:h-9)
  chipHeightNarrow: 44, // 칩·Must-Read 토글 (h-11), feedAreas 기록용
  chipHeightWide: 32, // (md:h-8)
  edgeTolerance: 1, // 끝 맞춤·순서·겹침 허용 (px)
  heightTolerance: 0.5, // 높이 허용 (서브픽셀)
  // toolbarLayout 768 미만 소스 줄 보이는 폭 ≥ innerWidth − pagePadding(16) − 토글 간격 8 − touchMin(44) − 넘침 표시 16 − 1
  sourceToggleGap: 8,
  sourceEndHint: 16,
  searchName: '키워드 검색',
  sortName: '정렬',
  feedBackName: '피드로 돌아가기',
  handoverText: 'AI 챗에서 분석',
  handoverName: /챗에서 분석/.source,
  // IconGuard(frontend/src/tests/ui/IconGuard.test.ts)와 같은 판정식. 텍스트 표현 기호(©·↔ 등)는 걸리지 않는다
  pictographPattern: '\\p{Emoji_Presentation}|\\p{Extended_Pictographic}\\u{FE0F}',
  bannedTerms: ['Ask AI', '전용 AI 챗', '전용 챗'], // R45
  settingsWord: '설정', // briefing ①
  categoryPanelTab: '카테고리별 요약', // briefing ③
  // 피드 카테고리 칩의 긴 라벨 (lib/labels.ts, R19·R47)
  longCategoryLabels: ['하네스 & 벤치마크', 'MCP & 생태계', '에이전트 아키텍처', '최신 AI 동향'],
  // briefing ③ 에서 분야 머리글이 아닌 고정 머리글 (spec 은 '오늘의 핵심 요약' 만 적었다. Action Items 칸도 분야가 아니다)
  briefingFixedHeadings: ['오늘의 핵심 요약', '오늘의 추천 Action Items'],
};

const MISSING_SOURCE_ID = 999999999; // 없는 기사 → 챗 경고 알림
const FIXTURE_DIR = path.join(SCRIPT_DIR, 'ui-audit-fixtures');
const SELF_TEST_VIEWPORT = { width: 1440, height: 6000 };
// 768 미만 판정(넘친 쪽마다 표시, 표시 겹침)은 좁은 폭에서만 돈다. fixture 의 이 영역만 360 폭으로 잰다
const SELF_TEST_NARROW_VIEWPORT = { width: 360, height: 6000 };
const SELF_TEST_NARROW = '[data-self-test-narrow]';
// 두 폭 모두에서 보는 영역 (보정 5 숨은 Must-Read). 이 안의 data-expect 는 두 폭 모두에서 잡혀야 한다
const SELF_TEST_BOTH = '[data-self-test-both]';
const SELF_TEST_NARROW_CHECKS = ['clip', 'scrollRow', 'occluded'];
// 360 폭에서 [data-self-test-narrow] 영역만 보는 검사 (보정 7: 768 미만 판정, 두 폭 영역의 보정 5 툴바는 대상이 아니다)
const SELF_TEST_NARROW_ONLY_CHECKS = ['toolbarLayout', 'chatScope'];
// 1440 에서 [data-self-test-narrow] 밖을 재고, 360 에서 [data-self-test-narrow] 영역만 한 번 더 재는 검사 (보정 9: 768 미만 44px 판)
const SELF_TEST_NARROW_ALSO_CHECKS = ['feedAreas'];

const USAGE = `사용법: node scripts/ui-audit.mjs [옵션]

실행 중인 AgentLens 앱을 로컬 Chrome 으로 열어 폭·테마별 화면 규칙(R3~R9)과
spec 14.8 판정(clip, placeholder, occluded, rowAlign, scrollRow, ariaControls, keepAll,
vRhythm, chatAlign, toast)과 보정 7 판정(toolbarLayout, cardMetric, chatScope, terms,
modelPicker, focusLabels), 보정 9 판정(feedAreas, chatHeader, pictograph, briefing, cardFooter)을
측정한다. 프로덕션 빌드(pnpm build && pnpm start)를 대상으로 한다.

측정 상태: / 와 /chat 기본, / 의 대화상자 9개(뉴스 상세는 탭 2개), / 레이더 펼침,
/chat?sourceId={첫 기사 id}, /chat?sourceId=999999999, /chat 포커스 필터 열림 (보정 7)
  보정 7 검사: / 처음 상태 toolbarLayout(768 미만 판정)·cardMetric, /chat 기본 chatScope·terms·modelPicker,
              /chat 기사 칩·경고 알림 chatScope·terms, /chat 포커스 필터 열림 focusLabels·terms
  보정 9 검사: / 처음 상태 feedAreas·cardFooter·terms, /chat 기본 chatHeader·pictograph,
              /chat 포커스 필터 열림 pictograph, 뉴스 상세 두 탭 pictograph·terms, 일일 브리핑 pictograph·briefing
              (toolbarLayout·vRhythm 판정이 바뀌고 terms 는 Ask AI·전용 챗·전용 AI 챗 도 본다)

옵션
  --base <url>             앱 주소 (기본 ${DEFAULT_BASE})
  --out <dir>              결과 폴더 (기본 <저장소>/docs/qa-engineer/ui-audit)
  --commit <sha>           report.json environment.commit 에 남길 커밋 (기본 git rev-parse HEAD)
  --screenshots <mode>     key | all | none (기본 key)
                             key: / 와 /chat × 5개 폭 × light, dark 20장
                                  + 뉴스 상세·일일 브리핑 × 390x844, 1440x900 × light 4장
                             all: 대화상자·추가 상태를 포함한 모든 조합
  --routes <list>          feed,chat 중 일부만 (기본 모두)
  --themes <list>          light,dark 중 일부만 (기본 모두)
  --viewports <list>       예: 390x844,1440x900 (기본 360x780,390x844,768x1024,1024x768,1440x900)
  --skip-dialogs           / 의 대화상자 측정을 건너뛴다
  --timeout <ms>           페이지·요소 대기 시간 (기본 15000)
  --headful                Chrome 창을 띄운다 (디버깅용)
  --self-test              앱 없이 판정을 검증한다: scripts/ui-audit-fixtures 의
                             defects.html (data-expect 요소마다 그 검사가 실패해야 함),
                             clean.html (모든 검사가 대상이 있고 통과해야 함),
                             dev-indicator.html (개발 서버 환경 오류로 판정해야 함)
                           fixture 는 1440 폭으로 한 번, [data-self-test-narrow] 영역만 360 폭으로 한 번 더 연다
                           (768 미만 scrollRow 판정 — 넘친 쪽마다 넘침 표시, 표시와 줄 겹침 — 은 360 에서 돈다)
                           보정 7 의 toolbarLayout·chatScope 는 360 폭에서 [data-self-test-narrow] 영역만 본다
                           보정 9 의 feedAreas 는 1440 에서 그 영역 밖, 360 에서 그 영역을 본다
                           fixture 의 role="dialog" 는 data-self-test-dialog 로 '맨 위 대화상자' 판정에서 뺀다
                           셋 다 맞으면 종료 0, 하나라도 틀리면 1
  -h, --help               이 도움말

환경 변수
  CHROME_PATH              Chrome 실행 파일 경로 (없으면 흔한 설치 경로를 찾는다)

종료 코드: 0 모두 통과, 1 실패 하나 이상, 2 사용법·환경 오류
           (페이지에 nextjs-portal 이 있으면 개발 서버로 보고 2)
전제: 프로덕션 빌드 앱이 떠 있고, 수집된 기사가 있어야 R5·뉴스 상세·rowAlign 측정이 된다.
      기사·브리핑이 없으면 R3~R9 의 해당 항목은 skipped 에 남는다. vRhythm·chatAlign·toast 는
      대상이 없으면 '대상 없음' 실패다. 브리핑이 없으면 briefing·브리핑 pictograph 는 대화상자째 skipped 다.`;

class UsageError extends Error {}
class EnvironmentError extends UsageError {}

function parseList(value, allowed, label) {
  if (value === undefined) return [...allowed];
  const items = value.split(',').map((s) => s.trim()).filter(Boolean);
  for (const item of items) {
    if (!allowed.includes(item)) {
      throw new UsageError(`${label} 값이 잘못됐다: ${item} (가능: ${allowed.join(', ')})`);
    }
  }
  if (items.length === 0) throw new UsageError(`${label} 값이 비었다`);
  return items;
}

function parseViewports(value) {
  if (value === undefined) return VIEWPORTS;
  return value.split(',').map((s) => s.trim()).filter(Boolean).map((token) => {
    const m = /^(\d+)x(\d+)$/.exec(token);
    if (!m) throw new UsageError(`--viewports 형식이 잘못됐다: ${token} (예: 390x844)`);
    return { width: Number(m[1]), height: Number(m[2]) };
  });
}

export function parseCliArgs(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: false,
      strict: true,
      options: {
        base: { type: 'string' },
        out: { type: 'string' },
        screenshots: { type: 'string' },
        routes: { type: 'string' },
        themes: { type: 'string' },
        viewports: { type: 'string' },
        'skip-dialogs': { type: 'boolean' },
        timeout: { type: 'string' },
        headful: { type: 'boolean' },
        commit: { type: 'string' },
        'self-test': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (err) {
    throw new UsageError(err instanceof Error ? err.message : String(err));
  }
  const v = parsed.values;
  if (v.help) return { help: true };
  if (v['self-test']) return { help: false, selfTest: true, headful: Boolean(v.headful) };
  if (v.commit !== undefined && !/^[0-9a-f]{4,40}$/i.test(v.commit)) {
    throw new UsageError(`--commit 은 커밋 해시다: ${v.commit}`);
  }

  const screenshots = v.screenshots ?? 'key';
  if (!['key', 'all', 'none'].includes(screenshots)) {
    throw new UsageError(`--screenshots 는 key, all, none 중 하나다: ${screenshots}`);
  }
  let base = v.base ?? DEFAULT_BASE;
  try {
    base = new URL(base).origin;
  } catch {
    throw new UsageError(`--base 가 URL 이 아니다: ${base}`);
  }
  const timeout = v.timeout === undefined ? 15000 : Number(v.timeout);
  if (!Number.isFinite(timeout) || timeout <= 0) throw new UsageError(`--timeout 은 양수(ms)다: ${v.timeout}`);

  const routeIds = parseList(v.routes, ROUTES.map((r) => r.id), '--routes');
  return {
    help: false,
    selfTest: false,
    commit: v.commit ?? null,
    base,
    out: v.out ? path.resolve(process.cwd(), v.out) : DEFAULT_OUT,
    screenshots,
    routes: ROUTES.filter((r) => routeIds.includes(r.id)),
    themes: parseList(v.themes, THEMES, '--themes'),
    viewports: parseViewports(v.viewports),
    skipDialogs: Boolean(v['skip-dialogs']),
    timeout,
    headful: Boolean(v.headful),
  };
}

function findChrome() {
  if (process.env.CHROME_PATH) {
    if (!fs.existsSync(process.env.CHROME_PATH)) {
      throw new UsageError(`CHROME_PATH 가 가리키는 파일이 없다: ${process.env.CHROME_PATH}`);
    }
    return process.env.CHROME_PATH;
  }
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new UsageError('Chrome 을 찾지 못했다. CHROME_PATH 환경 변수로 실행 파일 경로를 준다.');
  return found;
}

// ---------------------------------------------------------------------------
// 공통 도우미
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function deviceOf(width) {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

const vpKey = (vp) => `${vp.width}x${vp.height}`;

function matchName(name, matcher) {
  if (typeof matcher === 'string') return name === matcher;
  return matcher.test(name);
}

function describeMatcher(matcher) {
  return typeof matcher === 'string' ? matcher : String(matcher);
}

function flattenAx(node, out = []) {
  if (!node) return out;
  out.push(node);
  for (const child of node.children ?? []) flattenAx(child, out);
  return out;
}

async function axNodes(page) {
  // interestingOnly 는 이름 있는 group(칩 묶음 등)을 빼므로 전체 트리를 본다 (display:none 은 어차피 빠진다).
  const root = await page.accessibility.snapshot({ interestingOnly: false });
  return flattenAx(root);
}

async function findAx(page, roles, matcher) {
  const roleList = Array.isArray(roles) ? roles : [roles];
  const nodes = await axNodes(page);
  return nodes.find((n) => roleList.includes(n.role) && typeof n.name === 'string' && matchName(n.name.trim(), matcher)) ?? null;
}

async function clickAx(page, roles, matcher) {
  const node = await findAx(page, roles, matcher);
  if (!node) return false;
  const handle = await node.elementHandle();
  if (!handle) return false;
  try {
    await handle.click();
  } catch {
    await handle.evaluate((el) => el.click());
  }
  await handle.dispose();
  return true;
}

// 아래 in-page 함수들은 page.evaluate 로 브라우저에서 돈다. 바깥 변수를 참조하지 않는다.

async function waitForDialogCount(page, predicate, expected, timeout) {
  try {
    await page.waitForFunction(
      (pred, n) => {
        const count = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].filter((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
        }).length;
        return pred === 'gt' ? count > n : count === n;
      },
      { timeout },
      predicate,
      expected,
    );
    return true;
  } catch {
    return false;
  }
}

async function waitForMenu(page, timeout) {
  try {
    await page.waitForSelector('[role="menu"]', { visible: true, timeout });
    return true;
  } catch {
    return false;
  }
}

async function closeAllOverlays(page) {
  for (let i = 0; i < 4; i += 1) {
    const open = await page.evaluate(() => {
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      };
      return [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="menu"]')].some(visible);
    });
    if (!open) return true;
    await page.keyboard.press('Escape');
    await sleep(250);
  }
  return false;
}

// ---------------------------------------------------------------------------
// 측정 (in-page)
// ---------------------------------------------------------------------------

function inPageMeasureBase(args) {
  const { routeId, viewport, touchMin, tolerance, headerMax } = args;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };

  // R3
  const de = document.documentElement;
  const R3 = { scrollWidth: de.scrollWidth, innerWidth: window.innerWidth };
  R3.pass = R3.scrollWidth <= R3.innerWidth;

  // R4: 대화상자 밖의 첫 보이는 <header>. 자식이 하나뿐인 감싸개는 안으로 내려간다.
  const header = [...document.querySelectorAll('header')].find(
    (h) => !h.closest('[role="dialog"], [role="alertdialog"]') && visible(h),
  );
  let R4;
  if (!header) {
    R4 = { pass: false, error: '<header> 없음' };
  } else {
    const isRowChild = (c) => {
      if (!visible(c)) return false;
      const r = c.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) return false; // sr-only
      const pos = getComputedStyle(c).position;
      return pos !== 'absolute' && pos !== 'fixed';
    };
    let container = header;
    let kids = [...container.children].filter(isRowChild);
    while (kids.length === 1 && kids[0].children.length > 0) {
      container = kids[0];
      kids = [...container.children].filter(isRowChild);
    }
    const rects = kids.map((k) => k.getBoundingClientRect());
    const maxTop = Math.max(...rects.map((r) => r.top));
    const minBottom = Math.min(...rects.map((r) => r.bottom));
    const height = header.getBoundingClientRect().height;
    R4 = {
      height,
      childCount: kids.length,
      offsetTops: kids.map((k) => k.offsetTop),
      oneLine: rects.length === 0 || maxTop < minBottom,
    };
    R4.pass = height <= headerMax && R4.oneLine;
  }

  // R5 (/ 만, 390x844·1440x900)
  let R5 = null;
  const cards = [...document.querySelectorAll('[data-feed-card]')].filter(visible);
  if (routeId === 'feed') {
    const vw = `${viewport.width}x${viewport.height}`;
    if (vw === '390x844' || vw === '1440x900') {
      if (cards.length === 0) {
        R5 = { skipped: true, reason: '[data-feed-card] 없음 (수집된 기사가 필요)' };
      } else if (vw === '390x844') {
        const h3 = cards[0].querySelector('h3');
        if (!h3) {
          R5 = { pass: false, error: '첫 카드에 h3 없음' };
        } else {
          const r = h3.getBoundingClientRect();
          R5 = { mode: 'first-title', top: r.top, bottom: r.bottom, innerHeight: window.innerHeight };
          R5.pass = r.top >= 0 && r.bottom <= window.innerHeight;
        }
      } else {
        const firstTop = cards[0].getBoundingClientRect().top;
        const row = cards.filter((c) => Math.abs(c.getBoundingClientRect().top - firstTop) < 2);
        const bottoms = row.map((c) => c.getBoundingClientRect().bottom);
        R5 = { mode: 'first-row', rowCount: row.length, top: firstTop, maxBottom: Math.max(...bottoms), innerHeight: window.innerHeight };
        R5.pass = firstTop >= 0 && R5.maxBottom <= window.innerHeight;
      }
    }
  }

  // R6 (768 미만): spec 1.9 의 주요 조작 요소
  let R6 = null;
  if (viewport.width < 768) {
    const selectors = [
      'header a[href]', 'header button', 'header input', 'header select',
      '[role="group"] button', '[role="group"] [aria-pressed]',
      '[role="tab"]',
      'select', 'input[type="search"]', 'input[type="text"]', 'input[type="url"]', 'input[type="email"]', 'input[type="password"]', 'textarea',
      '[data-feed-card] button', '[data-feed-card] a[href]',
      '[role="switch"]',
      '[role="radiogroup"] button', '[role="radiogroup"] [role="radio"]',
      'nav button', 'nav a[href]',
      'main button',
    ];
    const seen = new Set();
    const failures = [];
    let checked = 0;
    for (const el of document.querySelectorAll(selectors.join(','))) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (el.closest('[inert]') || el.closest('[aria-hidden="true"]')) continue;
      if (el.closest('[role="dialog"], [role="alertdialog"]')) continue; // 대화상자는 대화상자 측정에서 본다
      if (el.matches('.markdown-viewer a, .markdown-viewer a *')) continue; // 문장 속 링크 (WCAG 2.5.8 예외)
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue; // sr-only (건너뛰기 링크 등)
      checked += 1;
      if (r.width + tolerance < touchMin || r.height + tolerance < touchMin) {
        failures.push({
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role'),
          name: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim().slice(0, 60),
          width: Math.round(r.width * 10) / 10,
          height: Math.round(r.height * 10) / 10,
        });
      }
    }
    R6 = { checked, failures, pass: failures.length === 0 };
  }

  // R8
  const meta = document.querySelector('meta[name="viewport"]');
  const content = meta ? meta.getAttribute('content') || '' : '';
  const R8 = {
    content,
    userScalableNo: /user-scalable\s*=\s*(no|0)/i.test(content),
    maximumScale: /maximum-scale/i.test(content),
  };
  R8.pass = Boolean(meta) && !R8.userScalableNo && !R8.maximumScale;

  // 테마 적용 확인 (R2 참고값)
  const theme = {
    htmlClass: de.className,
    dataTheme: de.getAttribute('data-theme'),
    colorScheme: de.style.colorScheme,
  };

  return { R3, R4, R5, R6, R8, theme, cardCount: cards.length };
}

/** 열린 대화상자 중 맨 위(문서 순서 마지막)의 속성과 그 안의 조작 요소 크기. */
function inPageMeasureTopDialog(args) {
  const { measureTouch, touchMin, tolerance } = args;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].filter(visible);
  if (dialogs.length === 0) return null;
  dialogs.forEach((d, i) => d.setAttribute('data-audit-dialog', String(i)));
  const top = dialogs[dialogs.length - 1];

  const labelledby = top.getAttribute('aria-labelledby');
  const labelEl = labelledby ? document.getElementById(labelledby) : null;
  const ariaLabel = top.getAttribute('aria-label');
  const name = (labelEl ? labelEl.textContent : ariaLabel) || '';
  const attrs = {
    role: top.getAttribute('role'),
    ariaModal: top.getAttribute('aria-modal'),
    ariaLabelledby: labelledby,
    ariaLabel,
    name: name.trim().slice(0, 80),
    labelled: name.trim().length > 0,
    appShellInert: Boolean(document.getElementById('app-shell')?.hasAttribute('inert')),
    openCount: dialogs.length,
  };

  let touch = null;
  if (measureTouch) {
    const failures = [];
    let checked = 0;
    const sel = 'button, a[href], input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea, [role="tab"], [role="switch"], [role="menuitem"]';
    for (const el of top.querySelectorAll(sel)) {
      if (el.matches('.markdown-viewer a, .markdown-viewer a *')) continue;
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue;
      checked += 1;
      if (r.width + tolerance < touchMin || r.height + tolerance < touchMin) {
        failures.push({
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role'),
          name: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim().slice(0, 60),
          width: Math.round(r.width * 10) / 10,
          height: Math.round(r.height * 10) / 10,
        });
      }
    }
    touch = { checked, failures, pass: failures.length === 0 };
  }

  const de = document.documentElement;
  const overflow = { scrollWidth: de.scrollWidth, innerWidth: window.innerWidth };
  overflow.pass = overflow.scrollWidth <= overflow.innerWidth;

  return { attrs, touch, overflow };
}

function inPageEscapeResult(topIndex) {
  const marked = [...document.querySelectorAll('[data-audit-dialog]')];
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return el.isConnected && r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  // 닫힌 대화상자는 DOM 에서 빠지므로 맨 위 번호는 측정 때 센 값(topIndex)을 쓴다.
  const maxIndex = topIndex;
  const remaining = marked.filter(visible).map((el) => Number(el.getAttribute('data-audit-dialog')));
  marked.forEach((el) => el.removeAttribute('data-audit-dialog'));
  return { remaining, maxIndex };
}

function inPageMenuItemSizes(args) {
  const { touchMin, tolerance } = args;
  const failures = [];
  let checked = 0;
  for (const el of document.querySelectorAll('[role="menu"] [role^="menuitem"]')) {
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;
    checked += 1;
    if (r.width + tolerance < touchMin || r.height + tolerance < touchMin) {
      failures.push({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        name: (el.textContent || '').trim().slice(0, 60),
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10,
      });
    }
  }
  return { checked, failures };
}

/** R3 가로 넘침: document.documentElement.scrollWidth <= innerWidth (기본 상태·대화상자와 같은 기준). */
function inPageOverflow() {
  const de = document.documentElement;
  const r = { scrollWidth: de.scrollWidth, innerWidth: window.innerWidth };
  r.pass = r.scrollWidth <= r.innerWidth;
  return r;
}

/** 환경 판정 (R31): Next.js 개발 표시기가 있으면 개발 서버다. */
function inPageEnv() {
  return { devIndicator: Boolean(document.querySelector('nextjs-portal')) };
}

/**
 * spec 14.8 판정. names 의 검사만 돈다. 열린 대화상자가 있으면 맨 위 대화상자 안만 본다.
 * tag 가 참이면 실패한 요소에 data-audit-hit="<검사 이름…>" 을 단다 (self-test 용).
 * 대상 찾기는 plan '측정 훅 계약' 을 따른다. 수정 전 코드(속성 없음)에서도 scrollRow·clip·rowAlign·placeholder 가
 * 대상을 찾도록 대체 선택자를 둔다.
 */
function inPageChecks(args) {
  // scope·exclude 는 self-test 전용: scope 는 이 선택자 요소 안만, exclude 는 이 선택자 안을 뺀다
  // initialState: 사용자 조작 전 처음 상태(/ 기본 상태, self-test)일 때만 참. 툴바 Must-Read 증거는 이때만 본다
  // r7: 보정 7 기대값, chatState: /chat 측정 상태('base'|'source'|'toast'), chatScope 의 넘침 판정에 쓴다
  // r9: 보정 9 기대값 (EXPECT9)
  const { names, k, tag, scope = null, exclude = null, initialState = false, r7 = null, r9 = null, chatState = null } = args;
  const vw = window.innerWidth;
  const round = (n) => Math.round(n * 10) / 10;
  const rectOf = (r) => ({ left: round(r.left), top: round(r.top), right: round(r.right), bottom: round(r.bottom), width: round(r.width), height: round(r.height) });
  const CONTROL_SEL = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="tab"], [role="switch"], [role="menuitem"], [role="menuitemradio"]';
  const TEXT_INPUT_TYPES = ['', 'text', 'search', 'url', 'email', 'password', 'tel', 'number'];
  const HANGUL = /[ㄱ-ㆎ가-힣]/;

  const shown = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    if (typeof el.checkVisibility === 'function') return el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const srOnly = (r) => r.width <= 1 || r.height <= 1;
  const isScroll = (v) => v === 'auto' || v === 'scroll';
  // 계산된 색 문자열의 알파 (0~1). `transparent`, `/` 뒤 값, 쉼표 표기의 넷째 값, 16진 표기의 알파 자리를 읽는다.
  // 알파 자리가 없는 표기는 1, 읽을 수 없으면 null (칠한 것으로 본다). page.evaluate 안에서 돌므로 이 함수 안에 둔다
  const colorAlpha = (color) => {
    if (!color) return null;
    const s = color.trim().toLowerCase();
    if (s === 'transparent') return 0;
    const num = (t) => {
      const v = t.trim();
      if (v === 'none') return 0;
      const n = parseFloat(v);
      if (!Number.isFinite(n)) return null;
      return v.endsWith('%') ? n / 100 : n;
    };
    const hex = /^#([0-9a-f]+)$/.exec(s);
    if (hex) {
      const h = hex[1];
      if (h.length === 3 || h.length === 6) return 1;
      if (h.length === 4) return parseInt(h[3] + h[3], 16) / 255;
      if (h.length === 8) return parseInt(h.slice(6), 16) / 255;
      return null;
    }
    const fn = /^[a-z-]+\((.*)\)$/.exec(s);
    if (!fn) return null;
    const body = fn[1];
    if (body.includes('/')) return num(body.slice(body.lastIndexOf('/') + 1));
    if (body.includes(',')) {
      const parts = body.split(',');
      if (parts.length === 4) return num(parts[3]);
      if (parts.length === 3) return 1;
      return null;
    }
    return 1; // 공백 표기에 `/` 가 없으면 알파 1
  };

  // data-self-test-dialog: self-test fixture 의 대화상자 블록 (페이지 전체 판정을 그 안으로 좁히지 않는다)
  const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].filter((d) => shown(d) && !d.hasAttribute('data-self-test-dialog'));
  const topDialog = dialogs.length ? dialogs[dialogs.length - 1] : null;
  const root = topDialog ?? document.body;
  // scope 는 선택자 목록(쉼표)도 된다: 그 선택자 중 하나의 안에 있는 요소만 본다
  const inScope = (el) => (topDialog ? topDialog.contains(el) : !el.closest('[inert]'))
    && (!scope || Boolean(el.closest(scope)))
    && (!exclude || !el.closest(exclude));

  const pathOf = (el) => {
    const segs = [];
    for (let n = el; n && n.nodeType === 1 && n !== document.body && segs.length < 6; n = n.parentElement) {
      let seg = n.tagName.toLowerCase();
      if (n.id) seg += `#${n.id}`;
      const role = n.getAttribute('role');
      if (role) seg += `[role="${role}"]`;
      const label = n.getAttribute('aria-label');
      if (label) seg += `[aria-label="${label.slice(0, 40)}"]`;
      for (const attr of n.getAttributeNames()) {
        if (/^data-(feed-card|card-meta|scroll-row|insights-bar|feed-toolbar|feed-search|feed-list-header|toolbar-row|feed-status|must-read-toggle|chat-|composer|toast-region)/.test(attr)) seg += `[${attr}]`;
      }
      const parent = n.parentElement;
      if (parent && !n.id) {
        const same = [...parent.children].filter((c) => c.tagName === n.tagName);
        if (same.length > 1) seg += `:nth-of-type(${same.indexOf(n) + 1})`;
      }
      segs.unshift(seg);
    }
    return segs.join(' > ');
  };
  const nameOf = (el) => {
    const label = el.getAttribute('aria-label');
    if (label) return label.trim().slice(0, 60);
    const by = el.getAttribute('aria-labelledby');
    if (by) {
      const t = by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
      if (t) return t.replace(/\s+/g, ' ').slice(0, 60);
    }
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (text) return text.slice(0, 60);
    return (el.getAttribute('placeholder') || el.getAttribute('title') || '').slice(0, 60);
  };

  const results = {};
  for (const n of names) results[n] = { pass: true, targets: 0, failures: [], truncated: 0 };
  const fail = (check, el, reason, extra = {}) => {
    const res = results[check];
    if (res.failures.length < k.maxFailures) {
      res.failures.push(el ? { path: pathOf(el), name: nameOf(el), rect: rectOf(el.getBoundingClientRect()), reason, ...extra } : { reason, ...extra });
    } else {
      res.truncated += 1;
    }
    if (tag && el) {
      const prev = (el.getAttribute('data-audit-hit') || '').split(' ').filter(Boolean);
      if (!prev.includes(check)) el.setAttribute('data-audit-hit', [...prev, check].join(' '));
      // self-test 의 data-expect-reason 대조용: '검사:이유' 를 줄마다 남긴다
      const reasons = el.getAttribute('data-audit-reasons');
      el.setAttribute('data-audit-reasons', `${reasons ? `${reasons}\n` : ''}${check}:${reason}`);
    }
  };

  // 화면 표시 범위: 뷰포트와 overflow 가 visible 이 아닌 조상들의 안쪽 상자를 겹친 사각형
  const paddingBox = (a) => {
    const ar = a.getBoundingClientRect();
    const left = ar.left + a.clientLeft;
    const top = ar.top + a.clientTop;
    return { left, top, right: left + a.clientWidth, bottom: top + a.clientHeight };
  };

  // 범위 안 조작 요소와 글자 요소
  const controls = [...root.querySelectorAll(CONTROL_SEL)].filter((el) => inScope(el) && shown(el) && !srOnly(el.getBoundingClientRect()));
  const textEls = new Set();
  {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.nodeValue || !t.nodeValue.trim()) continue;
      const p = t.parentElement;
      if (!p || p.closest('script, style, noscript, template, svg, option')) continue;
      textEls.add(p);
    }
  }

  // ---- clip
  // 스크롤바가 보이는 스크롤 영역인지: CSS 로 숨기지 않았는지(scrollbar-width, ::-webkit-scrollbar) 로 본다.
  // headless Chrome 은 puppeteer 기본 인자 --hide-scrollbars 로 모든 스크롤바를 숨기므로 자리 차지(offsetHeight − clientHeight)로는 알 수 없다
  const scrollbarShown = (a, cs) => {
    if (cs.scrollbarWidth === 'none') return false;
    try {
      if (getComputedStyle(a, '::-webkit-scrollbar').display === 'none') return false;
    } catch {
      // 의사 요소 스타일을 읽지 못하면 scrollbar-width 만 본다
    }
    return true;
  };
  const reportedScroll = new Set(); // ④ 실패를 남긴 스크롤 영역 (그 안 요소마다 중복하지 않는다)
  if (results.clip) {
    const EXCLUDE = '.markdown-viewer pre, .markdown-viewer code, .markdown-viewer table';
    const candidates = new Set([...controls, ...[...textEls].filter((el) => inScope(el) && shown(el) && !srOnly(el.getBoundingClientRect()))]);
    for (const el of candidates) {
      if (el.closest(EXCLUDE)) continue;
      results.clip.targets += 1;
      const r = el.getBoundingClientRect();
      const tol = k.clipTolerance;
      let reported = false;
      let intended = false;
      // 스크롤 영역을 지나면 그 축의 요소 위치는 스크롤에 따라 바뀐다. 그 뒤로는 그 축에서 요소 rect 대신
      // 지나온 스크롤 영역의 rect 를 더 바깥 조상과 비교한다 (④). 중첩 스크롤이면 바깥 스크롤 영역으로 바꾼다
      let scrollX = null;
      let scrollY = null;
      // ① 조상 clip 상자 밖, ④ 스크롤 영역 상자의 잘림
      for (let a = el.parentElement; a && a !== document.documentElement && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        // 말줄임·line-clamp 조상이 자르는 것은 의도한 잘림이다 (그 조상은 ③ 이 본다)
        if (cs.textOverflow === 'ellipsis' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none')) {
          intended = true;
          break;
        }
        if (a.clientWidth < 1 || a.clientHeight < 1) {
          intended = true; // 접힌 영역
          break;
        }
        const box = paddingBox(a);
        const boxInfo = rectOf({ ...box, width: box.right - box.left, height: box.bottom - box.top });
        const ax = isScroll(cs.overflowX);
        const ay = isScroll(cs.overflowY);
        // 가로
        if (!scrollX) {
          // 가로는 scrollRow 가 본다. '스크롤바가 보이는 스크롤 영역' 면제는 768 이상(스크롤 버튼 기준 폭)에서만 준다.
          // 768 미만(모바일)과 macOS 기본 설정은 오버레이 스크롤바라 스크롤하기 전에는 스크롤바가 보이지 않는다
          const hExempt = a.hasAttribute('data-scroll-row') || (ax && vw >= k.scrollButtonMinWidth && scrollbarShown(a, cs));
          if (!hExempt && (r.left < box.left - tol || r.right > box.right + tol)) {
            fail('clip', el, '부모 상자 밖으로 가로 잘림', { by: pathOf(a), box: boxInfo });
            reported = true;
            break;
          }
        } else if (!ax && !scrollX.hasAttribute('data-scroll-row') && !reportedScroll.has(scrollX)) {
          const sr = scrollX.getBoundingClientRect();
          if (sr.left < box.left - tol || sr.right > box.right + tol) {
            reportedScroll.add(scrollX);
            fail('clip', scrollX, '스크롤 영역이 부모 상자 밖으로 가로 잘림', { by: pathOf(a), box: boxInfo });
          }
        }
        // 세로
        if (!scrollY) {
          if (!ay && (r.top < box.top - tol || r.bottom > box.bottom + tol)) {
            fail('clip', el, '부모 상자 밖으로 세로 잘림', { by: pathOf(a), box: boxInfo });
            reported = true;
            break;
          }
        } else if (!ay && !reportedScroll.has(scrollY)) {
          const sr = scrollY.getBoundingClientRect();
          if (sr.top < box.top - tol || sr.bottom > box.bottom + tol) {
            reportedScroll.add(scrollY);
            fail('clip', scrollY, '스크롤 영역이 부모 상자 밖으로 세로 잘림', { by: pathOf(a), box: boxInfo });
          }
        }
        if (ax) scrollX = a;
        if (ay) scrollY = a;
      }
      if (reported || intended) continue;
      const inHScroll = scrollX !== null;
      // ② 화면 밖 (가로 스크롤 영역 안은 제외)
      if (!inHScroll && (r.left < -tol || r.right > vw + tol)) {
        fail('clip', el, '화면 밖', { innerWidth: vw });
        continue;
      }
      // ③ 글자 넘침 (자기 글자가 있는 블록 요소)
      if (!textEls.has(el) || el.matches('input, textarea, select')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'inline' || cs.display === 'contents') continue;
      if (!isScroll(cs.overflowX) && el.scrollWidth > el.clientWidth + tol && cs.textOverflow !== 'ellipsis') {
        fail('clip', el, '글자 가로 넘침 (말줄임 없음)', { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth });
        continue;
      }
      if (!isScroll(cs.overflowY) && el.scrollHeight > el.clientHeight + tol && (!cs.webkitLineClamp || cs.webkitLineClamp === 'none')) {
        fail('clip', el, '글자 세로 넘침 (line-clamp 없음)', { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight });
      }
    }
  }

  // ---- placeholder
  if (results.placeholder) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    for (const el of root.querySelectorAll('input, textarea')) {
      if (el.tagName === 'INPUT' && !TEXT_INPUT_TYPES.includes((el.getAttribute('type') || '').toLowerCase())) continue;
      if (!inScope(el) || !shown(el) || srOnly(el.getBoundingClientRect())) continue;
      const ph = el.getAttribute('placeholder');
      if (!ph || el.value !== '') continue;
      const cs = getComputedStyle(el);
      const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (el.tagName === 'TEXTAREA') {
        // 한 줄 입력만 본다: 내용 높이가 두 줄보다 작은 textarea
        const lh = cs.lineHeight === 'normal' ? parseFloat(cs.fontSize) * 1.2 : parseFloat(cs.lineHeight);
        const innerH = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        if (innerH >= lh * 2 - 1) continue;
      }
      results.placeholder.targets += 1;
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const width = ctx.measureText(ph).width;
      if (width > avail + k.placeholderTolerance) {
        fail('placeholder', el, '자리표시가 입력 내용 폭보다 김', { placeholder: ph, textWidth: round(width), available: round(avail) });
      }
    }
  }

  // ---- occluded
  // 입력(input·textarea)의 rect 안, 안쪽 여백(padding) 영역에만 놓인 요소인지
  const isAdornment = (el, r, hit) => {
    if (!el.matches('input, textarea')) return false;
    const cs = getComputedStyle(el);
    const hr = (hit.closest(CONTROL_SEL) ?? hit).getBoundingClientRect();
    const inside = hr.left >= r.left - 1 && hr.right <= r.right + 1 && hr.top >= r.top - 1 && hr.bottom <= r.bottom + 1;
    const contentLeft = r.left + el.clientLeft + parseFloat(cs.paddingLeft);
    const contentRight = r.left + el.clientLeft + el.clientWidth - parseFloat(cs.paddingRight);
    return inside && (hr.right <= contentLeft + 1 || hr.left >= contentRight - 1);
  };
  if (results.occluded) {
    for (const el of controls) {
      const r = el.getBoundingClientRect();
      // 보이는 범위(뷰포트 ∩ clip 조상) 안에 다 들어온 요소만 본다. 일부만 보이는 것은 clip·scrollRow 몫이다
      let vis = { left: 0, top: 0, right: vw, bottom: window.innerHeight };
      for (let a = el.parentElement; a && a !== document.documentElement && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const b = paddingBox(a);
        vis = { left: Math.max(vis.left, b.left), top: Math.max(vis.top, b.top), right: Math.min(vis.right, b.right), bottom: Math.min(vis.bottom, b.bottom) };
      }
      const tol = k.clipTolerance;
      if (r.left < vis.left - tol || r.top < vis.top - tol || r.right > vis.right + tol || r.bottom > vis.bottom + tol) continue;
      results.occluded.targets += 1;
      const ix = Math.min(k.occludeInset, r.width / 2 - 0.5);
      const iy = Math.min(k.occludeInset, r.height / 2 - 0.5);
      const points = [
        [r.left + r.width / 2, r.top + r.height / 2],
        [r.left + ix, r.top + iy],
        [r.right - ix, r.top + iy],
        [r.left + ix, r.bottom - iy],
        [r.right - ix, r.bottom - iy],
      ];
      for (const [x, y] of points) {
        const hit = document.elementFromPoint(x, y);
        if (!hit) continue;
        // 자기·자손이면 보임, 조상이면 둥근 모서리 밖으로 빠진 점이다. 그 밖(형제·다른 레이어)이면 가려짐
        if (hit === el || el.contains(hit) || hit.contains(el)) continue;
        // 알림(토스트)은 잠깐 떠서 내용 위에 놓이도록 만든 레이어다. 위치는 toast 검사가 본다
        if (hit.closest('[data-toast-region]')) continue;
        // 입력 안쪽 여백에 올린 보조 버튼(토큰 보기·지우기 등)은 글자 영역을 가리지 않는다
        if (isAdornment(el, r, hit)) continue;
        fail('occluded', el, '다른 요소에 가려짐', { point: [round(x), round(y)], by: pathOf(hit) });
        break;
      }
    }
  }

  // ---- scrollRow
  // 줄의 선택 칩 선택자: 줄이 data-selected-selector 를 가지면 그것, 아니면 앱 규칙대로 고른다
  // (소스 줄은 data-source-chip 칩만 — Must-Read 제외, 탭 줄은 aria-selected 탭, 그 밖은 aria-pressed 칩)
  const selectedSelectorOf = (row) => {
    const own = row.getAttribute('data-selected-selector');
    if (own) return own;
    if (row.querySelector('[data-source-chip]')) return '[data-source-chip][aria-pressed="true"]';
    if (row.querySelector('[role="tab"]')) return '[role="tab"][aria-selected="true"]';
    return '[aria-pressed="true"]';
  };
  if (results.scrollRow) {
    const rows = new Set([...root.querySelectorAll('[data-scroll-row]')]);
    for (const g of root.querySelectorAll('[role="group"]')) {
      if (isScroll(getComputedStyle(g).overflowX)) rows.add(g);
    }
    for (const row of rows) {
      if (!inScope(row) || !shown(row)) continue;
      results.scrollRow.targets += 1;
      const cs = getComputedStyle(row);
      const tol = k.scrollTolerance;
      const label = row.getAttribute('aria-label') || '';
      const overflow = row.scrollWidth > row.clientWidth + tol;
      const hiddenStart = row.scrollLeft > tol;
      const hiddenEnd = row.scrollLeft + row.clientWidth < row.scrollWidth - tol;
      const actual = !overflow ? 'none' : hiddenStart && hiddenEnd ? 'both' : hiddenStart ? 'start' : 'end';
      const attr = row.getAttribute('data-overflow');
      const mask = [cs.maskImage, cs.webkitMaskImage].find((m) => m && m !== 'none') || 'none';
      const info = { scrollWidth: row.scrollWidth, clientWidth: row.clientWidth, scrollLeft: round(row.scrollLeft), dataOverflow: attr, actual, mask: mask === 'none' ? 'none' : 'set' };
      if (overflow && (attr === null || attr === 'none' || attr !== actual)) {
        fail('scrollRow', row, attr === null ? '넘치는데 data-overflow 가 없음' : `data-overflow="${attr}" 가 실제(${actual})와 다름`, info);
      } else if (!overflow && attr !== null && attr !== 'none') {
        fail('scrollRow', row, `넘치지 않는데 data-overflow="${attr}"`, info);
      }
      if (!overflow && mask !== 'none') fail('scrollRow', row, '넘치지 않는데 mask-image 가 있음', info);
      if (overflow && vw >= k.scrollButtonMinWidth) {
        const scope = row.parentElement ?? row;
        const btn = (suffix) => [...scope.querySelectorAll('button[aria-label]')].find((b) => {
          const l = b.getAttribute('aria-label');
          return !row.contains(b) && l.endsWith(suffix) && (!label || l.startsWith(label)) && shown(b);
        });
        if (hiddenStart && !btn('이전 항목 보기')) fail('scrollRow', row, '앞쪽이 넘쳤는데 이전 스크롤 버튼이 보이지 않음', info);
        if (hiddenEnd && !btn('다음 항목 보기')) fail('scrollRow', row, '뒤쪽이 넘쳤는데 다음 스크롤 버튼이 보이지 않음', info);
      }
      if (overflow && vw >= k.r14Width && k.r14Groups.includes(label)) {
        fail('scrollRow', row, `${vw}px 에서 '${label}' 그룹이 넘침 (R14)`, info);
      }
      const box = paddingBox(row);
      const rr = row.getBoundingClientRect();
      // (보정 3) 흐림 폭 = 스냅 여백: 계산된 scroll-padding-left/right 가 24px 여야 한다
      const spl = parseFloat(cs.scrollPaddingLeft);
      const spr = parseFloat(cs.scrollPaddingRight);
      if (spl !== k.maskWidth || spr !== k.maskWidth) {
        fail('scrollRow', row, `scroll-padding 이 ${k.maskWidth}px 가 아님 (left ${cs.scrollPaddingLeft}, right ${cs.scrollPaddingRight})`, info);
      }
      // 선택 칩이 줄 보이는 상자에서 넘친 쪽 흐림 24px 를 뺀 범위 안에 다 들어와야 한다
      // (R15 '선택된 칩 전체가 흐림 밖에 보이게', 처음 상태. 선택자는 줄의 data-selected-selector, 없으면 대체 순서)
      const selected = row.querySelector(selectedSelectorOf(row));
      if (selected && shown(selected)) {
        const cr = selected.getBoundingClientRect();
        const minLeft = box.left + (hiddenStart ? k.maskWidth : 0);
        const maxRight = box.right - (hiddenEnd ? k.maskWidth : 0);
        if (cr.left < minLeft - tol || cr.right > maxRight + tol) {
          fail('scrollRow', row, `선택 칩이 흐림 ${k.maskWidth}px 를 뺀 보이는 범위 밖`, {
            ...info,
            selected: nameOf(selected),
            selectedRect: rectOf(cr),
            visibleRange: { left: round(minLeft), right: round(maxRight) },
          });
        }
      }
      // (보정 3) 768 미만 넘침 표시: 넘친 쪽마다 같은 감싸개 안에 그쪽 표시가 보이고, 넘치지 않은 쪽에는 없고, 줄과 겹치지 않는다
      if (vw < k.scrollButtonMinWidth) {
        const wrap = row.parentElement ?? row;
        const hints = (side) => [...wrap.querySelectorAll(`[data-overflow-hint="${side}"]`)].filter((h) => !row.contains(h) && shown(h));
        const leftHints = hints('start');
        const rightHints = hints('end');
        const okStart = leftHints.some((h) => h.getBoundingClientRect().right <= rr.left + tol);
        const okEnd = rightHints.some((h) => h.getBoundingClientRect().left >= rr.right - tol);
        if (hiddenStart && !okStart) fail('scrollRow', row, '768 미만: 왼쪽이 넘쳤는데 줄 왼쪽에 넘침 표시가 보이지 않음', info);
        if (hiddenEnd && !okEnd) fail('scrollRow', row, '768 미만: 오른쪽이 넘쳤는데 줄 오른쪽에 넘침 표시가 보이지 않음', info);
        if (!hiddenStart && leftHints.length) fail('scrollRow', row, '768 미만: 넘치지 않은 왼쪽에 넘침 표시가 있음', info);
        if (!hiddenEnd && rightHints.length) fail('scrollRow', row, '768 미만: 넘치지 않은 오른쪽에 넘침 표시가 있음', info);
        for (const h of [...leftHints, ...rightHints]) {
          const hr = h.getBoundingClientRect();
          const ox = Math.min(hr.right, rr.right) - Math.max(hr.left, rr.left);
          const oy = Math.min(hr.bottom, rr.bottom) - Math.max(hr.top, rr.top);
          if (ox > tol && oy > tol) {
            fail('scrollRow', row, `768 미만: 넘침 표시(${h.getAttribute('data-overflow-hint')})가 줄과 ${round(ox)}px 겹침`, { ...info, hint: rectOf(hr), row: rectOf(rr) });
          }
        }
      }
    }
    // (보정 5, R34) 피드 툴바의 Must-Read 토글이 첫 화면에 다 보이는지. 처음 상태에서 소스 그룹이 있는 [data-feed-toolbar] 마다 본다
    for (const toolbar of initialState ? document.querySelectorAll('[data-feed-toolbar]') : []) {
      if (!inScope(toolbar) || !shown(toolbar) || !toolbar.querySelector('[role="group"][aria-label="소스"]')) continue;
      const toggles = [...toolbar.querySelectorAll('[data-must-read-toggle]')];
      const toggle = toggles.length === 1 ? toggles[0] : null;
      const tr = toggle ? toggle.getBoundingClientRect() : null;
      const tb = toolbar.getBoundingClientRect();
      const tol = k.clipTolerance;
      const why = [];
      if (toggles.length !== 1) why.push(`토글 ${toggles.length}개`);
      if (toggle) {
        if (toggle.closest('[role="group"][aria-label="소스"]')) why.push('소스 그룹 안');
        if (!shown(toggle)) why.push('보이지 않음');
        if (tr.left < -tol || tr.right > vw + tol) why.push('화면 밖');
        if (tr.left < tb.left - tol || tr.right > tb.right + tol || tr.top < tb.top - tol || tr.bottom > tb.bottom + tol) why.push('툴바 상자 밖');
        const hit = document.elementFromPoint(tr.left + tr.width / 2, tr.top + tr.height / 2);
        if (!hit || !(hit === toggle || toggle.contains(hit))) why.push('가운데 점이 토글이 아님');
        if (vw < k.scrollButtonMinWidth && (tr.width + k.touchTolerance < k.touchMin || tr.height + k.touchTolerance < k.touchMin)) {
          why.push(`터치 영역 ${round(tr.width)}×${round(tr.height)} < ${k.touchMin}`);
        }
      }
      const mustReadVisible = why.length === 0;
      results.scrollRow.toolbar = { viewport: vw, mustReadVisible, mustReadRect: tr ? rectOf(tr) : null };
      results.scrollRow.targets += 1;
      if (!mustReadVisible) fail('scrollRow', toolbar, `Must-Read 토글이 첫 화면에 다 보이지 않음 (${why.join(', ')})`, { mustReadRect: tr ? rectOf(tr) : null, toolbar: rectOf(tb) });
    }
  }

  // ---- ariaControls
  if (results.ariaControls) {
    const els = [...root.querySelectorAll('[aria-controls]')];
    if (root !== document.body && root.hasAttribute('aria-controls')) els.unshift(root);
    for (const el of els) {
      if (!inScope(el)) continue;
      results.ariaControls.targets += 1;
      const ids = (el.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean);
      const missing = ids.filter((id) => !document.getElementById(id));
      if (missing.length) fail('ariaControls', el, '문서에 없는 id 를 가리킴', { missing });
    }
  }

  // ---- keepAll
  if (results.keepAll) {
    const failed = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.nodeValue || !HANGUL.test(t.nodeValue)) continue;
      const p = t.parentElement;
      if (!p || failed.has(p) || p.closest('.markdown-viewer, code, pre, kbd, samp, script, style, noscript, template, svg, option')) continue;
      if (!inScope(p) || !shown(p) || srOnly(p.getBoundingClientRect())) continue;
      const range = document.createRange();
      range.selectNodeContents(t);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0).sort((a, b) => a.top - b.top);
      let lines = 0;
      let lastBottom = -Infinity;
      for (const r of rects) {
        if (r.top >= lastBottom - 2) {
          lines += 1;
          lastBottom = r.bottom;
        } else {
          lastBottom = Math.max(lastBottom, r.bottom);
        }
      }
      if (lines < 2) continue;
      results.keepAll.targets += 1;
      const wb = getComputedStyle(p).wordBreak;
      if (wb !== 'keep-all') {
        failed.add(p);
        fail('keepAll', p, `두 줄 이상 한국어 글자의 word-break 가 ${wb}`, { lines });
      }
    }
  }

  // ---- rowAlign
  if (results.rowAlign) {
    const cards = [...document.querySelectorAll('[data-feed-card]')].filter(shown);
    results.rowAlign.targets = cards.length;
    if (cards.length === 0) {
      fail('rowAlign', null, '대상 없음: [data-feed-card]');
    } else {
      const tol = k.rowAlignTolerance;
      const sorted = cards.map((c) => ({ c, r: c.getBoundingClientRect() })).sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left);
      const rows = [];
      for (const item of sorted) {
        const row = rows.find((rw) => Math.abs(rw[0].r.top - item.r.top) <= k.rowGroupTolerance);
        if (row) row.push(item);
        else rows.push([item]);
      }
      for (const row of rows) {
        if (row.length < 2) continue;
        const h3Tops = row.map(({ c }) => c.querySelector('h3')?.getBoundingClientRect().top ?? null);
        const heights = row.map(({ r }) => r.height);
        const validTops = h3Tops.filter((t) => t !== null);
        const minTop = Math.min(...validTops);
        const minH = Math.min(...heights);
        row.forEach(({ c }, i) => {
          if (h3Tops[i] === null) fail('rowAlign', c, '카드에 h3 없음');
          else if (h3Tops[i] - minTop > tol) fail('rowAlign', c, `같은 줄 h3 top 차 ${round(h3Tops[i] - minTop)}px`, { h3Tops: h3Tops.map((t) => (t === null ? null : round(t))) });
          if (heights[i] - minH > tol) fail('rowAlign', c, `같은 줄 카드 높이 차 ${round(heights[i] - minH)}px`, { heights: heights.map(round) });
        });
      }
      // 머리줄 줄바꿈: 자식들의 세로 구간이 한 점에서 겹치지 않으면 두 줄 이상이다
      for (const c of cards) {
        const meta = c.querySelector('[data-card-meta]');
        if (!meta) continue;
        const kids = [...meta.children].filter((ch) => shown(ch) && !srOnly(ch.getBoundingClientRect()) && !['absolute', 'fixed'].includes(getComputedStyle(ch).position));
        if (kids.length < 2) continue;
        const rs = kids.map((ch) => ch.getBoundingClientRect());
        const maxTop = Math.max(...rs.map((x) => x.top));
        const minBottom = Math.min(...rs.map((x) => x.bottom));
        if (maxTop >= minBottom) fail('rowAlign', c, '머리줄([data-card-meta])이 줄바꿈됨', { childTops: rs.map((x) => round(x.top)) });
      }
    }
  }

  // ---- vRhythm (R20, 보정 9 세 간격): 요약 바 → [data-feed-search], [data-feed-search] → 필터 영역 첫 [data-toolbar-row],
  // 마지막 [data-toolbar-row] → [data-feed-list-header]. 각 영역은 앞 영역 뒤(DOM 순서)의 첫 요소다
  if (results.vRhythm) {
    const pick = (sel) => [...document.querySelectorAll(sel)].find((e) => shown(e) && inScope(e)) ?? null;
    const after = (prev, sel) => (prev
      ? [...document.querySelectorAll(sel)].find((e) => shown(e) && inScope(e) && !prev.contains(e) && (prev.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)) ?? null
      : pick(sel));
    const bar = pick('[data-insights-bar]');
    const search = after(bar, '[data-feed-search]');
    const toolbar = after(search ?? bar, '[data-feed-toolbar]');
    const header = after(toolbar ?? search ?? bar, '[data-feed-list-header]');
    const missing = [['[data-insights-bar]', bar], ['[data-feed-search]', search], ['[data-feed-toolbar]', toolbar], ['[data-feed-list-header]', header]].filter(([, e]) => !e).map(([s]) => s);
    if (missing.length) {
      fail('vRhythm', null, `대상 없음: ${missing.join(', ')}`);
    } else {
      results.vRhythm.targets = 3;
      const rows = [...toolbar.querySelectorAll('[data-toolbar-row]')].filter(shown);
      const first = (rows[0] ?? toolbar).getBoundingClientRect();
      const last = (rows[rows.length - 1] ?? toolbar).getBoundingClientRect();
      const sr = search.getBoundingClientRect();
      const gaps = [
        { el: search, label: '요약 바 → 검색 영역', gap: sr.top - bar.getBoundingClientRect().bottom },
        { el: rows[0] ?? toolbar, label: '검색 영역 → 필터 영역 첫 칩 줄', gap: first.top - sr.bottom },
        { el: header, label: '필터 영역 마지막 칩 줄 → 목록 머리줄', gap: header.getBoundingClientRect().top - last.bottom },
      ];
      results.vRhythm.gaps = gaps.map((g) => ({ label: g.label, gap: round(g.gap) }));
      for (const g of gaps) {
        if (g.gap < k.vRhythmMin - k.vRhythmTolerance || g.gap > k.vRhythmMax + k.vRhythmTolerance) {
          fail('vRhythm', g.el, `${g.label} 간격 ${round(g.gap)}px (${k.vRhythmMin}~${k.vRhythmMax})`, { gap: round(g.gap), toolbarRows: rows.length });
        }
      }
    }
  }

  // ---- chatAlign
  if (results.chatAlign) {
    const pick = (sel) => [...document.querySelectorAll(sel)].find((e) => shown(e) && inScope(e)) ?? null;
    const head = pick('[data-chat-sidebar-head]');
    const bar = pick('[data-chat-context-bar]');
    const col = pick('[data-chat-column]');
    const comp = pick('[data-composer]');
    const missing = [['[data-chat-sidebar-head]', head], ['[data-chat-context-bar]', bar], ['[data-chat-column]', col], ['[data-composer]', comp]].filter(([, e]) => !e).map(([s]) => s);
    if (missing.length) {
      fail('chatAlign', null, `대상 없음: ${missing.join(', ')}`);
    } else {
      results.chatAlign.targets = 4;
      const tol = k.chatAlignTolerance;
      const hb = head.getBoundingClientRect().bottom;
      const bb = bar.getBoundingClientRect().bottom;
      if (Math.abs(hb - bb) > tol) fail('chatAlign', head, `사이드바 머리 영역 아래 경계 ${round(hb)} ≠ 맥락 줄 아래 경계 ${round(bb)}`, { diff: round(hb - bb) });
      const firstCtl = [...bar.querySelectorAll(CONTROL_SEL)].find((e) => shown(e) && !srOnly(e.getBoundingClientRect())) ?? bar;
      // 첫 조작 요소가 칠해진 상자(배경·테두리)를 가진 복합 위젯(세그먼트 토글 등) 안에 있으면 눈에 보이는 왼쪽 끝은 그 상자다
      const painted = (n) => {
        const cs = getComputedStyle(n);
        const bg = cs.backgroundColor;
        const alpha = colorAlpha(bg);
        const hasBg = alpha === null ? true : alpha > 0; // 알파를 읽지 못하면 칠한 것으로 본다
        return hasBg || parseFloat(cs.borderLeftWidth) > 0 || (cs.boxShadow && cs.boxShadow !== 'none');
      };
      let edgeEl = firstCtl;
      for (let n = firstCtl.parentElement; n && n !== bar && bar.contains(n); n = n.parentElement) {
        if (n.matches('[role="group"], [role="radiogroup"], [role="tablist"], [role="toolbar"]') && painted(n)) edgeEl = n;
      }
      const lefts = [
        { el: edgeEl, label: edgeEl === firstCtl ? '맥락 줄 첫 조작 요소' : '맥락 줄 첫 조작 요소의 위젯 상자', left: edgeEl.getBoundingClientRect().left },
        { el: col, label: '메시지 열', left: col.getBoundingClientRect().left },
        { el: comp, label: '입력 영역', left: comp.getBoundingClientRect().left },
      ];
      const minLeft = Math.min(...lefts.map((l) => l.left));
      if (Math.max(...lefts.map((l) => l.left)) - minLeft > tol) {
        for (const l of lefts) {
          if (l.left - minLeft > tol) fail('chatAlign', l.el, `${l.label} 왼쪽 끝이 ${round(l.left - minLeft)}px 어긋남`, { lefts: lefts.map((x) => ({ label: x.label, left: round(x.left) })) });
        }
      }
    }
  }

  // ---- toast
  if (results.toast) {
    const pick = (sel) => [...document.querySelectorAll(sel)].find((e) => shown(e) && inScope(e)) ?? null;
    const toasts = [...document.querySelectorAll('[data-toast-region] [role="status"], [data-toast-region] [role="alert"]')].filter(shown);
    const comp = pick('[data-composer]');
    const col = pick('[data-chat-column]');
    const missing = [];
    if (!toasts.length) missing.push('[data-toast-region] 안 알림');
    if (!comp) missing.push('[data-composer]');
    if (vw >= k.toastColumnMinWidth && !col) missing.push('[data-chat-column]');
    if (missing.length) {
      fail('toast', null, `대상 없음: ${missing.join(', ')}`);
    } else {
      const cr = comp.getBoundingClientRect();
      for (const t of toasts) {
        results.toast.targets += 1;
        const tr = t.getBoundingClientRect();
        const info = { toast: rectOf(tr), composer: rectOf(cr), column: col ? rectOf(col.getBoundingClientRect()) : null };
        if (tr.bottom > cr.top + k.toastTolerance) fail('toast', t, '알림 아래 끝이 입력 영역 위 끝보다 아래', info);
        else if (cr.top - tr.bottom > k.toastGapMax) fail('toast', t, `알림과 입력 영역 간격 ${round(cr.top - tr.bottom)}px > ${k.toastGapMax}px`, info);
        if (vw >= k.toastColumnMinWidth) {
          const lr = col.getBoundingClientRect();
          if (tr.left < lr.left - k.toastTolerance || tr.right > lr.right + k.toastTolerance) fail('toast', t, '알림이 메시지 열 좌우 밖', info);
        }
      }
    }
  }


  // ---- 보정 7 공통 도우미
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('').replace(/\s+/g, ' ').trim();
  const accName = (el) => {
    const label = el.getAttribute('aria-label');
    if (label) return label.trim();
    const by = el.getAttribute('aria-labelledby');
    if (by) return by.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').replace(/\s+/g, ' ').trim();
    if (el.labels && el.labels.length) return [...el.labels].map((l) => l.textContent).join(' ').replace(/\s+/g, ' ').trim();
    return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  };
  // 줄의 보이는 범위: 패딩 상자에서 넘친 쪽 흐림을 뺀 가로 범위, 화면으로 자름
  const visibleRange = (row) => {
    const b = paddingBox(row);
    const tolS = k.scrollTolerance;
    const hs = row.scrollLeft > tolS;
    const he = row.scrollLeft + row.clientWidth < row.scrollWidth - tolS;
    return { left: Math.max(0, b.left + (hs ? k.maskWidth : 0)), right: Math.min(vw, b.right - (he ? k.maskWidth : 0)) };
  };

  // ---- toolbarLayout (R35, 보정 9 판정): / 처음 상태. 768 미만 판정, 768 이상은 기록만.
  // 소스 줄 보이는 폭·흐림 밖 칩 2개, Must-Read 토글이 소스 줄과 같은 줄이고 오른쪽 끝이 콘텐츠 끝, 필터 영역 안 select·검색 입력 없음
  if (results.toolbarLayout && r7) {
    const toolbars = [...document.querySelectorAll('[data-feed-toolbar]')].filter((t) => inScope(t) && shown(t) && t.querySelector('[role="group"][aria-label="소스"]'));
    if (toolbars.length === 0) fail('toolbarLayout', null, '대상 없음: 소스 그룹이 있는 [data-feed-toolbar]');
    for (const tb of toolbars) {
      results.toolbarLayout.targets += 1;
      if (vw >= k.scrollButtonMinWidth) {
        results.toolbarLayout.rows = [...tb.querySelectorAll('[data-scroll-row], [role="group"]')].filter((r) => shown(r) && r.getAttribute('aria-label')).map((r) => {
          const range = visibleRange(r);
          const chips = [...r.querySelectorAll('button')].filter((c) => { const cr = c.getBoundingClientRect(); return shown(c) && cr.left >= range.left - k.clipTolerance && cr.right <= range.right + k.clipTolerance; });
          return { label: r.getAttribute('aria-label'), viewport: vw, rowWidth: round(r.getBoundingClientRect().width), fullyVisibleChips: chips.length };
        });
        continue;
      }
      const src = tb.querySelector('[role="group"][aria-label="소스"]');
      const sr = src.getBoundingClientRect();
      const visibleWidth = Math.min(sr.right, vw) - Math.max(sr.left, 0);
      const range = visibleRange(src);
      let chips = [...src.querySelectorAll('[data-source-chip]')];
      if (!chips.length) chips = [...src.querySelectorAll('button')];
      const fully = chips.filter((c) => { const cr = c.getBoundingClientRect(); return shown(c) && cr.left >= range.left - k.clipTolerance && cr.right <= range.right + k.clipTolerance; });
      const toggle = tb.querySelector('[data-must-read-toggle]');
      const tr = toggle ? toggle.getBoundingClientRect() : null;
      // 콘텐츠 상자 = 필터 영역 부모(프로덕션 main)의 rect − padding (spec 14.17)
      const box = tb.parentElement;
      const bcs = getComputedStyle(box);
      const contentRight = box.getBoundingClientRect().right - parseFloat(bcs.paddingRight);
      const minWidth = vw - r7.pagePadding - (r9 ? r9.sourceToggleGap : 8) - k.touchMin - (r9 ? r9.sourceEndHint : 16) - 1;
      const info = { viewport: vw, visibleWidth: round(visibleWidth), minWidth, fullyVisibleChips: fully.length, toggleTop: tr ? round(tr.top) : null, toggleRight: tr ? round(tr.right) : null, contentRight: round(contentRight), sourceTop: round(sr.top), sourceBottom: round(sr.bottom) };
      results.toolbarLayout.source = info;
      const tolE = r9 ? r9.edgeTolerance : 1;
      if (visibleWidth < minWidth) fail('toolbarLayout', src, `768 미만: 소스 줄 보이는 폭 ${round(visibleWidth)} < ${minWidth}`, info);
      if (fully.length < r7.minVisibleSourceChips) fail('toolbarLayout', src, `768 미만: 흐림 밖에 다 보이는 소스 칩 ${fully.length}개 < ${r7.minVisibleSourceChips}`, info);
      if (!toggle) {
        fail('toolbarLayout', tb, '768 미만: Must-Read 토글 없음', info);
      } else {
        const mid = (tr.top + tr.bottom) / 2;
        if (mid < sr.top || mid > sr.bottom) fail('toolbarLayout', toggle, `768 미만: Must-Read 토글이 소스 줄과 다른 줄 (토글 세로 가운데 ${round(mid)}, 소스 줄 ${round(sr.top)}~${round(sr.bottom)})`, info);
        if (Math.abs(tr.right - contentRight) > tolE) fail('toolbarLayout', toggle, `768 미만: Must-Read 토글 오른쪽 끝 ${round(tr.right)} ≠ 콘텐츠 오른쪽 끝 ${round(contentRight)}`, info);
      }
      for (const el of tb.querySelectorAll('select, input[type="search"]')) {
        fail('toolbarLayout', el, `768 미만: 필터 영역([data-feed-toolbar]) 안에 ${el.tagName === 'SELECT' ? 'select' : '검색 입력'}`, info);
      }
    }
  }

  // ---- cardMetric (R36): 보이는 카드마다 점수·개수 통계의 종류
  if (results.cardMetric && r7) {
    const reverse = Object.fromEntries(Object.entries(r7.sourceLabels).map(([id, label]) => [label, id]));
    const summary = { cards: 0, bySource: {} };
    for (const card of document.querySelectorAll('[data-feed-card]')) {
      if (!inScope(card) || !shown(card)) continue;
      results.cardMetric.targets += 1;
      summary.cards += 1;
      let source = card.getAttribute('data-source');
      if (!source) {
        const meta = card.querySelector('[data-card-meta]');
        const piece = meta ? (meta.textContent || '').split('·')[1] : undefined;
        source = piece ? reverse[piece.replace(/\s+/g, ' ').trim()] ?? `?${piece.trim()}` : '?';
      }
      // 통계: data-card-stat 이 있으면 그것, 없으면 sr-only 글자가 통계 라벨인 요소의 부모
      let stats = [...card.querySelectorAll('[data-card-stat]')].map((el) => ({ el, label: (el.querySelector('.sr-only')?.textContent || el.getAttribute('data-metric') || '').trim() }));
      if (!stats.length) {
        stats = [...card.querySelectorAll('.sr-only')].filter((s) => r7.statLabels.includes((s.textContent || '').trim())).map((s) => ({ el: s.parentElement, label: s.textContent.trim() }));
      }
      const scores = stats.filter((x) => r7.scoreLabels.includes(x.label));
      const counts = stats.filter((x) => x.label === '포크' || x.label === '댓글');
      // 인기 점수 통계: data-card-stat="hotness", 없으면 sr-only '인기 점수' 의 부모 (보정 8, R41)
      const hotness = stats.filter((x) => x.el.getAttribute('data-card-stat') === 'hotness' || x.label === '인기 점수');
      const bs = (summary.bySource[source] ??= { cards: 0, scoreShown: 0, hotnessShown: 0 });
      bs.cards += 1;
      if (scores.length) bs.scoreShown += 1;
      if (hotness.length) bs.hotnessShown += 1;
      const want = r7.scoreMetricLabels[source];
      for (const x of scores) {
        if (x.label === '점수') fail('cardMetric', x.el, `종류 없는 '점수' 라벨 (소스 ${source})`, { source });
        if (!want) fail('cardMetric', x.el, `원천 지표가 없는 소스(${source})에 점수 통계 '${x.label}'`, { source });
        else if (x.label !== want) fail('cardMetric', x.el, `${source} 점수 라벨이 '${want}' 가 아님 ('${x.label}')`, { source });
      }
      if (source === 'github') {
        for (const x of counts) if (x.label !== '포크') fail('cardMetric', x.el, `github 개수 통계가 '포크' 가 아님 ('${x.label}')`, { source });
      }
      // ⑤ (보정 8, R41) 원천 지표가 없는 소스 카드에 인기 점수가 있으면 실패
      if (!want) for (const x of hotness) fail('cardMetric', x.el, `원천 지표가 없는 소스(${source})에 인기 점수`, { source });
    }
    results.cardMetric.summary = summary;
  }

  // ---- chatScope (R37): 스코프 두 탭이 맥락 줄 보이는 범위·화면 안
  if (results.chatScope && r7) {
    const groups = [...root.querySelectorAll('[role="group"][aria-label="검색 스코프 모드"]')].filter((g) => inScope(g) && shown(g));
    if (groups.length === 0) fail('chatScope', null, '대상 없음: 그룹 검색 스코프 모드');
    for (const g of groups) {
      results.chatScope.targets += 1;
      const row = g.closest('[data-chat-context-bar]')?.querySelector('[data-scroll-row]') ?? null;
      const range = row ? visibleRange(row) : { left: 0, right: vw };
      for (const btn of [...g.querySelectorAll('button')].slice(0, 2)) {
        const br = btn.getBoundingClientRect();
        if (br.left < -k.clipTolerance || br.right > vw + k.clipTolerance) fail('chatScope', btn, '스코프 탭이 화면 밖', { rect: rectOf(br) });
        else if (br.left < range.left - k.clipTolerance || br.right > range.right + k.clipTolerance) fail('chatScope', btn, `스코프 탭이 맥락 줄 보이는 범위(흐림 ${k.maskWidth}px 제외) 밖`, { rect: rectOf(br), range: { left: round(range.left), right: round(range.right) } });
      }
      if (row && (chatState === 'base' || chatState === 'toast')) {
        const ov = row.getAttribute('data-overflow');
        if (ov !== 'none') fail('chatScope', row, `기사 칩이 없는데 맥락 줄 data-overflow="${ov}" (none 이어야 함)`, { scrollWidth: row.scrollWidth, clientWidth: row.clientWidth });
      }
    }
  }

  // ---- terms (R38): 영어·다른 말 (사용자 글 면제)
  if (results.terms && r7) {
    const exempt = (el) => el.closest('.markdown-viewer, input, textarea, [role="log"], [data-chat-messages]')
      || [...(function* up(n) { for (let x = n; x && x !== document.body; x = x.parentElement) yield x; })(el)].some((x) => x.hasAttribute('title') && x.getAttribute('title').trim() === (x.textContent || '').replace(/\s+/g, ' ').trim());
    const seen = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const p = t.parentElement;
      if (!p || seen.has(p) || !t.nodeValue.trim()) continue;
      seen.add(p);
      if (p.closest('script, style, noscript, template, svg, option') || !inScope(p) || !shown(p) || exempt(p)) continue;
      results.terms.targets += 1;
      const text = ownText(p);
      let why = null;
      if (text === 'Scoped' || text === 'Global') why = `영어 라벨 '${text}'`;
      else if (text.includes('(Scoped)') || text.includes('(Global)')) why = `영어 괄호 라벨 '${text}'`;
      else if (text.startsWith('Focus:')) why = `영어 앞말 '${text}'`;
      else if (text.includes('코퍼스')) why = `'코퍼스' 용어 '${text.slice(0, 40)}'`;
      if (why) fail('terms', p, why);
    }
    for (const g of root.querySelectorAll('[role="group"][aria-label="검색 스코프 모드"]')) {
      if (!inScope(g) || !shown(g)) continue;
      const second = g.querySelectorAll('button')[1];
      if (second && accName(second) !== r7.scopeGlobalLabel) fail('terms', second, `global 탭 접근 이름이 '${r7.scopeGlobalLabel}' 가 아님 ('${accName(second)}')`);
    }
    // (보정 9, R45) 보이는 조작 요소의 접근 이름·보이는 글자에 Ask AI·전용 AI 챗·전용 챗
    if (r9) {
      for (const el of root.querySelectorAll('button, a, [role="tab"]')) {
        if (!inScope(el) || !shown(el) || srOnly(el.getBoundingClientRect()) || exempt(el)) continue;
        results.terms.targets += 1;
        const name = accName(el);
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        const term = r9.bannedTerms.find((t) => name.includes(t) || text.includes(t));
        if (term) fail('terms', el, `금지 용어 '${term}' (접근 이름 '${name.slice(0, 40)}', 글자 '${text.slice(0, 40)}')`, { term });
      }
    }
  }

  // ---- modelPicker (R39): 보이는 'Claude 모델 선택' 버튼 정확히 1개, 질문 입력창 아래
  if (results.modelPicker && r7) {
    results.modelPicker.targets = 1;
    const all = [...root.querySelectorAll('button[aria-label^="Claude 모델 선택"]')].filter((b) => inScope(b));
    const btns = all.filter((b) => shown(b) && !srOnly(b.getBoundingClientRect()));
    if (btns.length !== 1) {
      if (btns.length === 0) fail('modelPicker', null, '보이는 Claude 모델 선택 버튼이 없음');
      for (const b of btns) fail('modelPicker', b, `보이는 Claude 모델 선택 버튼이 ${btns.length}개 (1개여야 함)`, { hiddenSkipped: all.length - btns.length });
    } else {
      const b = btns[0];
      const areas = [...root.querySelectorAll('textarea')].filter((ta) => inScope(ta) && shown(ta) && accName(ta).startsWith('질문 입력'));
      // 버튼보다 DOM 앞에 있는 입력창 중 마지막 (없으면 첫 입력창)
      const before = areas.filter((ta) => ta.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      const ta = before[before.length - 1] ?? areas[0] ?? null;
      if (!ta) fail('modelPicker', b, '대상 없음: 질문 입력창');
      else if (b.getBoundingClientRect().top < ta.getBoundingClientRect().bottom - k.clipTolerance) {
        fail('modelPicker', b, `모델 선택이 질문 입력창 아래가 아님 (top ${round(b.getBoundingClientRect().top)} < 입력창 bottom ${round(ta.getBoundingClientRect().bottom)})`);
      }
    }
  }

  // ---- focusLabels (R40): 포커스 필터 '도메인 카테고리' 칩 글자 목록
  if (results.focusLabels && r7) {
    const groups = [...root.querySelectorAll('[role="group"][aria-label="도메인 카테고리"]')].filter((g) => inScope(g) && shown(g));
    if (groups.length === 0) fail('focusLabels', null, '대상 없음: 그룹 도메인 카테고리');
    for (const g of groups) {
      results.focusLabels.targets += 1;
      const labels = [...g.querySelectorAll('button')].map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim());
      if (JSON.stringify(labels) !== JSON.stringify(r7.focusLabels)) fail('focusLabels', g, `칩 라벨 ${JSON.stringify(labels)} ≠ ${JSON.stringify(r7.focusLabels)}`, { labels });
    }
  }

  // ---- 보정 9 (spec 14.17) 공통 도우미
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const visibleBox = (el) => shown(el) && !srOnly(el.getBoundingClientRect());
  const contentBoxOf = (box) => {
    const r = box.getBoundingClientRect();
    const cs = getComputedStyle(box);
    return { left: r.left + parseFloat(cs.paddingLeft), right: r.right - parseFloat(cs.paddingRight), top: r.top + parseFloat(cs.paddingTop), bottom: r.bottom - parseFloat(cs.paddingBottom) };
  };
  // title 이 글자와 같은 요소(사용자 글) 안인지 (terms 면제와 같은 규칙)
  const titledUserText = (el) => {
    for (let x = el; x && x !== document.body; x = x.parentElement) {
      if (x.hasAttribute('title') && x.getAttribute('title').trim() === norm(x.textContent)) return true;
    }
    return false;
  };

  // ---- feedAreas (R42): / 처음 상태. 필터 영역([data-feed-toolbar])의 부모(콘텐츠 상자)마다 세 영역을 본다
  if (results.feedAreas && r9) {
    const toolbars = [...document.querySelectorAll('[data-feed-toolbar]')].filter((t) => inScope(t) && shown(t));
    if (toolbars.length === 0) fail('feedAreas', null, '대상 없음: [data-feed-toolbar]');
    const wide = vw >= r9.wideMinWidth;
    const inputH = wide ? r9.inputHeightWide : r9.inputHeightNarrow;
    const tolE = r9.edgeTolerance;
    const tolH = r9.heightTolerance;
    for (const box of new Set(toolbars.map((t) => t.parentElement))) {
      results.feedAreas.targets += 1;
      const toolbar = toolbars.find((t) => t.parentElement === box);
      const content = contentBoxOf(box);
      const searchAreas = [...box.querySelectorAll('[data-feed-search]')];
      const headers = [...box.querySelectorAll('[data-feed-list-header]')];
      const searchArea = searchAreas.find(shown) ?? null;
      const header = headers.find(shown) ?? null;
      const search = [...box.querySelectorAll('input')].find((i) => shown(i) && (i.type === 'search' || accName(i) === r9.searchName)) ?? null;
      const sort = [...box.querySelectorAll('select, [role="combobox"]')].find((x) => shown(x) && accName(x) === r9.sortName) ?? null;
      const toggle = toolbar.querySelector('[data-must-read-toggle]');
      const rows = [...toolbar.querySelectorAll('[data-toolbar-row]')].filter(shown);
      const groups = [...toolbar.querySelectorAll('[role="group"]')].filter(shown);
      const cat = groups.find((g) => g.getAttribute('aria-label') === '카테고리') ?? null;
      const src = groups.find((g) => g.getAttribute('aria-label') === '소스') ?? null;
      const R = (el) => (el ? el.getBoundingClientRect() : null);
      const [sr, so, tg, hd] = [R(search), R(sort), R(toggle), R(header)];
      results.feedAreas.layout = { viewport: vw, content: { left: round(content.left), right: round(content.right) }, search: sr && rectOf(sr), sort: so && rectOf(so), toggle: tg && rectOf(tg), header: hd && rectOf(hd) };
      // ① 영역 수, 검색·정렬 위치
      if (searchAreas.length !== 1) fail('feedAreas', box, `① [data-feed-search] ${searchAreas.length}개 (1개여야 함)`);
      if (headers.length !== 1) fail('feedAreas', box, `① [data-feed-list-header] ${headers.length}개 (1개여야 함)`);
      if (!search) fail('feedAreas', box, `① 검색 입력(${r9.searchName}) 없음`);
      else if (!search.closest('[data-feed-search]')) fail('feedAreas', search, '① 검색 입력이 [data-feed-search] 밖');
      for (const el of toolbar.querySelectorAll('input[type="search"], select')) fail('feedAreas', el, `① [data-feed-toolbar] 안에 ${el.tagName === 'SELECT' ? 'select' : '검색 입력'}`);
      if (!sort) fail('feedAreas', box, `① 정렬(${r9.sortName}) 없음`);
      else if (!sort.closest('[data-feed-list-header]')) fail('feedAreas', sort, '① 정렬이 [data-feed-list-header] 밖');
      // ② 순서: 검색(영역, 없으면 입력) → 필터 영역 첫 칩 줄, 마지막 칩 줄 → 목록 머리줄
      const firstRow = R(rows[0] ?? toolbar);
      const lastRow = R(rows[rows.length - 1] ?? toolbar);
      const searchEl = searchArea ?? search;
      if (searchEl && R(searchEl).bottom > firstRow.top + tolE) fail('feedAreas', searchEl, `② 검색 bottom ${round(R(searchEl).bottom)} > 필터 영역 첫 칩 줄 top ${round(firstRow.top)} + ${tolE}`);
      if (header && lastRow.bottom > hd.top + tolE) fail('feedAreas', header, `② 필터 영역 마지막 칩 줄 bottom ${round(lastRow.bottom)} > 목록 머리줄 top ${round(hd.top)} + ${tolE}`);
      // ③ 검색 입력과 칩 그룹의 세로 겹침
      if (search) {
        for (const g of groups) {
          const gr = g.getBoundingClientRect();
          const ov = Math.min(sr.bottom, gr.bottom) - Math.max(sr.top, gr.top);
          if (ov > tolE) fail('feedAreas', search, `③ 검색 입력이 칩 그룹(${g.getAttribute('aria-label') ?? ''})과 세로 ${round(ov)}px 겹침`);
        }
      }
      // ④ 높이
      if (search && Math.abs(sr.height - inputH) > tolH) fail('feedAreas', search, `④ 검색 입력 높이 ${round(sr.height)} ≠ ${inputH}`);
      if (sort && Math.abs(so.height - inputH) > tolH) fail('feedAreas', sort, `④ 정렬 높이 ${round(so.height)} ≠ ${inputH}`);
      const chip = src ? ([...src.querySelectorAll('[data-source-chip]')].find(shown) ?? [...src.querySelectorAll('button')].find(shown) ?? null) : null;
      if (toggle && chip && Math.abs(tg.height - chip.getBoundingClientRect().height) > tolH) {
        fail('feedAreas', toggle, `④ Must-Read 토글 높이 ${round(tg.height)} ≠ 소스 칩 높이 ${round(chip.getBoundingClientRect().height)}`);
      }
      // ⑤ 끝 맞춤
      const edge = (el, value, target, what) => {
        if (el && Math.abs(value - target) > tolE) fail('feedAreas', el, `⑤ ${what} ${round(value)} ≠ 콘텐츠 ${round(target)}`, { content: { left: round(content.left), right: round(content.right) } });
      };
      if (search) {
        edge(search, sr.left, content.left, '검색 입력 왼쪽 끝');
        edge(search, sr.right, content.right, '검색 입력 오른쪽 끝');
      }
      if (header) edge(header, hd.left, content.left, '목록 머리줄 왼쪽 끝');
      if (sort) edge(sort, so.right, content.right, '정렬 오른쪽 끝');
      if (toggle) edge(toggle, tg.right, content.right, 'Must-Read 토글 오른쪽 끝');
      if (wide) {
        if (!cat) fail('feedAreas', toolbar, '⑤ 카테고리 그룹 없음');
        else edge(cat, cat.getBoundingClientRect().left, content.left, '카테고리 그룹 왼쪽 끝');
      }
      // ⑥ 목록 머리줄 한 줄
      if (header && sort && hd.height > so.height + tolE) fail('feedAreas', header, `⑥ 목록 머리줄 높이 ${round(hd.height)} > 정렬 높이 ${round(so.height)} + ${tolE} (두 줄)`);
    }
  }

  // ---- chatHeader (R43): /chat 기본. 헤더의 보이는 첫 조작 요소가 '피드로 돌아가기' 링크이고 가장 왼쪽
  if (results.chatHeader && r9) {
    const all = [...root.querySelectorAll('header')].filter((h) => inScope(h) && shown(h) && !h.parentElement?.closest('header'));
    // 앱에서는 첫 header (/chat 은 ChatHeader 하나), self-test 에서는 범위 안 header 모두
    const headers = scope || exclude ? all : all.slice(0, 1);
    if (headers.length === 0) fail('chatHeader', null, '대상 없음: header');
    for (const h of headers) {
      results.chatHeader.targets += 1;
      const ctrls = [...h.querySelectorAll('a[href], button')].filter(visibleBox);
      const link = ctrls.find((e) => e.tagName === 'A' && accName(e) === r9.feedBackName) ?? null;
      const order = ctrls.slice(0, 6).map((e) => accName(e).slice(0, 30));
      if (!link) {
        fail('chatHeader', h, `'${r9.feedBackName}' 링크 없음`, { order });
        continue;
      }
      if (ctrls[0] !== link) fail('chatHeader', ctrls[0], `헤더 첫 조작 요소가 '${accName(ctrls[0]).slice(0, 30)}' ('${r9.feedBackName}' 링크가 아님)`, { order });
      const lr = link.getBoundingClientRect();
      const others = ctrls.filter((e) => e !== link).map((e) => e.getBoundingClientRect().left);
      const minLeft = others.length ? Math.min(...others) : Infinity;
      if (lr.left > minLeft + r9.edgeTolerance) fail('chatHeader', link, `'${r9.feedBackName}' 링크 왼쪽 끝 ${round(lr.left)} 이 다른 조작 요소 왼쪽 끝 ${round(minLeft)} 보다 오른쪽`, { order });
    }
  }

  // ---- pictograph (R44): 보이는 라벨·제목 글자의 그림 이모지 (마크다운 본문, 외부 기사 링크, 사용자 글 제외)
  if (results.pictograph && r9) {
    const re = new RegExp(r9.pictographPattern, 'u');
    const SEL = 'button, a, [role="tab"], [role="menuitem"], [role="radio"], label, h1, h2, h3';
    for (const el of root.querySelectorAll(SEL)) {
      if (!inScope(el) || !visibleBox(el)) continue;
      if (el.closest('.markdown-viewer, a[target="_blank"]') || titledUserText(el)) continue;
      results.pictograph.targets += 1;
      const text = norm(el.textContent);
      const m = re.exec(text);
      if (m) fail('pictograph', el, `그림 이모지 '${m[0]}' ('${text.slice(0, 40)}')`, { char: m[0] });
    }
  }

  // ---- briefing (R46·R47): 일일 브리핑 대화상자
  if (results.briefing && r9) {
    const dlgs = topDialog ? [topDialog] : [...root.querySelectorAll('[role="dialog"]')].filter((d) => inScope(d) && shown(d));
    if (dlgs.length === 0) fail('briefing', null, '대상 없음: 대화상자');
    for (const d of dlgs) {
      results.briefing.targets += 1;
      // ① 설정 진입 버튼이 하나 (실패 알림·상태 안의 '… 설정 열기' 는 뺀다)
      const settings = [...d.querySelectorAll('button')].filter((b) => visibleBox(b) && accName(b).includes(r9.settingsWord) && !b.closest('[role="alert"], [role="status"]'));
      if (settings.length === 0) fail('briefing', d, `① 설정 버튼 0개 (1개여야 함)`);
      if (settings.length > 1) for (const b of settings) fail('briefing', b, `① 설정 버튼 ${settings.length}개 (1개여야 함): '${accName(b).slice(0, 30)}'`);
      // ② 대화상자 설명(aria-describedby)과 같은 글자를 가진 다른 보이는 요소
      const descEls = (d.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)).filter(Boolean);
      const desc = norm(descEls.map((e) => e.textContent).join(' '));
      if (desc) {
        for (const el of d.querySelectorAll('*')) {
          if (descEls.some((x) => x === el || x.contains(el) || el.contains(x))) continue;
          if (el.closest('svg') || !visibleBox(el) || norm(el.textContent) !== desc) continue;
          if ([...el.children].some((c) => norm(c.textContent) === desc)) continue; // 가장 안쪽 요소만
          fail('briefing', el, `② 대화상자 설명과 같은 글자: '${desc.slice(0, 40)}'`);
        }
      }
      // ③ '카테고리별 요약' 탭 패널의 분야 머리글(h3, 고정 머리글 제외)이 긴 라벨 4개 안
      const tab = [...d.querySelectorAll('[role="tab"]')].find((t) => norm(t.textContent) === r9.categoryPanelTab) ?? null;
      let panel = d;
      if (tab) panel = tab.getAttribute('aria-selected') === 'true' ? document.getElementById(tab.getAttribute('aria-controls') || '') : null;
      const headings = [];
      for (const h3 of panel ? panel.querySelectorAll('h3') : []) {
        if (!visibleBox(h3)) continue;
        const copy = h3.cloneNode(true);
        for (const x of copy.querySelectorAll('[aria-hidden="true"]')) x.remove();
        const text = norm(copy.textContent);
        if (r9.briefingFixedHeadings.includes(text)) continue;
        headings.push(text);
        if (!r9.longCategoryLabels.includes(text)) fail('briefing', h3, `③ 분야 머리글 '${text.slice(0, 40)}' 이 긴 라벨 4개 밖`, { labels: r9.longCategoryLabels });
      }
      results.briefing.categoryHeadings = panel ? headings : '카테고리별 요약 탭이 선택되지 않음';
    }
  }

  // ---- cardFooter (R48): / 처음 상태의 보이는 카드. 이관 버튼 글자 보임, 버튼 묶음이 카드 안쪽, 통계 묶음과 겹치지 않음
  if (results.cardFooter && r9) {
    const nameRe = new RegExp(r9.handoverName);
    const tol = r9.edgeTolerance;
    for (const card of document.querySelectorAll('[data-feed-card]')) {
      if (!inScope(card) || !shown(card)) continue;
      const btn = [...card.querySelectorAll('button')].find((b) => nameRe.test(accName(b))) ?? null;
      if (!btn) continue;
      results.cardFooter.targets += 1;
      // 보이는 글자: 버튼까지 조상이 모두 보이고 sr-only(1px) 가 아닌 글자 노드
      const parts = [];
      const walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        let ok = true;
        for (let n = t.parentElement; n && btn.contains(n); n = n.parentElement) {
          if (!visibleBox(n)) { ok = false; break; }
        }
        if (ok) parts.push(t.nodeValue);
      }
      const visibleText = norm(parts.join(' '));
      if (!visibleText.includes(r9.handoverText)) fail('cardFooter', btn, `이관 버튼 보이는 글자에 '${r9.handoverText}' 없음 (보이는 글자 '${visibleText}')`);
      const group = btn.parentElement;
      const gr = group.getBoundingClientRect();
      const inner = contentBoxOf(card);
      if (gr.left < inner.left - tol || gr.right > inner.right + tol || gr.top < inner.top - tol || gr.bottom > inner.bottom + tol) {
        fail('cardFooter', group, `버튼 묶음이 카드 안쪽 상자 밖 (묶음 ${round(gr.left)}~${round(gr.right)}, 안쪽 ${round(inner.left)}~${round(inner.right)})`, { group: rectOf(gr) });
      }
      const stat = card.querySelector('[data-card-stat]');
      if (stat && stat.parentElement !== group) {
        const sg = stat.parentElement.getBoundingClientRect();
        const ox = Math.min(sg.right, gr.right) - Math.max(sg.left, gr.left);
        const oy = Math.min(sg.bottom, gr.bottom) - Math.max(sg.top, gr.top);
        if (ox > tol && oy > tol) fail('cardFooter', group, `통계 묶음과 버튼 묶음이 ${round(ox)}×${round(oy)}px 겹침`, { stats: rectOf(sg), group: rectOf(gr) });
      }
    }
    if (results.cardFooter.targets === 0) fail('cardFooter', null, '대상 없음: 이관 버튼이 있는 [data-feed-card]');
  }

  for (const res of Object.values(results)) {
    res.pass = res.failures.length === 0 && res.truncated === 0;
    if (res.truncated === 0) delete res.truncated;
  }
  return results;
}

// ---------------------------------------------------------------------------
// R9 진입점 (spec 설계 3, 6, 9)
// ---------------------------------------------------------------------------

const ALL = ['desktop', 'tablet', 'mobile'];

const ENTRY_POINTS = {
  feed: {
    page: [
      { id: 'skip-link', roles: ['link'], name: '본문으로 건너뛰기' },
      { id: 'nav-chat', roles: ['link'], name: /AI 챗/ },
      { id: 'nav-feed', roles: ['link'], name: '피드', devices: ['desktop', 'tablet'] },
      { id: 'collect-status', roles: ['button'], name: /다음 수집|수집 중/, devices: ['desktop'] },
      { id: 'collect-status-icon', roles: ['button'], name: /^수집 스케줄/, devices: ['tablet'] },
      { id: 'collect-now', roles: ['button'], name: '즉시 수집', devices: ['desktop', 'tablet'] },
      { id: 'palette', roles: ['button'], name: /검색·명령/, devices: ['desktop'] },
      { id: 'palette-icon', roles: ['button'], name: '커맨드 팔레트 열기', devices: ['tablet', 'mobile'] },
      { id: 'theme-menu', roles: ['button'], name: '테마 선택', devices: ['desktop', 'tablet'] },
      { id: 'more', roles: ['button'], name: '더보기' },
      { id: 'category-chips', roles: ['group'], name: '카테고리' },
      { id: 'search', roles: ['searchbox', 'textbox'], name: '키워드 검색' },
      { id: 'source-chips', roles: ['group'], name: '소스' },
      { id: 'sort', roles: ['combobox', 'listbox', 'menulist'], name: '정렬' },
      { id: 'must-read', roles: ['button'], name: /Must-Read/ },
      { id: 'bookmark-chip', roles: ['button'], name: /^북마크/ },
      { id: 'card-chat', roles: ['button', 'link'], name: /^AI 챗에서 분석/, needs: 'cards' }, // 보정 9 (R45)
      { id: 'card-original', roles: ['link'], name: /원문/, needs: 'cards' },
      { id: 'card-bookmark', roles: ['button'], name: /보관/, needs: 'cards' },
      { id: 'briefing', roles: ['button'], name: /^오늘의 브리핑/, optional: '브리핑이 없으면 그리지 않는다 (spec 4.1)' },
      { id: 'trend', roles: ['button'], name: /트렌드|급상승/, optional: '레이더 데이터가 없으면 그리지 않는다 (spec 4.1)' },
    ],
    menu: [
      { id: 'menu-sources', name: '소스 & 리서처' },
      { id: 'menu-share', name: '공유 & 알림' },
      { id: 'menu-mcp', name: 'MCP 연동' },
      { id: 'menu-rss', name: /RSS 피드/ },
      { id: 'menu-reset', name: /^초기화 & 재수집/ },
      { id: 'menu-schedule', name: /^수집 스케줄/, devices: ['mobile'] },
      { id: 'menu-collect', name: '즉시 수집', devices: ['mobile'] },
      { id: 'menu-theme-light', name: /라이트/, devices: ['mobile'] },
      { id: 'menu-theme-dark', name: /다크/, devices: ['mobile'] },
      { id: 'menu-theme-system', name: /시스템/, devices: ['mobile'] },
    ],
  },
  chat: {
    page: [
      { id: 'back-to-feed', roles: ['link'], name: '피드로 돌아가기' },
      { id: 'history-toggle', roles: ['button'], name: '대화 기록 보기', devices: ['tablet', 'mobile'] },
      { id: 'history-nav', roles: ['navigation'], name: '대화 기록 목록', devices: ['desktop'] },
      { id: 'new-chat', roles: ['button'], name: /새 대화/ },
      { id: 'palette', roles: ['button'], name: /커맨드 팔레트/, devices: ['desktop', 'tablet'] },
      { id: 'more', roles: ['button'], name: '더보기' },
      { id: 'scope', roles: ['group'], name: '검색 스코프 모드' },
      { id: 'prompt', roles: ['textbox'], name: /질문 입력/ },
    ],
    menu: [
      { id: 'menu-feed', name: '뉴스 피드로 이동' },
      { id: 'menu-theme-light', name: /라이트/ },
      { id: 'menu-theme-dark', name: /다크/ },
      { id: 'menu-theme-system', name: /시스템/ },
      { id: 'menu-palette', name: /커맨드 팔레트/, devices: ['mobile'] },
    ],
  },
};

async function checkEntryPoints(page, routeId, device, ctx) {
  const spec = ENTRY_POINTS[routeId];
  const nodes = await axNodes(page);
  const has = (roles, matcher) =>
    nodes.some((n) => roles.includes(n.role) && typeof n.name === 'string' && matchName(n.name.trim(), matcher));

  const items = [];
  for (const ep of spec.page) {
    if (!(ep.devices ?? ALL).includes(device)) continue;
    if (ep.needs === 'cards' && ctx.cardCount === 0) {
      items.push({ id: ep.id, status: 'skipped', reason: '기사 카드 없음' });
      continue;
    }
    const found = has(ep.roles, ep.name);
    if (!found && ep.optional) {
      items.push({ id: ep.id, status: 'absent', reason: ep.optional });
      continue;
    }
    items.push({ id: ep.id, roles: ep.roles, name: describeMatcher(ep.name), status: found ? 'found' : 'missing' });
  }

  // 더보기 메뉴를 열고 항목을 찾는다
  let menuTouch = null;
  const menuEntries = spec.menu.filter((ep) => (ep.devices ?? ALL).includes(device));
  const opened = (await clickAx(page, ['button'], '더보기')) && (await waitForMenu(page, 3000));
  if (!opened) {
    for (const ep of menuEntries) items.push({ id: ep.id, name: describeMatcher(ep.name), status: 'missing', reason: '더보기 메뉴를 열지 못함' });
  } else {
    const menuNodes = await axNodes(page);
    for (const ep of menuEntries) {
      const found = menuNodes.some((n) => MENU_ROLES.includes(n.role) && typeof n.name === 'string' && matchName(n.name.trim(), ep.name));
      items.push({ id: ep.id, name: describeMatcher(ep.name), via: '더보기', status: found ? 'found' : 'missing' });
    }
    if (device === 'mobile') {
      menuTouch = await page.evaluate(inPageMenuItemSizes, { touchMin: TOUCH_MIN, tolerance: TOUCH_TOLERANCE });
    }
    await page.keyboard.press('Escape');
    await sleep(200);
    await closeAllOverlays(page);
  }

  const missing = items.filter((i) => i.status === 'missing');
  return { items, missing: missing.map((m) => m.id), pass: missing.length === 0, menuTouch };
}

// ---------------------------------------------------------------------------
// 대화상자 열기 (/)
// ---------------------------------------------------------------------------

async function openViaMenu(page, matcher) {
  if (!(await clickAx(page, ['button'], '더보기'))) return '더보기 버튼 없음';
  if (!(await waitForMenu(page, 3000))) return '더보기 메뉴가 열리지 않음';
  if (!(await clickAx(page, MENU_ROLES, matcher))) return `메뉴 항목 없음: ${describeMatcher(matcher)}`;
  return null;
}

const DIALOGS = [
  {
    id: 'news-detail',
    label: '뉴스 상세',
    needs: 'cards',
    // 첫 탭(AI 요약 & 시사점)은 열린 그대로 재고, 이 탭들은 다시 열어 눌러서 잰다 (spec 14.8)
    // 보정 9 (R45): 둘째 탭 이름 'AI 질의응답'. 두 탭 모두 pictograph·terms (spec 14.17)
    extraChecks: ['pictograph', 'terms'],
    tabs: [{ id: 'ask-ai', label: '뉴스 상세 AI 질의응답 탭', name: /^AI 질의응답/, extraChecks: ['pictograph', 'terms'] }],
    open: async (page) => {
      const handle = await page.$('[data-feed-card] h3 button') ?? await page.$('[data-feed-card] h3') ?? await page.$('[data-feed-card]');
      if (!handle) return '기사 카드 없음';
      await handle.click();
      await handle.dispose();
      return null;
    },
  },
  {
    id: 'daily-briefing',
    label: '일일 브리핑',
    needs: 'briefing',
    extraChecks: ['pictograph', 'briefing'], // 보정 9 (R44, R46·R47)
    open: async (page) => ((await clickAx(page, ['button'], /^오늘의 브리핑/)) ? null : '브리핑 버튼 없음'),
  },
  {
    id: 'daily-briefing+settings',
    label: '일일 브리핑 위 연동 설정 (겹침)',
    needs: 'briefing',
    stacked: 2,
    open: async (page, timeout) => {
      if (!(await clickAx(page, ['button'], /^오늘의 브리핑/))) return '브리핑 버튼 없음';
      if (!(await waitForDialogCount(page, 'gt', 0, timeout))) return '일일 브리핑이 열리지 않음';
      // 보정 9 (R46): 바닥 버튼 글자가 '연동 설정 관리' → '연동 설정' (고치기 전 커밋은 위 톱니 '연동 설정' 을 먼저 누른다)
      return (await clickAx(page, ['button'], /^연동 설정( 관리)?$/)) ? null : '연동 설정 버튼 없음';
    },
  },
  { id: 'share-notify', label: '공유 & 알림', open: (page) => openViaMenu(page, '공유 & 알림') },
  {
    id: 'schedule',
    label: '스케줄',
    open: async (page) => {
      if (await clickAx(page, ['button'], /^(다음 수집|수집 스케줄|수집 중)/)) return null;
      return openViaMenu(page, /^수집 스케줄/);
    },
  },
  { id: 'mcp', label: 'MCP', open: (page) => openViaMenu(page, 'MCP 연동') },
  { id: 'sources', label: '소스 & 리서처', open: (page) => openViaMenu(page, '소스 & 리서처') },
  {
    id: 'command-palette',
    label: '커맨드 팔레트',
    open: async (page) => ((await clickAx(page, ['button'], /검색·명령|커맨드 팔레트 열기/)) ? null : '커맨드 팔레트 버튼 없음'),
  },
  // 확인 창은 Escape 로만 닫는다. 확인 버튼은 절대 누르지 않는다 (파괴적 동작).
  { id: 'reset-confirm', label: '초기화 확인 창', expectRole: 'alertdialog', open: (page) => openViaMenu(page, /^초기화 & 재수집/) },
];

// 보정 7 새 측정 상태 '챗 포커스 필터 열림' (spec 14.15): /chat 의 포커스 캡슐 버튼으로 연다
const CHAT_FOCUS_DIALOG = {
  id: 'focus-filter',
  label: '챗 포커스 필터',
  extraChecks: ['focusLabels', 'terms', 'pictograph'],
  open: async (page) => ((await clickAx(page, ['button'], /^지식 검색 포커스 필터 설정 열기/)) ? null : '포커스 필터 버튼 없음 (지식 검색 포커스 필터 설정 열기…)'),
};

async function measureDialog(page, dialog, viewport, ctx, opts) {
  const result = { dialog: dialog.id, label: dialog.label };
  if (dialog.needs === 'cards' && ctx.cardCount === 0) {
    return { ...result, skipped: true, reason: '기사 카드 없음 (수집된 기사가 필요)' };
  }
  if (dialog.needs === 'briefing' && !ctx.hasBriefing) {
    return { ...result, skipped: true, reason: '브리핑 버튼 없음 (생성된 브리핑이 필요)' };
  }

  const openError = await dialog.open(page, opts.timeout);
  if (openError) return { ...result, pass: false, error: openError };
  const expected = dialog.stacked ?? 1;
  if (!(await waitForDialogCount(page, 'gt', expected - 1, opts.timeout))) {
    return { ...result, pass: false, error: '대화상자가 열리지 않음' };
  }
  await sleep(300); // 등장 애니메이션 (reduced-motion 이면 없음)

  const m = await page.evaluate(inPageMeasureTopDialog, {
    measureTouch: viewport.width < 768,
    touchMin: TOUCH_MIN,
    tolerance: TOUCH_TOLERANCE,
  });
  if (!m) return { ...result, pass: false, error: '열린 대화상자를 찾지 못함' };

  const R7 = { ...m.attrs };
  const roleOk = dialog.expectRole ? R7.role === dialog.expectRole : R7.role === 'dialog' || R7.role === 'alertdialog';
  R7.roleOk = roleOk;
  R7.stackedExpected = expected;

  // 14.8 판정 (맨 위 대화상자 안)
  const stateChecks = await page.evaluate(inPageChecks, { names: [...STATE_CHECKS, ...(dialog.extraChecks ?? [])], k: K, tag: false, r7: EXPECT7, r9: EXPECT9 });

  let screenshot = null;
  if (opts.screenshotAll) {
    screenshot = await takeShot(page, opts, `${ctx.prefix}-${dialog.id}`);
  } else if (opts.keyShot) {
    screenshot = await takeShot(page, opts, opts.keyShot);
  }

  // Escape 한 번: 맨 위만 닫히고 아래는 남는다
  await page.keyboard.press('Escape');
  await sleep(350);
  const esc = await page.evaluate(inPageEscapeResult, R7.openCount - 1);
  const topClosed = !esc.remaining.includes(esc.maxIndex);
  const othersKept = esc.remaining.length === esc.maxIndex; // 0..maxIndex-1 이 모두 남음
  R7.escape = { before: R7.openCount, remaining: esc.remaining.length, topClosed, othersKept };
  R7.pass = roleOk && R7.ariaModal === 'true' && R7.labelled && topClosed && othersKept && R7.openCount === expected;

  const checks = { R3: m.overflow, R7, ...stateChecks };
  if (m.touch) checks.R6 = m.touch;
  const closed = await closeAllOverlays(page);

  // 다른 탭 상태: 다시 열고 탭을 눌러 같은 판정을 한다
  const tabStates = [];
  for (const tab of dialog.tabs ?? []) {
    const state = { id: tab.id, label: tab.label };
    const err = await dialog.open(page, opts.timeout);
    if (err || !(await waitForDialogCount(page, 'gt', expected - 1, opts.timeout))) {
      tabStates.push({ ...state, pass: false, error: err ?? '대화상자가 열리지 않음' });
      await closeAllOverlays(page);
      continue;
    }
    await sleep(300);
    if (!(await clickAx(page, ['tab'], tab.name))) {
      tabStates.push({ ...state, pass: false, error: `탭 없음: ${describeMatcher(tab.name)}` });
      await closeAllOverlays(page);
      continue;
    }
    await sleep(400);
    const tabChecks = {
      R3: await page.evaluate(inPageOverflow),
      ...(await page.evaluate(inPageChecks, { names: [...STATE_CHECKS, ...(tab.extraChecks ?? [])], k: K, tag: false, r7: EXPECT7, r9: EXPECT9 })),
    };
    let tabShot = null;
    if (opts.screenshotAll) tabShot = await takeShot(page, opts, `${ctx.prefix}-${dialog.id}-${tab.id}`);
    const tabClosed = await closeAllOverlays(page);
    tabStates.push({ ...state, checks: tabChecks, screenshot: tabShot, cleanedUp: tabClosed, pass: Object.values(tabChecks).every((c) => c.pass !== false) });
  }

  return { ...result, checks, screenshot, cleanedUp: closed, tabStates, pass: Object.values(checks).every((c) => c.pass !== false) };
}

// ---------------------------------------------------------------------------
// 실행
// ---------------------------------------------------------------------------

async function takeShot(page, opts, name) {
  const file = path.join(opts.out, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return path.relative(opts.out, file);
}

async function loadRoute(page, opts, route, theme, viewport, load = {}) {
  const touch = viewport.width < 1024;
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: theme },
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ]);
  // localStorage 에 테마를 넣고 다시 읽는다
  if (!page.url().startsWith(opts.base)) {
    await page.goto(`${opts.base}/`, { waitUntil: 'domcontentloaded', timeout: opts.timeout });
  }
  await page.evaluate((key, value) => localStorage.setItem(key, value), THEME_STORAGE_KEY, theme);
  await page.goto(`${opts.base}${load.path ?? route.path}`, { waitUntil: load.waitUntil ?? 'networkidle2', timeout: opts.timeout });
  await page.waitForSelector('header', { visible: true, timeout: opts.timeout });
  if (load.waitUntil !== 'domcontentloaded') await sleep(300);
  await assertProductionPage(page);
}

/** R31: 개발 서버 표시기가 있으면 측정을 멈춘다 (종료 2). */
async function assertProductionPage(page) {
  const env = await page.evaluate(inPageEnv);
  if (env.devIndicator) {
    throw new EnvironmentError('개발 서버 환경: 페이지에 nextjs-portal(Next.js 개발 표시기)이 있다. 프로덕션 빌드(pnpm build 뒤 pnpm start 또는 standalone server.js)에서 돌린다.');
  }
}

const NEW_CHECKS = new Set(ALL_CHECKS);

function collectFailures(comboId, checks, failures) {
  for (const [name, c] of Object.entries(checks)) {
    if (!c || c.pass !== false) continue;
    if (NEW_CHECKS.has(name)) {
      // 14.8 판정은 조합의 checks 에 전체가 있다. 여기에는 건수와 앞 3개만 둔다
      failures.push({ combo: comboId, check: name, detail: { count: c.failures.length + (c.truncated ?? 0), sample: c.failures.slice(0, 3) } });
    } else {
      failures.push({ combo: comboId, check: name, detail: c });
    }
  }
}

function gitHead() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

async function fetchFirstNewsId(opts) {
  try {
    const res = await fetch(`${opts.base}/api/news?page=1`, { signal: AbortSignal.timeout(opts.timeout) });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.items?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

/** 기본 상태 밖의 측정 상태 하나 (레이더 펼침, 챗 기사 칩, 챗 경고 알림). */
async function measureExtraState(page, opts, report, combo, state) {
  const id = `${combo.id}-${state.id}`;
  const entry = { id, route: state.path ?? combo.route, theme: combo.theme, viewport: combo.viewport, device: combo.device, state: state.id, label: state.label };
  try {
    const prepared = await state.prepare();
    if (prepared && prepared.skip) {
      entry.skipped = true;
      entry.reason = prepared.skip;
      report.skipped.push({ combo: id, check: 'state', reason: prepared.skip });
    } else {
      const checks = {
        R3: await page.evaluate(inPageOverflow),
        ...(await page.evaluate(inPageChecks, { names: state.checks, k: K, tag: false, r7: EXPECT7, r9: EXPECT9, chatState: state.chatState ?? null })),
      };
      if (opts.screenshots === 'all') entry.screenshot = await takeShot(page, opts, id);
      entry.checks = checks;
      collectFailures(id, checks, report.failures);
      entry.pass = Object.values(checks).every((c) => c.pass !== false);
    }
  } catch (err) {
    if (err instanceof EnvironmentError) throw err;
    entry.pass = false;
    entry.error = err instanceof Error ? err.message : String(err);
    report.failures.push({ combo: id, check: 'state', detail: entry.error });
  }
  report.combos.push(entry);
  log(entry);
}

async function run(opts) {
  const chromePath = findChrome();
  const { default: puppeteer } = await import('puppeteer-core');
  fs.mkdirSync(opts.out, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: !opts.headful,
    args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'],
  });

  const chromeVersion = await browser.version();
  const report = {
    generatedAt: new Date().toISOString(),
    base: opts.base,
    chrome: chromeVersion,
    environment: { devIndicator: false, base: opts.base, chrome: chromeVersion, commit: opts.commit ?? gitHead() },
    options: {
      screenshots: opts.screenshots,
      routes: opts.routes.map((r) => r.id),
      themes: opts.themes,
      viewports: opts.viewports.map(vpKey),
      skipDialogs: opts.skipDialogs,
    },
    thresholds: K,
    combos: [],
    failures: [],
    skipped: [],
  };
  const reportPath = path.join(opts.out, 'report.json');
  const writeReport = () => fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(opts.timeout);
    const firstNewsId = opts.routes.some((r) => r.id === 'chat') ? await fetchFirstNewsId(opts) : null;
    report.environment.firstNewsId = firstNewsId;

    for (const route of opts.routes) {
      for (const theme of opts.themes) {
        for (const viewport of opts.viewports) {
          const device = deviceOf(viewport.width);
          const comboId = `${route.id}-${theme}-${vpKey(viewport)}`;
          const combo = { id: comboId, route: route.path, theme, viewport, device, dialog: null };
          try {
            await loadRoute(page, opts, route, theme, viewport);
            const base = await page.evaluate(inPageMeasureBase, {
              routeId: route.id,
              viewport,
              touchMin: TOUCH_MIN,
              tolerance: TOUCH_TOLERANCE,
              headerMax: HEADER_MAX_HEIGHT,
            });
            combo.cardCount = base.cardCount;
            combo.themeApplied = {
              ...base.theme,
              pass: base.theme.htmlClass.split(/\s+/).includes(theme) && base.theme.dataTheme === theme,
            };

            // 14.8 판정 (기본 상태): 메뉴를 열기 전에 잰다
            const names = [...STATE_CHECKS];
            if (route.id === 'feed') {
              names.push('vRhythm');
              if (viewport.width >= K.rowAlignMinWidth) names.push('rowAlign');
            }
            if (route.id === 'chat' && viewport.width >= K.chatAlignMinWidth) names.push('chatAlign');
            // 보정 7: / 처음 상태는 toolbarLayout·cardMetric, /chat 기본은 chatScope·terms·modelPicker
            if (route.id === 'feed') names.push('toolbarLayout', 'cardMetric');
            if (route.id === 'chat') names.push('chatScope', 'terms', 'modelPicker');
            // 보정 9: / 처음 상태는 feedAreas·cardFooter·terms, /chat 기본은 chatHeader·pictograph
            if (route.id === 'feed') names.push('feedAreas', 'cardFooter', 'terms');
            if (route.id === 'chat') names.push('chatHeader', 'pictograph');
            const stateChecks = await page.evaluate(inPageChecks, { names, k: K, tag: false, initialState: true, r7: EXPECT7, r9: EXPECT9, chatState: route.id === 'chat' ? 'base' : null });

            const shoot = opts.screenshots === 'all' || opts.screenshots === 'key';
            if (shoot) combo.screenshot = await takeShot(page, opts, comboId);

            const checks = { R3: base.R3, R4: base.R4, R8: base.R8 };
            if (base.R5) {
              if (base.R5.skipped) report.skipped.push({ combo: comboId, check: 'R5', reason: base.R5.reason });
              else checks.R5 = base.R5;
            }
            if (base.R6) checks.R6 = base.R6;

            const R9 = await checkEntryPoints(page, route.id, device, { cardCount: base.cardCount });
            if (R9.menuTouch && checks.R6) {
              checks.R6.menuChecked = R9.menuTouch.checked;
              checks.R6.failures.push(...R9.menuTouch.failures.map((f) => ({ ...f, via: '더보기 메뉴' })));
              checks.R6.pass = checks.R6.failures.length === 0;
            }
            delete R9.menuTouch;
            checks.R9 = R9;
            for (const item of R9.items) {
              if (item.status === 'skipped' || item.status === 'absent') {
                report.skipped.push({ combo: comboId, check: `R9:${item.id}`, reason: item.reason });
              }
            }
            checks.themeApplied = combo.themeApplied;
            Object.assign(checks, stateChecks);
            combo.checks = checks;
            collectFailures(comboId, checks, report.failures);
            combo.pass = Object.values(checks).every((c) => c.pass !== false);
            report.combos.push(combo);
            log(combo);

            if (route.id === 'feed' && !opts.skipDialogs) {
              const hasBriefing = Boolean(await findAx(page, ['button'], /^오늘의 브리핑/));
              const prefix = comboId;
              for (const dialog of DIALOGS) {
                const dComboId = `${comboId}-${dialog.id}`;
                const keyName = KEY_DIALOG_SHOTS[dialog.id];
                const keyShot = opts.screenshots === 'key' && keyName && theme === 'light' && KEY_DIALOG_VIEWPORTS.has(vpKey(viewport))
                  ? `${keyName}-${theme}-${vpKey(viewport)}`
                  : null;
                let d;
                try {
                  d = await measureDialog(page, dialog, viewport, { cardCount: base.cardCount, hasBriefing, prefix }, {
                    timeout: opts.timeout,
                    out: opts.out,
                    screenshotAll: opts.screenshots === 'all',
                    keyShot,
                  });
                } catch (err) {
                  if (err instanceof EnvironmentError) throw err;
                  d = { dialog: dialog.id, label: dialog.label, pass: false, error: err instanceof Error ? err.message : String(err) };
                }
                const tabStates = d.tabStates ?? [];
                delete d.tabStates;
                const dCombo = { id: dComboId, route: route.path, theme, viewport, device, ...d };
                if (d.skipped) {
                  report.skipped.push({ combo: dComboId, check: 'dialog', reason: d.reason });
                } else {
                  if (d.error) report.failures.push({ combo: dComboId, check: 'open', detail: d.error });
                  if (d.checks) collectFailures(dComboId, d.checks, report.failures);
                }
                report.combos.push(dCombo);
                log(dCombo);
                for (const t of tabStates) {
                  const tId = `${dComboId}-${t.id}`;
                  const tCombo = { ...t, state: t.id, id: tId, route: route.path, theme, viewport, device, dialog: dialog.id };
                  if (t.error) report.failures.push({ combo: tId, check: 'open', detail: t.error });
                  if (t.checks) collectFailures(tId, t.checks, report.failures);
                  report.combos.push(tCombo);
                  log(tCombo);
                }
                const dirty = (!d.skipped && (d.error || d.cleanedUp === false)) || tabStates.some((t) => t.error || t.cleanedUp === false);
                if (dirty) {
                  // 상태가 꼬였으면 다시 불러 다음 대화상자를 깨끗하게 연다
                  await loadRoute(page, opts, route, theme, viewport);
                }
              }
            }

            // 보정 7 새 측정 상태: 챗 포커스 필터 열림 (R40). 14.8 상태별 검사 + focusLabels·terms + R7 대화상자 속성
            if (route.id === 'chat' && !opts.skipDialogs) {
              const dialog = CHAT_FOCUS_DIALOG;
              const dComboId = `${comboId}-${dialog.id}`;
              let d;
              try {
                d = await measureDialog(page, dialog, viewport, { cardCount: base.cardCount, hasBriefing: false, prefix: comboId }, {
                  timeout: opts.timeout,
                  out: opts.out,
                  screenshotAll: opts.screenshots === 'all',
                  keyShot: null,
                });
              } catch (err) {
                if (err instanceof EnvironmentError) throw err;
                d = { dialog: dialog.id, label: dialog.label, pass: false, error: err instanceof Error ? err.message : String(err) };
              }
              delete d.tabStates;
              const dCombo = { id: dComboId, route: route.path, theme, viewport, device, ...d };
              if (d.error) report.failures.push({ combo: dComboId, check: 'open', detail: d.error });
              if (d.checks) collectFailures(dComboId, d.checks, report.failures);
              report.combos.push(dCombo);
              log(dCombo);
              if (d.error || d.cleanedUp === false) await loadRoute(page, opts, route, theme, viewport);
            }

            // 추가 측정 상태 (spec 14.8)
            if (route.id === 'feed') {
              await measureExtraState(page, opts, report, combo, {
                id: 'radar',
                label: '레이더 펼침',
                checks: STATE_CHECKS,
                prepare: async () => {
                  await loadRoute(page, opts, route, theme, viewport);
                  if (!(await clickAx(page, ['button'], /트렌드/))) return { skip: '트렌드 버튼 없음 (레이더 데이터가 없으면 그리지 않는다, spec 4.1)' };
                  await sleep(500);
                  return null;
                },
              });
            }
            if (route.id === 'chat') {
              await measureExtraState(page, opts, report, combo, {
                id: 'source',
                label: '챗 기사 칩 (sourceId)',
                path: firstNewsId === null ? null : `/chat?sourceId=${firstNewsId}`,
                checks: [...STATE_CHECKS, 'chatScope', 'terms'],
                chatState: 'source',
                prepare: async () => {
                  if (firstNewsId === null) return { skip: '첫 기사 id 를 얻지 못함 (/api/news)' };
                  await loadRoute(page, opts, route, theme, viewport, { path: `/chat?sourceId=${firstNewsId}` });
                  await sleep(700);
                  return null;
                },
              });
              await measureExtraState(page, opts, report, combo, {
                id: 'toast',
                label: '챗 경고 알림 (없는 기사)',
                path: `/chat?sourceId=${MISSING_SOURCE_ID}`,
                checks: [...STATE_CHECKS, 'toast', 'chatScope', 'terms'],
                chatState: 'toast',
                prepare: async () => {
                  await loadRoute(page, opts, route, theme, viewport, { path: `/chat?sourceId=${MISSING_SOURCE_ID}`, waitUntil: 'domcontentloaded' });
                  // 알림은 3.5초 뒤 사라진다. 뜨자마자 잰다 (안 뜨면 toast 검사가 '대상 없음' 실패를 남긴다)
                  try {
                    await page.waitForFunction(
                      () => document.querySelector('[data-toast-region] [role="status"], [data-toast-region] [role="alert"]') !== null,
                      { timeout: Math.min(opts.timeout, 8000) },
                    );
                  } catch {
                    // 판정에서 대상 없음으로 남는다
                  }
                  await sleep(150);
                  return null;
                },
              });
            }
          } catch (err) {
            if (err instanceof EnvironmentError) throw err;
            combo.pass = false;
            combo.error = err instanceof Error ? err.message : String(err);
            report.failures.push({ combo: comboId, check: 'load', detail: combo.error });
            report.combos.push(combo);
            log(combo);
          }
        }
      }
    }
  } catch (err) {
    if (err instanceof EnvironmentError) {
      report.environment.devIndicator = true;
      report.error = err.message;
      writeReport();
      console.error(`report: ${reportPath}`);
    }
    throw err;
  } finally {
    await browser.close();
  }

  const byCheck = {};
  for (const c of report.combos) {
    for (const [name, chk] of Object.entries(c.checks ?? {})) {
      if (!NEW_CHECKS.has(name)) continue;
      byCheck[name] ??= { states: 0, failedStates: 0, failures: 0 };
      byCheck[name].states += 1;
      if (chk.pass === false) {
        byCheck[name].failedStates += 1;
        byCheck[name].failures += chk.failures.length + (chk.truncated ?? 0);
      }
    }
  }
  report.summary = {
    combos: report.combos.length,
    passed: report.combos.filter((c) => c.pass === true).length,
    failed: report.combos.filter((c) => c.pass === false).length,
    skipped: report.combos.filter((c) => c.skipped).length,
    failures: report.failures.length,
    byCheck,
    pass: report.failures.length === 0,
  };
  writeReport();
  console.log(`\n${report.summary.pass ? 'PASS' : 'FAIL'}: 조합 ${report.summary.combos}, 통과 ${report.summary.passed}, 실패 ${report.summary.failed}, 건너뜀 ${report.summary.skipped}, 실패 항목 ${report.summary.failures}`);
  for (const [name, b] of Object.entries(byCheck)) {
    console.log(`  ${name.padEnd(12)} 상태 ${b.states}, 실패 상태 ${b.failedStates}, 실패 요소 ${b.failures}`);
  }
  console.log(`report: ${reportPath}`);
  return report.summary.pass;
}

function log(combo) {
  const status = combo.skipped ? 'SKIP' : combo.pass ? 'PASS' : 'FAIL';
  const failed = combo.checks
    ? Object.entries(combo.checks).filter(([, c]) => c && c.pass === false).map(([k]) => k)
    : [];
  const extra = combo.error ? ` (${combo.error})` : combo.reason ? ` (${combo.reason})` : failed.length ? ` [${failed.join(', ')}]` : '';
  console.log(`${status} ${combo.id}${extra}`);
}

// ---------------------------------------------------------------------------
// 자체 검증 (R30 ①): 앱 없이 fixture 로 판정을 검증한다
// ---------------------------------------------------------------------------

/** data-expect 요소마다 그 검사가 자신이나 자손에 data-audit-hit 을 남겼는지. */
/**
 * data-expect 요소마다 그 검사가 자신이나 자손에 data-audit-hit 을 남겼는지.
 * data-expect-reason 이 있으면 그 검사의 실패 이유에 그 글자가 들어 있어야 맞다 (다른 이유의 실패로 덮이지 않게).
 * [data-self-test-both] 안의 표시는 모든 폭에서 잡혀야 한다 (both).
 */
function inPageExpectations() {
  return [...document.querySelectorAll('[data-expect]')].flatMap((el) => {
    const names = (el.getAttribute('data-expect') || '').split(/\s+/).filter(Boolean);
    const reason = el.getAttribute('data-expect-reason');
    const hits = [el, ...el.querySelectorAll('[data-audit-hit]')];
    return names.map((name) => ({
      check: name,
      both: el.closest('[data-self-test-both]') !== null,
      note: el.getAttribute('data-note') || el.getAttribute('aria-label') || (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      hit: reason
        ? hits.some((n) => (n.getAttribute('data-audit-reasons') || '').split('\n').some((line) => line.startsWith(`${name}:`) && line.includes(reason)))
        : hits.some((n) => (n.getAttribute('data-audit-hit') || '').split(' ').includes(name)),
    }));
  });
}

async function runSelfTest(opts) {
  const chromePath = findChrome();
  const read = (name) => {
    const file = path.join(FIXTURE_DIR, name);
    if (!fs.existsSync(file)) throw new UsageError(`fixture 가 없다: ${file}`);
    return fs.readFileSync(file, 'utf8');
  };
  const fixtures = { defects: read('defects.html'), clean: read('clean.html'), devIndicator: read('dev-indicator.html') };
  const { default: puppeteer } = await import('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: !opts.headful,
    args: ['--no-first-run', '--no-default-browser-check', '--lang=ko-KR'],
  });
  const problems = [];
  try {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    // 넓은 폭(1440) 한 번, 768 미만 판정용 좁은 폭(360) 한 번 연다. 좁은 폭은 [data-self-test-narrow] 영역만 잰다
    const open = async (html, viewport) => {
      await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'load' });
      await sleep(100);
    };
    // 폭마다 한 번 열고 그 안에서 runs 를 차례로 돈다 (같은 DOM 에 표시가 쌓인다).
    // chatState 'base': chatScope 의 '기사 칩 없음 → data-overflow none' 판정까지 본다
    const wideNames = ALL_CHECKS.filter((n) => !SELF_TEST_NARROW_ONLY_CHECKS.includes(n));
    const passes = [
      { id: `${SELF_TEST_VIEWPORT.width}`, viewport: SELF_TEST_VIEWPORT, runs: [{ names: wideNames, exclude: SELF_TEST_NARROW, scope: null }] },
      {
        id: `${SELF_TEST_NARROW_VIEWPORT.width}`,
        viewport: SELF_TEST_NARROW_VIEWPORT,
        runs: [
          { names: SELF_TEST_NARROW_CHECKS, exclude: null, scope: `${SELF_TEST_NARROW}, ${SELF_TEST_BOTH}` },
          { names: [...SELF_TEST_NARROW_ONLY_CHECKS, ...SELF_TEST_NARROW_ALSO_CHECKS], exclude: null, scope: SELF_TEST_NARROW },
        ],
      },
    ].map((ps) => ({ ...ps, names: ps.runs.flatMap((r) => r.names) }));
    const evalRun = (run, tag) => page.evaluate(inPageChecks, { names: run.names, k: K, tag, scope: run.scope, exclude: run.exclude, initialState: true, r7: EXPECT7, r9: EXPECT9, chatState: 'base' });

    // defects.html: 모든 data-expect 가 (어느 폭에서든) 해당 검사에서 실패해야 한다. ALL_CHECKS 마다 표시가 하나 이상 있어야 한다
    console.log('defects.html');
    let expectations = null;
    const dCounts = {};
    for (const pass of passes) {
      await open(fixtures.defects, pass.viewport);
      if (pass === passes[0]) {
        const dEnv = await page.evaluate(inPageEnv);
        if (dEnv.devIndicator) problems.push('defects.html: 개발 표시기로 잘못 판정');
        // R3: 화면 오른쪽 밖 버튼(left 1400, width 100) 때문에 문서가 가로로 넘쳐야 한다
        const dR3 = await page.evaluate(inPageOverflow);
        console.log(`  ${dR3.pass ? 'MISS' : 'OK  '} R3           가로 넘침 scrollWidth ${dR3.scrollWidth} > innerWidth ${dR3.innerWidth}`);
        if (dR3.pass) problems.push(`defects.html: R3 가로 넘침을 잡지 못함 (scrollWidth ${dR3.scrollWidth}, innerWidth ${dR3.innerWidth})`);
      }
      for (const run of pass.runs) {
        const dChecks = await evalRun(run, true);
        for (const name of run.names) dCounts[`${name}@${pass.id}`] = dChecks[name].failures.length + (dChecks[name].truncated ?? 0);
      }
      const got = await page.evaluate(inPageExpectations);
      expectations = expectations === null
        ? got.map((e) => ({ ...e, where: e.hit ? [pass.id] : [], missedIn: e.hit || !pass.names.includes(e.check) ? [] : [pass.id] }))
        : expectations.map((e, i) => ({
          ...e,
          hit: e.hit || got[i].hit,
          where: got[i].hit ? [...e.where, pass.id] : e.where,
          missedIn: got[i].hit || !pass.names.includes(e.check) ? e.missedIn : [...e.missedIn, pass.id],
        }));
    }
    // 두 폭 영역의 표시는 그 검사를 돈 모든 폭에서 잡혀야 맞다
    expectations = expectations.map((e) => (e.both && e.missedIn.length ? { ...e, hit: false } : e));
    for (const name of ALL_CHECKS) {
      const mine = expectations.filter((e) => e.check === name);
      if (mine.length === 0) problems.push(`defects.html: ${name} 의 data-expect 결함이 없음`);
      for (const e of mine) {
        const where = e.hit ? ` (${e.where.join('·')})` : e.both && e.where.length ? ` (${e.where.join('·')} 에서만 잡힘, ${e.missedIn.join('·')} 놓침)` : '';
        console.log(`  ${e.hit ? 'OK  ' : 'MISS'} ${name.padEnd(12)} ${e.note}${where}`);
        if (!e.hit) problems.push(`defects.html: ${name} 이(가) 결함을 잡지 못함 — ${e.note}`);
      }
      const counts = passes.filter((ps) => ps.names.includes(name)).map((ps) => `${ps.id} ${dCounts[`${name}@${ps.id}`]}건`).join(', ');
      console.log(`       ${name.padEnd(12)} 실패 ${counts}`);
    }
    for (const e of expectations) {
      if (!ALL_CHECKS.includes(e.check)) problems.push(`defects.html: 모르는 검사 이름 data-expect="${e.check}"`);
    }

    // clean.html: 폭마다 그 폭의 검사가 모두 대상이 있고 통과해야 한다
    console.log('clean.html');
    for (const pass of passes) {
      await open(fixtures.clean, pass.viewport);
      if (pass === passes[0]) {
        const cEnv = await page.evaluate(inPageEnv);
        if (cEnv.devIndicator) problems.push('clean.html: 개발 표시기로 잘못 판정');
        const cR3 = await page.evaluate(inPageOverflow);
        console.log(`  ${cR3.pass ? 'OK  ' : 'FAIL'} R3           scrollWidth ${cR3.scrollWidth}, innerWidth ${cR3.innerWidth}`);
        if (!cR3.pass) problems.push(`clean.html: R3 오탐 (scrollWidth ${cR3.scrollWidth} > innerWidth ${cR3.innerWidth})`);
      }
      const cChecks = {};
      for (const run of pass.runs) Object.assign(cChecks, await evalRun(run, false));
      for (const name of pass.names) {
        const c = cChecks[name];
        const ok = c.pass && c.targets > 0;
        console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${name.padEnd(12)} ${pass.id}px 대상 ${c.targets}, 실패 ${c.failures.length}`);
        if (c.targets === 0) problems.push(`clean.html: ${name} ${pass.id}px 대상 없음 (빈 통과)`);
        for (const f of c.failures.slice(0, 5)) problems.push(`clean.html: ${name} ${pass.id}px 오탐 — ${f.reason} ${f.path ?? ''} ${f.name ? `"${f.name}"` : ''}`);
      }
      if ((await page.$('[data-expect]')) !== null) problems.push('clean.html: data-expect 표시가 있으면 안 된다');
    }

    // dev-indicator.html: 환경 오류로 판정해야 한다
    await open(fixtures.devIndicator, SELF_TEST_VIEWPORT);
    const vEnv = await page.evaluate(inPageEnv);
    console.log(`dev-indicator.html\n  ${vEnv.devIndicator ? 'OK  ' : 'FAIL'} nextjs-portal → 개발 서버 환경 오류 (종료 2 대상)`);
    if (!vEnv.devIndicator) problems.push('dev-indicator.html: 개발 서버 환경 오류로 판정하지 못함');
  } finally {
    await browser.close();
  }

  if (problems.length) {
    console.log(`\nSELF-TEST FAIL: ${problems.length}건`);
    for (const p of problems) console.log(`  - ${p}`);
    return false;
  }
  console.log(`\nSELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 ${ALL_CHECKS.length}개 통과, dev-indicator.html 환경 오류 판정`);
  return true;
}

async function main() {
  let opts;
  try {
    opts = parseCliArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    console.error('도움말: node scripts/ui-audit.mjs --help');
    return 2;
  }
  if (opts.help) {
    console.log(USAGE);
    return 0;
  }
  try {
    if (opts.selfTest) return (await runSelfTest(opts)) ? 0 : 1;
    return (await run(opts)) ? 0 : 1;
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(err.message);
      return 2;
    }
    console.error(err instanceof Error ? err.stack : String(err));
    return 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
