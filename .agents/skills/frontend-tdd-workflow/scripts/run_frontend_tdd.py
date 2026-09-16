#!/usr/bin/env python3
"""
Frontend TDD Cycle Runner & Phase Assertion Harness Script.
Detects vitest or jest and verifies RED/GREEN phase assertions.
"""

import sys
import subprocess
import argparse
from pathlib import Path

def detect_frontend_test_command():
    cwd = Path.cwd()
    frontend_dir = cwd / "frontend"
    target_dir = frontend_dir if frontend_dir.exists() else cwd

    if (target_dir / "vitest.config.ts").exists() or (target_dir / "vitest.config.js").exists():
        return ["npx", "vitest", "run"]
    
    if (target_dir / "package.json").exists():
        return ["npm", "test", "--", "--run"]
        
    return ["npm", "test"]

def main():
    parser = argparse.ArgumentParser(description="Frontend TDD Cycle Runner")
    parser.add_argument("--phase", choices=["red", "green", "check"], default="check",
                        help="Assert expected state: 'red' (must fail), 'green' (must pass), 'check' (report result)")
    parser.add_argument("--cmd", type=str, default=None, help="Explicit test command override")
    args = parser.parse_args()
    cwd = Path.cwd()
    target_dir = cwd / "frontend" if (cwd / "frontend").exists() else cwd
    cmd = args.cmd.split() if args.cmd else detect_frontend_test_command()
    print(f"[Frontend TDD Harness] Running test suite in {target_dir}: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=str(target_dir), capture_output=True, text=True)

    print("\n--- STDOUT ---")
    print(result.stdout)
    if result.stderr:
        print("--- STDERR ---")
        print(result.stderr)

    passed = (result.returncode == 0)

    if args.phase == "red":
        if not passed:
            print("\n✅ [PHASE RED ASSERTION PASSED] Tests failed as expected before implementation.")
            sys.exit(0)
        else:
            print("\n❌ [PHASE RED ASSERTION FAILED] Tests passed unexpectedly. New tests must fail before implementation.")
            sys.exit(1)
    elif args.phase == "green":
        if passed:
            print("\n✅ [PHASE GREEN ASSERTION PASSED] All tests passed cleanly.")
            sys.exit(0)
        else:
            print("\n❌ [PHASE GREEN ASSERTION FAILED] Tests failed. Implementation must satisfy all assertions.")
            sys.exit(1)
    else:
        print(f"\n[PHASE CHECK] Test exit code: {result.returncode}")
        sys.exit(result.returncode)

if __name__ == "__main__":
    main()
