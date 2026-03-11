$dirs = @(
    "H:\boringwebsite",
    "H:\boring",
    "H:\boring\projects\dailyfacts",
    "H:\boring\projects\datasets-directory",
    "H:\boring\projects\opensource-directory",
    "H:\boring\projects\tools-directory"
)

foreach ($dir in $dirs) {
    Write-Host "Processing $dir..."
    Set-Location $dir
    git add .
    git commit -m "chore: finalize CI/CD fixes, test coverage, and monetisation integrations"
    git push
}
Write-Host "All repositories pushed successfully."
