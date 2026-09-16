#!/usr/bin/env python3
"""
Backend TDD Cycle Runner & Phase Assertion Harness Script.
Detects pytest or python -m unittest and verifies RED/GREEN phase assertions.
"""

import sys
import subprocess
import argparse
from pathlib import Path

def detect_backend_test_command():
    cwd = Path.cwd()
    
    # Check if pytest is available
    if subprocess.run(["which", "pytest"], capture_output=True).returncode == 0:
        return ["pytest", "-v"]
    
    # Check venv pytest
    for venv_name in [".venv", "venv"]:
        vp = cwd / "backend" / venv_name / "bin" / "pytest"
        if vp.exists():
            return [str(vp), "backend/tests", "-v"]
        
    return ["python3", "-m", "unittest", "discover"]

def main():
    parser = argparse.ArgumentParser(description="Backend TDD Cycle Runner")
    parser.add_argument("--phase", choices=["red", "green", "check"], default="check",
                        help="Assert expected state: 'red' (must fail), 'green' (must pass), 'check' (report result)")
    parser.add_argument("--cmd", type=str, default=None, help="Explicit test command override")
    args = parser.parse_args()

    cmd = args.cmd.split() if args.cmd else detect_backend_test_command()
    print(f"[Backend TDD Harness] Running test suite: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

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
