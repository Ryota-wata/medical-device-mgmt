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
