# dsh-eva-skin installer: links this checkout (skin + files companion) into the
# dsh profile module fallback and registers their rows in the profile's user
# patch layer. Usage: powershell -ExecutionPolicy Bypass -File install.ps1 [ProfileName]
[CmdletBinding()]
param(
  # The dsh profile whose user patch layer gets the rows (default: web).
  [string]$ProfileName = 'web'
)

$ErrorActionPreference = 'Stop'

$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$repoDir = (Resolve-Path (Join-Path $PSScriptRoot '.')).Path

# 1. Link into the healed profiles module fallback ($DSH_HOME/profiles/node_modules).
$scopeDir = Join-Path $dshHome 'profiles\node_modules\@deepseek-ai'
New-Item -ItemType Directory -Force -Path $scopeDir | Out-Null
$pairs = @(
  @{ Name = 'dsh-client-ui-eva'; Target = $repoDir },
  @{ Name = 'dsh-eva-files'; Target = (Join-Path $repoDir 'files') }
)
foreach ($pair in $pairs) {
  $link = Join-Path $scopeDir $pair.Name
  if (-not (Test-Path $link)) {
    New-Item -ItemType Junction -Path $link -Target $pair.Target | Out-Null
    Write-Host "linked $link -> $($pair.Target)"
  } else {
    Write-Host "link already present: $link"
  }
}

# 2. Register the rows in the profile's user patch layer (idempotent).
$patchPath = Join-Path $dshHome "profiles\$ProfileName\cordis.patch.yml"
if (-not (Test-Path $patchPath)) {
  throw "profile patch not found: $patchPath (is the '$ProfileName' profile initialized?)"
}
$content = Get-Content $patchPath -Raw
if ($content -match 'dsh-client-ui-eva') {
  Write-Host "patch already contains the ui-eva row: $patchPath"
} else {
  $block = @'

# dsh-eva-skin: Evangelion theme + wallpaper (installed by install.ps1).
- insert:
    - id: ui-eva
      name: '@deepseek-ai/dsh-client-ui-eva'
    - id: eva-files
      name: '@deepseek-ai/dsh-eva-files'
'@
  if ($content.Trim() -eq '[]' -or $content.Trim() -eq '') {
    Set-Content -Path $patchPath -Value "# dsh-eva-skin: Evangelion theme + wallpaper (installed by install.ps1).`n- insert:`n    - id: ui-eva`n      name: '@deepseek-ai/dsh-client-ui-eva'`n    - id: eva-files`n      name: '@deepseek-ai/dsh-eva-files'`n"
  } else {
    Add-Content -Path $patchPath -Value $block
  }
  Write-Host "appended ui-eva row to $patchPath"
}

Write-Host ''
Write-Host 'Done. Refresh the dsh web GUI page (F5) to apply the skin.'
Write-Host 'If the skin does not appear, restart dsh web, then refresh again.'
