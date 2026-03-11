# Technical Requirements

## Executive Summary
This document outlines the core technical requirements, constraints, integrations, and operational standards for the Programmatic SEO Directory platform and its child projects.

## Core Environment & Tech Stack
- **Python 3.11+**: Primary scripting and build language.
- **Docker**: For isolated environment builds, testing, and dependency management.
- **Jinja2**: HTML templating engine used for generating static sites.
- **Fuse.js**: Client-side library used for full-text search capabilities across generated items.
- **pytest**: Test automation framework ensuring code quality and coverage.
- **Terraform 1.5+**: Infrastructure as Code (IaC) tool for provisioning Cloudflare Pages.

## Component Integrations & Parameters
Each project supports configurable integrations defined via environment variables or Terraform configs:
- **Google Analytics**: Requires `GA_MEASUREMENT_ID` (Default: `G-QPDP38ZCCV`).
- **Google AdSense**: Controlled by `ENABLE_ADSENSE` (Default: `True`) and `ADSENSE_PUBLISHER_ID` (Default: `ca-pub-5193703345853377`).
- **Amazon Affiliate**: Controlled by `ENABLE_AMAZON` (Default: `True`) and `AMAZON_AFFILIATE_TAG` (Default: `quickutils-20`).
- **Pinterest Automation**: Controlled by `ENABLE_PINTEREST` (Default: `True`).
- **Custom Domains**: Configured via Terraform (e.g., `[project-name].quickutils.top`).

## Operational Standards & CI/CD
1. **Test Coverage**: All code changes to core scripts or project-specific logics must maintain >90% code coverage.
2. **Test Checks**: A 100% test pass rate across all projects (including master and child repositories) is mandatory before deployment.
3. **Zero-Cost Infrastructure**: The platform relies on Cloudflare Pages and Terraform Cloud (for state management) to preserve a strict $0 hosting and infrastructure footprint.
4. **Intelligent Deployments**: CI/CD pipelines must selectively deploy updated projects instead of the entire suite to conserve build minutes.
5. **Programmatic SEO (pSEO)**: Rendered pages must strictly include valid HTML5 metadata, JSON-LD structured data, Open Graph (OG), and Twitter card configurations.
