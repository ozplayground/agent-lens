#!/usr/bin/env python3
"""frontend TDD 단계 확인 스크립트.

frontend/ 에서 pnpm exec vitest run 을 돌리고 단계별 기대 결과를 단언한다.
  --phase red    테스트가 실패해야 성공 (구현 전 Red 증명)
  --phase green  테스트가 통과해야 성공
  --phase check  vitest 종료 코드를 그대로 돌려준다
`--` 뒤의 인자는 vitest 에 그대로 넘긴다 (예: src/tests/feed/NewsCard.test.tsx).
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
FRONTEND = ROOT / "frontend"


def vitest_command(extra):
    if shutil.which("pnpm"):
        return ["pnpm", "exec", "vitest", "run"] + extra
    return ["npx", "vitest", "run"] + extra


def main():
    argv = sys.argv[1:]
    extra = []
    if "--" in argv:
        i = argv.index("--")
        argv, extra = argv[:i], argv[i + 1:]
    parser = argparse.ArgumentParser(description="frontend TDD 단계 확인")
    parser.add_argument("--phase", choices=["red", "green", "check"], default="check")
    args = parser.parse_args(argv)

    cmd = vitest_command(extra)
    print(f"[frontend TDD] {FRONTEND}: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=str(FRONTEND), capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)

    passed = result.returncode == 0
    if args.phase == "red":
        if passed:
            print("❌ RED 실패: 테스트가 통과했다. 구현 전 새 테스트는 실패해야 한다.")
            sys.exit(1)
        print("✅ RED 확인: 테스트가 실패했다. 실패 이유가 기대(요소 없음, 값 다름)와 같은지 위 출력으로 확인한다.")
        sys.exit(0)
    if args.phase == "green":
        if passed:
            print("✅ GREEN 확인: 테스트가 모두 통과했다.")
            sys.exit(0)
        print("❌ GREEN 실패: 통과하지 못한 테스트가 있다.")
        sys.exit(1)
    print(f"[check] vitest 종료 코드 {result.returncode}")
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
