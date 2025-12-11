import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  OriginalListItem,
  OriginalListStatus,
  OriginalListFilter,
  OriginalListStats,
  OriginalListImportData,
  hasCompleteNewLocation,
} from '@/lib/types/originalList';
import { useHospitalFacilityStore } from './hospitalFacilityStore';

interface OriginalListState {
  // データ
  items: OriginalListItem[];

  // CRUD操作
  setItems: (items: OriginalListItem[]) => void;
  addItem: (item: OriginalListItem) => void;
  addItems: (items: OriginalListItem[]) => void;
  updateItem: (id: string, updates: Partial<OriginalListItem>) => void;
  deleteItem: (id: string) => void;
  getItemById: (id: string) => OriginalListItem | undefined;

  // フィルター・検索
  getItemsByHospitalId: (hospitalId: string) => OriginalListItem[];
  filterItems: (filter: OriginalListFilter) => OriginalListItem[];
  searchItems: (hospitalId: string, query: string) => OriginalListItem[];

  // マッピング機能（個別施設マスタ連携）
  applyMappingFromFacilityMaster: (itemId: string) => boolean;
  applyMappingToAll: (hospitalId: string) => number;
  setNewLocation: (
    itemId: string,
    newLocation: { floor: string; department: string; room: string }
  ) => void;

  // ステータス更新
  updateStatus: (id: string, status: OriginalListStatus) => void;
  approveItem: (id: string, approvedBy: string) => void;
  completeItem: (id: string) => void;
  cancelItem: (id: string) => void;

  // 一括操作
  approveItems: (ids: string[], approvedBy: string) => void;
  completeItems: (ids: string[]) => void;

  // インポート
  importItems: (
    hospitalId: string,
    hospitalName: string,
    data: OriginalListImportData[]
  ) => number;

  // 統計
  getStats: (hospitalId: string) => OriginalListStats;

  // ID生成
  generateItemId: () => string;
}

