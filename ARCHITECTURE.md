# Architecture Overview

## Architecture Tree

```mermaid
graph TD
    A[Root Master Repository: quickutils-master] -->|Manages Templates & Core Scripts| B(scripts/)
    A -->|Manages Global Infrastructure| C(terraform/)
    
    B -.->|Synchronized via sync_project_scripts.py| D[Child Project: boilerplates-directory]
    B -.->|Synchronized| E[Child Project: cheatsheets-directory]
    B -.->|Synchronized| F[Child Project: ...other directories]
    
    D --> D1[data/database.json]
    D --> D2[src/]
    D --> D3[scripts/]
    D --> D4[tests/]
    D --> D5[dist/ - Generated Output]
    
    C -->|Deploys to| G[Cloudflare Pages]
    D5 -.->|Automated Push via GitHub Actions| G
    
    H[GitHub Actions Workflow] -->|Triggers on push| I{Intelligent Routing}
    I -->|Core change| J[Build & Deploy All Projects]
    I -->|Project change| K[Build & Deploy Specific Project]
```

## System Workflow
1. **Data Ingestion**: Specific scripts (e.g., `fetch_data.py`) aggregate or parse initial dataset into localized `data/database.json`.
2. **Static Site Generation**: `build_directory.py` reads `database.json`, ingests Jinja templates from `src/templates`, and renders static files (HTML, JSON, XML) into the `dist/` directory.
3. **Synchronization**: `sync_project_scripts.py` ensures all child projects have the latest master scripts and shared templates before testing or generating content.
4. **Testing**: `pytest` traverses `tests/` directories to confirm generation boundaries, link integrity, and snippet logic.
5. **Deployment**: GitHub Actions catches pushes, determines the changed boundaries, and invokes Cloudflare deployments automatically based on Terraform pre-provisioned projects.
