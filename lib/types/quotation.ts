/**
 * 見積書関連の型定義
 */

// 見積フェーズ
export type QuotationPhase =
  | '定価見積'
  | '概算見積'
  | '確定見積';

// 明細分類
export type QuotationItemType =
  | 'A_表紙明細'
  | 'B_明細代表'
  | 'C_個体管理品目'
  | 'D_付属品'
  | 'E_その他役務';

// 受領見積グループ（ヘッダー情報）
export interface ReceivedQuotationGroup {
  id: number;
  receivedQuotationNo: string; // 施設番号-yyyy-mm-###
  rfqGroupId?: number; // 見積依頼グループとの紐づけ
  rfqNo?: string; // 見積依頼No（表示用）
  vendorName: string;
  vendorNo?: string;
  vendorContact?: string;
  vendorEmail?: string;
  quotationDate: string; // 見積日
  validityPeriod?: number; // 有効期限（月数）
  deliveryPeriod?: number; // 納期（月数）
  phase: QuotationPhase;
  totalAmount?: number; // 全明細の合計金額
  pdfUrl?: string; // 見積書PDFのURL
  createdAt: string;
  updatedAt: string;
}

// 受領見積明細（個別レコード）
export interface ReceivedQuotationItem {
  id: number;
  quotationGroupId: number; // 見積グループとの紐づけ
  receivedQuotationNo: string; // 見積番号（表示用）
  itemType: QuotationItemType;
  itemName: string;
  manufacturer?: string;
  model?: string;
  quantity: number;
  unit?: string;
  listPriceUnit?: number;
  listPriceTotal?: number;
  sellingPriceUnit?: number;
  sellingPriceTotal?: number;
  discount?: number;
  taxRate: number;
  totalWithTax?: number;
  assetMasterId?: number; // 資産Masterとの紐づけ
  linkedApplicationIds?: number[]; // 紐づけられた申請ID（複数可）
  createdAt: string;
  updatedAt: string;
}

// 後方互換性のため、旧型を残す（非推奨）
/** @deprecated ReceivedQuotationGroupとReceivedQuotationItemを使用してください */
export interface ReceivedQuotation {
  id: number;
  receivedQuotationNo: string;
  rfqGroupId?: number;
  rfqNo?: string;
  vendorName: string;
  vendorNo?: string;
  vendorContact?: string;
  vendorEmail?: string;
  quotationDate: string;
  validityPeriod?: number;
  deliveryPeriod?: number;
  phase: QuotationPhase;
  items: QuotationItem[];
  totalAmount?: number;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated ReceivedQuotationItemを使用してください */
export interface QuotationItem {
  id: number;
  itemType: QuotationItemType;
  itemName: string;
  manufacturer?: string;
  model?: string;
  quantity: number;
  unit?: string;
  listPriceUnit?: number;
  listPriceTotal?: number;
  sellingPriceUnit?: number;
  sellingPriceTotal?: number;
  discount?: number;
  taxRate: number;
  totalWithTax?: number;
  assetMasterId?: number;
  linkedApplicationIds?: number[];
}

// OCR結果の型定義
export interface OCRResultItem {
  itemType: QuotationItemType;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number;
  unit: string;
  listPriceUnit: number;
  listPriceTotal: number;
  sellingPriceUnit: number;
  sellingPriceTotal: number;
  discount: number;
  taxRate: number;
  totalWithTax: number;
}

export interface OCRResult {
  vendorName: string;
  quotationDate: string;
  validityPeriod: number;
  deliveryPeriod: number;
  phase: QuotationPhase;
  items: OCRResultItem[];
  totalAmount: number;
}

// フォームとフィルタの型定義
export interface QuotationFormData {
  rfqGroupId: string;
  pdfFile: File | null;
}

export interface QuotationFilter {
  rfqGroupId: string;
  phase: string;
}
