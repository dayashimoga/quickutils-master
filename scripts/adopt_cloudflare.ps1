# adopt_cloudflare.ps1
# This script helps to import existing Cloudflare Pages projects and Custom Domains into your local Terraform state.

$ACCOUNT_ID = $env:CLOUDFLARE_ACCOUNT_ID
$CF_API_TOKEN = $env:CLOUDFLARE_API_TOKEN

if (-not $ACCOUNT_ID -or -not $CF_API_TOKEN) {
    Write-Host "❌ Error: CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN environment variables not found." -ForegroundColor Red
    Write-Host "Please set them first:"
    Write-Host '$env:CLOUDFLARE_ACCOUNT_ID = "your_id"'
    Write-Host '$env:CLOUDFLARE_API_TOKEN = "your_token"'
    exit 1
}

$PROJECTS_JSON = "terraform/projects.json"
if (-not (Test-Path $PROJECTS_JSON)) {
    Write-Host "❌ Error: $PROJECTS_JSON not found. Run this from the repository root." -ForegroundColor Red
    exit 1
}

$projects = Get-Content $PROJECTS_JSON | ConvertFrom-Json
$headers = @{
    "Authorization" = "Bearer $CF_API_TOKEN"
    "Content-Type"  = "application/json"
}

cd terraform
if (-not (Test-Path ".terraform")) {
    Write-Host "🚀 Initializing Terraform..."
    terraform init
}

foreach ($prop in $projects.PSObject.Properties) {
    $key = $prop.Name
    $val = $prop.Value
    $repo = $val.repo_name
    $domain = $val.custom_domain

    Write-Host "`n🔍 Checking Project: $repo ($key)..." -ForegroundColor Cyan

    # 1. Check Project
    $url = "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$repo"
    try {
        $res = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
        Write-Host "  ✅ Project exists in Cloudflare." -ForegroundColor Green
        
        # Check if in state
        $state = terraform state show "cloudflare_pages_project.quickutils_projects[`"$key`"]" 2>$null
        if (-not $state) {
            Write-Host "  🚀 Importing project into Terraform state..." -ForegroundColor Yellow
            terraform import "cloudflare_pages_project.quickutils_projects[`"$key`"]" "$ACCOUNT_ID/$repo"
        } else {
            Write-Host "  ✅ Project already in state." -ForegroundColor Green
        }

        # 2. Check Custom Domain
        if ($domain) {
            $domUrl = "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$repo/domains/$domain"
            try {
                $domRes = Invoke-RestMethod -Uri $domUrl -Headers $headers -Method Get
                Write-Host "  ✅ Custom Domain $domain exists in Cloudflare." -ForegroundColor Green
                
                $domState = terraform state show "cloudflare_pages_domain.quickutils_domains[`"$key`"]" 2>$null
                if (-not $domState) {
                    Write-Host "  🚀 Importing domain into Terraform state..." -ForegroundColor Yellow
                    terraform import "cloudflare_pages_domain.quickutils_domains[`"$key`"]" "$ACCOUNT_ID/$repo/$domain"
                } else {
                    Write-Host "  ✅ Domain already in state." -ForegroundColor Green
                }
            } catch {
                Write-Host "  ℹ️ Custom Domain $domain not found in Cloudflare (will be created by Terraform)." -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "  ℹ️ Project $repo not found in Cloudflare (will be created by Terraform)." -ForegroundColor Gray
    }
}

Write-Host "`n🏁 Adoption complete! You can now run 'terraform apply'." -ForegroundColor Green
