/**
 * 編集リストの型定義
 * 編集リスト = 原本（マスタ）を複製した作業用リスト
 * 購入申請の要望機器が追加され、見積依頼グループ作成まで管理する
 */

import { Asset } from './asset';
import { PurchaseApplicationType } from './purchaseApplication';

/**
 * 編集リストアイテム（要望機器1件 = 1レコード）
 */
export interface EditListItem {
  id: string;

  // 申請元情報
  applicationId: string;
  applicationNo: string;
  applicationType: PurchaseApplicationType;
  applicationReason?: string;
  applicantName: string;
  applicantDepartment: string;
  applicationDate: string;

  // 機器情報
  assetId?: string;           // 既存資産ID（更新・増設の場合）
  qrCode?: string;
  name: string;
  maker: string;
  model: string;
  category?: string;
  largeClass?: string;
  mediumClass?: string;
  item?: string;
  quantity: number;
  unit: string;

  // 設置場所
  facility: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  roomName: string;

  // 希望情報
  desiredDeliveryDate?: string;
  priority?: string; // 優先順位

  // 使用用途及び件数
  usagePurpose?: string; // 用途
  caseCount?: string; // 症例数

  // コメント
  comment?: string;

  // 添付ファイル
  attachedFiles?: string[];

  // システム接続要望
  currentConnectionStatus?: string; // 現在の接続状況
  currentConnectionDestination?: string; // 現在の接続先
  requestConnectionStatus?: string; // 接続要望
  requestConnectionDestination?: string; // 要望接続先

  // 処理状態
  status: 'pending' | 'rfq_assigned' | 'completed';
  rfqGroupId?: string;

  addedAt: string;
}

/**
 * 編集リスト
 */
export interface EditList {
  id: string;
  name: string;
  facilities: string[];
  baseAssets: Asset[];        // 原本資産一覧の複製
  items: EditListItem[];      // 申請から追加された要望機器
  createdAt: string;
  updatedAt: string;
}

/**
 * 編集リスト作成用データ
 */
export interface CreateEditListInput {
  name: string;
  facilities: string[];
  baseAssets: Asset[];  // 原本資産一覧の複製
}
