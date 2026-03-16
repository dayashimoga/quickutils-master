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
    build_command       = lookup(each.value, "build_command", "export PYTHONPATH=$PYTHONPATH:. && pip install -r requirements.txt && python scripts/fetch_data.py && python scripts/build_directory.py && python scripts/generate_sitemap.py")
    destination_dir     = lookup(each.value, "destination_dir", "dist")
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
        SRC_DIR              = lookup(each.value, "src_dir", "src")
        DATA_DIR             = lookup(each.value, "data_dir", "data")
        DIST_DIR             = lookup(each.value, "dist_dir", "dist")
        PROJECT_TYPE         = lookup(each.value, "project_type", each.key)
        SITE_URL             = "https://${each.value.custom_domain}"
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
        SRC_DIR              = lookup(each.value, "src_dir", "src")
        DATA_DIR             = lookup(each.value, "data_dir", "data")
        DIST_DIR             = lookup(each.value, "dist_dir", "dist")
        PROJECT_TYPE         = lookup(each.value, "project_type", each.key)
        SITE_URL             = "https://${each.value.custom_domain}"
      }
    }
  }
}

data "cloudflare_zone" "quickutils_top" {
  name = "quickutils.top"
}

resource "cloudflare_record" "quickutils_cnames" {
  for_each = local.projects
  zone_id  = data.cloudflare_zone.quickutils_top.id
  name     = each.value.custom_domain == "quickutils.top" ? "@" : split(".", each.value.custom_domain)[0]
  value    = "${each.value.repo_name}.pages.dev"
  type     = "CNAME"
  proxied  = true
  # Handle existing records by allowing overwrite
  allow_overwrite = true
}

resource "cloudflare_pages_domain" "quickutils_domains" {
  for_each     = local.projects
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.quickutils_projects[each.key].name
  domain       = each.value.custom_domain
}

# --- Email Routing for contact@quickutils.top ---

# 1. Add destination email (requires verification click by user)
resource "cloudflare_email_routing_address" "admin_email" {
  account_id = var.cloudflare_account_id
  email      = var.email_destination
}

# 2. Add routing rule
resource "cloudflare_email_routing_rule" "contact_forwarding" {
  zone_id = data.cloudflare_zone.quickutils_top.id
  name    = "contact-email-forwarding"
  enabled = true

  matcher {
    type  = "literal"
    field = "to"
    value = "contact@quickutils.top"
  }

  action {
    type  = "forward"
    value = [cloudflare_email_routing_address.admin_email.email]
  }
}
