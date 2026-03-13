$ErrorActionPreference = 'Stop'

$script:wdStyleNormal = -1
$script:wdStyleHeading1 = -2
$script:wdStyleHeading2 = -3
$script:wdStyleHeading3 = -4
$script:wdStyleHeading4 = -5
$script:wdStyleTableGrid = -155
$script:wdFindContinue = 1
$script:wdReplaceAll = 2
$script:wdColorAutomatic = 0
$script:wdBorderTop = -1
$script:wdBorderLeft = -2
$script:wdBorderBottom = -3
$script:wdBorderRight = -4
$script:wdBorderHorizontal = -5
$script:wdBorderVertical = -6
$script:wdLineStyleSingle = 1
$script:wdLineWidth050pt = 4
$script:wdTextureNone = 0
$script:wdBulletGallery = 1
$script:wdWord10ListBehavior = 2
$script:wdListNumberStyleBullet = 23
$script:wdListLevelAlignLeft = 0
$script:wdTrailingTab = 0
$script:tableHeaderShade = -738132173

function Release-ComObjectSafely {
  param(
    $ComObject
  )

  if ($null -eq $ComObject) {
    return
  }

  try {
    [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($ComObject)
  }
  catch {
  }
}

function Set-XmlAttributeValue {
  param(
    [Parameter(Mandatory = $true)]$Node,
    [Parameter(Mandatory = $true)][string]$Prefix,
    [Parameter(Mandatory = $true)][string]$LocalName,
    [Parameter(Mandatory = $true)][string]$NamespaceUri,
    [Parameter(Mandatory = $true)][string]$Value
  )

  $attribute = $Node.Attributes.GetNamedItem($LocalName, $NamespaceUri)
  if ($null -eq $attribute) {
    $attribute = $Node.OwnerDocument.CreateAttribute($Prefix, $LocalName, $NamespaceUri)
    [void]$Node.Attributes.Append($attribute)
  }
  $attribute.Value = $Value
}

function Normalize-DocxSquareBullets {
  param(
    [Parameter(Mandatory = $true)][string]$DocxPath
  )

  Add-Type -AssemblyName System.IO.Compression.FileSystem

  $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("api_doc_bullet_fix_{0}" -f ([guid]::NewGuid().ToString('N')))
  $extractDir = Join-Path $tempRoot 'unzipped'
  New-Item -ItemType Directory -Path $extractDir -Force | Out-Null

  try {
    [System.IO.Compression.ZipFile]::ExtractToDirectory($DocxPath, $extractDir)

    $numberingPath = Join-Path $extractDir 'word\\numbering.xml'
    if (-not (Test-Path $numberingPath)) {
      return
    }

    $numberingText = [System.IO.File]::ReadAllText($numberingPath)
    $numberingText = [System.Text.RegularExpressions.Regex]::Replace(
      $numberingText,
      '(<w:numFmt w:val="bullet"\s*/>\s*<w:lvlText w:val=")[^"]*(")',
      ('$1{0}$2' -f [char]0x25A0)
    )
    $numberingText = $numberingText.Replace('w:ascii="Wingdings"', 'w:ascii="Meiryo UI"')
    $numberingText = $numberingText.Replace('w:hAnsi="Wingdings"', 'w:hAnsi="Meiryo UI"')
    $numberingText = $numberingText.Replace('w:ascii="Symbol"', 'w:ascii="Meiryo UI"')
    $numberingText = $numberingText.Replace('w:hAnsi="Symbol"', 'w:hAnsi="Meiryo UI"')

    if ($numberingText -notmatch 'w:eastAsia="Meiryo UI"') {
      $numberingText = [System.Text.RegularExpressions.Regex]::Replace(
        $numberingText,
        '(<w:rFonts\b[^>]*w:ascii="Meiryo UI"[^>]*w:hAnsi="Meiryo UI")([^>]*?/>)',
        '$1 w:eastAsia="Meiryo UI" w:cs="Meiryo UI"$2'
      )
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($numberingPath, $numberingText, $utf8NoBom)

    $repackedPath = Join-Path $tempRoot 'repacked.zip'
    if (Test-Path $repackedPath) {
      Remove-Item -LiteralPath $repackedPath -Force
    }
    [System.IO.Compression.ZipFile]::CreateFromDirectory($extractDir, $repackedPath)

    Remove-Item -LiteralPath $DocxPath -Force
    Move-Item -LiteralPath $repackedPath -Destination $DocxPath
  }
  finally {
    if (Test-Path $tempRoot) {
      Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
  }
}

function Set-FontNameProperties {
  param(
    [Parameter(Mandatory = $true)]$Font,
    [Parameter(Mandatory = $true)][string]$FontName
  )

  foreach ($property in @('Name', 'NameAscii', 'NameFarEast', 'NameOther', 'NameBi')) {
    try {
      $Font.$property = $FontName
    }
    catch {
      # Some Word COM font properties are not available in all contexts.
    }
  }
}

function Invoke-WordFindReplace {
  param(
    [Parameter(Mandatory = $true)]$Range,
    [Parameter(Mandatory = $true)][string]$FindText,
    [Parameter(Mandatory = $true)][string]$ReplaceText
  )

  $find = $Range.Find
  $find.ClearFormatting()
  $find.Replacement.ClearFormatting()
  $find.Text = $FindText
  $find.Replacement.Text = $ReplaceText
  $find.Forward = $true
  $find.Wrap = $script:wdFindContinue
  $find.Format = $false
  $find.MatchCase = $false
  $find.MatchWholeWord = $false
  $find.MatchWildcards = $false
  $find.MatchSoundsLike = $false
  $find.MatchAllWordForms = $false
  $find.Execute(
    $FindText,
    $false,
    $false,
    $false,
    $false,
    $false,
    $true,
    $script:wdFindContinue,
    $false,
    $ReplaceText,
    $script:wdReplaceAll
  ) | Out-Null
}

function Replace-AllStoryText {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)][string]$FindText,
    [Parameter(Mandatory = $true)][string]$ReplaceText
  )

  $story = $Document.StoryRanges.Item(1)
  while ($story -ne $null) {
    Invoke-WordFindReplace -Range $story -FindText $FindText -ReplaceText $ReplaceText
    $story = $story.NextStoryRange
  }
}

