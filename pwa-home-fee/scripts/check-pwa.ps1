param(
  [int]$Port = 4173
)

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

function Test-HttpStatus {
  param([string]$Url)
  try {
    return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5).StatusCode
  } catch {
    return $_.Exception.Message
  }
}

$lanIp = Get-LanIp
$localUrl = "http://127.0.0.1:$Port/index.html"
$lanUrl = "http://${lanIp}:$Port/index.html"

Write-Host "PortListening: $(Test-PortListening -PortToCheck $Port)"
Write-Host "LocalUrl    : $localUrl"
Write-Host "LocalStatus : $(Test-HttpStatus -Url $localUrl)"
Write-Host "LanUrl      : $lanUrl"
Write-Host "LanStatus   : $(Test-HttpStatus -Url $lanUrl)"
