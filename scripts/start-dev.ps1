$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root ".runtime"
$pidFile = Join-Path $runtimeDir "dev-server.pid"

if (!(Test-Path $runtimeDir)) {
  New-Item -ItemType Directory -Path $runtimeDir | Out-Null
}

if (Test-Path $pidFile) {
  $existingPid = (Get-Content $pidFile -Raw).Trim()
  if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
    Write-Output "Development server already running (PID: $existingPid)."
    Write-Output "Visit: http://127.0.0.1:3000/"
    exit 0
  }
}

$process = Start-Process -FilePath "node" -ArgumentList "backend/server.mjs" -WorkingDirectory $root -PassThru
$process.Id | Set-Content -Path $pidFile -Encoding ascii

Start-Sleep -Seconds 1

try {
  $resp = Invoke-WebRequest -Uri "http://127.0.0.1:3000/health" -UseBasicParsing -TimeoutSec 5
  if ($resp.StatusCode -eq 200) {
    Write-Output "Development server started."
    Write-Output "Homepage: http://127.0.0.1:3000/"
    Write-Output "Health:   http://127.0.0.1:3000/health"
    exit 0
  }
  throw "Health check returned status $($resp.StatusCode)"
} catch {
  Write-Error "Failed to start development server: $_"
  if (Get-Process -Id $process.Id -ErrorAction SilentlyContinue) {
    Stop-Process -Id $process.Id -Force
  }
  if (Test-Path $pidFile) {
    Remove-Item $pidFile -Force
  }
  exit 1
}
