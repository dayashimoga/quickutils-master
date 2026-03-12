# Configuration Guide

This guide covers step-by-step configuration for each project, specifically parameterizing Cloudflare Pages metrics, generic metadata overrides, and infrastructure state management.

## Project Parameters & Feature Flags
Each project deployed to Cloudflare relies entirely on injected Environment Variables. These can be set inside `terraform/main.tf` under the `deployment_configs` block or via `projects.json`.

### Available Parameters
| Parameter | Description | Default Value | Required? |
|-----------|-------------|---------------|-----------|
| `GA_MEASUREMENT_ID` | Google Analytics Identifier | `G-QPDP38ZCCV` | No |
| `ADSENSE_PUBLISHER_ID`| Identifies the account to receive AdSense income | `ca-pub-5193703345853377` | No |
| `AMAZON_AFFILIATE_TAG`| Append affiliate id to links | `quickutils-20` | No |
| `ENABLE_ADSENSE` | Render `<ins>` blocks inside templates | `true` | No (Can be `false`) |
| `ENABLE_AMAZON` | Render Recommended reading modules | `true` | No (Can be `false`) |
| `ENABLE_PINTEREST` | Append automated pin scripts | `true` | No (Can be `false`) |

### Adding a Custom Domain
Custom domains are managed inside `terraform/main.tf` using the `cloudflare_pages_domain` resource. To add one:
1. Locate the terraform resource:
```hcl
resource "cloudflare_pages_domain" "custom" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.quickutils_projects["my-new-project"].name
  domain       = "newdomain.com"
}
```
2. Commit the change, and Terraform will automatically map the Cloudflare Pages deployment to your custom URL.

## Terraform State Management
To provision multiple Cloudflare Pages resources effectively, we utilize Terraform. However, storing `terraform.tfstate` directly in a Git repository poses a massive security risk to API tokens. 

**How it is handled securely for free:**
Our `terraform/main.tf` uses a `cloud` backend block routing to **Terraform Cloud** (HashiCorp):
```hcl
terraform {
  cloud {
    organization = "quickutils"
    workspaces {
      name = "quickutils_wn"
    }
  }
}
```
* **Security**: Terraform Cloud securely encrypts your state. The `.gitignore` prevents unauthenticated local `*.tfstate` traces from leaking to GitHub.
* **Cost**: Terraform Cloud provides a generous continuous free tier specifically designed to handle single-state organizational infrastructure safely.
