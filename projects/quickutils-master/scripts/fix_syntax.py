import os

directories = [
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
    path = os.path.join(d, "scripts", "build_directory.py")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Address possible syntax errors introduced earlier
        if "def copy_static_assets():\n:" in content or "def copy_static_assets()::" in content or "def copy_static_assets()\n:" in content:
            content = content.replace("def copy_static_assets():\n:", "def copy_static_assets():\n")
            content = content.replace("def copy_static_assets()::", "def copy_static_assets():")
            content = content.replace("def copy_static_assets()\n:", "def copy_static_assets():\n")
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Fixed {path}")
        else:
            print(f"No syntax error found in {path}")
            
print("Syntax check complete.")
