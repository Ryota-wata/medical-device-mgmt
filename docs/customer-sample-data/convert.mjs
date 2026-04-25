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
// 9. 原本リスト・編集分析リスト → 編集リスト用カラム抽出
// ─────────────────────────────────────────
async function convertEditList() {
  const fname = "原本リスト・編集分析リスト0425.xlsx";
  const fpath = resolve(SRC, fname);
  // ファイルが存在しない場合はスキップ
  try { await readFile(fpath); } catch { console.log(`⏭ ${fname} not found, skipping`); return; }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(fpath);
  const ws = wb.getWorksheet(1);

  // 行1 = 編集リスト(リ)、行11 = カラム名（項目②）、行12以降 = データ
  // ○マーク列を収集
  const editCols = [];
  for (let ci = 2; ci <= 200; ci++) {
    const mark = esc(ws.getRow(1).getCell(ci).value);
    if (mark === "○" || mark === "〇") {
      const name = esc(ws.getRow(11).getCell(ci).value).replace(/\n/g, "");
      const group = esc(ws.getRow(9).getCell(ci).value).replace(/\n/g, "");
      const subgroup = esc(ws.getRow(10).getCell(ci).value).replace(/\n/g, "");
      editCols.push({ ci, name, group, subgroup });
    }
  }

  // カラム定義をキー名に変換
  const colKeyMap = {
    2: "commonDivision",       // 共通部門名
    3: "commonDepartment",     // 共通部署名
    5: "roomCategory1",        // 諸室区分①
    6: "roomCategory2",        // 諸室区分②
    8: "divisionId",           // 部門ID
    9: "departmentId",         // 部署ID
    10: "roomId",              // 諸室ID
    12: "currentBuilding",     // 棟（現）
    13: "currentFloor",        // 階（現）
    14: "currentDivision",     // 部門名（現）
    15: "currentDepartment",   // 部署名（現）
    16: "currentRoom",         // 室名（現）
    18: "newBuilding",         // 棟（新）
    19: "newFloor",            // 階（新）
    20: "newDivision",         // 部門名（新）
    21: "newDepartment",       // 部署名（新）
    22: "newRoom",             // 室名（新）
    24: "serialNo",            // シリアル番号
    25: "fixedAssetNo",        // 固定資産番号
    26: "meNo",                // ME管理機器番号
    29: "qrCode",              // QRコード
    31: "assetMasterId",       // 資産マスタID
    32: "category",            // カテゴリ
    33: "largeClass",          // 大分類
    34: "mediumClass",         // 中分類
    36: "itemType",            // 明細区分
    37: "parentItem",          // 明細親機
    38: "itemName",            // 品目名
    39: "manufacturer",        // メーカー名
    40: "model",               // 型式
    41: "quantity",            // 数量
    42: "unit",                // 単位
    44: "managementDept",      // 管理部署
    45: "deviceType",          // 機器種別
    46: "assetGroupName",      // 資産グループ名称
    47: "purpose",             // 使用目的
    48: "remarks",             // 備考
    52: "applicationType",     // 申請種別
    53: "fiscalYear",          // 執行年度
    54: "priority",            // 優先順位
    56: "systemConnection",    // システム接続
    57: "systemTarget",        // システム接続先
    59: "wish1Manufacturer",   // ①要望メーカー
    60: "wish1Model",          // ①要望型式
    61: "wish2Manufacturer",   // ②要望メーカー
    62: "wish2Model",          // ②要望型式
    63: "wish3Manufacturer",   // ③要望メーカー
    64: "wish3Model",          // ③要望型式
    66: "rfqNo",               // 見積依頼No
    67: "rfqGroupName",        // 見積グループ名
    113: "quotationPhase",     // 見積フェーズ
    114: "quotationDate",      // 見積日付
    115: "accountCategory",    // 会計区分
    116: "listPriceUnit",      // 定価単価
    117: "listPriceTotal",     // 定価金額
    118: "quotationPriceUnit", // 見積単価
    119: "quotationPriceExTax",// 見積金額（税別）
    120: "quotationPriceInTax",// 見積金額（税込）
  };

  const items = [];
  for (let ri = 12; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    // 空行スキップ
    let hasData = false;
    for (const { ci } of editCols.slice(0, 5)) {
      if (esc(row.getCell(ci).value)) { hasData = true; break; }
    }
    if (!hasData) continue;

    const record = { id: String(items.length + 1) };
    for (const { ci } of editCols) {
      const key = colKeyMap[ci];
      if (!key) continue;
      let val = row.getCell(ci).value;
      // 日付変換
      if (key === "quotationDate") {
        val = fmtDate(val);
      } else {
        val = esc(val);
      }
      // 数値フィールド
      if (["quantity", "listPriceUnit", "listPriceTotal", "quotationPriceUnit", "quotationPriceExTax", "quotationPriceInTax"].includes(key)) {
        record[key] = num(val);
      } else {
        record[key] = val;
      }
    }
    items.push(record);
  }

  // ダミーID(●●●●●●)に資産マスタIDを付番
  // 資産マスタJSONが存在すれば品目名+メーカーで突合
  const amJsonPath = resolve(DEST, "asset-master.json");
  let assignedCount = 0;
  try {
    const amRaw = await readFile(amJsonPath, "utf-8");
    const amData = JSON.parse(amRaw);

    // 品目名+メーカー → assetMasterIdのマップを構築
    const exactMap = new Map();   // key: "品目名|||メーカー" → assetMasterId
    const itemMap = new Map();    // key: "品目名" → assetMasterId (品目名のみ)
    for (const am of amData) {
      if (!am.assetMasterId) continue;
      const itemKey = am.item || "";
      const makerKey = am.maker || "";
      if (itemKey && makerKey) {
        const k = `${itemKey}|||${makerKey}`;
        if (!exactMap.has(k)) exactMap.set(k, am.assetMasterId);
      }
      if (itemKey && !itemMap.has(itemKey)) {
        itemMap.set(itemKey, am.assetMasterId);
      }
    }

    for (const record of items) {
      if (record.assetMasterId && record.assetMasterId !== "●●●●●●") continue;
      const itemName = record.itemName || "";
      const maker = record.manufacturer || "";
      // 品目名+メーカーで完全一致を優先
      const exactKey = `${itemName}|||${maker}`;
      if (exactMap.has(exactKey)) {
        record.assetMasterId = exactMap.get(exactKey);
        assignedCount++;
        continue;
      }
      // 品目名のみで一致
      if (itemMap.has(itemName)) {
        record.assetMasterId = itemMap.get(itemName);
        assignedCount++;
      }
    }
    console.log(`  ダミーID付番: ${assignedCount}件に資産マスタIDを付与`);
  } catch {
    console.log("  ⏭ asset-master.json未生成のためダミーID付番スキップ");
  }

  // 型定義を生成
  const typeFields = Object.entries(colKeyMap)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, key]) => {
      const numFields = ["quantity", "listPriceUnit", "listPriceTotal", "quotationPriceUnit", "quotationPriceExTax", "quotationPriceInTax"];
      return `  ${key}: ${numFields.includes(key) ? "number" : "string"};`;
    });

  const ts = `// Auto-generated from ${fname} — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs
// 編集リスト(リ)の○マーク付きカラム(${editCols.length}列)を抽出

export interface EditListItem {
  id: string;
${typeFields.join("\n")}
}

/** 編集分析リスト サンプルデータ (${items.length}件) */
export const customerEditListItems: EditListItem[] = ${JSON.stringify(items, null, 2)};
`;
  await writeFile(resolve(DEST, "edit-list.ts"), ts, "utf-8");
  console.log(`✔ 原本リスト・編集分析リスト → edit-list.ts (${items.length} items, ${editCols.length} cols)`);
}

