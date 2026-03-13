param(
  [string]$OutputPath,
  [switch]$Publish
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$generatorPath = Join-Path $scriptDir 'generate-api-doc-word.ps1'
$specPath = Join-Path $scriptDir 'specs\\api-docs\\ship-department.ps1'

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  if ($Publish) {
    & $generatorPath -SpecPath $specPath -Publish
  }
  else {
    & $generatorPath -SpecPath $specPath
  }
}
elseif ($Publish) {
  & $generatorPath -SpecPath $specPath -OutputPath $OutputPath -Publish
}
else {
  & $generatorPath -SpecPath $specPath -OutputPath $OutputPath
}