function Replace-AllShapeText {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)][string]$FindText,
    [Parameter(Mandatory = $true)][string]$ReplaceText
  )

  for ($i = 1; $i -le $Document.Shapes.Count; $i++) {
    $shape = $Document.Shapes.Item($i)
    if ($shape.TextFrame.HasText -eq -1) {
      Invoke-WordFindReplace -Range $shape.TextFrame.TextRange -FindText $FindText -ReplaceText $ReplaceText
    }
  }
}

function Replace-DocumentPlaceholders {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)][hashtable]$ReplacementMap
  )

  foreach ($key in $ReplacementMap.Keys) {
    $value = [string]$ReplacementMap[$key]
    Replace-AllStoryText -Document $Document -FindText $key -ReplaceText $value
    Replace-AllShapeText -Document $Document -FindText $key -ReplaceText $value
  }
}

function Set-StyleFormatting {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)]$StyleRef,
    [Parameter(Mandatory = $true)][string]$FontName,
    [Parameter(Mandatory = $true)][double]$FontSize,
    [Parameter(Mandatory = $true)][int]$Bold
  )

  $style = $null
  try {
    $style = $Document.Styles.Item($StyleRef)
  }
  catch {
    return
  }

  if ($null -eq $style) {
    return
  }

  Set-FontNameProperties -Font $style.Font -FontName $FontName
  $style.Font.Size = $FontSize
  $style.Font.Bold = $Bold
}

function Find-RangeByText {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)][string]$Text
  )

  $range = $Document.Content
  $find = $range.Find
  $find.ClearFormatting()
  $find.Text = $Text
  $find.Forward = $true
  $find.Wrap = 0
  $find.MatchCase = $false
  $find.MatchWholeWord = $false
  $find.MatchWildcards = $false

  if (-not $find.Execute()) {
    throw "Text not found: $Text"
  }

  return $range
}

