# missions.py
# Each mission is a dictionary with:
#   title       - short name shown to the player
#   story       - flavour text that sets the scene
#   goal        - what the player must make their code do
#   hint        - one-line nudge if they get stuck
#   starter     - the code the player starts with (edit this to win)
#   test        - a function(output: str) -> bool that checks correctness

MISSIONS = [
    {
        "id": 1,
        "title": "Mission 1: Hello, World!",
        "story": (
            "You've just joined the AI Research Lab.\n"
            "The lab's greeting system is broken — it prints nothing.\n"
            "Fix it so it says hello to the world."
        ),
        "goal": 'Make your code print exactly:  Hello, World!',
        "hint": "Use the print() function with the exact text.",
        "starter": (
            "# Fix this code so it prints: Hello, World!\n"
            "\n"
            "# Your code here:\n"
            "print(\"Hello, World!\")\n"
        ),
        "test": lambda output: output.strip() == "Hello, World!",
    },
    {
        "id": 2,
        "title": "Mission 2: The Sum Machine",
        "story": (
            "The lab's calculator AI is malfunctioning.\n"
            "It needs to add two numbers together.\n"
            "Write a function that returns the sum of a and b."
        ),
        "goal": "Define add(a, b) and print add(3, 7).  Expected output:  10",
        "hint": "def add(a, b): return a + b",
        "starter": (
            "# Complete the function so add(3, 7) prints 10\n"
            "\n"
            "def add(a, b):\n"
            "    pass  # replace 'pass' with your code\n"
            "\n"
            "print(add(3, 7))\n"
        ),
        "test": lambda output: output.strip() == "10",
    },
    {
        "id": 3,
        "title": "Mission 3: Even or Odd?",
        "story": (
            "The lab needs a classifier to sort numbers.\n"
            "Numbers 1-5 must be labelled Even or Odd.\n"
            "Print each on its own line."
        ),
        "goal": (
            "Print five lines:\n"
            "  1 Odd\n  2 Even\n  3 Odd\n  4 Even\n  5 Odd"
        ),
        "hint": "Use a for loop and the modulo operator %",
        "starter": (
            "# Loop through 1 to 5 and print '<number> Even' or '<number> Odd'\n"
            "\n"
            "for n in range(1, 6):\n"
            "    pass  # replace 'pass' with your logic\n"
        ),
        "test": lambda output: output.strip() == (
            "1 Odd\n2 Even\n3 Odd\n4 Even\n5 Odd"
        ),
    },
]
