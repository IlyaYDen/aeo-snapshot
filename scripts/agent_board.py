#!/usr/bin/env python3
"""Print the current AEO Snapshot agent board."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "agents" / "agent_manifest.json"
BOARD_PATH = ROOT / "tasks" / "agent_board.json"


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true", help="Print raw board JSON.")
    args = parser.parse_args()

    manifest = read_json(MANIFEST_PATH)
    board = read_json(BOARD_PATH)

    if args.json:
        print(json.dumps({"manifest": manifest, "board": board}, ensure_ascii=False, indent=2))
        return

    print(f"Goal: {board['goal']}")
    print(f"Status: {board['status']}")
    print(
        "Revenue: "
        f"${board['metrics']['revenue_usd_confirmed']} / ${board['metrics']['target_revenue_usd']}"
    )
    print("\nAgents:")
    for agent in manifest["agents"]:
        print(f"- {agent['id']}: {', '.join(agent['owns'])}")

    print("\nNext actions:")
    for action in board["next_actions"]:
        command = f" ({action['command']})" if "command" in action else ""
        print(f"- [{action['status']}] {action['owner']}: {action['action']}{command}")


if __name__ == "__main__":
    main()
