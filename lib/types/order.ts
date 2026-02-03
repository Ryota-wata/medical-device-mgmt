/**
 * 発注関連の型定義
 */

/** 発注形態 */
export type OrderType =
  | '購入'
  | '割賦'
  | 'リース（ファイナンス）'
  | 'リース（オペレーティング）'
  | 'レンタル';

/** 支払い条件 */
export type PaymentTerms =
  | '納品時一括'
  | '検収後一括'
  | '分割払い'
  | '月末締め翌月末払い'
  | 'その他';

/** 検収書の発行 */
export type InspectionCertType = '本体のみ' | '付属品含む';

/** 保存形式 */
export type StorageFormat = '電子取引' | 'スキャナ保存' | '未指定';

/** 発注グループ */
export interface OrderGroup {
  id: number;
  orderNo: string;
  rfqGroupId: number;
  rfqNo: string;
  groupName: string;
  vendorName: string;
  /** 申請者 */
  applicant: string;
  applicantEmail: string;
  /** 発注形態 */
  orderType: OrderType;
  /** 納品日（品目ごとに異なる可能性あり） */
  deliveryDate?: string;
  /** 支払い条件 */
  paymentTerms: PaymentTerms;
  /** 支払い期日 */
  paymentDueDate?: string;
  /** リース会社 */
  leaseCompany?: string;
  /** リース開始日 */
  leaseStartDate?: string;
  /** リース年数 */
  leaseYears?: number;
  /** 検収書の発行 */
  inspectionCertType: InspectionCertType;
  /** 保管形式 */
  storageFormat: StorageFormat;
  /** 合計金額（税込） */
  totalAmount: number;
  /** 発注日 */
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

/** 発注明細 */
export interface OrderItem {
  id: number;
  orderGroupId: number;
  /** 元の見積明細ID */
  quotationItemId: number;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** 個別の納品日（グループと異なる場合） */
  deliveryDate?: string;
  remarks?: string;
}
