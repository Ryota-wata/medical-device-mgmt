const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  Bookmark,
  InternalHyperlink,
  PageBreak,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ナレッジディレクトリ
const knowledgeDir = path.join(__dirname, '../docs/knowledge');

// 章定義
const chapters = [
  { file: '01_claude_code_overview.md', title: '第1章：Claude Code概要', bookmark: 'chapter1' },
  { file: '02_environment_setup.md', title: '第2章：環境構築', bookmark: 'chapter2' },
  { file: '03_project_initialization.md', title: '第3章：プロジェクト初期化', bookmark: 'chapter3' },
  { file: '04_claude_md.md', title: '第4章：CLAUDE.mdによるプロジェクトルール定義', bookmark: 'chapter4' },
  { file: '05_project_input.md', title: '第5章：プロジェクト概要のインプット', bookmark: 'chapter5' },
  { file: '06_requirements_definition.md', title: '第6章：要件定義の進め方', bookmark: 'chapter6' },
  { file: '07_screen_design.md', title: '第7章：基本設計（画面設計）の進め方', bookmark: 'chapter7' },
  { file: '08_skill_md.md', title: '第8章：Skill.mdによる品質向上', bookmark: 'chapter8' },
  { file: '09_document_generation.md', title: '第9章：設計ドキュメント自動生成', bookmark: 'chapter9' },
];

// Markdownをパースして要素に変換
function parseMarkdown(content, chapterBookmark) {
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';
  let inTable = false;
  let tableRows = [];
  let isFirstChapterHeading = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // コードブロック処理
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.replace('```', '').trim();
        codeBlockContent = [];
      } else {
        // コードブロック終了
        elements.push(createCodeBlock(codeBlockContent.join('\n'), codeBlockLang));
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // テーブル処理
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // セパレーター行をスキップ
      if (!line.includes('---')) {
        const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // テーブル終了
      if (tableRows.length > 0) {
        elements.push(createTable(tableRows));
      }
      inTable = false;
      tableRows = [];
    }

    // 見出し1（章タイトル）
    if (line.startsWith('# ')) {
      const text = line.replace('# ', '');
      if (isFirstChapterHeading && chapterBookmark) {
        elements.push(createHeading1WithBookmark(text, chapterBookmark));
        isFirstChapterHeading = false;
      } else {
        elements.push(createHeading1(text));
      }
    }
    // 見出し2
    else if (line.startsWith('## ')) {
      elements.push(createHeading2(line.replace('## ', '')));
    }
    // 見出し3
    else if (line.startsWith('### ')) {
      elements.push(createHeading3(line.replace('### ', '')));
    }
    // 見出し4
    else if (line.startsWith('#### ')) {
      elements.push(createHeading4(line.replace('#### ', '')));
    }
    // 水平線（スキップ）
    else if (line.startsWith('---')) {
      // 水平線は出力しない
    }
    // リスト項目
    else if (line.match(/^[-*] /)) {
      elements.push(createBulletPoint(line.replace(/^[-*] /, '')));
    }
    // 番号付きリスト
    else if (line.match(/^\d+\. /)) {
      elements.push(createNumberedPoint(line));
    }
    // 通常テキスト
    else if (line.trim() !== '') {
      elements.push(createParagraph(line));
    }
  }

  // 残ったテーブルを処理
  if (inTable && tableRows.length > 0) {
    elements.push(createTable(tableRows));
  }

  return elements;
}

// 見出し1（ブックマーク付き）- Bookmarkクラスを使用
function createHeading1WithBookmark(text, bookmarkName) {
  return new Paragraph({
    children: [
      new Bookmark({
        id: bookmarkName,
        children: [
          new TextRun({ text, bold: true, size: 36 }),
        ],
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

// 見出し1
function createHeading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36 })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

// 見出し2
function createHeading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

// 見出し3
function createHeading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
  });
}

// 見出し4
function createHeading4(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22 })],
    heading: HeadingLevel.HEADING_4,
    spacing: { before: 150, after: 80 },
  });
}

// 通常段落
function createParagraph(text) {
  // インラインコードとボールドの処理
  const children = parseInlineFormatting(text);
  return new Paragraph({
    children,
    spacing: { before: 80, after: 80 },
  });
}

// インライン書式のパース
function parseInlineFormatting(text) {
  const children = [];
  let remaining = text;

  while (remaining.length > 0) {
    // ボールド **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // インラインコード `code`
    const codeMatch = remaining.match(/`([^`]+)`/);

    let nextMatch = null;
    let matchType = null;

    if (boldMatch && (!codeMatch || boldMatch.index < codeMatch.index)) {
      nextMatch = boldMatch;
      matchType = 'bold';
    } else if (codeMatch) {
      nextMatch = codeMatch;
      matchType = 'code';
    }

    if (nextMatch) {
      // マッチ前のテキスト
      if (nextMatch.index > 0) {
        children.push(new TextRun({ text: remaining.substring(0, nextMatch.index), size: 22 }));
      }

      // マッチしたテキスト
      if (matchType === 'bold') {
        children.push(new TextRun({ text: nextMatch[1], bold: true, size: 22 }));
      } else if (matchType === 'code') {
        children.push(new TextRun({
          text: nextMatch[1],
          font: 'Courier New',
          size: 20,
          shading: { type: ShadingType.SOLID, color: 'F0F0F0' },
        }));
      }

      remaining = remaining.substring(nextMatch.index + nextMatch[0].length);
    } else {
      children.push(new TextRun({ text: remaining, size: 22 }));
      break;
    }
  }

  return children;
}

// テーブル用インライン書式パース（サイズ20、ヘッダー時は太字）
function parseInlineFormattingForTable(text, isHeader) {
  const children = [];
  let remaining = text;

  while (remaining.length > 0) {
    // ボールド **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // インラインコード `code`
    const codeMatch = remaining.match(/`([^`]+)`/);

    let nextMatch = null;
    let matchType = null;

    if (boldMatch && (!codeMatch || boldMatch.index < codeMatch.index)) {
      nextMatch = boldMatch;
      matchType = 'bold';
    } else if (codeMatch) {
      nextMatch = codeMatch;
      matchType = 'code';
    }

    if (nextMatch) {
      // マッチ前のテキスト
      if (nextMatch.index > 0) {
        children.push(new TextRun({ text: remaining.substring(0, nextMatch.index), bold: isHeader, size: 20 }));
      }

      // マッチしたテキスト
      if (matchType === 'bold') {
        children.push(new TextRun({ text: nextMatch[1], bold: true, size: 20 }));
      } else if (matchType === 'code') {
        children.push(new TextRun({
          text: nextMatch[1],
          font: 'Courier New',
          bold: isHeader,
          size: 18,
        }));
      }

      remaining = remaining.substring(nextMatch.index + nextMatch[0].length);
    } else {
      children.push(new TextRun({ text: remaining, bold: isHeader, size: 20 }));
      break;
    }
  }

  return children;
}

