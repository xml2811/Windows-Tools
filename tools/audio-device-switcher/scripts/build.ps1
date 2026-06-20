$ErrorActionPreference = "Stop"

$ToolPath = Split-Path -Parent $PSScriptRoot
Set-Location $ToolPath

Write-Host "Building Audio Device Switcher..."
npm run tauri:build
