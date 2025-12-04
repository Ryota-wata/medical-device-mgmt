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
  qrCode: string;
  assetName: string;
  model?: string;
  location: IndividualLocation;
  registrationDate: string;
  applicationNo: string;
  applicationType: string;
  status: IndividualStatus;
  vendor?: string;
  serialNumber?: string;
  acquisitionCost?: number;
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
