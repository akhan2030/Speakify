# Push Meta WhatsApp env vars from .env.local to Vercel production.
# Usage: fill WHATSAPP_* in .env.local, then run: .\scripts\push-whatsapp-env.ps1

$envFile = Join-Path $PSScriptRoot ".." ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN first."
  exit 1
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^([^#=]+)=(.*)$') {
    $vars[$matches[1].Trim()] = $matches[2].Trim().Trim('"')
  }
}

$required = @("WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN")
foreach ($name in $required) {
  if (-not $vars.ContainsKey($name) -or -not $vars[$name]) {
    Write-Error "Missing $name in .env.local"
    exit 1
  }
}

$optional = @(
  "WHATSAPP_OTP_TEMPLATE_NAME",
  "WHATSAPP_OTP_TEMPLATE_LANGUAGE",
  "WHATSAPP_API_VERSION"
)

Push-Location (Join-Path $PSScriptRoot "..")
try {
  foreach ($name in ($required + $optional)) {
    if ($vars.ContainsKey($name) -and $vars[$name]) {
      Write-Host "Setting $name on Vercel production..."
      $vars[$name] | npx vercel env add $name production --force
    }
  }
  Write-Host "Done. Run: npx vercel deploy --prod --yes"
} finally {
  Pop-Location
}
