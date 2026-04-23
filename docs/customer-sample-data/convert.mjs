/**
 * 顧客サンプルデータ Excel → TypeScript 変換スクリプト
 *
 * 使い方:
 *   node docs/customer-sample-data/convert.mjs
 *
 * 出力先: lib/data/customer/
 * 再取り込み: Excel を差し替えて再実行すれば上書きされる
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = __dirname;
const DEST = resolve(__dirname, "../../lib/data/customer");

await mkdir(DEST, { recursive: true });

const NOW = new Date().toISOString();
const esc = (v) => {
  if (v == null) return "";
  return String(v).trim();
};
const num = (v) => {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};
const fmtDate = (v) => {
  if (v == null) return "";
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  }
  const s = String(v).trim();
  // "Mon Nov 13 2017 ..." 形式
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  }
  return s;
};

// ─────────────────────────────────────────
// 1. 共通部署マスタ → departments + roomCategories
// ─────────────────────────────────────────
async function convertDepartments() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(SRC, "共通部署マスタ.xlsx"));
  const ws = wb.getWorksheet("共通部署M");

  const departments = [];
  const roomCategories = [];
  let deptId = 1;
  let roomId = 1;

  for (let ri = 3; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    const division = esc(row.getCell(2).value);
    const dept = esc(row.getCell(3).value);
    const rc1 = esc(row.getCell(5).value);
    const rc2 = esc(row.getCell(6).value);

    if (division && dept) {
      departments.push({
        id: `DEPT${String(deptId++).padStart(3, "0")}`,
        division,
        department: dept,
        status: "active",
        createdAt: NOW,
        updatedAt: NOW,
      });
    }
    if (rc1 && rc2) {
      roomCategories.push({
        id: `RC${String(roomId++).padStart(3, "0")}`,
        roomCategory1: rc1,
        roomCategory2: rc2,
        status: "active",
        createdAt: NOW,
        updatedAt: NOW,
      });
    }
  }

  const ts = `// Auto-generated from 共通部署マスタ.xlsx — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs
import { DepartmentMaster, RoomCategoryMaster } from '@/lib/types/master';

export const customerDepartments: DepartmentMaster[] = ${JSON.stringify(departments, null, 2)};

export const customerRoomCategories: RoomCategoryMaster[] = ${JSON.stringify(roomCategories, null, 2)};
`;
  await writeFile(resolve(DEST, "departments.ts"), ts, "utf-8");
  console.log(`✔ 共通部署マスタ → departments.ts (${departments.length} depts, ${roomCategories.length} rooms)`);
}

// ─────────────────────────────────────────
// 2. 突合画面 → SurveyData[]
// ─────────────────────────────────────────
async function convertMatching() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(SRC, "突合画面.xlsx"));
  const ws = wb.getWorksheet("モック用_突合せサンプル");

  const surveyItems = [];  // A病院(現) → 現有品調査リスト（上半分）
  const ledgerItems = [];  // A病院(台) → 資産台帳リスト（下半分）
  // Header at row 2: 元ﾘｽﾄ, count, 突合状況, QRコード, 資産番号, ME番号,
  //   部門名, 部署名, 室名, category, 品目大分類, 品目中分類,
  //   個体管理品目, メーカー, 型式, 数量, 取得日付
  let surveyId = 1;
  let ledgerId = 1;
  for (let ri = 3; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    const qrCode = esc(row.getCell(4).value);
    if (!qrCode && !esc(row.getCell(7).value)) continue;

    const sourceList = esc(row.getCell(1).value);
    const record = {
      qrCode,
      assetNo: esc(row.getCell(5).value),
      meNo: esc(row.getCell(6).value),
      department: esc(row.getCell(7).value),
      section: esc(row.getCell(8).value),
      roomName: esc(row.getCell(9).value),
      category: esc(row.getCell(10).value),
      majorCategory: esc(row.getCell(11).value),
      middleCategory: esc(row.getCell(12).value),
      item: esc(row.getCell(13).value),
      manufacturer: esc(row.getCell(14).value),
      model: esc(row.getCell(15).value),
      quantity: num(row.getCell(16).value),
      acquisitionDate: fmtDate(row.getCell(17).value),
    };

    if (sourceList.includes("(台)")) {
      ledgerItems.push({ id: `L${ledgerId++}`, ...record });
    } else {
      surveyItems.push({ id: String(surveyId++), ...record });
    }
  }

  const ts = `// Auto-generated from 突合画面.xlsx — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs
import { SurveyData } from '@/lib/types/data-matching';
import { LedgerData } from '@/lib/types/data-matching';

/** 現有品調査リスト — A病院(現) (${surveyItems.length}件) */
export const customerSurveyData: SurveyData[] = ${JSON.stringify(surveyItems, null, 2)};

