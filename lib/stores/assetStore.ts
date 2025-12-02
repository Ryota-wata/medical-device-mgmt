import { create } from 'zustand';
import { Asset, RemodelApplication, AssetMasterData } from '../types';

interface AssetStore {
  assets: Asset[];
  selectedAsset: Asset | null;
  remodelApplications: RemodelApplication[];
  assetMasterData: AssetMasterData[];
  isLoading: boolean;

  // 資産検索
  searchAssets: (filters: any) => Promise<void>;
  setSelectedAsset: (asset: Asset | null) => void;

  // リモデル申請
  loadRemodelApplications: () => Promise<void>;
  addRemodelApplication: (application: RemodelApplication) => void;

  // 資産マスタ
  loadAssetMaster: () => Promise<void>;
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],
  selectedAsset: null,
  remodelApplications: [],
  assetMasterData: [],
  isLoading: false,

  searchAssets: async (filters: any) => {
    set({ isLoading: true });
    try {
      // TODO: 実際のAPIコールに置き換える
      await new Promise((resolve) => setTimeout(resolve, 500));

      // モックデータ
      const mockAssets: Asset[] = [
        {
          qrCode: 'QR-2025-0001',
          no: 1,
          facility: '〇〇〇〇〇〇病院',
          building: '本館',
          floor: '2F',
          department: '手術部門',
          section: '手術',
          category: '医療機器',
          largeClass: '手術関連機器',
          mediumClass: '電気メス 双極',
          item: '手術台',
          name: '電気手術用電源装置2システム',
          maker: '医療',
          model: 'EW11 超音波吸引器',
          quantity: 1,
          width: 520,
          depth: 480,
          height: 1400,
        }
      ];

      set({ assets: mockAssets, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setSelectedAsset: (asset: Asset | null) => {
    set({ selectedAsset: asset });
  },

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
