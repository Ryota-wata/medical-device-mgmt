const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  LevelFormat, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TableOfContents
} = require("docx");
const fs = require("fs");

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };
const headerShading = { fill: "1F4E79", type: ShadingType.CLEAR };
const lightShading = { fill: "F2F7FB", type: ShadingType.CLEAR };
const whiteShading = { fill: "FFFFFF", type: ShadingType.CLEAR };
const warnShading = { fill: "FFF2CC", type: ShadingType.CLEAR };

function makeTable(headers, rows, colWidths, opts = {}) {
  return new Table({
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          new TableCell({
            borders: cellBorders,
            width: { size: colWidths[i], type: WidthType.DXA },
            shading: headerShading,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20, font: "Yu Gothic" })] })]
          })
        )
      }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) => {
            const isHighlight = opts.highlightRows && opts.highlightRows.includes(ri);
            return new TableCell({
              borders: cellBorders,
              width: { size: colWidths[ci], type: WidthType.DXA },
              shading: isHighlight ? warnShading : (ri % 2 === 1 ? lightShading : whiteShading),
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ spacing: { before: 40, after: 40 },
                children: [new TextRun({ text: String(cell), size: 20, font: "Yu Gothic" })] })]
            });
          })
        })
      )
    ]
  });
}

const p = (text, opts = {}) => new Paragraph({
  spacing: { before: opts.spaceBefore || 80, after: opts.spaceAfter || 80 },
  indent: opts.indent ? { left: opts.indent } : undefined,
  alignment: opts.align,
  children: [new TextRun({ text, size: opts.size || 22, font: "Yu Gothic", bold: opts.bold, color: opts.color || "1A1A1A" })]
});

const emptyP = () => new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });

const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const numberingConfig = [
  { reference: "bullet-list", levels: [
    { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
    { level: 1, format: LevelFormat.BULLET, text: "\u2013", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
  ]},
];

const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: "bullet-list", level },
  spacing: { before: 40, after: 40 },
  children: [new TextRun({ text, size: 22, font: "Yu Gothic", color: "1A1A1A" })]
});

function flowDiagram(lines) {
  return lines.map(line => new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: line, size: 18, font: "Consolas", color: "333333" })]
  }));
}

function coverPage(title, subtitle, docNo, version) {
  return [
    emptyP(), emptyP(), emptyP(), emptyP(), emptyP(), emptyP(),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 200 },
      children: [new TextRun({ text: "医療機器管理システム", size: 48, bold: true, font: "Yu Gothic", color: "1F4E79" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: title, size: 44, bold: true, font: "Yu Gothic", color: "1F4E79" })] }),
    subtitle ? new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 400 },
      children: [new TextRun({ text: subtitle, size: 28, font: "Yu Gothic", color: "555555" })] }) : emptyP(),
    emptyP(),
    makeTable(["項目", "内容"], [
      ["文書番号", docNo], ["バージョン", version], ["作成日", "2026-03-02"],
      ["ステータス", "ドラフト"], ["作成者", ""], ["承認者", ""],
    ], [3000, 6360]),
    emptyP(),
    p("改訂履歴", { bold: true, size: 24 }),
    makeTable(["版", "日付", "変更内容", "作成者"],
      [[version, "2026-03-02", "初版作成", ""]],
      [1000, 1800, 4560, 2000]),
    pageBreak(),
  ];
}

function buildDoc(headerText, children) {
  return new Document({
    styles: {
      default: { document: { run: { font: "Yu Gothic", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, color: "1F4E79", font: "Yu Gothic" },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" } } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, color: "2E75B6", font: "Yu Gothic" },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 23, bold: true, color: "404040", font: "Yu Gothic" },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
      ]
    },
    numbering: { config: numberingConfig },
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1200, bottom: 1200, left: 1440 }, pageNumbers: { start: 1 } }
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT, spacing: { after: 0 },
          children: [new TextRun({ text: headerText, size: 16, color: "888888", font: "Yu Gothic" })]
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 16, color: "888888", font: "Yu Gothic" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888", font: "Yu Gothic" }),
            new TextRun({ text: " / ", size: 16, color: "888888", font: "Yu Gothic" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "888888", font: "Yu Gothic" }),
          ]
        })] })
      },
      children
    }]
  });
}

async function saveDoc(doc, path) {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path, buffer);
  console.log(`Generated: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

module.exports = { makeTable, p, emptyP, h1, h2, h3, pageBreak, bullet, flowDiagram, coverPage, buildDoc, saveDoc };
