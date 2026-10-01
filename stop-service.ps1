[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = $PSScriptRoot
$statePath = Join-Path $repositoryRoot ".runtime\service-process.json"

if (-not (Test-Path -LiteralPath $statePath)) {
  Write-Host "No relational service managed by .\start-service.ps1 is running."
  exit 0
}

$state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
$rootProcessId = [int] $state.processId
$rootProcess = Get-Process -Id $rootProcessId -ErrorAction SilentlyContinue

if ($null -eq $rootProcess) {
  Remove-Item -LiteralPath $statePath -Force
  Write-Host "Removed stale relational service state; its process was no longer running."
  exit 0
}

$actualStartTimeFileTimeUtc = [string] $rootProcess.StartTime.ToFileTimeUtc()
if ($actualStartTimeFileTimeUtc -ne [string] $state.startTimeFileTimeUtc) {
  Remove-Item -LiteralPath $statePath -Force
  throw "The recorded PID now belongs to another process. Stale state was removed without stopping it."
}

$taskKillCommand = Get-Command "taskkill.exe" -ErrorAction Stop
& $taskKillCommand.Source /PID $rootProcessId /T /F | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Windows could not stop the relational service process tree rooted at PID $rootProcessId."
}

Remove-Item -LiteralPath $statePath -Force
Write-Host "Relational service stopped."
