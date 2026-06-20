$ErrorActionPreference = "Stop"

$ToolPath = Split-Path -Parent $PSScriptRoot
$RepoPath = Split-Path -Parent (Split-Path -Parent $ToolPath)
$ReleasePath = Join-Path $RepoPath "releases\audio-device-switcher"
$BuiltExe = Join-Path $ToolPath "src-tauri\target\release\audio-device-switcher.exe"
$ReleaseExe = Join-Path $ReleasePath "audio-device-switcher.exe"

if (!(Test-Path $BuiltExe)) {
    throw "Built exe not found: $BuiltExe"
}

New-Item -ItemType Directory -Force -Path $ReleasePath | Out-Null
Copy-Item $BuiltExe $ReleaseExe -Force

$Hash = Get-FileHash $ReleaseExe -Algorithm SHA256
Set-Content -Path (Join-Path $ReleasePath "checksums.txt") -Value "SHA256  $($Hash.Hash)  audio-device-switcher.exe" -Encoding UTF8

Write-Host "Portable release copied to:"
Write-Host $ReleaseExe
Write-Host "SHA256:"
Write-Host $Hash.Hash
