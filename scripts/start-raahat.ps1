$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Find-Raahat {
  foreach ($port in 5173..5180) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$port/icons/icon.svg" -TimeoutSec 3
      if ($response.StatusCode -eq 200) {
        return "http://localhost:$port/"
      }
    } catch {}
  }
  return $null
}

$base = Find-Raahat

if (-not $base) {
  Write-Host ""
  Write-Host "  Starting Raahat..." -ForegroundColor Cyan
  Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm run dev" -WorkingDirectory $root

  for ($attempt = 1; $attempt -le 30 -and -not $base; $attempt++) {
    Start-Sleep -Seconds 2
    $base = Find-Raahat
  }
}

if ($base) {
  $phoneUrl = $null
  try {
    $route = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Sort-Object RouteMetric | Select-Object -First 1
    $ip = (Get-NetIPAddress -InterfaceIndex $route.InterfaceIndex -AddressFamily IPv4 | Select-Object -First 1).IPAddress
    if ($ip) { $phoneUrl = "http://${ip}:$(([Uri]$base).Port)/" }
  } catch {}

  Write-Host "  Raahat is ready: $base" -ForegroundColor Green
  if ($phoneUrl) {
    Write-Host "  Phone (same Wi-Fi): $phoneUrl" -ForegroundColor Yellow
  }
  Start-Process $base
  Start-Sleep -Seconds 4
  exit 0
}

Write-Host ""
Write-Host "  Raahat could not be started." -ForegroundColor Red
Write-Host "  Make sure Node.js is installed, then run: npm install"
Write-Host "  Then start it with: npm run dev"
Write-Host ""
Read-Host "  Press Enter to close"
exit 1
