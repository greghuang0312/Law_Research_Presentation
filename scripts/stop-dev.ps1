$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $root ".runtime/dev-server.pid"

if (!(Test-Path $pidFile)) {
  Write-Output "No running development server pid file found."
  exit 0
}

$serverPid = (Get-Content $pidFile -Raw).Trim()

if ($serverPid -and (Get-Process -Id $serverPid -ErrorAction SilentlyContinue)) {
  Stop-Process -Id $serverPid -Force
  Write-Output "Stopped development server (PID: $serverPid)."
} else {
  Write-Output "PID file exists but process is not running."
}

Remove-Item $pidFile -Force
