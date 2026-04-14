# scoring.py
# Tracks the player's score and displays progress.
#
# Points per mission:
#   First try  → 3 points
#   Second try → 2 points
#   Three+     → 1 point

POINTS_TABLE = {1: 3, 2: 2}   # attempt → points (default 1 for 3+)


class Score:
    def __init__(self, total_missions: int):
        self.total_missions = total_missions
        self.earned = 0          # total points earned so far
        self.max_possible = total_missions * 3   # perfect score

    def record(self, attempts: int) -> int:
        """Award points based on number of attempts. Returns points earned."""
        points = POINTS_TABLE.get(attempts, 1)
        self.earned += points
        return points

    def summary(self) -> str:
        """Return a multi-line summary string."""
        bar = self._progress_bar(self.earned, self.max_possible, width=30)
        pct = int(self.earned / self.max_possible * 100)
        lines = [
            "",
            "=" * 40,
            "  FINAL SCORE",
            "=" * 40,
            f"  Points : {self.earned} / {self.max_possible}",
            f"  Rating : {bar} {pct}%",
            f"  Grade  : {self._grade(pct)}",
            "=" * 40,
        ]
        return "\n".join(lines)

    def _progress_bar(self, value: int, maximum: int, width: int) -> str:
        filled = int(value / maximum * width)
        return "[" + "#" * filled + "-" * (width - filled) + "]"

    def _grade(self, pct: int) -> str:
        if pct == 100:
            return "S  — Perfect run!"
        if pct >= 80:
            return "A  — Excellent!"
        if pct >= 60:
            return "B  — Good work."
        if pct >= 40:
            return "C  — Keep practising."
        return    "D  — Don't give up!"
