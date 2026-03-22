$ErrorActionPreference = "Stop"

$sdk = "C:\Users\zhouqiyu\android-sdk"
$platformTools = Join-Path $sdk "platform-tools"
$adb = Join-Path $platformTools "adb.exe"

if (-not (Test-Path $adb)) {
  throw "未找到 adb：$adb"
}

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
if ($env:Path -notlike "*$platformTools*") {
  $env:Path = "$platformTools;$env:Path"
}

& $adb devices
