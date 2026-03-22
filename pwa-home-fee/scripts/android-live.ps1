$ErrorActionPreference = "Stop"

$sdk = "C:\Users\zhouqiyu\android-sdk"
$platformTools = Join-Path $sdk "platform-tools"
$adb = Join-Path $platformTools "adb.exe"

if (-not (Test-Path $adb)) {
  throw "adb not found: $adb"
}

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
if ($env:Path -notlike "*$platformTools*") {
  $env:Path = "$platformTools;$env:Path"
}

Write-Host "Using ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "Starting Capacitor Live Reload..."

$hostIp = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -like "192.168.*" -or
    $_.IPAddress -like "10.*" -or
    $_.IPAddress -like "172.16.*" -or
    $_.IPAddress -like "172.17.*" -or
    $_.IPAddress -like "172.18.*" -or
    $_.IPAddress -like "172.19.*" -or
    $_.IPAddress -like "172.2?.*" -or
    $_.IPAddress -like "172.3?.*"
  } |
  Select-Object -ExpandProperty IPAddress -First 1

if (-not $hostIp) {
  throw "No LAN IPv4 address found."
}

Write-Host "Live Reload Host: $hostIp"
npx cap run android -l --host $hostIp --port 4173