/** 資産台帳リスト — A病院(台) (${ledgerItems.length}件) */
export const customerLedgerData: LedgerData[] = ${JSON.stringify(ledgerItems, null, 2)};
`;
  await writeFile(resolve(DEST, "matching.ts"), ts, "utf-8");
  console.log(`✔ 突合画面 → matching.ts (survey: ${surveyItems.length}, ledger: ${ledgerItems.length})`);
}

// ─────────────────────────────────────────
// 3. 購入STEP2 OCR明細確認
// ─────────────────────────────────────────
async function convertStep2() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(SRC, "購入STEP２OCR明細確認.xlsx"));
  const ws = wb.getWorksheet("STEP❷");

  const items = [];
  // Header row 4: No, 品名, メーカー, 型式, 数量, 定価単価, 定価金額, 購入単価, 購入金額
  for (let ri = 5; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    const no = row.getCell(1).value;
    if (no == null || no === "") continue;

    items.push({
      rowNo: num(no),
      itemName: esc(row.getCell(2).value),
      manufacturer: esc(row.getCell(3).value),
      model: esc(row.getCell(4).value),
      quantity: num(row.getCell(5).value),
      listPriceUnit: num(row.getCell(6).value),
      listPriceTotal: num(row.getCell(7).value),
      purchasePriceUnit: num(row.getCell(8).value),
      purchasePriceTotal: num(row.getCell(9).value),
    });
  }

  const ts = `// Auto-generated from 購入STEP２OCR明細確認.xlsx — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs

export interface Step2OCRItem {
  rowNo: number;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number;
  listPriceUnit: number;
  listPriceTotal: number;
  purchasePriceUnit: number;
  purchasePriceTotal: number;
}

/** 購入STEP2 OCR明細確認データ (${items.length}件) */
export const customerStep2Items: Step2OCRItem[] = ${JSON.stringify(items, null, 2)};
`;
  await writeFile(resolve(DEST, "step2-ocr.ts"), ts, "utf-8");
  console.log(`✔ 購入STEP2 → step2-ocr.ts (${items.length} items)`);
}

// ─────────────────────────────────────────
// 4. 購入STEP3 明細区分登録
// ─────────────────────────────────────────
async function convertStep3() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(SRC, "購入STEP３明細区分登録.xlsx"));
  const ws = wb.getWorksheet("STEP❸");

  const items = [];
  // Header row 4: No, 品名, メーカー, 型式, 数量, 定価単価, 定価金額, 購入単価, 購入金額, (skip 10), カテゴリ, 明細区分, ステータス, アクション
  for (let ri = 5; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    const no = row.getCell(1).value;
    if (no == null || no === "") continue;

    items.push({
      rowNo: num(no),
      itemName: esc(row.getCell(2).value),
      manufacturer: esc(row.getCell(3).value),
      model: esc(row.getCell(4).value),
      quantity: num(row.getCell(5).value),
      listPriceUnit: num(row.getCell(6).value),
      listPriceTotal: num(row.getCell(7).value),
      purchasePriceUnit: num(row.getCell(8).value),
      purchasePriceTotal: num(row.getCell(9).value),
      category: esc(row.getCell(11).value),
      itemType: esc(row.getCell(12).value),
      status: esc(row.getCell(13).value),
      action: esc(row.getCell(14).value),
    });
  }

  const ts = `// Auto-generated from 購入STEP３明細区分登録.xlsx — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs

export interface Step3Item {
  rowNo: number;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number;
  listPriceUnit: number;
  listPriceTotal: number;
  purchasePriceUnit: number;
  purchasePriceTotal: number;
  category: string;
  itemType: string;
  status: string;
  action: string;
}