// ─────────────────────────────────────────
// 10. SHIP資産マスタ → JSON + 型定義
// ─────────────────────────────────────────
async function convertAssetMaster() {
  const fname = "SHIP資産マスタ.xlsx";
  const fpath = resolve(SRC, fname);
  try { await readFile(fpath); } catch { console.log(`⏭ ${fname} not found, skipping`); return; }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(fpath);
  const ws = wb.getWorksheet("資産マスタ");

  // Row 4 = カラム名、Row 6以降 = データ
  // カラムマッピング（Excelの列番号 → フィールド名）
  const colMap = {
    // JMDN分類・一般名称 (G-N)
    7: "classificationCode",     // 類別コード
    8: "jmdnCode",               // JMDNコード
    9: "classificationName",     // 類別名称
    10: "jmdnSubCategory",       // 中分類名
    11: "generalName",           // 一般的名称
    12: "tradeName",             // 販売名
    13: "jmdnManufacturer",      // 製造販売業者等
    14: "packageInsert",         // 添付文書
    // 薬事 (O)
    15: "pharmaceuticalAffairs", // 薬事
    // SHIP_Master (Y-AF)
    25: "assetMasterId",         // 資産マスタID
    26: "category",              // カテゴリ
    27: "largeClass",            // 大分類
    28: "mediumClass",           // 中分類
    29: "detailCategory",        // 明細区分
    30: "item",                  // 品目（個体管理品目名）
    31: "maker",                 // メーカー（略称）
    32: "model",                 // 型式
    // SHIP (AG)
    33: "shipFlag",              // SHIP
    // 設備情報 (AH-BC)
    34: "drawingNo",             // 図面No.
    35: "layoutReflection",      // レイアウト反映
    36: "specialEquipment",      // 特殊設備（重設備）
    37: "masterStandardDrawing", // Master標準図
    38: "width",                 // 幅（W）
    39: "depth",                 // 奥行（D）
    40: "height",                // 高さ（H）
    41: "powerConnection",       // 電源接続
    42: "powerType",             // 電源種別
    43: "powerConsumption",      // 消費電力
    44: "waterSupplySize",       // 給水サイズ
    45: "hotWaterSize",          // 給湯サイズ
    46: "drainageSize",          // 排水サイズ
    47: "exhaustSize",           // 排気サイズ
    48: "exhaustVolume",         // 排気風量
    49: "steamSize",             // 蒸気サイズ
    50: "gas",                   // ガス
    51: "weight",                // 重量（kg）
    52: "reinforcement",         // 補強
    53: "mountAnchor",           // 架台・アンカー
    54: "floorLowering",         // 床下げ
    55: "equipmentRemarks",      // 設備備考
    // 資産M❶ 資産情報 (BE-BL)
    57: "legalServiceLife",      // 耐用年数（法定）
    58: "serviceLifePeriod",     // 耐用期間
    59: "endOfService",          // End of service
    60: "endOfSupport",          // End of support
    61: "dedicatedConsumables",  // 専用消耗品
    62: "catalogDocument",       // カタログドキュメント
    63: "operationManual",       // 操作マニュアル
    64: "otherDocument",         // その他PDFデータ他
    // 資産M❷ PMDA提供 (BN-CH)
    66: "pmdaClassNotification",      // クラス分類告示
    67: "pmdaMaintenanceNotification",// 特定保守告示別表
    68: "pmdaInstallNotification",    // 設置管理告示別表
    69: "pmdaClassCode",              // 類別コード
    70: "pmdaClassName",              // 類別名称
    71: "pmdaSubCategory",            // 中分類名
    72: "pmdaCode",                   // コード
    73: "pmdaGeneralName",            // 一般的名称
    74: "pmdaGeneralNameDef",         // 一般的名称定義
    75: "pmdaClassification",         // クラス分類
    76: "pmdaGhtfRule",               // GHTFルール
    77: "pmdaSpecificMaintenance",    // 特定保守
    78: "pmdaInstallMgmt",            // 設置管理
    79: "pmdaRepairCategory",         // 修理区分
    80: "pmdaQms316",                 // QMS告示316号
    81: "pmdaOldGeneralNameCode",     // 旧一般的名称コード
    82: "pmdaOldGeneralName",         // 旧一般的名称
    83: "pmdaOldClassification",      // 旧クラス分類
    84: "pmdaOldRepairType",          // 旧修理種別
    85: "pmdaRevisionCount",          // 改正回数
    86: "pmdaLastUpdated",            // 最終更新日
    // JMDN (CK)
    89: "registrationStatus",         // 登録状況
  };

  const items = [];
  for (let ri = 6; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    // 空行スキップ（col 25 = 資産マスタIDで判定）
    const masterId = esc(row.getCell(25).value);
    if (!masterId) continue;

    const record = {};
    for (const [ciStr, key] of Object.entries(colMap)) {
      const ci = Number(ciStr);
      record[key] = esc(row.getCell(ci).value);
    }
    items.push(record);
  }

  // 空文字列フィールドを省略してサイズ削減
  const compactItems = items.map(item => {
    const compact = {};
    for (const [k, v] of Object.entries(item)) {
      if (v !== "" && v !== undefined && v !== null) compact[k] = v;
    }
    return compact;
  });

  // JSON形式で出力（TSだとファイルが巨大になるため）
  const jsonPath = resolve(DEST, "asset-master.json");
  await writeFile(jsonPath, JSON.stringify(compactItems), "utf-8"); // compact JSON, no whitespace

  // 型定義ファイルを出力
  const fields = Object.values(colMap);
  const typeDef = `// Auto-generated from ${fname} — do not edit manually
// Re-generate: node docs/customer-sample-data/convert.mjs
// データ本体: asset-master.json (${items.length}件)

export interface CustomerAssetMaster {
${fields.map(f => `  ${f}: string;`).join("\n")}
}

// JSONデータの読み込み
import assetMasterJson from './asset-master.json';
export const customerAssetMasters: CustomerAssetMaster[] = assetMasterJson as CustomerAssetMaster[];
`;
  await writeFile(resolve(DEST, "asset-master.ts"), typeDef, "utf-8");

  const sizeMB = (JSON.stringify(items).length / 1024 / 1024).toFixed(1);
  console.log(`✔ SHIP資産マスタ → asset-master.json + asset-master.ts (${items.length} items, ${sizeMB}MB)`);
}

// ─────────────────────────────────────────
// 11. Index file
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
export { customerEditListItems } from './edit-list';
export { customerAssetMasters } from './asset-master';
export type { CustomerAssetMaster } from './asset-master';
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
await convertEditList();
await convertAssetMaster();
await writeIndex();
console.log("\n✅ All done! Output: lib/data/customer/");
