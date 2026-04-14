# ai_system.py
# Simulates an AI assistant that responds to player prompts.
#
# Key idea: the QUALITY of the player's prompt determines how useful
# the response is. This teaches prompt engineering as a mechanic.
#
# Scoring breakdown (max 8 points):
#   Length    0-3 pts  (longer = more detail = better)
#   Question  0-1 pt   (ends with or contains '?')
#   Keywords  0-2 pts  (uses terms relevant to the current mission)
#   Context   0-2 pts  (shows effort: "I tried", "I get an error", etc.)
#
# Tiers:
#   0-2 → Tier 1: Poor     (vague, unhelpful response)
#   3-4 → Tier 2: Okay     (general nudge)
#   5-6 → Tier 3: Good     (specific guidance)
#   7-8 → Tier 4: Excellent (step-by-step explanation)

# ── Scoring constants ──────────────────────────────────────────────────────────

# Words that show the player is providing context about what they tried
CONTEXT_WORDS = [
    "i tried", "i'm getting", "im getting", "i get", "i keep",
    "not working", "doesn't work", "doesn't print", "error",
    "wrong", "expected", "but", "why", "how do i", "what does",
    "what is", "can you explain", "i don't understand",
]

TIER_LABELS = {1: "Poor", 2: "Okay", 3: "Good", 4: "Excellent"}

TIER_THRESHOLDS = [(7, 4), (5, 3), (3, 2), (0, 1)]  # (min_score, tier)


# ── Per-mission AI responses at each tier ─────────────────────────────────────
# Each response is written to match what a real AI would say if given
# that quality of prompt — poor prompts get unhelpful generic answers.

RESPONSES = {
    1: {  # Mission: Hello, World!
        1: (
            "Try checking the Python documentation for output functions."
        ),
        2: (
            "Python has a built-in function that displays text on screen. "
            "Make sure you're calling it correctly."
        ),
        3: (
            "Use the print() function to output text. Pass your message as "
            "a string inside quotes: print(\"your message here\"). "
            "Check that the text matches exactly what's required."
        ),
        4: (
            "The print() function writes text to the screen. It takes a "
            "string argument — text wrapped in quotes.\n\n"
            "  print(\"Hello, World!\")\n\n"
            "Python is case-sensitive and punctuation counts, so "
            "\"Hello, World!\" must match exactly: capital H, capital W, "
            "a comma, a space, and an exclamation mark."
        ),
    },
    2: {  # Mission: The Sum Machine
        1: (
            "Review how Python functions work."
        ),
        2: (
            "Your function currently does nothing — 'pass' is just a "
            "placeholder. You need to give it a body that computes a result."
        ),
        3: (
            "Replace 'pass' with a return statement. To add two numbers "
            "together in Python, use the + operator and return the result: "
            "return a + b."
        ),
        4: (
            "A function that just has 'pass' returns None — it does nothing.\n\n"
            "To fix it, replace 'pass' with:\n"
            "  return a + b\n\n"
            "The 'return' keyword sends a value back to whoever called the "
            "function. The '+' operator adds two numbers. So add(3, 7) will "
            "compute 3 + 7 and return 10, which print() then displays."
        ),
    },
    3: {  # Mission: Even or Odd?
        1: (
            "Look into Python loops and conditional statements."
        ),
        2: (
            "Inside your loop you need to decide whether each number is "
            "even or odd, then print the right label. An if/else block "
            "will help."
        ),
        3: (
            "Use the modulo operator % to check divisibility. If n % 2 == 0 "
            "the number is even; otherwise it's odd. Build that into an "
            "if/else and print the number and label together."
        ),
        4: (
            "The % operator gives the remainder after division. "
            "n % 2 is 0 for even numbers and 1 for odd ones.\n\n"
            "Replace 'pass' with:\n"
            "  if n % 2 == 0:\n"
            "      label = \"Even\"\n"
            "  else:\n"
            "      label = \"Odd\"\n"
            "  print(n, label)\n\n"
            "print(n, label) automatically puts a space between them, "
            "so it prints '2 Even' exactly as required."
        ),
    },
}


# ── Scoring logic ──────────────────────────────────────────────────────────────

def _score_length(prompt: str) -> tuple[int, str]:
    n = len(prompt.strip())
    if n < 10:
        return 0, f"Very short ({n} chars) — AI can't tell what you need"
    if n < 30:
        return 1, f"Short ({n} chars) — a bit more detail would help"
    if n < 60:
        return 2, f"Medium ({n} chars) — decent amount of context"
    return 3, f"Detailed ({n} chars) — great, more context = better help"


