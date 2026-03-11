terraform {
  cloud {
    organization = "quickutils"
    workspaces {
      name = "quickutils_wn"
    }
  }
}

resource "cloudflare_pages_project" "quickutils_projects" {
  for_each          = local.projects
  account_id        = var.cloudflare_account_id
  name              = each.value.repo_name
  production_branch = "main"

  source {
    type = "github"
    config {
      owner                         = var.github_username
      repo_name                     = each.value.repo_name
      production_branch             = "main"
      pr_comments_enabled           = true
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "all"
      preview_branch_includes       = ["*"]
      preview_branch_excludes       = []
    }
  }

  build_config {
    build_command       = "pip install -r requirements.txt && python scripts/fetch_data.py && python scripts/build_directory.py && python scripts/generate_sitemap.py"
    destination_dir     = "dist"
    root_dir            = "" # This might need adjustment depending on mono-repo setup vs individual repos
  }

  deployment_configs {
    production {
      environment_variables = {
        GH_USERNAME          = var.github_username
        GA_MEASUREMENT_ID    = var.ga_measurement_id
        ADSENSE_PUBLISHER_ID = var.adsense_publisher_id
        AMAZON_AFFILIATE_TAG = var.amazon_affiliate_tag
        ENABLE_ADSENSE       = "true"
        ENABLE_AMAZON        = "true"
        ENABLE_PINTEREST     = "true"
        PYTHON_VERSION       = "3.11"
      }
    }
    preview {
      environment_variables = {
        GH_USERNAME          = var.github_username
        GA_MEASUREMENT_ID    = var.ga_measurement_id
        ADSENSE_PUBLISHER_ID = var.adsense_publisher_id
        AMAZON_AFFILIATE_TAG = var.amazon_affiliate_tag
        ENABLE_ADSENSE       = "true"
        ENABLE_AMAZON        = "true"
        ENABLE_PINTEREST     = "true"
        PYTHON_VERSION       = "3.11"
      }
    }
  }
}

# Optional: Custom Domains (Example for one project)
# resource "cloudflare_pages_domain" "example" {
#   account_id   = var.cloudflare_account_id
#   project_name = cloudflare_pages_project.quickutils_projects["opensource"].name
#   domain       = "opensource.quickutils.top"
# }
