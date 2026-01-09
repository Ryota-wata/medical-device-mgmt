// SHIP施設マスタの型定義
export interface FacilityMaster {
  id: string;
  facilityCode: string;
  facilityName: string;
  building?: string;    // 棟
  floor?: string;       // 階
  department?: string;  // 部門
  section?: string;     // 部署
  prefecture: string;
  foundingBody: string; // 設立母体
  city: string;
  address: string;
  postalCode: string;
  phoneNumber: string;
  establishedDate: string;
  facilityType: string;
  bedCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// SHIP資産マスタの型定義
export interface AssetMaster {
  id: string;
  category: string;
  largeClass: string;
  mediumClass: string;
  item: string;
  maker: string;
  model: string;
  specification: string;
  unitPrice: number;
  depreciationYears: number;
  maintenanceCycle: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// フィルター条件
export interface FacilityFilter {
  facilityCode?: string;
  facilityName?: string;
  prefecture?: string;
  city?: string;
  facilityType?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface AssetFilter {
  category?: string;
  largeClass?: string;
  mediumClass?: string;
  item?: string;
  maker?: string;
  model?: string;
  status?: 'active' | 'inactive' | 'all';
}
