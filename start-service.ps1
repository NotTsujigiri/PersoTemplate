[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repositoryRoot = $PSScriptRoot
$runtimeDirectory = Join-Path $repositoryRoot ".runtime"
$statePath = Join-Path $runtimeDirectory "service-process.json"
$standardOutputPath = Join-Path $runtimeDirectory "service.stdout.log"
$standardErrorPath = Join-Path $runtimeDirectory "service.stderr.log"
$configurationPath = Join-Path $repositoryRoot "relational-host.json"

function Remove-StaleState {
  if (Test-Path -LiteralPath $statePath) {
    Remove-Item -LiteralPath $statePath -Force
  }
}

function Test-Endpoint {
  param(
    [Parameter(Mandatory)] [string] $HostName,
    [Parameter(Mandatory)] [int] $Port
  )

  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    return $client.ConnectAsync($HostName, $Port).Wait(250) -and $client.Connected
  }
  catch {
    return $false
  }
  finally {
    $client.Dispose()
  }
}

New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null

if (Test-Path -LiteralPath $statePath) {
  $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
  $existingProcess = Get-Process -Id ([int] $state.processId) -ErrorAction SilentlyContinue
  if ($null -ne $existingProcess) {
    $actualStartTimeFileTimeUtc = [string] $existingProcess.StartTime.ToFileTimeUtc()
    if ($actualStartTimeFileTimeUtc -eq [string] $state.startTimeFileTimeUtc) {
      Write-Host "The relational service is already running (PID $($state.processId))."
      Write-Host "Open $($state.url)"
      exit 0
    }
  }
  Remove-StaleState
}

$configuration = Get-Content -Raw -LiteralPath $configurationPath | ConvertFrom-Json
$hostName = [string] $configuration.webHost.host
$port = [int] $configuration.webHost.port

if (Test-Endpoint -HostName $hostName -Port $port) {
  throw "Port $port is already in use by a service not managed by this repository script."
}

$npmCommand = Get-Command "npm.cmd" -ErrorAction Stop
$serviceProcess = Start-Process `
  -FilePath $npmCommand.Source `
  -ArgumentList @("run", "service") `
  -WorkingDirectory $repositoryRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $standardOutputPath `
  -RedirectStandardError $standardErrorPath `
  -PassThru

$token = [string] ($configuration.contributorProfile.contributors | Where-Object { $_.id -eq "relational-engine-web-bridge" }).options.token
$encodedToken = [Uri]::EscapeDataString($token)
$serviceUrl = "http://${hostName}:$port/?token=$encodedToken"
$state = [ordered]@{
  processId = $serviceProcess.Id
  startTimeFileTimeUtc = [string] $serviceProcess.StartTime.ToFileTimeUtc()
  url = $serviceUrl
}
$state | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding utf8

$deadline = [DateTime]::UtcNow.AddSeconds(30)
while ([DateTime]::UtcNow -lt $deadline) {
  $serviceProcess.Refresh()
  if ($serviceProcess.HasExited) {
    Remove-StaleState
    $errorOutput = if (Test-Path -LiteralPath $standardErrorPath) {
      Get-Content -Raw -LiteralPath $standardErrorPath
    } else {
      "No error output was produced."
    }
    throw "The relational service exited before becoming ready.`n$errorOutput"
  }

  if (Test-Endpoint -HostName $hostName -Port $port) {
    Write-Host "Relational service started (PID $($serviceProcess.Id))."
    Write-Host "Open $serviceUrl"
    Write-Host "Logs: $standardOutputPath and $standardErrorPath"
    exit 0
  }

  Start-Sleep -Milliseconds 200
}

throw "The relational service did not listen on ${hostName}:$port within 30 seconds. Run .\stop-service.ps1, then review $standardErrorPath."
