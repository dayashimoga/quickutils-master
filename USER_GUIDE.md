# User Guide

This guide is designed for operators adding new websites, tools, or dataset entities into the QuickUtils programmatic directory ecosystem.

## Adding Content

### 1. Understanding the Database
Every child project (e.g., `boilerplates-directory`, `apistatus-directory`) contains a `data/database.json` file. This specifies the pages the static site generator will build.

### 2. Modifying the `database.json`
To add a new entity, edit the respective `database.json` and add a new JSON object:
```json
{
  "name": "Super Awesome Tool",
  "category": "Utilities",
  "description": "A very succinct description of this tool.",
  "url": "https://example.com/tool",
  "auth": "OAuth",
  "cors": "yes",
  "https": true
}
```
*Note: The generator handles "slug" creation automatically during the build process if omitted.*

### 3. Generating the Site Locally
If you want to view the site before deploying:
1. Navigate to the project's subfolder: `cd projects/boilerplates-directory`
2. Sync the project (if you made template changes in master): `python scripts/sync_project_scripts.py`
3. Generate the directory: `python scripts/build_directory.py`
4. The generated HTML files will be located in the `dist/` directory. Look at `dist/index.html` to preview.

## Triggering a Deployment
Deployments are entirely automated. 
1. `git add projects/boilerplates-directory/data/database.json`
2. `git commit -m "Added Super Awesome Tool to boilerplates"`
3. `git push`

The CI/CD pipeline intelligently detects the changes and immediately signals Cloudflare to ingest and host your changes globally!
