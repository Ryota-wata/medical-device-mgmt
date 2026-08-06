param(
  [Parameter(Mandatory = $true)]
  [string]$SpecPath,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath,
  [string]$OperationIdPrefix = ''
)

$ErrorActionPreference = 'Stop'

function ConvertTo-PascalToken {
  param([string]$Value)

  $parts = @($Value -split '[^A-Za-z0-9]+' | Where-Object { $_ })
  return (($parts | ForEach-Object {
    if ($_.Length -eq 1) { $_.ToUpperInvariant() }
    else { $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1) }
  }) -join '')
}

function Get-OperationId {
  param(
    [string]$Method,
    [string]$Path
  )

  $Path = ($Path -split '\?', 2)[0]
  $suffix = ''
  foreach ($segment in @($Path.Trim('/') -split '/')) {
    if ($segment -match '^\{(.+)\}$') {
      $suffix += 'By' + (ConvertTo-PascalToken $Matches[1])
    }
    else {
      $suffix += ConvertTo-PascalToken $segment
    }
  }
  $baseOperationId = $Method.ToLowerInvariant() + $suffix
  if ([string]::IsNullOrWhiteSpace($OperationIdPrefix)) {
    return $baseOperationId
  }
  return $OperationIdPrefix + $baseOperationId.Substring(0, 1).ToUpperInvariant() + $baseOperationId.Substring(1)
}

function Escape-MarkdownCell {
  param($Value)
  if ($null -eq $Value) { return '' }
  return ([string]$Value).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
}

function Get-NormalizedRows {
  param(
    $Rows,
    [int]$ColumnCount
  )

  if ($null -eq $Rows) { return @() }
  $items = @($Rows)
  if ($items.Count -eq 0) { return @() }
  $flattened = @()
  foreach ($item in $items) {
    if ($null -ne $item -and $null -ne $item.PSObject.Properties['value'] -and
        ($item.value -is [System.Collections.IEnumerable]) -and -not ($item.value -is [string])) {
      $flattened += @($item.value)
    }
    elseif (($item -is [System.Collections.IEnumerable]) -and -not ($item -is [string])) {
      $flattened += @($item)
    }
    else {
      $flattened += $item
    }
  }
  if ($flattened.Count % $ColumnCount -eq 0) {
    $normalized = @()
    for ($index = 0; $index -lt $flattened.Count; $index += $ColumnCount) {
      $normalized += ,@($flattened[$index..($index + $ColumnCount - 1)])
    }
    return @($normalized | ForEach-Object { ,@($_) })
  }
  throw "Table row shape cannot be normalized: expected $ColumnCount columns, got $($flattened.Count)."
}

function Add-MarkdownTable {
  param(
    [System.Collections.Generic.List[string]]$Lines,
    $Headers,
    $Rows
  )

  $headerItems = @($Headers)
  $Lines.Add('| ' + (($headerItems | ForEach-Object { Escape-MarkdownCell $_ }) -join ' | ') + ' |')
  $Lines.Add('| ' + (($headerItems | ForEach-Object { '---' }) -join ' | ') + ' |')
  foreach ($row in @(Get-NormalizedRows -Rows $Rows -ColumnCount $headerItems.Count)) {
    $Lines.Add('| ' + ((@($row) | ForEach-Object { Escape-MarkdownCell $_ }) -join ' | ') + ' |')
  }
  $Lines.Add('')
}

if (-not (Test-Path -LiteralPath $SpecPath)) {
  throw "Spec not found: $SpecPath"
}

$resolvedSpec = (Resolve-Path -LiteralPath $SpecPath).Path
$spec = & $resolvedSpec
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("# $($spec.ScreenLabel) API内部設計")
$lines.Add('')

foreach ($section in @($spec.Sections)) {
  switch ($section.Type) {
    'Heading1' {
      $lines.Add("## $($section.Text)")
      $lines.Add('')
    }
    'Heading2' {
      $lines.Add("### $($section.Text)")
      $lines.Add('')
    }
    'Heading3' {
      $lines.Add("#### $($section.Text)")
      $lines.Add('')
    }
    'Paragraph' {
      $lines.Add([string]$section.Text)
      $lines.Add('')
    }
    'Bullets' {
      foreach ($item in @($section.Items)) { $lines.Add("- $item") }
      $lines.Add('')
    }
    'Numbered' {
      $number = 1
      foreach ($item in @($section.Items)) {
        $lines.Add("$number. $item")
        $number++
      }
      $lines.Add('')
    }
    'Table' {
      Add-MarkdownTable -Lines $lines -Headers $section.Headers -Rows $section.Rows
    }
    'EndpointBlocks' {
      foreach ($endpoint in @($section.Items)) {
        $operationId = Get-OperationId -Method $endpoint.Method -Path $endpoint.Path
        $lines.Add("### $operationId")
        $lines.Add('')
        $lines.Add('#### 権限')
        $lines.Add('')
        $permissionLines = if ($endpoint.ContainsKey('PermissionLines')) { @($endpoint.PermissionLines | Where-Object { $_ }) } else { @() }
        if ($permissionLines.Count -gt 0) {
          foreach ($item in $permissionLines) { $lines.Add("- $item") }
        }
        else {
          $lines.Add("- 認証条件は「$($endpoint.Auth)」とする。")
        }
        $lines.Add('')
        $lines.Add('#### 処理仕様')
        $lines.Add('')
        $processingLines = if ($endpoint.ContainsKey('ProcessingLines')) { @($endpoint.ProcessingLines | Where-Object { $_ }) } else { @() }
        if ($processingLines.Count -gt 0) {
          $number = 1
          foreach ($item in $processingLines) {
            $lines.Add("$number. $item")
            $number++
          }
        }
        else {
          $lines.Add("1. $($endpoint.Overview)")
        }
        $lines.Add('')
        if ($endpoint.ContainsKey('ExtraSections')) {
          foreach ($extra in @($endpoint.ExtraSections)) {
            if (-not $extra -or [string]::IsNullOrWhiteSpace([string]$extra.Title)) { continue }
            $lines.Add("#### $($extra.Title)")
            $lines.Add('')
            foreach ($item in @($extra.Lines | Where-Object { $_ })) { $lines.Add("- $item") }
            $lines.Add('')
          }
        }
        if ($endpoint.ContainsKey('ExtraTables')) {
          foreach ($extraTable in @($endpoint.ExtraTables)) {
            if (-not $extraTable -or [string]::IsNullOrWhiteSpace([string]$extraTable.Title)) { continue }
            $lines.Add("#### $($extraTable.Title)")
            $lines.Add('')
            Add-MarkdownTable -Lines $lines -Headers $extraTable.Headers -Rows $extraTable.Rows
          }
        }
      }
    }
    'PageBreak' {
      continue
    }
    default {
      throw "Unsupported section type '$($section.Type)' in $resolvedSpec"
    }
  }
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $resolvedOutput
if (-not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}
[System.IO.File]::WriteAllText(
  $resolvedOutput,
  (($lines -join "`n").TrimEnd() + "`n"),
  [System.Text.UTF8Encoding]::new($false)
)
Write-Output $resolvedOutput