function Set-ReplacementBodyStart {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)]$WordApp
  )

  if ($Document.TablesOfContents.Count -ge 1) {
    $searchStart = $Document.TablesOfContents.Item(1).Range.End
    $searchRange = $Document.Range($searchStart, $Document.Content.End - 1)
    $find = $searchRange.Find
    $find.ClearFormatting()
    $find.Text = '第1章 概要'
    $find.Forward = $true
    $find.Wrap = 0
    $find.MatchCase = $false
    $find.MatchWholeWord = $false
    $find.MatchWildcards = $false

    if (-not $find.Execute()) {
      throw 'Body start heading not found after table of contents.'
    }

    $firstHeadingRange = $searchRange
  }
  else {
    $firstHeadingRange = Find-RangeByText -Document $Document -Text '第1章 概要'
  }

  $start = $firstHeadingRange.Start
  $selection = $WordApp.Selection
  $selection.SetRange($start, $Document.Content.End - 1)
  $selection.Delete() | Out-Null
  $selection.SetRange($start, $start)
  return $selection
}

function Add-Paragraph {
  param(
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][string]$Text,
    [int]$Style = $script:wdStyleNormal
  )

  $Selection.Style = $Style
  $Selection.TypeText($Text)
  $Selection.TypeParagraph()
}

function Get-SquareBulletListTemplate {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)]$WordApp
  )

  $templateName = '__API_DOC_SQUARE_BULLET__'

  try {
    for ($i = 1; $i -le $Document.ListTemplates.Count; $i++) {
      $existing = $Document.ListTemplates.Item($i)
      try {
        if ([string]$existing.Name -eq $templateName) {
          return $existing
        }
      }
      catch {
      }
    }
  }
  catch {
  }

  $template = $Document.ListTemplates.Add($false, $templateName)
  $level = $template.ListLevels.Item(1)
  $level.NumberStyle = $script:wdListNumberStyleBullet
  $level.NumberFormat = [char]0x25A0
  $level.TrailingCharacter = $script:wdTrailingTab
  $level.NumberPosition = 0
  $level.Alignment = $script:wdListLevelAlignLeft
  $level.TextPosition = $WordApp.CentimetersToPoints(0.74)
  $level.TabPosition = $WordApp.CentimetersToPoints(0.74)
  $level.ResetOnHigher = 0
  $level.StartAt = 1
  Set-FontNameProperties -Font $level.Font -FontName 'Meiryo UI'

  return $template
}

function Add-BulletsAsParagraphs {
  param(
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][string[]]$Items
  )

  if ($Items.Count -eq 0) {
    return
  }

  $document = $Selection.Document
  $start = $Selection.Range.Start

  foreach ($item in $Items) {
    Add-Paragraph -Selection $Selection -Text $item -Style $script:wdStyleNormal
  }

  $end = $Selection.Range.Start
  $range = $document.Range($start, $end)

  try {
    $listTemplate = Get-SquareBulletListTemplate -Document $document -WordApp $document.Application
    $range.ListFormat.ApplyListTemplateWithLevel($listTemplate, $false, 0, $script:wdWord10ListBehavior, 1) | Out-Null
  }
  catch {
    $range.ListFormat.ApplyBulletDefault() | Out-Null
  }
}

function Add-NumberedAsParagraphs {
  param(
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][string[]]$Items
  )

  $index = 1
  foreach ($item in $Items) {
    Add-Paragraph -Selection $Selection -Text ("{0}. {1}" -f $index, $item) -Style $script:wdStyleNormal
    $index++
  }
}

