param(
  [string]$OutputPath,
  [switch]$Publish
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$generator = Join-Path $scriptDir 'generate-api-doc-word.ps1'
$specPath = Join-Path $scriptDir 'specs\api-docs\ship-facility-master.ps1'

$parameters = @{
  SpecPath = $specPath
}

if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
  $parameters.OutputPath = $OutputPath
}

if ($Publish) {
  $parameters.Publish = $true
}

& $generator @parameters
