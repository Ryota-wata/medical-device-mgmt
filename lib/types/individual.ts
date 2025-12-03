/**
 * 個体管理関連の型定義
 */

export type IndividualStatus = '使用中' | '廃棄済';

export interface IndividualDocument {
  type: string;
  filename: string;
  uploadDate: string;
  size: number;
}

export interface IndividualLocation {
  building: string;
  floor: string;
  department: string;
  section: string;
}

export interface Individual {
  id: number;
  // 基本情報
  facilityName?: string; // 施設名
  qrCode: string; // QRコード
  assetNo?: string; // 固定資産番号
  managementNo?: string; // 管理機器番号
  assetName: string; // 個体管理名称
  category?: string; // category
  largeClass?: string; // 大分類
  mediumClass?: string; // 中分類

  // 設置情報
  location: IndividualLocation;
  roomClass1?: string; // 諸室区分①
  roomClass2?: string; // 諸室区分②
  roomName?: string; // 諸室名称
  installationLocation?: string; // 設置場所

  // 機器情報
  maker?: string; // メーカー名
  model?: string; // 型式
  quantity?: string; // 数量／単位
  quantityNum?: number; // 数量
  serialNumber?: string; // シリアル番号
  width?: string; // W
  depth?: string; // D
  height?: string; // H
  assetInfo?: string; // 資産情報

  // 契約・購入情報
  contractName?: string; // 契約･見積名称
  contractNo?: string; // 契約番号（契約単位）
  quotationNo?: string; // 見積番号
  contractDate?: string; // 契約･発注日
  deliveryDate?: string; // 納品日
  inspectionDate?: string; // 検収日
  acquisitionCost?: number; // 取得価格

  // リース情報
  lease?: string; // リース
  leaseStartDate?: string; // リース開始日
  leaseEndDate?: string; // リース終了日
  rental?: string; // 借用

  // メンテナンス情報
  legalServiceLife?: string; // 耐用年数（法定）
  recommendedServiceLife?: string; // 使用年数（メーカー推奨）
  endOfService?: string; // End of service：販売終了
  endOfSupport?: string; // End of support：メンテ終了

  // 登録・申請情報
  registrationDate: string;
  applicationNo: string;
  applicationType: string;
  status: IndividualStatus;
  vendor?: string;

  // ドキュメント
  documents?: IndividualDocument[];
  disposalDate?: string;
  disposalApplicationNo?: string;
  disposalDocuments?: IndividualDocument[];
}

/**
 * ステータスバッジのスタイルを返す
 */
export function getIndividualStatusBadgeStyle(status: IndividualStatus): {
  background: string;
  color: string;
} {
  switch (status) {
    case '使用中':
      return { background: '#27ae60', color: 'white' };
    case '廃棄済':
      return { background: '#95a5a6', color: 'white' };
    default:
      return { background: '#95a5a6', color: 'white' };
  }
}