// 箇条書き
function createBulletPoint(text) {
  const children = parseInlineFormatting(text);
  return new Paragraph({
    children,
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
  });
}

// 番号付きリスト
function createNumberedPoint(text) {
  const children = parseInlineFormatting(text);
  return new Paragraph({
    children,
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
  });
}

// コードブロック（複数行対応）
function createCodeBlock(code, lang) {
  const children = [];

  // 言語ラベル
  if (lang) {
    children.push(new TextRun({ text: `【${lang}】`, font: 'Courier New', size: 18, bold: true }));
    children.push(new TextRun({ break: 1 }));
  }

  // コードを行ごとに分割して、各行の間に改行を入れる
  const lines = code.split('\n');
  lines.forEach((line, index) => {
    children.push(new TextRun({ text: line || ' ', font: 'Courier New', size: 18 }));
    if (index < lines.length - 1) {
      children.push(new TextRun({ break: 1 }));
    }
  });

  return new Paragraph({
    children,
    shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
    spacing: { before: 100, after: 100 },
    indent: { left: 360, right: 360 },
  });
}

// 水平線（空行で代用）
function createHorizontalRule() {
  return new Paragraph({
    children: [new TextRun({ text: '' })],
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
    },
  });
}

// テーブル作成
function createTable(rows) {
  if (rows.length === 0) return new Paragraph({ children: [] });

  const maxCols = Math.max(...rows.map(r => r.length));

  const tableRows = rows.map((row, rowIndex) => {
    const cells = [];
    for (let i = 0; i < maxCols; i++) {
      const cellText = row[i] || '';
      const isHeader = rowIndex === 0;

      // セル内のインライン書式をパース（太字、コード）
      const cellChildren = parseInlineFormattingForTable(cellText, isHeader);

      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: cellChildren,
            }),
          ],
          shading: isHeader
            ? { type: ShadingType.SOLID, color: 'E8E8E8' }
            : undefined,
        })
      );
    }
    return new TableRow({ children: cells });
  });

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// 目次の作成（テーブル形式でリンク）
function createTableOfContents() {
  const elements = [];

  // タイトル
  elements.push(
    new Paragraph({
      children: [new TextRun({ text: '目次', bold: true, size: 36 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 300 },
      alignment: AlignmentType.CENTER,
    })
  );

  // 各章へのリンク
  chapters.forEach((chapter, index) => {
    elements.push(
      new Paragraph({
        children: [
          new InternalHyperlink({
            anchor: chapter.bookmark,
            children: [
              new TextRun({
                text: chapter.title,
                color: '0563C1',
                underline: { type: 'single' },
                size: 24,
              }),
            ],
          }),
        ],
        spacing: { before: 120, after: 120 },
      })
    );
  });

  // ページブレーク
  elements.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  return elements;
}

// メイン処理
async function main() {
  const allElements = [];

  // 表紙
  allElements.push(
    new Paragraph({
      children: [new TextRun({ text: '', size: 22 })],
      spacing: { before: 2000 },
    })
  );
  allElements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Claude Codeによる',
          bold: true,
          size: 48,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );
  allElements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'モック駆動開発ナレッジ',
          bold: true,
          size: 48,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );
  allElements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '〜要件定義から基本設計までの実践ガイド〜',
          size: 28,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1500 },
    })
  );
  allElements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'バージョン 1.0',
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );
  allElements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '2025年2月',
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );
  allElements.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // 目次
  allElements.push(...createTableOfContents());

  // 各章の内容
  for (const chapter of chapters) {
    const filePath = path.join(knowledgeDir, chapter.file);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const chapterElements = parseMarkdown(content, chapter.bookmark);
      allElements.push(...chapterElements);

      // 章の終わりにページブレーク
      allElements.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );

      console.log(`✓ ${chapter.title} を追加`);
    } else {
      console.log(`✗ ${chapter.file} が見つかりません`);
    }
  }

  // ドキュメント作成
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            font: 'Yu Gothic',
            size: 22,
          },
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: allElements,
      },
    ],
  });

  // ファイル出力
  const outputPath = path.join(__dirname, '../docs/claude-code-knowledge.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);

  console.log(`\n✓ Wordファイルを作成しました: ${outputPath}`);
}

main().catch(console.error);
