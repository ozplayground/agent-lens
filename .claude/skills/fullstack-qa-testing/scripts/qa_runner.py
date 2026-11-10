#!/usr/bin/env python3
"""AgentLens API·frontend 스모크 E2E.

실행 중인 backend(·frontend)의 주요 엔드포인트를 불러 상태 코드와 지연을 확인한다.
데이터를 바꾸는 엔드포인트(수집, 초기화, 설정 저장)는 부르지 않는다.
종료 코드: 0 전부 통과, 1 실패 하나 이상.
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request

BACKEND_CHECKS = [
    ("/", 200),
    ("/health", 200),
    ("/api/news?limit=5", 200),
    ("/api/news/999999999", 404),
    ("/api/news/feed/rss.xml", 200),
    ("/api/stats", 200),
    ("/api/schedule/status", 200),
    ("/api/schedule/progress", 200),
    ("/api/sources", 200),
    ("/api/trends/radar", 200),
    ("/api/briefing/settings", 200),
    ("/api/chat/sessions", 200),
    ("/api/research/status", 200),
]
FRONTEND_CHECKS = [
    ("/api/health", 200),
    ("/", 200),
    ("/chat", 200),
]


def call(url, expected):
    start = time.time()
    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=10) as r:
            status, body = r.getcode(), r.read(300).decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        status, body = e.code, e.read(300).decode("utf-8", "replace")
    except Exception as e:  # 연결 실패 등
        status, body = 0, str(e)
    ms = int((time.time() - start) * 1000)
    return {"url": url, "status": status, "expected": expected, "ms": ms,
            "passed": status == expected, "body": body.replace("\n", " ")[:120]}


def main():
    p = argparse.ArgumentParser(description="AgentLens QA 스모크")
    p.add_argument("--base-url", default="http://localhost:8000", help="backend 주소")
    p.add_argument("--frontend-url", default=None, help="frontend 주소 (예: http://localhost:3001). 없으면 건너뛴다")
    p.add_argument("--json", action="store_true", help="결과를 JSON 으로 출력")
    a = p.parse_args()

    results = [call(a.base_url.rstrip("/") + path, code) for path, code in BACKEND_CHECKS]
    if a.frontend_url:
        results += [call(a.frontend_url.rstrip("/") + path, code) for path, code in FRONTEND_CHECKS]

    if a.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for r in results:
            mark = "PASS" if r["passed"] else "FAIL"
            print(f"[{mark}] {r['url']} -> {r['status']} (기대 {r['expected']}, {r['ms']}ms)"
                  + ("" if r["passed"] else f"  {r['body']}"))
    failed = sum(not r["passed"] for r in results)
    print(f"\n통과 {len(results) - failed} / {len(results)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