/** 購入STEP3 明細区分登録データ (${items.length}件) */
export const customerStep3Items: Step3Item[] = ${JSON.stringify(items, null, 2)};
`;
  await writeFile(resolve(DEST, "step3-category.ts"), ts, "utf-8");
  console.log(`✔ 購入STEP3 → step3-category.ts (${items.length} items)`);
}

// ─────────────────────────────────────────
// 5. 購入STEP4 資産マスタ登録
// ─────────────────────────────────────────
async function convertStep4() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(SRC, "購入STEP４資産マスタ登録.xlsx"));
  const ws = wb.getWorksheet("STEP❹");

  const items = [];
  // Header row 5: No, 品名, メーカー, 型式, 数量, 明細区分, カテゴリ, (skip 8), 大分類, 中分類, 個体管理品目, メーカー, 型式, 操作
  for (let ri = 6; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    const no = row.getCell(1).value;
    if (no == null || no === "") continue;

    items.push({
      rowNo: num(no),
      originalItemName: esc(row.getCell(2).value),
      originalManufacturer: esc(row.getCell(3).value),
      originalModel: esc(row.getCell(4).value),
      quantity: num(row.getCell(5).value),
      itemType: esc(row.getCell(6).value),
      category: esc(row.getCell(7).value),
      largeClass: esc(row.getCell(9).value),
      middleClass: esc(row.getCell(10).value),
      itemName: esc(row.getCell(11).value),
      manufacturer: esc(row.getCell(12).value),
      model: esc(row.getCell(13).value),
      action: esc(row.getCell(14).value),
    });
  }

  const ts = `// Auto-generated from 購入STEP４資産マスタ登録.xlsx — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs

export interface Step4Item {
  rowNo: number;
  originalItemName: string;
  originalManufacturer: string;
  originalModel: string;
  quantity: number;
  itemType: string;
  category: string;
  largeClass: string;
  middleClass: string;
  itemName: string;
  manufacturer: string;
  model: string;
  action: string;
}

/** 購入STEP4 資産マスタ登録データ (${items.length}件) */
export const customerStep4Items: Step4Item[] = ${JSON.stringify(items, null, 2)};
`;
  await writeFile(resolve(DEST, "step4-asset-master.ts"), ts, "utf-8");
  console.log(`✔ 購入STEP4 → step4-asset-master.ts (${items.length} items)`);
}

// ─────────────────────────────────────────
// 6. 購入STEP5 個体登録・金額案分
// ─────────────────────────────────────────
async function convertStep5() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(SRC, "購入STEP５個体登録・金額案分.xlsx"));
  const ws = wb.getWorksheet("STEP❺");

  // Find header row (row with "No,")
  let headerRow = 7;
  for (let ri = 1; ri <= 10; ri++) {
    if (esc(ws.getRow(ri).getCell(1).value) === "No,") {
      headerRow = ri;
      break;
    }
  }

  const items = [];
  for (let ri = headerRow + 1; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    const no = row.getCell(1).value;
    if (no == null || no === "") continue;

    items.push({
      rowNo: num(no),
      category: esc(row.getCell(2).value),
      itemType: esc(row.getCell(3).value),
      itemName: esc(row.getCell(4).value),
      manufacturer: esc(row.getCell(5).value),
      model: esc(row.getCell(6).value),
      quantity: num(row.getCell(7).value),
      listPriceUnit: num(row.getCell(8).value),
      listPriceTotal: num(row.getCell(9).value),
      purchasePriceUnit: num(row.getCell(10).value),
      purchasePriceTotal: num(row.getCell(11).value),
      unit: esc(row.getCell(13).value),
      parentChild: esc(row.getCell(14).value),
      allocationCategory: esc(row.getCell(15).value),
      differenceAllocation: esc(row.getCell(16).value),
      allocationAmount: num(row.getCell(17).value),
      taxCategory: esc(row.getCell(18).value),
      taxRate: num(row.getCell(19).value),
      taxIncludedAmount: num(row.getCell(20).value),
    });
  }

  const ts = `// Auto-generated from 購入STEP５個体登録・金額案分.xlsx — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs

export interface Step5Item {
  rowNo: number;
  category: string;
  itemType: string;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number;
  listPriceUnit: number;
  listPriceTotal: number;
  purchasePriceUnit: number;
  purchasePriceTotal: number;
  unit: string;
  parentChild: string;
  allocationCategory: string;
  differenceAllocation: string;
  allocationAmount: number;
  taxCategory: string;
  taxRate: number;
  taxIncludedAmount: number;
}

