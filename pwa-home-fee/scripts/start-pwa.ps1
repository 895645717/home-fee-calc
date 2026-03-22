param(
  [int]$Port = 4173,
  [string]$ProjectDir = ""
)

$ErrorActionPreference = "Stop"

if (-not $ProjectDir) {
  $ProjectDir = Join-Path (Split-Path $PSScriptRoot -Parent) "dist"
}

function Get-LanIp {
  $match = ipconfig | Select-String "IPv4 Address.*:"
  if ($match) {
    return ($match | Select-Object -First 1).ToString().Split(":")[-1].Trim()
  }
  return "127.0.0.1"
}

function Test-PortListening {
  param([int]$PortToCheck)
  $lines = netstat -ano -p tcp | Select-String (":$PortToCheck\\s")
  return [bool]($lines | Select-String "LISTENING")
}

$localUrl = "http://127.0.0.1:$Port/index.html"
$lanIp = Get-LanIp
$lanUrl = "http://${lanIp}:$Port/index.html"

if (Test-PortListening -PortToCheck $Port) {
  Write-Host "PWA service already running."
  Write-Host "PWA local: $localUrl"
  Write-Host "PWA LAN  : $lanUrl"
  exit 0
}

Write-Host "Starting PWA service..."
Write-Host "PWA local: $localUrl"
Write-Host "PWA LAN  : $lanUrl"
Write-Host "Press Ctrl+C to stop server."

$python = if (Get-Command py -ErrorAction SilentlyContinue) { "py -3" } elseif (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { throw "Python not found" }
Invoke-Expression "$python -m http.server $Port --bind 0.0.0.0 --directory `"$ProjectDir`""
