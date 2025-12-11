import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  HospitalFacilityMaster,
  HospitalFacilityStatus,
  HospitalInfo,
  FacilityMapping,
  CurrentLocationKey,
} from '@/lib/types/hospitalFacility';

interface HospitalFacilityState {
  // 病院リスト
  hospitals: HospitalInfo[];
  // 個別施設マスタ
  facilities: HospitalFacilityMaster[];

  // 病院操作
  setHospitals: (hospitals: HospitalInfo[]) => void;
  addHospital: (hospital: HospitalInfo) => void;
  updateHospital: (id: string, updates: Partial<HospitalInfo>) => void;
  deleteHospital: (id: string) => void;
  getHospitalById: (id: string) => HospitalInfo | undefined;

  // 施設マスタ操作
  setFacilities: (facilities: HospitalFacilityMaster[]) => void;
  addFacility: (facility: HospitalFacilityMaster) => void;
  updateFacility: (id: string, updates: Partial<HospitalFacilityMaster>) => void;
  deleteFacility: (id: string) => void;
  getFacilityById: (id: string) => HospitalFacilityMaster | undefined;

  // 検索・フィルター
  getFacilitiesByHospitalId: (hospitalId: string) => HospitalFacilityMaster[];
  searchFacilities: (hospitalId: string, query: string) => HospitalFacilityMaster[];

  // マッピング機能
  getMappingByCurrentLocation: (key: CurrentLocationKey) => FacilityMapping | undefined;
  getNewLocationByCurrentLocation: (key: CurrentLocationKey) => { floor: string; department: string; room: string } | undefined;

  // リモデル完了処理
  completeRemodel: (hospitalId: string, facilityIds: string[]) => void;
  swapToNewLocation: (facilityId: string) => void;

  // 統計
  getHospitalStats: (hospitalId: string) => { total: number; mapped: number; completed: number };

  // ID生成
  generateFacilityId: () => string;
  generateHospitalId: () => string;
}

export const useHospitalFacilityStore = create<HospitalFacilityState>()(
  persist(
    (set, get) => ({
      hospitals: [],
      facilities: [],

      // 病院操作
      setHospitals: (hospitals) => set({ hospitals }),

      addHospital: (hospital) => set((state) => ({
        hospitals: [...state.hospitals, hospital]
      })),

      updateHospital: (id, updates) => set((state) => ({
        hospitals: state.hospitals.map((h) =>
          h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
        )
      })),

      deleteHospital: (id) => set((state) => ({
        hospitals: state.hospitals.filter((h) => h.id !== id),
        facilities: state.facilities.filter((f) => f.hospitalId !== id)
      })),

      getHospitalById: (id) => get().hospitals.find((h) => h.id === id),

      // 施設マスタ操作
      setFacilities: (facilities) => set({ facilities }),

      addFacility: (facility) => set((state) => ({
        facilities: [...state.facilities, facility]
      })),

      updateFacility: (id, updates) => set((state) => ({
        facilities: state.facilities.map((f) =>
          f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
        )
      })),

      deleteFacility: (id) => set((state) => ({
        facilities: state.facilities.filter((f) => f.id !== id)
      })),

      getFacilityById: (id) => get().facilities.find((f) => f.id === id),

      // 検索・フィルター
      getFacilitiesByHospitalId: (hospitalId) =>
        get().facilities.filter((f) => f.hospitalId === hospitalId),

      searchFacilities: (hospitalId, query) => {
        const lowerQuery = query.toLowerCase();
        return get().facilities.filter((f) =>
          f.hospitalId === hospitalId &&
          (f.currentFloor.toLowerCase().includes(lowerQuery) ||
           f.currentDepartment.toLowerCase().includes(lowerQuery) ||
           f.currentRoom.toLowerCase().includes(lowerQuery) ||
           f.newFloor.toLowerCase().includes(lowerQuery) ||
           f.newDepartment.toLowerCase().includes(lowerQuery) ||
           f.newRoom.toLowerCase().includes(lowerQuery))
        );
      },

      // マッピング機能
      getMappingByCurrentLocation: (key) => {
        const facility = get().facilities.find((f) =>
          f.hospitalId === key.hospitalId &&
          f.currentFloor === key.floor &&
          f.currentDepartment === key.department &&
          f.currentRoom === key.room
        );
        if (!facility) return undefined;
        return {
          currentLocation: {
            floor: facility.currentFloor,
            department: facility.currentDepartment,
            room: facility.currentRoom,
          },
          newLocation: {
            floor: facility.newFloor,
            department: facility.newDepartment,
            room: facility.newRoom,
          },
        };
      },

      getNewLocationByCurrentLocation: (key) => {
        const mapping = get().getMappingByCurrentLocation(key);
        return mapping?.newLocation;
      },

      // リモデル完了処理
      completeRemodel: (hospitalId, facilityIds) => {
        set((state) => ({
          facilities: state.facilities.map((f) =>
            f.hospitalId === hospitalId && facilityIds.includes(f.id)
              ? { ...f, status: 'completed' as HospitalFacilityStatus, updatedAt: new Date().toISOString() }
              : f
          )
        }));
        // 病院のステータス更新
        const stats = get().getHospitalStats(hospitalId);
        if (stats.total === stats.completed) {
          get().updateHospital(hospitalId, { remodelStatus: 'completed' });
        }
      },

      // 新居→現状への切り替え（単一施設）
      swapToNewLocation: (facilityId) => set((state) => ({
        facilities: state.facilities.map((f) =>
          f.id === facilityId
            ? {
                ...f,
                currentFloor: f.newFloor,
                currentDepartment: f.newDepartment,
                currentRoom: f.newRoom,
                newFloor: '',
                newDepartment: '',
                newRoom: '',
                status: 'completed' as HospitalFacilityStatus,
                updatedAt: new Date().toISOString(),
              }
            : f
        )
      })),

      // 統計
      getHospitalStats: (hospitalId) => {
        const facilities = get().getFacilitiesByHospitalId(hospitalId);
        return {
          total: facilities.length,
          mapped: facilities.filter((f) => f.status === 'mapped' || f.status === 'completed').length,
          completed: facilities.filter((f) => f.status === 'completed').length,
        };
      },

      // ID生成
      generateFacilityId: () => {
        const facilities = get().facilities;
        const maxId = facilities.reduce((max, f) => {
          const num = parseInt(f.id.replace('HF', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `HF${String(maxId + 1).padStart(5, '0')}`;
      },

      generateHospitalId: () => {
        const hospitals = get().hospitals;
        const maxId = hospitals.reduce((max, h) => {
          const num = parseInt(h.id.replace('HOSP', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `HOSP${String(maxId + 1).padStart(3, '0')}`;
      },
    }),
    {
      name: 'hospital-facility-storage',
    }
  )
);
