# QuickUtils Monorepo Technical Architecture

## Architectural Overview
QuickUtils represents a horizontally scaled multi-application ecosystem originating from a monolithic repository configuration. It leverages automated discrete-repository sharding tied intrinsically into edge-accelerated deployments through Cloudflare Pages and Terraform workflows.

### 1. Codebase Philosophy
*   **Vanilla JS Priority**: Frameworkless vanilla JavaScript is utilized across 90% of the nodes (including intensive computation modules like physics simulators, game logic strings, and MNA circuit iterations). 
*   **Zero-Dependency Constraint**: No heavy front-end packaging ecosystems (Webpack, Babel) for individual utilities, maximizing raw speed.
*   **PWA Compliance**: All applications utilize the cached global core ecosystem script for progressive capabilities. 

---

## Core Operational Components

### 1. Orchestrated Distribution Layer
Rather than bridging the unified mono-repository directly to Cloudflare via localized route trees (which violently breaches Cloudflare parallel build constraints when scaling past 20 domains simultaneously), the distribution logic explicitly handles horizontal sharding.

*   `github_distribute.py`: Interrogates local active sub-projects, auto-provisions isolated GitHub repositories specifically mapped individually to tools, and recursively syncs the file architecture utilizing dynamic temp-checkout branches. 
*   **Selective Sync Constraints**: Utilizes automated `$CHANGED_PROJECTS` tracking derived from `git diff` payload variables to avoid deploying/resyncing unaffected sub-nodes during minor cross-network enhancements.

### 2. Infrastructure as Code (IaC) - Terraform
Cloudflare administration is fully detached from manual UI configuration via Terraform.

*   **Dynamic Source Binding**: Uses dynamically injected `terraform/projects.json` payloads updated continually by `generate_projects_json.py` to keep Terraform infrastructure maps natively synced with root configuration files (`project_config.json`).
*   **Native Domain CNAME Routing**: Overhauls standard `*.pages.dev` assignments seamlessly by provisioning mapped root `A` or `CNAME` variables dynamically alongside corresponding zone provisioning to bypass SSL validation delays. 

### 3. CI/CD Unified Workflow Strategy
A standardized GitHub Actions matrix (`ci.yml`) intercepts standard `push` protocols.
*   Runs isolated **Vitest** verification modules for complex local JS environments alongside deep mocked JSDOM environments for GUI simulation metrics without browser overhead. 
*   Maintains a global threshold validation requiring >90% code coverage. 
*   Simultaneous testing layers provided via cross-compatable orchestrated **Docker** multi-environment instances (`Dockerfile.test`).