function Add-Table {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][string[]]$Headers,
    [Parameter(Mandatory = $true)][object[]]$Rows
  )

  $rowCount = 1 + $Rows.Count
  $colCount = $Headers.Count
  $table = $Document.Tables.Add($Selection.Range, $rowCount, $colCount)
  $table.Style = $script:wdStyleTableGrid
  $table.AllowAutoFit = $false
  $table.Range.Style = $script:wdStyleNormal

  $borders = @(
    $script:wdBorderTop,
    $script:wdBorderLeft,
    $script:wdBorderBottom,
    $script:wdBorderRight,
    $script:wdBorderHorizontal,
    $script:wdBorderVertical
  )
  foreach ($borderType in $borders) {
    $table.Borders.Item($borderType).LineStyle = $script:wdLineStyleSingle
    $table.Borders.Item($borderType).LineWidth = $script:wdLineWidth050pt
    $table.Borders.Item($borderType).Color = $script:wdColorAutomatic
  }

  for ($c = 1; $c -le $colCount; $c++) {
    $headerCell = $table.Cell(1, $c)
    $headerRange = $headerCell.Range
    $headerRange.Text = [string]$Headers[$c - 1]
    $headerRange.Bold = 1
    $headerRange.Font.Name = 'Meiryo UI'
    $headerRange.Font.Size = 11
    $headerCell.Shading.Texture = $script:wdTextureNone
    $headerCell.Shading.BackgroundPatternColor = $script:tableHeaderShade
  }

  for ($r = 0; $r -lt $Rows.Count; $r++) {
    $row = @($Rows[$r])
    for ($c = 1; $c -le $colCount; $c++) {
      $cellText = ''
      if ($c -le $row.Count) {
        $cellText = [string]$row[$c - 1]
      }
      $cell = $table.Cell($r + 2, $c)
      $cellRange = $cell.Range
      $cellRange.Text = $cellText
      $cellRange.Bold = 0
      $cellRange.Font.Name = 'Meiryo UI'
      $cellRange.Font.Size = 11
    }
  }

  $Selection.SetRange($table.Range.End, $table.Range.End)
  $Selection.TypeParagraph()
}

function Add-ApiEndpointBlock {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][hashtable]$Spec
  )

  Add-Paragraph -Selection $Selection -Text $Spec.Title -Style $script:wdStyleHeading2
  Add-Paragraph -Selection $Selection -Text $Spec.Overview -Style $script:wdStyleNormal
  Add-Paragraph -Selection $Selection -Text 'エンドポイント' -Style $script:wdStyleHeading4
  Add-Paragraph -Selection $Selection -Text ("Method: {0}" -f $Spec.Method) -Style $script:wdStyleNormal
  Add-Paragraph -Selection $Selection -Text ("Path: {0}" -f $Spec.Path) -Style $script:wdStyleNormal
  Add-Paragraph -Selection $Selection -Text ("認証: {0}" -f $Spec.Auth) -Style $script:wdStyleNormal

  if ($Spec.ContainsKey('ParametersTitle')) {
    Add-Paragraph -Selection $Selection -Text $Spec.ParametersTitle -Style $script:wdStyleHeading3
    Add-Table -Document $Document -Selection $Selection -Headers $Spec.ParametersHeaders -Rows $Spec.ParametersRows
  }

  if ($Spec.ContainsKey('RequestTitle')) {
    Add-Paragraph -Selection $Selection -Text $Spec.RequestTitle -Style $script:wdStyleHeading3
    Add-Table -Document $Document -Selection $Selection -Headers $Spec.RequestHeaders -Rows $Spec.RequestRows
  }

  if ($Spec.ContainsKey('PermissionLines')) {
    Add-Paragraph -Selection $Selection -Text '権限チェック' -Style $script:wdStyleHeading4
    foreach ($line in $Spec.PermissionLines) {
      Add-Paragraph -Selection $Selection -Text $line -Style $script:wdStyleNormal
    }
  }

  if ($Spec.ContainsKey('ProcessingLines')) {
    Add-Paragraph -Selection $Selection -Text '処理仕様' -Style $script:wdStyleHeading4
    foreach ($line in $Spec.ProcessingLines) {
      Add-Paragraph -Selection $Selection -Text $line -Style $script:wdStyleNormal
    }
  }

  if ($Spec.ContainsKey('ExtraSections')) {
    foreach ($section in $Spec.ExtraSections) {
      Add-Paragraph -Selection $Selection -Text $section.Title -Style $script:wdStyleHeading4
      foreach ($line in $section.Lines) {
        Add-Paragraph -Selection $Selection -Text $line -Style $script:wdStyleNormal
      }
    }
  }

  if ($Spec.ContainsKey('ResponseTitle')) {
    Add-Paragraph -Selection $Selection -Text $Spec.ResponseTitle -Style $script:wdStyleHeading3
  }

  if ($Spec.ContainsKey('ResponseHeaders')) {
    Add-Table -Document $Document -Selection $Selection -Headers $Spec.ResponseHeaders -Rows $Spec.ResponseRows
  }

  if ($Spec.ContainsKey('ResponseSubtables')) {
    foreach ($subtable in $Spec.ResponseSubtables) {
      Add-Paragraph -Selection $Selection -Text $subtable.Title -Style $script:wdStyleHeading4
      Add-Table -Document $Document -Selection $Selection -Headers $subtable.Headers -Rows $subtable.Rows
    }
  }

  if ($Spec.ContainsKey('ResponseLines')) {
    foreach ($line in $Spec.ResponseLines) {
      Add-Paragraph -Selection $Selection -Text $line -Style $script:wdStyleNormal
    }
  }

  Add-Paragraph -Selection $Selection -Text 'ステータスコード' -Style $script:wdStyleHeading3
  Add-Table -Document $Document -Selection $Selection -Headers @('HTTP', '説明', 'レスポンス') -Rows $Spec.StatusRows
}

