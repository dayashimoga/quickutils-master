# Troubleshooting & Code Understanding Guide

If a build is failing or templates render incorrectly, this document explains how the QuickUtils engine is layered so you know exactly where to apply fixes.

## Folder Index Breakdown

### 1. `data/`
- **What it does:** Holds `database.json`. This is the single source of truth for the generated content of any project.
- **Troubleshoot:** If a new website/item is not appearing, check for JSON syntax errors or missing required keys like `title`, `description`, or `url`.

### 2. `src/templates/`
- **What it does:** Contains the Jinja2 HTML blueprints (`index.html`, `item.html`, `category.html`).
- **Troubleshoot:** If AdSense, social media tags, or Google Analytics are missing from the live site, ensure the flags (e.g., `{% if enable_adsense %}`) evaluated to true, and verify `scripts/utils.py` correctly passed those environment variables into `env.globals.update()`.

### 3. `scripts/`
- **What it does:** The workhorse Python utilities bridging `data` and `src`.
  - `build_directory.py`: The orchestrator that loads the JSON and iterates through templates.
  - `utils.py`: The path resolution module mapping `DATA_DIR` and `SRC_DIR`.
  - `sync_project_scripts.py`: The distributor that clones scripts out against the child branches.
- **Troubleshoot:** If you see `TemplateNotFound` or `FileNotFoundError`, it means `utils.py` failed its dynamic root-path checks. Always run `python scripts/sync_project_scripts.py` whenever you edit a root script, otherwise child projects will use outdated variants.

### 4. `dist/`
- **What it does:** The transient, ".gitignored" folder storing the HTML build. This is what Cloudflare ingests to host to the public.
- **Troubleshoot:** Never edit files inside `dist/`. They are overwritten on every build. 

## How To: Add a New Website Directory
Scenario: You want to deploy "Games Directory":
1. Create a `projects/games-directory` folder.
2. Inside it, create an empty `data/` folder and place your `database.json` inside it.
3. Add the project name to `terraform/projects.json`.
4. Run `python scripts/sync_project_scripts.py`. This will copy all `src` templates and `scripts` into the new `games-directory`.
5. Run `pytest projects/games-directory/tests/` to verify internal consistency.
6. Commit the folder. GitHub Actions will execute Terraform, deploy a new Cloudflare Pages project, and map it.

## Recognizing Failures
- **Cloudflare Build Fails finding `dist`**: The build command `python scripts/build_directory.py` likely failed silently due to malformed JSON. Read the Cloudflare logic logs.
- **"DID NOT RAISE" Error in Pytest**: The `test_utils.py` logic expected a `FileNotFoundError`, but your `load_database` dynamically suppressed it and returned `[]`. Re-align the expected fixture output in `conftest.py`.
