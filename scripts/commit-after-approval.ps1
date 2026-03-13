param(
  [Parameter(Mandatory = $true)]
  [string]$Message,
  [string]$AuthorName = "Greg Huang",
  [string]$AuthorEmail = "greg.huang@local.dev",
  [string]$Workdir = "."
)

$ErrorActionPreference = "Stop"

Push-Location $Workdir
try {
  if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git not found."
  }

  if (!(Test-Path ".git")) {
    git init | Out-Null
  }

  git add -A

  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Write-Output "No staged changes. Skip commit."
    exit 0
  }

  git -c user.name="$AuthorName" -c user.email="$AuthorEmail" commit -m "$Message" | Out-Null

  $hash = (git rev-parse --short HEAD).Trim()
  Write-Output "Committed: $hash"
} finally {
  Pop-Location
}