export const useOriginalListStore = create<OriginalListState>()(
  persist(
    (set, get) => ({
      items: [],

      // CRUD操作
      setItems: (items) => set({ items }),

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      addItems: (items) =>
        set((state) => ({
          items: [...state.items, ...items],
        })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          ),
        })),

      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      getItemById: (id) => get().items.find((item) => item.id === id),

      // フィルター・検索
      getItemsByHospitalId: (hospitalId) =>
        get().items.filter((item) => item.hospitalId === hospitalId),

      filterItems: (filter) => {
        let result = get().items;

        if (filter.hospitalId) {
          result = result.filter((item) => item.hospitalId === filter.hospitalId);
        }

        if (filter.status) {
          result = result.filter((item) => item.status === filter.status);
        }

        if (filter.floor) {
          result = result.filter((item) =>
            item.currentFloor.toLowerCase().includes(filter.floor!.toLowerCase())
          );
        }

        if (filter.department) {
          result = result.filter((item) =>
            item.currentDepartment
              .toLowerCase()
              .includes(filter.department!.toLowerCase())
          );
        }

        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          result = result.filter(
            (item) =>
              item.assetName.toLowerCase().includes(query) ||
              item.assetNo?.toLowerCase().includes(query) ||
              item.managementNo?.toLowerCase().includes(query) ||
              item.maker?.toLowerCase().includes(query) ||
              item.model?.toLowerCase().includes(query)
          );
        }

        if (filter.hasMappingOnly) {
          result = result.filter((item) => hasCompleteNewLocation(item));
        }

        return result;
      },

      searchItems: (hospitalId, query) => {
        const lowerQuery = query.toLowerCase();
        return get().items.filter(
          (item) =>
            item.hospitalId === hospitalId &&
            (item.assetName.toLowerCase().includes(lowerQuery) ||
              item.assetNo?.toLowerCase().includes(lowerQuery) ||
              item.managementNo?.toLowerCase().includes(lowerQuery) ||
              item.currentFloor.toLowerCase().includes(lowerQuery) ||
              item.currentDepartment.toLowerCase().includes(lowerQuery) ||
              item.currentRoom.toLowerCase().includes(lowerQuery))
        );
      },

      // マッピング機能
      applyMappingFromFacilityMaster: (itemId) => {
        const item = get().getItemById(itemId);
        if (!item) return false;

        // 個別施設マスタから現状の設置場所に対応する新居情報を取得
        const facilityStore = useHospitalFacilityStore.getState();
        const newLocation = facilityStore.getNewLocationByCurrentLocation({
          hospitalId: item.hospitalId,
          floor: item.currentFloor,
          department: item.currentDepartment,
          room: item.currentRoom,
        });

        if (!newLocation || !newLocation.floor) return false;

        get().updateItem(itemId, {
          newFloor: newLocation.floor,
          newDepartment: newLocation.department,
          newRoom: newLocation.room,
          status: 'mapped',
          mappedAt: new Date().toISOString(),
        });

        return true;
      },

      applyMappingToAll: (hospitalId) => {
        const items = get().getItemsByHospitalId(hospitalId);
        let mappedCount = 0;

        items.forEach((item) => {
          if (item.status === 'pending') {
            const success = get().applyMappingFromFacilityMaster(item.id);
            if (success) mappedCount++;
          }
        });

        return mappedCount;
      },

      setNewLocation: (itemId, newLocation) => {
        const item = get().getItemById(itemId);
        if (!item) return;

        const hasComplete =
          newLocation.floor && newLocation.department && newLocation.room;

        get().updateItem(itemId, {
          newFloor: newLocation.floor,
          newDepartment: newLocation.department,
          newRoom: newLocation.room,
          status: hasComplete ? 'mapped' : item.status,
          mappedAt: hasComplete ? new Date().toISOString() : item.mappedAt,
        });
      },

      // ステータス更新
      updateStatus: (id, status) => {
        get().updateItem(id, { status });
      },

      approveItem: (id, approvedBy) => {
        get().updateItem(id, {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy,
        });
      },

      completeItem: (id) => {
        get().updateItem(id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      },

      cancelItem: (id) => {
        get().updateItem(id, { status: 'cancelled' });
      },

      // 一括操作
      approveItems: (ids, approvedBy) => {
        ids.forEach((id) => get().approveItem(id, approvedBy));
      },

      completeItems: (ids) => {
        ids.forEach((id) => get().completeItem(id));
      },

      // インポート
      importItems: (hospitalId, hospitalName, data) => {
        const now = new Date().toISOString();
        const newItems: OriginalListItem[] = data.map((row, index) => ({
          id: `${get().generateItemId()}_${index}`,
          hospitalId,
          hospitalName,
          assetName: row.assetName,
          assetNo: row.assetNo,
          managementNo: row.managementNo,
          category: row.category,
          largeClass: row.largeClass,
          mediumClass: row.mediumClass,
          maker: row.maker,
          model: row.model,
          serialNumber: row.serialNumber,
          quantity: row.quantity || 1,
          quantityUnit: row.quantityUnit,
          currentFloor: row.floor,
          currentDepartment: row.department,
          currentRoom: row.room,
          currentBuilding: row.building,
          currentSection: row.section,
          acquisitionCost: row.acquisitionCost,
          acquisitionDate: row.acquisitionDate,
          contractNo: row.contractNo,
          leaseInfo: row.leaseInfo,
          width: row.width,
          depth: row.depth,
          height: row.height,
          notes: row.notes,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        }));

        get().addItems(newItems);
        return newItems.length;
      },

      // 統計
      getStats: (hospitalId) => {
        const items = get().getItemsByHospitalId(hospitalId);
        const total = items.length;
        const pending = items.filter((i) => i.status === 'pending').length;
        const mapped = items.filter((i) => i.status === 'mapped').length;
        const approved = items.filter((i) => i.status === 'approved').length;
        const completed = items.filter((i) => i.status === 'completed').length;
        const cancelled = items.filter((i) => i.status === 'cancelled').length;
        const mappingRate =
          total > 0
            ? Math.round(((mapped + approved + completed) / total) * 100)
            : 0;

        return {
          total,
          pending,
          mapped,
          approved,
          completed,
          cancelled,
          mappingRate,
        };
      },

      // ID生成
      generateItemId: () => {
        const items = get().items;
        const maxId = items.reduce((max, item) => {
          const num = parseInt(item.id.replace('OL', '').split('_')[0], 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `OL${String(maxId + 1).padStart(6, '0')}`;
      },
    }),
    {
      name: 'original-list-storage',
    }
  )
);
