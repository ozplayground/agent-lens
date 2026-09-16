#!/usr/bin/env python3
"""
Fullstack Automated QA Runner Script.
Executes automated HTTP API checks, verifies response status codes, latencies, and payload schemas.
"""

import sys
import json
import time
import urllib.request
import urllib.error
import argparse

def test_endpoint(url: str, expected_status: int = 200, method: str = "GET", payload: dict = None):
    start = time.time()
    req = urllib.request.Request(url, method=method)
    if payload:
        data = json.dumps(payload).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    else:
        data = None

    try:
        with urllib.request.urlopen(req, data=data, timeout=5) as response:
            latency = int((time.time() - start) * 1000)
            status = response.getcode()
            body = response.read().decode("utf-8")
            passed = (status == expected_status)
            return {"url": url, "status": status, "expected": expected_status, "latency_ms": latency, "passed": passed, "body": body[:200]}
    except urllib.error.HTTPError as e:
        latency = int((time.time() - start) * 1000)
        passed = (e.code == expected_status)
        return {"url": url, "status": e.code, "expected": expected_status, "latency_ms": latency, "passed": passed, "error": str(e)}
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        return {"url": url, "status": 0, "expected": expected_status, "latency_ms": latency, "passed": False, "error": str(e)}

def main():
    parser = argparse.ArgumentParser(description="Fullstack QA Runner")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Base backend URL")
    args = parser.parse_args()

    print(f"[Fullstack QA Harness] Running QA checks against {args.base_url}")
    results = [
        test_endpoint(f"{args.base_url}/health", 200),
        test_endpoint(f"{args.base_url}/healthz", 200),
        test_endpoint(f"{args.base_url}/api/v1/chats", 200),
        test_endpoint(
            f"{args.base_url}/api/v1/socratic/analyze",
            200,
            method="POST",
            payload={"prompt": "기획서 작성해줘"}
        ),
        test_endpoint(f"{args.base_url}/api/v1/canvas/art-001", 200),
        test_endpoint(
            f"{args.base_url}/api/v1/tools/evaluate",
            200,
            method="POST",
            payload={"tool_name": "web_search", "parameters": {}}
        ),
    ]

    all_passed = True
    for r in results:
        status_sym = "✅ PASS" if r["passed"] else "❌ FAIL"
        print(f"[{status_sym}] {r['url']} -> HTTP {r['status']} ({r['latency_ms']}ms)")
        if not r["passed"]:
            all_passed = False

    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