function Write-ApiDocSections {
  param(
    [Parameter(Mandatory = $true)]$Document,
    [Parameter(Mandatory = $true)]$Selection,
    [Parameter(Mandatory = $true)][object[]]$Sections
  )

  foreach ($section in $Sections) {
    switch ($section.Type) {
      'Heading1' { Add-Paragraph -Selection $Selection -Text $section.Text -Style $script:wdStyleHeading1 }
      'Heading2' { Add-Paragraph -Selection $Selection -Text $section.Text -Style $script:wdStyleHeading2 }
      'Heading3' { Add-Paragraph -Selection $Selection -Text $section.Text -Style $script:wdStyleHeading3 }
      'Heading4' { Add-Paragraph -Selection $Selection -Text $section.Text -Style $script:wdStyleHeading4 }
      'Paragraph' { Add-Paragraph -Selection $Selection -Text $section.Text -Style $script:wdStyleNormal }
      'Bullets' { Add-BulletsAsParagraphs -Selection $Selection -Items $section.Items }
      'Numbered' { Add-NumberedAsParagraphs -Selection $Selection -Items $section.Items }
      'Table' { Add-Table -Document $Document -Selection $Selection -Headers $section.Headers -Rows $section.Rows }
      'EndpointBlocks' {
        foreach ($item in $section.Items) {
          Add-ApiEndpointBlock -Document $Document -Selection $Selection -Spec $item
        }
      }
      default { throw "Unknown section type: $($section.Type)" }
    }
  }
}

function Rebuild-TableOfContents {
  param(
    [Parameter(Mandatory = $true)]$Document
  )

  while ($Document.TablesOfContents.Count -gt 0) {
    $Document.TablesOfContents.Item(1).Delete()
  }

  $tocTitleRange = Find-RangeByText -Document $Document -Text '目次'
  $firstHeadingRange = Find-RangeByText -Document $Document -Text '第1章 概要'

  $tocStart = $tocTitleRange.Paragraphs.Item(1).Range.End
  $tocEnd = $firstHeadingRange.Start

  $tocRange = $Document.Range($tocStart, $tocEnd)
  $tocRange.Text = ''
  $tocRange.SetRange($tocStart, $tocStart)

  $Document.TablesOfContents.Add($tocRange, $true, 1, 3) | Out-Null
}

function Normalize-ApiDocParagraphStyles {
  param(
    [Parameter(Mandatory = $true)]$Document
  )

  foreach ($paragraph in $Document.Paragraphs) {
    $text = ($paragraph.Range.Text -replace '[\r\a]', '').Trim()
    if ([string]::IsNullOrWhiteSpace($text)) {
      continue
    }

    $targetStyle = $null

    if ($text -in @('エンドポイント', '権限チェック', '処理仕様')) {
      $targetStyle = $script:wdStyleHeading4
    }
    elseif ($text -in @('リクエストパラメータ', 'リクエストボディ', 'ステータスコード')) {
      $targetStyle = $script:wdStyleHeading3
    }
    elseif ($text -match '^レスポンス（.+）$') {
      $targetStyle = $script:wdStyleHeading3
    }
    elseif ($text -match '^(items|item)要素（.+）$') {
      $targetStyle = $script:wdStyleHeading4
    }

    if ($null -ne $targetStyle) {
      $paragraph.Range.Style = $targetStyle
    }
  }
}

