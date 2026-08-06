import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import AdmZip from "adm-zip";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    args[key] = value;
    index += 1;
  }
  return args;
}

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function normalizeText(value) {
  return String(value)
    .normalize("NFC")
    .replace(/`/g, "")
    .replace(/[\s\u00a0\u200b\u3000]+/g, "");
}

function extractVisibleText(wordPath) {
  const archive = new AdmZip(wordPath);
  const documentEntry = archive.getEntry("word/document.xml");
  if (!documentEntry) {
    throw new Error("word/document.xml is missing");
  }
  const xml = documentEntry.getData().toString("utf8");
  const runs = [];
  const pattern = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
  let match;
  while ((match = pattern.exec(xml)) !== null) {
    runs.push(decodeXml(match[1]));
  }
  return normalizeText(runs.join(""));
}

function collectStrings(value, output, key = "") {
  if (typeof value === "string") {
    if (key !== "Type") {
      const normalized = normalizeText(value);
      if (normalized.length >= 2) {
        output.push({ key, source: value, normalized });
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, output, key);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      collectStrings(childValue, output, childKey);
    }
  }
}

function verifyPresence(actualText, entries, label) {
  const missing = [];
  for (const entry of entries) {
    if (!actualText.includes(entry.normalized)) {
      missing.push(`${label}.${entry.key}: ${entry.source}`);
    }
  }
  return missing;
}

function verifySequence(actualText, entries) {
  const missing = [];
  let cursor = 0;
  for (const entry of entries) {
    const index = actualText.indexOf(entry.normalized, cursor);
    if (index < 0) {
      missing.push(`Sections.${entry.key}: ${entry.source}`);
      continue;
    }
    cursor = index + entry.normalized.length;
  }
  return missing;
}

const args = parseArgs(process.argv.slice(2));
if (!args.model || !args.word) {
  throw new Error("Usage: node verify-api-word-content.mjs --model <word-model.json> --word <document.docx>");
}

const modelPath = path.resolve(args.model);
const wordPath = path.resolve(args.word);
if (!fs.existsSync(modelPath)) {
  throw new Error(`Word model not found: ${modelPath}`);
}
if (!fs.existsSync(wordPath)) {
  throw new Error(`Word document not found: ${wordPath}`);
}

const model = JSON.parse(fs.readFileSync(modelPath, "utf8").replace(/^\uFEFF/, ""));
const actualText = extractVisibleText(wordPath);
const metadataEntries = [];
for (const key of [
  "ScreenLabel",
  "CoverDateText",
  "CoverVersionText",
  "RevisionVersionText",
  "RevisionDateText",
  "RevisionSummaryText",
  "RevisionAuthorText",
]) {
  collectStrings(model[key], metadataEntries, key);
}
const sectionEntries = [];
collectStrings(model.Sections ?? [], sectionEntries, "Sections");

const missing = [
  ...verifyPresence(actualText, metadataEntries, "Metadata"),
  ...verifySequence(actualText, sectionEntries),
];
if (missing.length > 0) {
  console.error(`Word content verification failed (${missing.length} missing item(s)): ${wordPath}`);
  for (const item of missing.slice(0, 30)) {
    console.error(`- ${item}`);
  }
  if (missing.length > 30) {
    console.error(`- ... ${missing.length - 30} more`);
  }
  process.exit(1);
}

console.log(
  `Word content verified: ${path.basename(wordPath)} `
    + `(${metadataEntries.length} metadata values, ${sectionEntries.length} section values).`,
);
