import os

PIN_TEST = """import pytest
from scripts.generate_pins import generate_pinterest_images
from pathlib import Path

def test_generate_pins_smoke():
    # Placeholder execution
    generate_pinterest_images() 
"""

directories = [
    r"h:\boring",
    r"h:\boring\projects\datasets-directory",
    r"h:\boring\projects\opensource-directory",
    r"h:\boring\projects\tools-directory",
    r"h:\boring\projects\prompts-directory",
    r"h:\boring\projects\cheatsheets-directory",
    r"h:\boring\projects\boilerplates-directory",
    r"h:\boring\projects\jobs-directory",
    r"h:\boring\projects\apistatus-directory"
]

for d in directories:
    test_path = os.path.join(d, "tests", "test_generate_pins.py")
    with open(test_path, "w", encoding="utf-8") as f:
        f.write(PIN_TEST)
    print(f"Created {test_path}")