function Apply-ApiDocFormatting {
  param(
    [Parameter(Mandatory = $true)]$Document
  )

  $fontName = 'Meiryo UI'

  $story = $Document.StoryRanges.Item(1)
  while ($story -ne $null) {
    Set-FontNameProperties -Font $story.Font -FontName $fontName
    $story = $story.NextStoryRange
  }

  for ($i = 1; $i -le $Document.Shapes.Count; $i++) {
    $shape = $Document.Shapes.Item($i)
    if ($shape.TextFrame.HasText -eq -1) {
      Set-FontNameProperties -Font $shape.TextFrame.TextRange.Font -FontName $fontName
    }
  }

  Set-StyleFormatting -Document $Document -StyleRef $script:wdStyleNormal -FontName $fontName -FontSize 11 -Bold 0
  Set-StyleFormatting -Document $Document -StyleRef $script:wdStyleHeading1 -FontName $fontName -FontSize 20 -Bold 1
  Set-StyleFormatting -Document $Document -StyleRef $script:wdStyleHeading2 -FontName $fontName -FontSize 16 -Bold 1
  Set-StyleFormatting -Document $Document -StyleRef $script:wdStyleHeading3 -FontName $fontName -FontSize 14 -Bold 1
  Set-StyleFormatting -Document $Document -StyleRef $script:wdStyleHeading4 -FontName $fontName -FontSize 12 -Bold 1

  foreach ($styleName in @('目次の見出し', '目次 1', '目次 2', '目次 3', '表 (格子)')) {
    Set-StyleFormatting -Document $Document -StyleRef $styleName -FontName $fontName -FontSize 11 -Bold 0
  }

  foreach ($paragraph in $Document.Paragraphs) {
    $styleName = ''
    try {
      $styleName = [string]$paragraph.Range.Style.NameLocal
    }
    catch {
    }

    if ($styleName -in @('見出し 1', '見出し 2', '見出し 3', '見出し 4')) {
      $paragraph.Range.Font.Bold = 1
    }
  }
}

function New-ApiWordDocumentFromSpec {
  param(
    [Parameter(Mandatory = $true)][hashtable]$Spec,
    [string]$OutputPathOverride
  )

  $templatePath = $Spec.TemplatePath
  $outputPath = if ([string]::IsNullOrWhiteSpace($OutputPathOverride)) { $Spec.OutputPath } else { $OutputPathOverride }

  if (-not (Test-Path $templatePath)) {
    throw "Template not found: $templatePath"
  }

  $outputDir = Split-Path -Parent $outputPath
  if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
  }

  Copy-Item $templatePath $outputPath -Force

  $word = $null
  $doc = $null
  try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open((Resolve-Path $outputPath).Path)

    $replacementMap = @{
      '__SCREEN_LABEL__'  = $Spec.ScreenLabel
      '__COVER_DATE__'    = $Spec.CoverDateText
      '__REVISION_DATE__' = $Spec.RevisionDateText
    }

    if ($Spec.ContainsKey('Placeholders')) {
      foreach ($key in $Spec.Placeholders.Keys) {
        $replacementMap[$key] = $Spec.Placeholders[$key]
      }
    }

    Replace-DocumentPlaceholders -Document $doc -ReplacementMap $replacementMap

    $selection = Set-ReplacementBodyStart -Document $doc -WordApp $word
    Write-ApiDocSections -Document $doc -Selection $selection -Sections $Spec.Sections
    Normalize-ApiDocParagraphStyles -Document $doc
    Rebuild-TableOfContents -Document $doc

    if ($doc.TablesOfContents.Count -ge 1) {
      $doc.TablesOfContents.Item(1).Update() | Out-Null
    }
    $doc.Fields.Update() | Out-Null
    Apply-ApiDocFormatting -Document $doc
    $doc.Save()
  }
  finally {
    if ($doc) {
      try {
        $doc.Close(0) | Out-Null
      }
      catch {
      }
    }
    if ($word) {
      try {
        $word.Quit() | Out-Null
      }
      catch {
      }
    }
    Release-ComObjectSafely -ComObject $doc
    Release-ComObjectSafely -ComObject $word
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
  }

  Normalize-DocxSquareBullets -DocxPath $outputPath

  return $outputPath
}
