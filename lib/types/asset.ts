/**
 * 資産データの型定義
 */

/**
 * 資産検索結果の型
 */
export interface Asset {
  qrCode: string;
  no: number;
  facility: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  category: string;
  largeClass: string;
  mediumClass: string;
  item: string;
  name: string;
  maker: string;
  model: string;
  quantity: number;
  width: number | string;
  depth: number | string;
  height: number | string;
  photos?: string[];

  // 追加フィールド（個体管理対応）
  assetNo?: string; // 固定資産番号
  managementNo?: string; // 管理機器番号
  roomClass1?: string; // 諸室区分①
  roomClass2?: string; // 諸室区分②
  roomName?: string; // 諸室名称
  installationLocation?: string; // 設置場所
  assetInfo?: string; // 資産情報
  quantityUnit?: string; // 数量／単位
  serialNumber?: string; // シリアル番号
  contractName?: string; // 契約･見積名称
  contractNo?: string; // 契約番号（契約単位）
  quotationNo?: string; // 見積番号
  contractDate?: string; // 契約･発注日
  deliveryDate?: string; // 納品日
  inspectionDate?: string; // 検収日
  lease?: string; // リース
  rental?: string; // 借用
  leaseStartDate?: string; // リース開始日
  leaseEndDate?: string; // リース終了日
  acquisitionCost?: number; // 取得価格
  legalServiceLife?: string; // 耐用年数（法定）
  recommendedServiceLife?: string; // 使用年数（メーカー推奨）
  endOfService?: string; // End of service：販売終了
  endOfSupport?: string; // End of support：メンテ終了

  // 作業用フィールド（見積依頼関連）
  rfqNo?: string; // 見積依頼No.
  rfqGroupName?: string; // グループ名称
  rfqVendor?: string; // 見積業者
  rfqAmount?: number | string; // 見積金額

  // 申請関連フィールド（編集リスト用）
  applicationCategory?: string; // 要望区分（申請種別）
  applicationNo?: string; // 申請No.
  applicationReason?: string; // 申請理由
  desiredDeliveryDate?: string; // 希望納期
  applicantName?: string; // 申請者
  applicantDepartment?: string; // 申請部署
  applicationDate?: string; // 申請日
  priority?: string; // 優先順位
  usagePurpose?: string; // 用途
  caseCount?: string; // 症例数
  comment?: string; // コメント
  attachedFiles?: string[]; // 添付ファイル
  currentConnectionStatus?: string; // 現在の接続状況
  currentConnectionDestination?: string; // 現在の接続先
  requestConnectionStatus?: string; // 接続要望
  requestConnectionDestination?: string; // 要望接続先
  sourceType?: 'base' | 'added'; // レコードソース（原本 or 追加）
}

/**
 * リモデル申請データの型
 */
export interface RemodelApplication {
  no: number;
  facility: string;
  // 移動前の情報
  department1: string;
  section1: string;
  roomCat1: string;
  roomCat2: string;
  // 識別情報
  qrCode: string;
  fixedAssetNo: string;
  manageDeviceNo: string;
  floor: string;
  // 設置部署
  department2: string;
  section2: string;
  roomName: string;
  // 資産分類
  category: string;
  largeClass: string;
  mediumClass: string;
  individualName: string;
  // メーカー・型式
  maker1: string;
  model1: string;
  maker2: string;
  model2: string;
  // 数量・寸法
  quantityUnit: string;
  quantity: number;
  width: number | string;
  depth: number | string;
  height: number | string;
  serialNo: string;
  // 設置情報
  installPlace: string;
  assetInfo: string;
  // 契約情報
  contractName: string;
  contractNo: string;
  quotationNo: string;
  contractDate: string;
  deliveryDate: string;
  // 検査情報
  inspectionDate1: string;
  inspectionDate2: string;
  // リース情報
  lease: string;
  rental: string;
  leaseStart: string;
  leaseEnd: string;
  // 価格・耐用年数
  acquisitionPrice: string;
  usefulLifeLegal: string;
  usefulLifeMaker: string;
  endOfService: string;
  endOfSupport: string;
  // 写真
  photos?: string[];
}

/**
 * 資産マスタデータの型
 */
export interface AssetMasterData {
  id: number;
  category: string;
  largeClass: string;
  mediumClass: string;
  individualItem: string;
  maker: string;
  model: string;
}
