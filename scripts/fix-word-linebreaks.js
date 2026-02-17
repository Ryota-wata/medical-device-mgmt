const AdmZip = require('adm-zip');
const path = require('path');

const inputPath = path.join(__dirname, '../docs/claude-code-knowledge.docx');

// docxを解凍
const zip = new AdmZip(inputPath);
const documentXml = zip.getEntry('word/document.xml');

if (!documentXml) {
  console.error('document.xml not found');
  process.exit(1);
}

let content = documentXml.getData().toString('utf8');

// Courier New フォントのテキストを見つけて、スペース2つ以上を改行に変換
// パターン: 【xxx】 の後や、コマンドの区切りなど

// 1. 【言語名】の後に改行を入れる
content = content.replace(
  /(<w:t[^>]*>)(【[^】]+】)\s*/g,
  '$1$2</w:t></w:r><w:r><w:br/><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">'
);

// 2. 連続するスペース（3つ以上）を改行として扱う（コードブロック内）
content = content.replace(
  /(<w:rFonts[^>]*Courier[^>]*>.*?<w:t[^>]*>)([^<]+)(<\/w:t>)/gs,
  (match, before, text, after) => {
    // 3つ以上の連続スペースを改行に変換
    const newText = text.replace(/\s{3,}/g, '</w:t></w:r><w:r><w:br/></w:r><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">');
    return before + newText + after;
  }
);

// 更新したXMLをzipに戻す
zip.updateFile('word/document.xml', Buffer.from(content, 'utf8'));

// 保存
zip.writeZip(inputPath);

console.log('✓ 改行を修正しました');