def _score_question(prompt: str) -> tuple[int, str]:
    if "?" in prompt:
        return 1, "Contains a question — AI knows what you want to know"
    return 0, "No question mark — try asking a specific question"


def _score_keywords(prompt: str, keywords: list) -> tuple[int, str]:
    lower = prompt.lower()
    hits = [kw for kw in keywords if kw.lower() in lower]
    pts = min(len(hits), 2)
    if pts == 0:
        return 0, "No relevant terms — mention the specific thing you're working on"
    if pts == 1:
        return 1, f"Used relevant term: '{hits[0]}'"
    return 2, f"Used relevant terms: {', '.join(repr(h) for h in hits[:3])}"


def _score_context(prompt: str) -> tuple[int, str]:
    lower = prompt.lower()
    hits = [cw for cw in CONTEXT_WORDS if cw in lower]
    pts = min(len(hits), 2)
    if pts == 0:
        return 0, "No context — try describing what you tried or what went wrong"
    if pts == 1:
        return 1, f"Some context ('{hits[0]}') — good start"
    return 2, "Strong context — you explained your situation clearly"


def score_prompt(prompt: str, keywords: list) -> dict:
    """
    Analyse a prompt and return a full breakdown dict:
    {
        'total': int,           # 0-8
        'tier': int,            # 1-4
        'tier_label': str,
        'breakdown': [          # list of (category, points, feedback) tuples
            ('Length',   pts, msg),
            ('Question', pts, msg),
            ('Keywords', pts, msg),
            ('Context',  pts, msg),
        ]
    }
    """
    l_pts, l_msg = _score_length(prompt)
    q_pts, q_msg = _score_question(prompt)
    k_pts, k_msg = _score_keywords(prompt, keywords)
    c_pts, c_msg = _score_context(prompt)

    total = l_pts + q_pts + k_pts + c_pts

    tier = 1
    for min_score, t in TIER_THRESHOLDS:
        if total >= min_score:
            tier = t
            break

    return {
        "total": total,
        "tier": tier,
        "tier_label": TIER_LABELS[tier],
        "breakdown": [
            ("Length",   l_pts, l_msg),
            ("Question", q_pts, q_msg),
            ("Keywords", k_pts, k_msg),
            ("Context",  c_pts, c_msg),
        ],
    }


# ── Public API ─────────────────────────────────────────────────────────────────

def ask_ai(prompt: str, mission: dict) -> dict:
    """
    Main entry point. Given a player's prompt and the current mission,
    return a dict with the AI response and quality analysis.

    Returns:
    {
        'response':    str,   # the simulated AI reply
        'score':       dict,  # full score breakdown from score_prompt()
    }
    """
    keywords = mission.get("keywords", [])
    score = score_prompt(prompt, keywords)
    response = RESPONSES[mission["id"]][score["tier"]]
    return {"response": response, "score": score}


def format_ai_output(result: dict) -> str:
    """
    Build the display string shown to the player after they ask a question.
    Shows the AI response, then the prompt quality breakdown.
    """
    score = result["score"]
    lines = []

    # ── AI Response ────────────────────────────────────────────────────────
    lines.append("")
    lines.append("  ── AI RESPONSE " + "─" * 25)
    lines.append("")
    for line in result["response"].splitlines():
        lines.append(f"    {line}")
    lines.append("")

    # ── Prompt Quality Report ──────────────────────────────────────────────
    lines.append("  ── PROMPT QUALITY REPORT " + "─" * 14)
    lines.append(
        f"  Score: {score['total']}/8  →  Tier {score['tier']}: "
        f"{score['tier_label']}"
    )
    lines.append("")
    for category, pts, msg in score["breakdown"]:
        bar = "+" * pts + "·" * (3 - pts) if category != "Question" else ("+" if pts else "·")
        lines.append(f"    {category:<10} [{bar}]  {msg}")
    lines.append("")

    # Coaching tip based on tier
    tips = {
        1: "Tip: Add more detail — what are you trying to do and what went wrong?",
        2: "Tip: Mention what you've already tried and ask a specific question.",
        3: "Tip: Great prompt! Include the exact error or output to get even more help.",
        4: "Tip: Excellent prompt! This is how professionals ask for help.",
    }
    lines.append(f"  {tips[score['tier']]}")
    lines.append("  " + "─" * 39)

    return "\n".join(lines)
