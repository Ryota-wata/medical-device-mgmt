import { create } from 'zustand';
import { Asset, RemodelApplication, AssetMasterData } from '../types';

// 初期資産データ（検索用マスタデータ）
const initialAssets: Asset[] = [
  { qrCode: 'QR-2025-0001', no: 1, facility: '東京総合病院', building: '本館', floor: '3F', department: '外科', section: '手術室', category: '医療機器', largeClass: '人工呼吸器', mediumClass: '集中治療用', item: '人工呼吸器', name: '人工呼吸器 V680', maker: 'フィリップス', model: 'V680', quantity: 1, width: 400, depth: 500, height: 1200 },
  { qrCode: 'QR-2025-0002', no: 2, facility: '東京総合病院', building: '本館', floor: '3F', department: '外科', section: '手術室', category: '医療機器', largeClass: '検査機器', mediumClass: '超音波診断装置', item: '輸液ポンプ', name: '輸液ポンプ IP-200', maker: '日立ハイテク', model: 'IP-200', quantity: 1, width: 150, depth: 200, height: 300 },
  { qrCode: 'QR-2025-0003', no: 3, facility: '東京総合病院', building: '東館', floor: '2F', department: '内科', section: '診察室', category: '医療機器', largeClass: '検査機器', mediumClass: '心電計', item: 'シリンジポンプ', name: 'シリンジポンプ TE-SS700', maker: 'テルモ', model: 'TE-SS700', quantity: 1, width: 100, depth: 150, height: 100 },
  { qrCode: 'QR-2025-0004', no: 4, facility: '東京総合病院', building: '別館', floor: '1F', department: '小児科', section: '受付', category: '医療機器', largeClass: '手術関連機器', mediumClass: '電気メス 双極', item: '除細動器', name: '除細動器 TEC-5600', maker: '日本光電', model: 'TEC-5600', quantity: 1, width: 300, depth: 400, height: 200 },
  { qrCode: 'QR-2025-0005', no: 5, facility: '東京総合病院', building: '新館', floor: '5F', department: '整形外科', section: 'リハビリ室', category: '医療機器', largeClass: '検査機器', mediumClass: '心電計', item: '心電計', name: '心電計 ECG-2550', maker: '日本光電', model: 'ECG-2550', quantity: 1, width: 350, depth: 300, height: 150 },
  { qrCode: 'QR-2025-0006', no: 6, facility: '東京総合病院', building: '本館', floor: '3F', department: '外科', section: '手術室', category: '医療機器', largeClass: 'リハビリ機器', mediumClass: '超音波治療器', item: '超音波治療器', name: '超音波治療器 US-750', maker: 'キヤノンメディカル', model: 'US-750', quantity: 1, width: 400, depth: 300, height: 1000 },
  { qrCode: 'QR-2025-0007', no: 7, facility: '東京総合病院', building: '本館', floor: '3F', department: '外科', section: '手術室', category: '医療機器', largeClass: 'リハビリ機器', mediumClass: '電気刺激装置', item: '低周波治療器', name: '低周波治療器 EU-910', maker: 'オージー技研', model: 'EU-910', quantity: 1, width: 250, depth: 200, height: 100 },
  { qrCode: 'QR-2025-0008', no: 8, facility: '東京総合病院', building: '東館', floor: '2F', department: '内科', section: '診察室', category: '医療機器', largeClass: '検査機器', mediumClass: '生化学分析装置', item: '自動分析装置', name: '自動分析装置 LABOSPECT', maker: '日立ハイテク', model: 'LABOSPECT 008α', quantity: 1, width: 1200, depth: 800, height: 1500 },
  { qrCode: 'QR-2025-0009', no: 9, facility: '東京総合病院', building: '東館', floor: '2F', department: '内科', section: '診察室', category: '医療機器', largeClass: '手術関連機器', mediumClass: '内視鏡関連', item: '内視鏡システム', name: '内視鏡システム EVIS X1', maker: 'オリンパス', model: 'CV-1500', quantity: 1, width: 600, depth: 500, height: 1400 },
  { qrCode: 'QR-2025-0010', no: 10, facility: '東京総合病院', building: '別館', floor: '1F', department: '小児科', section: '受付', category: '医療機器', largeClass: '検査機器', mediumClass: '血球計数器', item: '自動血球計数器', name: '自動血球計数器 XN-1000', maker: 'シスメックス', model: 'XN-1000', quantity: 1, width: 500, depth: 600, height: 700 },
  { qrCode: 'QR-2025-0011', no: 11, facility: '東京総合病院', building: '新館', floor: '5F', department: '整形外科', section: 'リハビリ室', category: '医療機器', largeClass: '透析関連機器', mediumClass: '血液透析装置', item: '個人用透析装置', name: '個人用透析装置 DCS-200Si', maker: '日機装', model: 'DCS-200Si', quantity: 1, width: 600, depth: 500, height: 1500 },
  { qrCode: 'QR-2025-0012', no: 12, facility: '東京総合病院', building: '本館', floor: '4F', department: '循環器科', section: '検査室', category: '医療機器', largeClass: '滅菌機器', mediumClass: '高圧蒸気滅菌器', item: 'オートクレーブ', name: 'オートクレーブ SG-750', maker: 'サクラ精機', model: 'SG-750', quantity: 1, width: 800, depth: 700, height: 1200 },
  { qrCode: 'QR-2025-0013', no: 13, facility: '東京総合病院', building: '本館', floor: '3F', department: '外科', section: '手術室', category: '医療機器', largeClass: '手術関連機器', mediumClass: '電気メス 双極', item: '電気手術器', name: '電気手術器 ESG-400', maker: 'オリンパス', model: 'ESG-400', quantity: 1, width: 300, depth: 400, height: 200 },
  { qrCode: 'QR-2025-0014', no: 14, facility: '東京総合病院', building: '東館', floor: '2F', department: '内科', section: '診察室', category: '医療機器', largeClass: '画像診断機器', mediumClass: 'CT関連', item: 'CTスキャナー', name: 'CTスキャナー SOMATOM', maker: 'シーメンス', model: 'SOMATOM Drive', quantity: 1, width: 2500, depth: 2000, height: 2000 },
  { qrCode: 'QR-2025-0015', no: 15, facility: '東京総合病院', building: '新館', floor: '5F', department: '整形外科', section: 'リハビリ室', category: '医療機器', largeClass: '画像診断機器', mediumClass: 'MRI関連', item: 'MRI装置', name: 'MRI装置 SIGNA Explorer', maker: 'GEヘルスケア', model: 'SIGNA Explorer', quantity: 1, width: 3000, depth: 2500, height: 2500 },
];

