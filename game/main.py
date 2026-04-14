#!/usr/bin/env python3
# main.py  —  Python AI Game MVP
#
# How to run:
#   python game/main.py
#
# Game loop per mission:
#   1. Show mission story + goal
#   2. Drop starter code into a temp file  (game/workspace.py)
#   3. Player edits workspace.py in any text editor
#   4. Press ENTER to run and check it
#   5. See output + pass/fail + score
#   6. Repeat until correct or player types 'hint' / 'skip'

import os
import sys

# Make sure Python can find our sibling modules when run directly
sys.path.insert(0, os.path.dirname(__file__))

from missions import MISSIONS
from runner import run_code
from scoring import Score

WORKSPACE = os.path.join(os.path.dirname(__file__), "workspace.py")

# ── Helpers ────────────────────────────────────────────────────────────────────

def clear():
    """Clear the terminal (cross-platform)."""
    os.system("cls" if os.name == "nt" else "clear")


def banner(text: str, char: str = "="):
    """Print a simple banner around text."""
    width = max(len(line) for line in text.splitlines()) + 4
    print(char * width)
    for line in text.splitlines():
        print(f"  {line}")
    print(char * width)


def write_workspace(code: str):
    """Write starter code into the workspace file."""
    with open(WORKSPACE, "w") as f:
        f.write(code)


def read_workspace() -> str:
    """Read whatever the player has written in the workspace file."""
    with open(WORKSPACE, "r") as f:
        return f.read()


def prompt(message: str) -> str:
    """Ask the player for input, returning lowercase stripped text."""
    return input(f"\n  {message} ").strip().lower()


# ── Screens ────────────────────────────────────────────────────────────────────

def show_welcome():
    clear()
    banner(
        "PYTHON AI GAME  —  MVP\n"
        "Solve missions by writing Python code.\n"
        "Edit  game/workspace.py  then press ENTER to run."
    )
    print()
    print("  Commands available during a mission:")
    print("    ENTER  → run your code")
    print("    hint   → show a hint  (-1 point)")
    print("    skip   → skip this mission  (0 points)")
    print("    quit   → exit the game")
    print()
    input("  Press ENTER to start...")


def show_mission(mission: dict, attempt: int):
    clear()
    banner(mission["title"])
    print()
    print("  STORY")
    for line in mission["story"].splitlines():
        print(f"    {line}")
    print()
    print("  GOAL")
    for line in mission["goal"].splitlines():
        print(f"    {line}")
    print()
    print(f"  Edit  game/workspace.py  then press ENTER.")
    if attempt > 1:
        print(f"  (Attempt {attempt})")


def show_result(success: bool, output: str, passed: bool, points: int = 0):
    print()
    print("  ── OUTPUT " + "─" * 30)
    for line in output.splitlines():
        print(f"    {line}")
    print("  " + "─" * 38)

    if not success:
        print(f"\n  ERROR  Your code raised an exception. Fix it and try again.")
    elif passed:
        print(f"\n  PASS  +{points} points  — well done!")
    else:
        print(f"\n  FAIL  Output didn't match. Check the goal and try again.")


# ── Mission loop ───────────────────────────────────────────────────────────────

def play_mission(mission: dict, score: Score) -> bool:
    """
    Run one mission until the player passes, skips, or quits.
    Returns False if the player wants to quit entirely.
    """
    write_workspace(mission["starter"])
    attempt = 0
    hint_used = False

    while True:
        attempt += 1
        show_mission(mission, attempt)

        command = prompt("[ENTER / hint / skip / quit] →")

        if command == "quit":
            return False          # signal main loop to stop

        if command == "hint":
            print(f"\n  HINT: {mission['hint']}")
            hint_used = True
            attempt -= 1          # don't count the hint request as an attempt
            input("  Press ENTER to continue...")
            continue

        if command == "skip":
            print("\n  Mission skipped. Moving on...")
            input("  Press ENTER...")
            return True

        # Run the player's code
        code = read_workspace()
        success, output = run_code(code)

        if success and mission["test"](output):
            # Work out points (hint costs 1, making effective attempts higher)
            effective_attempts = attempt + (1 if hint_used else 0)
            points = score.record(effective_attempts)
            show_result(success, output, passed=True, points=points)
            input("\n  Press ENTER for next mission...")
            return True
        else:
            show_result(success, output, passed=False)
            input("\n  Press ENTER to try again...")


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    show_welcome()

    score = Score(total_missions=len(MISSIONS))

    for mission in MISSIONS:
        keep_going = play_mission(mission, score)
        if not keep_going:
            print("\n  Game ended early. Thanks for playing!")
            break

    # Always show score at the end
    print(score.summary())
    print()


if __name__ == "__main__":
    main()
