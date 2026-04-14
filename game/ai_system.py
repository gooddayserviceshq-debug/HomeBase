# ai_system.py
# AI assistant for the Python game.
#
# How the Claude API fits in:
#   ask_ai() → tries _call_claude_api() first.
#   If Claude is unavailable (no key, no network, any error) it falls back
#   to RESPONSES[], the hand-written tier responses from before.
#
# The prompt quality score still matters:
#   It's passed to Claude via the system prompt, which instructs Claude
#   to be more or less helpful depending on tier. So a poor prompt still
#   gets a vague response — Claude just writes it dynamically now.
#
# Security:
#   API key is read from the ANTHROPIC_API_KEY environment variable only.
#   Never hardcoded. Load from game/.env file if present (no extra packages).
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

import os

# ── .env loader (no extra packages needed) ─────────────────────────────────────

def _load_env():
    """
    Read game/.env and push any KEY=VALUE lines into os.environ.
    Skips blank lines and comments. Never overwrites existing env vars.
    Call once at module load time.
    """
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

_load_env()   # run at import time so the key is always available


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


# ── Claude API call ────────────────────────────────────────────────────────────

# System prompt template sent to Claude on every ask.
# The tier instruction is the key: it tells Claude how helpful to be,
# so the prompt quality mechanic still works with the real API.
_SYSTEM_TEMPLATE = """\
You are a helpful AI assistant inside an educational Python game called "The Lab".

CURRENT MISSION
  Title : {title}
  Goal  : {goal}

PLAYER'S CURRENT CODE
```python
{code}
```

RESPONSE RULES — follow these exactly:
  Tier 1 (Poor prompt)      : Give only a vague hint. Do NOT mention specific \
functions, operators, or code. One sentence max.
  Tier 2 (Okay prompt)      : Give a general nudge. Mention the concept but \
not the syntax. Two sentences max.
  Tier 3 (Good prompt)      : Give specific guidance with the relevant syntax. \
No complete solution. Three sentences max.
  Tier 4 (Excellent prompt) : Give a clear explanation and a short code example \
that illustrates the concept (not the full answer). Four sentences max.

The player's prompt quality is Tier {tier} ({tier_label}).
Respond at that tier level. Be encouraging. Never give the complete solution.\
"""


def _call_claude_api(
    player_prompt: str,
    mission: dict,
    score: dict,
    current_code: str,
) -> str | None:
    """
    Send the player's question to Claude and return its response text.
    Returns None if:
      - the anthropic package is not installed
      - ANTHROPIC_API_KEY is not set
      - any network or API error occurs
    Callers should fall back to RESPONSES[] when this returns None.
    """
    # Lazy import — game still works if anthropic isn't installed
    try:
        import anthropic
    except ImportError:
        return None

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    system = _SYSTEM_TEMPLATE.format(
        title=mission["title"],
        goal=mission["goal"],
        code=current_code.strip() or "(player has not written any code yet)",
        tier=score["tier"],
        tier_label=score["tier_label"],
    )

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",  # fast + affordable for a game
            max_tokens=250,
            system=system,
            messages=[{"role": "user", "content": player_prompt}],
        )
        return message.content[0].text
    except Exception:
        # Any API error (rate limit, network, invalid key) → use fallback
        return None


# ── Public API ─────────────────────────────────────────────────────────────────

def ask_ai(prompt: str, mission: dict, current_code: str = "") -> dict:
    """
    Main entry point. Given a player's prompt, the current mission,
    and the player's current code, return an AI response + quality analysis.

    Tries the Claude API first; falls back to hand-written RESPONSES[]
    if Claude is unavailable for any reason.

    Returns:
    {
        'response':    str,   # the AI reply (Claude or fallback)
        'score':       dict,  # full score breakdown from score_prompt()
        'source':      str,   # 'claude' or 'fallback'
    }
    """
    keywords = mission.get("keywords", [])
    score = score_prompt(prompt, keywords)

    # ← THE API CALL LIVES HERE
    response = _call_claude_api(prompt, mission, score, current_code)
    source = "claude"

    if response is None:                          # fallback if API unavailable
        response = RESPONSES[mission["id"]][score["tier"]]
        source = "fallback"

    return {"response": response, "score": score, "source": source}


def format_ai_output(result: dict) -> str:
    """
    Build the display string shown to the player after they ask a question.
    Shows the AI response, then the prompt quality breakdown.
    """
    score = result["score"]
    source = result.get("source", "fallback")
    lines = []

    # ── AI Response ────────────────────────────────────────────────────────
    header = "  ── CLAUDE " if source == "claude" else "  ── AI RESPONSE "
    lines.append("")
    lines.append(header + "─" * (40 - len(header)))
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
