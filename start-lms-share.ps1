# Speakify LMS — public gateway (Cloudflare quick tunnel)
# NOTE: trycloudflare.com URLs change each run. For a FIXED URL use a named
# Cloudflare tunnel + your domain, or deploy to Vercel. See GATEWAY.md

$root = $PSScriptRoot
$log = "$env:TEMP\cloudflared-speakify-lms.log"
$linksFile = Join-Path $root "PUBLIC_URL.txt"
$envFile = Join-Path $root ".env.local"

Write-Host "=== Speakify LMS Gateway ===" -ForegroundColor Cyan
Set-Location $root

# Ensure ports 3000 and 3001 are free (stale Next.js on wrong port breaks tunnel CSS)
foreach ($port in @(3000, 3001)) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
  try {
    $conn = Get-NetTCPConnection -OwningProcess $_.Id -LocalPort 3000,3001 -ErrorAction SilentlyContinue
    if ($conn) { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
  } catch {}
}
Start-Sleep -Seconds 2

# Stop only cloudflared (leave dev server running if possible)
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Ensure dev server on 3000
$devReady = $false
for ($i = 0; $i -lt 20; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) { $devReady = $true; break }
  } catch {}
  if ($i -eq 0) {
    Write-Host "Starting Next.js dev server..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm run dev" -WindowStyle Minimized
  }
  Start-Sleep -Seconds 2
}

if (-not $devReady) {
  Write-Host "ERROR: Dev server not responding on port 3000." -ForegroundColor Red
  exit 1
}

Write-Host "Dev server OK on http://localhost:3000"

Remove-Item $log -Force -ErrorAction SilentlyContinue
Start-Process -FilePath "cloudflared" -ArgumentList "tunnel", "--url", "http://127.0.0.1:3000" -RedirectStandardError $log -WindowStyle Hidden

$url = $null
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Path $log) {
    $match = Select-String -Path $log -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -AllMatches |
      ForEach-Object { $_.Matches } | Select-Object -Last 1
    if ($match) { $url = $match.Value; break }
  }
}

if (-not $url) {
  Write-Host "ERROR: Could not get tunnel URL. Log:" $log -ForegroundColor Red
  if (Test-Path $log) { Get-Content $log -Tail 25 }
  exit 1
}

# Update NEXTAUTH_URL in .env.local
if (Test-Path $envFile) {
  $envContent = Get-Content $envFile -Raw
  if ($envContent -match "(?m)^NEXTAUTH_URL=.*") {
    $envContent = $envContent -replace "(?m)^NEXTAUTH_URL=.*", "NEXTAUTH_URL=$url"
  } else {
    $envContent = $envContent.TrimEnd() + "`nNEXTAUTH_URL=$url`n"
  }
  Set-Content -Path $envFile -Value $envContent -NoNewline
  Write-Host "Updated NEXTAUTH_URL in .env.local" -ForegroundColor Green

  # Restart dev server so Next.js picks up the new NEXTAUTH_URL
  Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      $conn = Get-NetTCPConnection -OwningProcess $_.Id -LocalPort 3000 -ErrorAction SilentlyContinue
      if ($conn) { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    } catch {}
  }
  Start-Sleep -Seconds 2
  Write-Host "Restarting Next.js dev server for new auth URL..."
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm run dev" -WindowStyle Minimized
  Start-Sleep -Seconds 8
}

$links = @"
Speakify LMS — Public Gateway
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Base URL: $url

IMPORTANT: This URL is valid while cloudflared is running on this PC.
Re-run:  npm run share   (or .\\start-lms-share.ps1)

--- Links ---
IELTS Register:    $url/register/ielts-accelerator
Pathway Register:  $url/register/pathway
Placement test:    $url/placement-test
IELTS Dashboard:   $url/dashboard/ielts/student
Pathway Dashboard: $url/dashboard/pathway/student
Login:             $url/login
Student dashboard: $url/dashboard/student
My Course:         $url/dashboard/student/course
Study plan:        $url/dashboard/student/study-plan
Mock IELTS:        $url/mock-test
Speaking:          $url/dashboard/student/speaking
Full Speaking Mock: $url/dashboard/student/speaking/mock

--- Demo login ---
Student: ahmed@test.com / Speakify2026!
Admin:   admin@speakify.com / Speakify2026!
"@

Set-Content -Path $linksFile -Value $links
Set-Clipboard $url

Write-Host ""
Write-Host $links -ForegroundColor White
Write-Host ""
Write-Host "Copied base URL to clipboard. Full list saved to PUBLIC_URL.txt" -ForegroundColor Green
Write-Host "Restart npm run dev once if login fails after URL change." -ForegroundColor Yellow
