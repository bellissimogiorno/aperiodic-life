#!/usr/bin/env python3
"""Small dependency-free helper for Aperiodic Life development and verification."""

from __future__ import annotations

import argparse
import hashlib
import http.server
import os
from pathlib import Path
import shlex
import socketserver
import subprocess
import sys
import webbrowser

ROOT = Path(__file__).resolve().parent.parent
JAVASCRIPT_SOURCES = sorted(
    path.relative_to(ROOT).as_posix()
    for path in ROOT.rglob("*.js")
    if ".git" not in path.parts and "__pycache__" not in path.parts
)

PROFILES = {
    "standard": [
        *[["node", "--check", source] for source in JAVASCRIPT_SOURCES],
        ["python3", "-m", "py_compile", "tools/project.py", "tools/package.py", "tools/build_site.py", "tools/export_repository.py", "test-package.py", "test-repository.py"],
        ["node", "test-core.js"],
        ["node", "test-regular-topology.js"],
        ["node", "test-interactions.js"],
        ["node", "test-snapshots.js"],
        ["node", "test-discoveries.js"],
        ["node", "test-structures.js"],
        ["node", "test-search-tools.js"],
        ["node", "test-research.js"],
        ["node", "test-traveller-evidence.js"],
        ["node", "test-hexagonal-evidence.js"],
        ["node", "test-priority-rules.js"],
        ["node", "test-hex-exhaustive-evidence.js"],
        ["node", "research/exhaustive-search/hat-broad/verify-rejections.js"],
        ["node", "test-static.js"],
        ["node", "build-standalone.js", "--check"],
        ["python3", "test-package.py"],
        ["python3", "test-repository.py"],
    ],
    "topology": [
        ["node", "test-topology.js"],
        ["node", "test-penrose-topology.js"],
        ["node", "test-regular-topology.js"],
    ],
    "large": [
        ["node", "--max-old-space-size=4096", "research/verify-aperiodic.js", "--long"],
        ["node", "--max-old-space-size=4096", "test-depth6-smoke.js"],
        ["node", "--max-old-space-size=4096", "test-boundary-depth6.js"],
        ["node", "--max-old-space-size=4096", "test-penrose-depth11-smoke.js"],
    ],
    "browser": [["node", "test-browser.js"]],
    "research": [
        ["node", "test-priority-rules.js"],
        ["node", "test-hex-exhaustive-evidence.js"],
        ["node", "research/exhaustive-search/hat-broad/verify-rejections.js"],
        ["node", "test-structures.js"],
        ["node", "test-research.js"],
        ["node", "test-traveller-evidence.js"],
        ["node", "test-hexagonal-evidence.js"],
    ],
}


def workflow_message(kind: str, message: str) -> None:
    """Emit an Actions command without interpreting newlines in its message."""
    escaped = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::{kind}::{escaped}", flush=True)


def run(command: list[str]) -> None:
    label = shlex.join(command)
    github_actions = os.environ.get("GITHUB_ACTIONS") == "true"
    if github_actions:
        workflow_message("group", label)
    print("+", label, flush=True)
    try:
        subprocess.run(command, cwd=ROOT, check=True)
    except subprocess.CalledProcessError as error:
        if github_actions:
            workflow_message("error", f"Failed: {label} (exit status {error.returncode}). See this command's log for details.")
        raise
    except OSError as error:
        if github_actions:
            workflow_message("error", f"Could not run {label}: {error}")
        raise
    finally:
        if github_actions:
            workflow_message("endgroup", "")


def command_test(profile: str) -> None:
    names = ["standard", "topology", "large", "research", "browser"] if profile == "all" else [profile]
    completed: set[tuple[str, ...]] = set()
    for name in names:
        print(f"\n== {name} ==", flush=True)
        for command in PROFILES[name]:
            key = tuple(command)
            if key in completed:
                print("= already passed:", " ".join(command), flush=True)
                continue
            run(command)
            completed.add(key)
    print("\nAll requested test profiles passed.")


def command_hash(paths: list[str]) -> None:
    targets = [ROOT / path for path in paths] if paths else [
        ROOT / "aperiodic-life-standalone.html",
    ]
    for path in targets:
        if not path.is_file():
            raise SystemExit(f"not a file: {path}")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        print(f"{digest}  {path.relative_to(ROOT)}")


def command_serve(port: int, open_browser: bool) -> None:
    os.chdir(ROOT)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("127.0.0.1", port), handler) as server:
        url = f"http://127.0.0.1:{port}/aperiodic-life-standalone.html"
        print(f"Serving {ROOT}\n{url}\nPress Ctrl-C to stop.")
        if open_browser:
            webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    tests = sub.add_parser("test", help="run a test profile")
    tests.add_argument("profile", choices=[*PROFILES, "all"])

    hashes = sub.add_parser("hash", help="print SHA-256 values")
    hashes.add_argument("paths", nargs="*")

    serve = sub.add_parser("serve", help="serve the project over local HTTP")
    serve.add_argument("--port", type=int, default=8000)
    serve.add_argument("--open", action="store_true", dest="open_browser")

    args = parser.parse_args()
    if args.command == "test":
        command_test(args.profile)
    elif args.command == "hash":
        command_hash(args.paths)
    elif args.command == "serve":
        command_serve(args.port, args.open_browser)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as error:
        print(f"Command failed with exit status {error.returncode}: {shlex.join(error.cmd)}", file=sys.stderr)
        raise SystemExit(error.returncode)
