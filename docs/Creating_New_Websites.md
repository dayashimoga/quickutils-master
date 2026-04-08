# Adding New Websites to QuickUtils Network

This document standardizes the process for creating, registering, deploying, and monetizing new utility websites within the QuickUtils monorepo ecosystem. 

## 1. Local Code Scaffolding
Create your new project folder internally within the `projects/` directory.

```bash
mkdir projects/my-new-tool
cd projects/my-new-tool
touch index.html style.css script.js
```

### Required Files
*   **`index.html`**: Must utilize semantic HTML5 and link to the shared core libraries.
*   **`style.css`**: Core styling. (Consider reusing CSS variables from `quickutils-core.css`).
*   **`script.js`**: Core logic. Must remain vanilla Javascript footprint. 

> [!IMPORTANT]  
> All new apps **must** initialize the core integrations script at the end of their logic lifecycle:
> ```javascript
> if (typeof QU !== 'undefined') QU.init({ kofi: true, discover: true });
> ```

---

## 2. Global Orchestration Registration
The infrastructure scripts require registering the website details centrally before they can deploy or create independent GitHub components. 

### Register in `project_config.json`
Navigate to the root level `project_config.json` file and add your new app identifier:

```json
"my-new-tool": {
    "name": "My New Tool",
    "description": "Short description of what it does.",
    "SITE_URL": "https://mytool.quickutils.top",
    "favicon": "🔧"
}
```

> [!TIP]
> The exact `SITE_URL` parameter defined here determines what Cloudflare subdomain (`mytool.quickutils.top`) Terraform will subsequently provision.

---

## 3. Deployment Pipeline & Infrastructure Execution 
Do **NOT** manually configure domains in the Cloudflare Dashboard. Our deployment relies entirely on multi-repository syncing and Terraform bindings managed via Github Actions. 

### What Happens Automatically (Upon push to `main`):
1. **GitHub Distribution Step**: The python script (`scripts/github_distribute.py`) extracts your isolated project folder and provisions an identical standalone GitHub repository dynamically (`https://github.com/dayashimoga/my-new-tool`). 
2. **Terraform Generation**: `scripts/generate_projects_json.py` transforms your config entry into a Terraform schema payload (`terraform/projects.json`).
3. **Cloudflare Provisioning**: Terraform applies this config directly: it creates a Cloudflare Pages project, links it to the natively generated standalone GitHub origin repo, establishes `main` tracking, and assigns the custom CNAME.

### Trigger Deployment
Simply commit your changes and push. 
```bash
git add project_config.json projects/my-new-tool/
git commit -m "feat: add my new tool website"
git push
```

> [!WARNING]
> **GitHub Cloudflare App Permissions**: Cloudflare Pages connects to specific repositories via a GitHub OAuth application. For the downstream Terraform binding to succeed autonomously, you must ensure the installed **"Cloudflare Pages" GitHub app** is configured with "All Repositories" access in your personal GitHub App Integrations menu. If set to limited repo access, Cloudflare Terraform binds will throw a "No Git connection" state. 

---

## 4. Troubleshooting Cloudflare Linkages
If your site spins up, but shows a **522 Connection Timeout**:
*   **Symptom**: The URL is reachable, but Cloudflare acts as an unrouted proxy.
*   **Cause**: Generally occurs if the Terraform `.tf` source block defaults back to caching or points the CF project repo to a root configuration directory (`root_dir`) that conflicts with the discrete Github repositories. The CF page subsequently executes an empty build environment and hangs. 
*   **Resolution**: Check Git status output ensuring the Git Distribution job synced your downstream repo root accurately without `.root_dir` trailing logic in `projects.json`. 

If your site shows **No Git connection** inside Cloudflare Dashboard:
* Check your `main.tf` logic lifecycle blocks (`ignore_changes = [source]`) and ensure your GitHub permissions token hasn't expired.
