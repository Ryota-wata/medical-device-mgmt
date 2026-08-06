param(
  [Parameter(Mandatory = $true)]
  [string]$SpecPath,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $SpecPath)) {
  throw "Spec not found: $SpecPath"
}

$resolvedSpec = (Resolve-Path -LiteralPath $SpecPath).Path
$spec = & $resolvedSpec
$json = $spec | ConvertTo-Json -Depth 100
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $resolvedOutput
if (-not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}
[System.IO.File]::WriteAllText($resolvedOutput, $json + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Output $resolvedOutput
