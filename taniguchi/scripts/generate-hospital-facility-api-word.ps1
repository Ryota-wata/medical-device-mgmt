param(
  [string]$OutputPath,
  [switch]$Publish
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$generator = Join-Path $scriptDir 'generate-api-doc-word.ps1'
$specPath = Join-Path $scriptDir 'specs\api-docs\hospital-facility-master.ps1'

$invokeParams = @{
  SpecPath = $specPath
}

if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
  $invokeParams['OutputPath'] = $OutputPath
}

if ($Publish) {
  $invokeParams['Publish'] = $true
}

& $generator @invokeParams
