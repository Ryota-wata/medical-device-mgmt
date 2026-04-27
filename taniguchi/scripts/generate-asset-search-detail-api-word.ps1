param(
  [string]$OutputPath,
  [switch]$Publish
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$taniguchiDir = Split-Path -Parent $scriptDir
$draftDir = Join-Path $taniguchiDir 'api\参考_作業用'
$generator = Join-Path $scriptDir 'generate-api-doc-word.ps1'
$specPath = Join-Path $scriptDir 'specs\api-docs\asset-search-detail.ps1'

$parameters = @{
  SpecPath = $specPath
}

if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
  $parameters.OutputPath = $OutputPath
} elseif (-not $Publish) {
  New-Item -ItemType Directory -Path $draftDir -Force | Out-Null
  $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
  $parameters.OutputPath = Join-Path $draftDir "API設計書_資産検索・資産詳細_$timestamp.docx"
}

if ($Publish) {
  $parameters.Publish = $true
}

& $generator @parameters
