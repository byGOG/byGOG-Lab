Param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Issue {
  param(
    [int]$Line,
    [string]$Ref,
    [string]$Status,
    [string]$Actual
  )
  $msg = "links.json:$Line `t $Status `t $Ref"
  if ($Actual) { $msg += " `t -> $Actual" }
  Write-Host $msg
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$iconDir = Join-Path $repoRoot 'icon'
$linksPath = Join-Path $repoRoot 'links.json'

if (-not (Test-Path $iconDir)) { throw "Icon directory not found: $iconDir" }
if (-not (Test-Path $linksPath)) { throw "links.json not found: $linksPath" }

$files = Get-ChildItem -Path $iconDir -File | Select-Object -ExpandProperty Name
$exactSet = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($f in $files) { [void]$exactSet.Add($f) }

$lowerMap = @{}
foreach ($f in $files) {
  $key = $f.ToLowerInvariant()
  if (-not $lowerMap.ContainsKey($key)) { $lowerMap[$key] = @() }
  $lowerMap[$key] += $f
}

$content = Get-Content -Path $linksPath -Raw
$regex = '"icon"\s*:\s*"icon\/([^"]+)"'
$matches = [System.Text.RegularExpressions.Regex]::Matches($content, $regex)

$issues = @()
foreach ($m in $matches) {
  $name = $m.Groups[1].Value
  $existsExact = $exactSet.Contains($name)
  $existsLower = $lowerMap.ContainsKey($name.ToLowerInvariant())
  if (-not $existsExact) {
    $pre = $content.Substring(0, $m.Index)
    $lineNum = ($pre -split "`n").Length
    if ($existsLower) {
      $actuals = ($lowerMap[$name.ToLowerInvariant()] -join ', ')
      $issues += [pscustomobject]@{ line=$lineNum; ref=$name; status='case-mismatch'; actual=$actuals }
    } else {
      $issues += [pscustomobject]@{ line=$lineNum; ref=$name; status='missing'; actual='' }
    }
  }
}

if ($issues.Count -gt 0) {
  Write-Host "Icon reference issues found:`n" -ForegroundColor Red
  foreach ($i in ($issues | Sort-Object line)) { Write-Issue -Line $i.line -Ref $i.ref -Status $i.status -Actual $i.actual }
  Write-Host "`nFailing due to icon reference issues." -ForegroundColor Red
  exit 1
}

Write-Host "All icon references in links.json are valid." -ForegroundColor Green
exit 0

