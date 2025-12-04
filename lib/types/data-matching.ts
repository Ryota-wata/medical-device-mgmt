/**
 * データ突合画面の型定義
 */

/**
 * 突合状況
 */
export type MatchingStatus =
  | '完全一致'
  | '部分一致'
  | '数量不一致'
  | '再確認'
  | '未確認'  // 台帳に存在するが現場に無い
  | '未登録'  // 現場に存在するが台帳に無い
  | '未突合';

/**
 * フィルター条件
 */
export interface DataMatchingFilters {
  category: string;
  department: string;
  section: string;
  majorCategory: string;
  middleCategory: string;
  matchingStatus: string;  // '全て' | MatchingStatus
  keyword: string;
}

/**
 * 現有品調査データ
 */
export interface SurveyData {
  id: string;
  qrCode: string;              // QRコード（シール番号）
  assetNo?: string;            // 資産番号（突合後に設定される場合も）
  department: string;          // 部門
  section: string;             // 部署
  roomName?: string;           // 諸室名称
  category: string;            // カテゴリ
  majorCategory: string;       // 大分類
  middleCategory: string;      // 中分類
  item: string;                // 品目
  manufacturer?: string;       // メーカー
  model?: string;              // 型式
  quantity: number;            // 数量
  acquisitionDate?: string;    // 取得年月日

  // 突合情報
  matchingStatus: MatchingStatus;
  matchedLedgerId?: string;    // 紐付けた台帳のID
  matchedAt?: string;          // 突合日時
  matchedBy?: string;          // 突合実施者
  memo?: string;               // メモ
}

/**
 * 固定資産台帳データ
 */
export interface LedgerData {
  id: string;
  assetNo: string;             // 資産番号
  department: string;          // 部門
  section: string;             // 部署
  roomName?: string;           // 諸室名称
  category: string;            // カテゴリ
  majorCategory: string;       // 大分類
  middleCategory: string;      // 中分類
  item: string;                // 品目
  manufacturer?: string;       // メーカー
  model?: string;              // 型式
  quantity: number;            // 数量
  acquisitionDate: string;     // 取得年月日

  // 突合情報
  matchingStatus: MatchingStatus;
  matchedSurveyId?: string;    // 紐付けた現有品のID
  matchedAt?: string;          // 突合日時
  matchedBy?: string;          // 突合実施者
}

/**
 * 突合編集データ
 */
export interface MatchingEditData {
  surveyId: string;
  matchingStatus: MatchingStatus;
  ledgerAssetNo?: string;
  memo?: string;
}
