import { create } from 'zustand';
import { FacilityMaster, AssetMaster } from '@/lib/types/master';

interface MasterStore {
  facilities: FacilityMaster[];
  assets: AssetMaster[];

  // Facility actions
  setFacilities: (facilities: FacilityMaster[]) => void;
  addFacility: (facility: FacilityMaster) => void;
  updateFacility: (id: string, facility: Partial<FacilityMaster>) => void;
  deleteFacility: (id: string) => void;
  getFacilityById: (id: string) => FacilityMaster | undefined;

  // Asset actions
  setAssets: (assets: AssetMaster[]) => void;
  addAsset: (asset: AssetMaster) => void;
  updateAsset: (id: string, asset: Partial<AssetMaster>) => void;
  deleteAsset: (id: string) => void;
  getAssetById: (id: string) => AssetMaster | undefined;

  // Search functions
  searchFacilities: (query: string) => FacilityMaster[];
  searchAssets: (query: string) => AssetMaster[];
}

export const useMasterStore = create<MasterStore>((set, get) => ({
  facilities: [],
  assets: [],

  // Facility actions
  setFacilities: (facilities) => set({ facilities }),

  addFacility: (facility) => set((state) => ({
    facilities: [...state.facilities, facility]
  })),

  updateFacility: (id, facility) => set((state) => ({
    facilities: state.facilities.map((f) =>
      f.id === id ? { ...f, ...facility, updatedAt: new Date().toISOString() } : f
    )
  })),

  deleteFacility: (id) => set((state) => ({
    facilities: state.facilities.filter((f) => f.id !== id)
  })),

  getFacilityById: (id) => {
    return get().facilities.find((f) => f.id === id);
  },

  // Asset actions
  setAssets: (assets) => set({ assets }),

  addAsset: (asset) => set((state) => ({
    assets: [...state.assets, asset]
  })),

  updateAsset: (id, asset) => set((state) => ({
    assets: state.assets.map((a) =>
      a.id === id ? { ...a, ...asset, updatedAt: new Date().toISOString() } : a
    )
  })),

  deleteAsset: (id) => set((state) => ({
    assets: state.assets.filter((a) => a.id !== id)
  })),

  getAssetById: (id) => {
    return get().assets.find((a) => a.id === id);
  },

  // Search functions (fuzzy search)
  searchFacilities: (query) => {
    const facilities = get().facilities;
    if (!query) return facilities;

    const lowerQuery = query.toLowerCase();
    return facilities.filter((f) =>
      f.facilityCode.toLowerCase().includes(lowerQuery) ||
      f.facilityName.toLowerCase().includes(lowerQuery) ||
      f.prefecture.toLowerCase().includes(lowerQuery) ||
      f.city.toLowerCase().includes(lowerQuery)
    );
  },

  searchAssets: (query) => {
    const assets = get().assets;
    if (!query) return assets;

    const lowerQuery = query.toLowerCase();
    return assets.filter((a) =>
      a.category.toLowerCase().includes(lowerQuery) ||
      a.largeClass.toLowerCase().includes(lowerQuery) ||
      a.mediumClass.toLowerCase().includes(lowerQuery) ||
      a.item.toLowerCase().includes(lowerQuery) ||
      a.maker.toLowerCase().includes(lowerQuery) ||
      a.model.toLowerCase().includes(lowerQuery)
    );
  },
}));
