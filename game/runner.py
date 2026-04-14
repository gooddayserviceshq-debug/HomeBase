# runner.py
# Runs the player's code in a safe sandbox and captures the output.
#
# How it works:
#   1. We redirect sys.stdout so print() writes to a StringIO buffer
#      instead of the real terminal.
#   2. We exec() the code string inside a try/except so errors don't
#      crash the whole game — they're shown as friendly messages.
#   3. We restore stdout no matter what (the finally block).

import sys
import io


def run_code(code: str) -> tuple[bool, str]:
    """
    Execute `code` and return (success, output_or_error).

    success == True  → code ran without exceptions, output is stdout text
    success == False → code raised an exception, output is the error message
    """
    # Capture everything printed during execution
    captured = io.StringIO()
    old_stdout = sys.stdout

    try:
        sys.stdout = captured
        exec(code, {})          # {} gives a clean namespace per run
        output = captured.getvalue()
        return True, output

    except Exception as error:
        # Return the error type and message so the player knows what went wrong
        error_type = type(error).__name__
        return False, f"{error_type}: {error}"

    finally:
        sys.stdout = old_stdout  # always restore, even if exec() crashed
