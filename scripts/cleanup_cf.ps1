$projects = @(
    "emoji-kitchen", "meal-planner", "meditation-journey", 
    "garden-planner", "ai-prompt-builder", "unit-converter", 
    "keyboard-tester", "quickutils-master", "dailyfacts", 
    "color-palette", "password-fortress"
)

foreach ($p in $projects) {
    Write-Host "Fetching domains for $p..."
    $domainsStr = npx wrangler@latest pages domain list --project-name $p 2>$null
    if ($LASTEXITCODE -eq 0 -and $domainsStr) {
        $lines = $domainsStr -split "`n"
        foreach ($line in $lines) {
            if ($line -match "│\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*│" -and $line -notmatch "pages\.dev" -and $line -notmatch "Domain") {
                $domain = $matches[1]
                Write-Host "Detaching domain $domain from $p"
                npx wrangler@latest pages domain delete $domain --project-name $p --yes
            }
        }
    }
    
    Write-Host "Deleting project $p..."
    npx wrangler@latest pages project delete $p --yes
}
Write-Host "Cleanup Complete!"