/** 購入STEP5 個体登録・金額案分データ (${items.length}件) */
export const customerStep5Items: Step5Item[] = ${JSON.stringify(items, null, 2)};
`;
  await writeFile(resolve(DEST, "step5-individual.ts"), ts, "utf-8");
  console.log(`✔ 購入STEP5 → step5-individual.ts (${items.length} items)`);
}

// ─────────────────────────────────────────
// 7. 購入STEP6 登録確認
// ─────────────────────────────────────────
async function convertStep6() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(SRC, "購入STEP６登録確認.xlsx"));
  const ws = wb.getWorksheet("STEP❻");

  let headerRow = 7;
  for (let ri = 1; ri <= 10; ri++) {
    if (esc(ws.getRow(ri).getCell(1).value) === "No,") {
      headerRow = ri;
      break;
    }
  }

  const items = [];
  for (let ri = headerRow + 1; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    const no = row.getCell(1).value;
    if (no == null || no === "") continue;

    items.push({
      rowNo: num(no),
      category: esc(row.getCell(2).value),
      itemType: esc(row.getCell(3).value),
      itemName: esc(row.getCell(4).value),
      manufacturer: esc(row.getCell(5).value),
      model: esc(row.getCell(6).value),
      quantity: num(row.getCell(7).value),
      unit: esc(row.getCell(8).value),
      parentChild: esc(row.getCell(9).value),
      listPriceTotal: num(row.getCell(10).value),
      purchasePriceTotal: num(row.getCell(11).value),
      department: esc(row.getCell(13).value),
      section: esc(row.getCell(14).value),
      roomName: esc(row.getCell(15).value),
      managementDepartment: esc(row.getCell(16).value),
    });
  }

  const ts = `// Auto-generated from 購入STEP６登録確認.xlsx — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs

export interface Step6Item {
  rowNo: number;
  category: string;
  itemType: string;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number;
  unit: string;
  parentChild: string;
  listPriceTotal: number;
  purchasePriceTotal: number;
  department: string;
  section: string;
  roomName: string;
  managementDepartment: string;
}

/** 購入STEP6 登録確認データ (${items.length}件) */
export const customerStep6Items: Step6Item[] = ${JSON.stringify(items, null, 2)};
`;
  await writeFile(resolve(DEST, "step6-confirm.ts"), ts, "utf-8");
  console.log(`✔ 購入STEP6 → step6-confirm.ts (${items.length} items)`);
}

// ─────────────────────────────────────────
// 8. 見積書サンプル
// ─────────────────────────────────────────
async function convertQuotationSample() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(SRC, "見積書サンプル.xlsx"));
  const ws = wb.getWorksheet("見積サンプル");

  const items = [];
  for (let ri = 2; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    const vals = [];
    for (let ci = 1; ci <= ws.columnCount; ci++) {
      const v = esc(row.getCell(ci).value);
      if (v) vals.push(v);
    }
    if (vals.length > 0) {
      items.push({
        col1: esc(row.getCell(1).value),
        col2: esc(row.getCell(2).value),
        col3: esc(row.getCell(3).value),
        col4: esc(row.getCell(4).value),
      });
    }
  }

  const ts = `// Auto-generated from 見積書サンプル.xlsx — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs

export interface QuotationSampleRow {
  col1: string;
  col2: string;
  col3: string;
  col4: string;
}

/** 見積書サンプルデータ (${items.length}件) */
export const customerQuotationSamples: QuotationSampleRow[] = ${JSON.stringify(items, null, 2)};
`;
  await writeFile(resolve(DEST, "quotation-sample.ts"), ts, "utf-8");
  console.log(`✔ 見積書サンプル → quotation-sample.ts (${items.length} items)`);
}

// ─────────────────────────────────────────
// 9. Index file
// ─────────────────────────────────────────
async function writeIndex() {
  const ts = `// Auto-generated barrel — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs
export { customerDepartments, customerRoomCategories } from './departments';
export { customerSurveyData, customerLedgerData } from './matching';
export { customerStep2Items } from './step2-ocr';
export { customerStep3Items } from './step3-category';
export { customerStep4Items } from './step4-asset-master';
export { customerStep5Items } from './step5-individual';
export { customerStep6Items } from './step6-confirm';
export { customerQuotationSamples } from './quotation-sample';
`;
  await writeFile(resolve(DEST, "index.ts"), ts, "utf-8");
  console.log("✔ index.ts");
}

// ── Run all ──
console.log("Converting customer sample data...\n");
await convertDepartments();
await convertMatching();
await convertStep2();
await convertStep3();
await convertStep4();
await convertStep5();
await convertStep6();
await convertQuotationSample();
await writeIndex();
console.log("\n✅ All done! Output: lib/data/customer/");