interface AssetStore {
  assets: Asset[];
  selectedAsset: Asset | null;
  remodelApplications: RemodelApplication[];
  assetMasterData: AssetMasterData[];
  isLoading: boolean;

  // 資産検索
  searchAssets: (filters: any) => Promise<Asset[]>;
  setSelectedAsset: (asset: Asset | null) => void;
  getAssets: () => Asset[];

  // リモデル申請
  loadRemodelApplications: () => Promise<void>;
  addRemodelApplication: (application: RemodelApplication) => void;

  // 資産マスタ
  loadAssetMaster: () => Promise<void>;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: initialAssets,
  selectedAsset: null,
  remodelApplications: [],
  assetMasterData: [],
  isLoading: false,

  searchAssets: async (filters: any) => {
    set({ isLoading: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      // 初期データからフィルタリング
      let results = initialAssets;
      if (filters.building) results = results.filter(a => a.building.includes(filters.building));
      if (filters.floor) results = results.filter(a => a.floor.includes(filters.floor));
      if (filters.department) results = results.filter(a => a.department.includes(filters.department));
      if (filters.section) results = results.filter(a => a.section.includes(filters.section));
      if (filters.category) results = results.filter(a => a.category.includes(filters.category));
      if (filters.largeClass) results = results.filter(a => a.largeClass.includes(filters.largeClass));
      if (filters.mediumClass) results = results.filter(a => a.mediumClass.includes(filters.mediumClass));
      set({ isLoading: false });
      return results;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setSelectedAsset: (asset: Asset | null) => {
    set({ selectedAsset: asset });
  },

  getAssets: () => get().assets,

  loadRemodelApplications: async () => {
    set({ isLoading: true });
    try {
      // TODO: 実際のAPIコールに置き換える
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockApplications: RemodelApplication[] = [];
      set({ remodelApplications: mockApplications, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addRemodelApplication: (application: RemodelApplication) => {
    set((state) => ({
      remodelApplications: [...state.remodelApplications, application]
    }));
  },

  loadAssetMaster: async () => {
    set({ isLoading: true });
    try {
      // TODO: 実際のAPIコールに置き換える
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockMasterData: AssetMasterData[] = [];
      set({ assetMasterData: mockMasterData, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));
