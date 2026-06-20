$ErrorActionPreference = "Stop"

$ToolPath = Split-Path -Parent $PSScriptRoot
$RepoPath = Split-Path -Parent (Split-Path -Parent $ToolPath)
$BackupRoot = Join-Path $RepoPath "_backups"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupZip = Join-Path $BackupRoot "manual-backup-audio-device-switcher-$Timestamp.zip"

New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null

$TempBackupDir = Join-Path $env:TEMP "mptech-manual-backup-audio-device-switcher-$Timestamp"

if (Test-Path $TempBackupDir) {
    Remove-Item $TempBackupDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $TempBackupDir | Out-Null

Copy-Item $ToolPath -Destination $TempBackupDir -Recurse -Force
Compress-Archive -Path (Join-Path $TempBackupDir "*") -DestinationPath $BackupZip -Force
Remove-Item $TempBackupDir -Recurse -Force

Write-Host "Backup created:"
Write-Host $BackupZip
