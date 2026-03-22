param([int]$Port = 4173)

$lines = cmd /c netstat -ano | Select-String ":$Port"
$pids = @()
foreach ($line in $lines) {
  $parts = ($line -replace "\s+", " ").Trim().Split(" ")
  if ($parts.Length -ge 5 -and $parts[1] -match ":$Port$") {
    $pids += $parts[-1]
  }
}
$pids = $pids | Select-Object -Unique
foreach ($pid in $pids) {
  try { Stop-Process -Id $pid -Force -ErrorAction Stop; Write-Output "STOPPED=$pid" } catch {}
}
