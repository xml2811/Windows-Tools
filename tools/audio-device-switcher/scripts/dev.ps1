$ErrorActionPreference = "Stop"

$ToolPath = Split-Path -Parent $PSScriptRoot
Set-Location $ToolPath

Write-Host "Starting Audio Device Switcher in development mode..."
npm run tauri:dev
