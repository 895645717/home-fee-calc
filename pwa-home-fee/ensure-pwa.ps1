param(
  [int]$Port = 4173,
  [string]$ProjectDir = "C:\Projects\daily_slills\pwa-home-fee"
)

function Get-LanIp {
  $ipconfigOutput = ipconfig
  $match = $ipconfigOutput | Select-String "IPv4 Address.*:"
  if ($match) {
    return ($match | Select-Object -First 1).ToString().Split(':')[-1].Trim()
  }
  return "127.0.0.1"
}

function Test-PortListening {
  param([int]$PortToCheck)
  $lines = netstat -ano -p tcp | Select-String (":$PortToCheck\\s")
  return [bool]($lines | Select-String "LISTENING")
}

function Test-HttpStatus {
  param([string]$Url)
  try {
    return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5).StatusCode
  } catch {
    return $_.Exception.Message
  }
}

$localUrl = "http://127.0.0.1:$Port/index.html"
$lanIp = Get-LanIp
$lanUrl = "http://${lanIp}:$Port/index.html"

if (-not (Test-PortListening -PortToCheck $Port)) {
  $pythonExe = if (Get-Command py -ErrorAction SilentlyContinue) { "py" } elseif (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { throw "Python not found" }
  $pythonArgs = if ($pythonExe -eq "py") { '-3 -m http.server ' + $Port + ' --bind 0.0.0.0 --directory "' + $ProjectDir + '"' } else { '-m http.server ' + $Port + ' --bind 0.0.0.0 --directory "' + $ProjectDir + '"' }
  Start-Process -FilePath cmd.exe -ArgumentList '/c','start','"pwa4173"','/min',$pythonExe,$pythonArgs -WorkingDirectory $ProjectDir | Out-Null
  Start-Sleep -Seconds 3
}

Write-Host "PortListening: $(Test-PortListening -PortToCheck $Port)"
Write-Host "LocalUrl    : $localUrl"
Write-Host "LocalStatus : $(Test-HttpStatus -Url $localUrl)"
Write-Host "LanUrl      : $lanUrl"
Write-Host "LanStatus   : $(Test-HttpStatus -Url $lanUrl)"
