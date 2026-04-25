import { create } from 'zustand';
import { EditList, EditListItem, CreateEditListInput, Asset } from '@/lib/types';
import { PurchaseApplication } from '@/lib/types/purchaseApplication';
import { generateMockAssets } from '@/lib/data/generateMockAssets';
import { customerEditListItems } from '@/lib/data/customer';

// 顧客サンプルデータをAsset型に変換
const customerBaseAssets: Asset[] = customerEditListItems.map((item, i) => ({
  qrCode: item.qrCode || '',
  no: i + 1,
  facility: 'サンプル病院',
  building: item.currentBuilding || '',
  floor: item.currentFloor || '',
  department: item.currentDivision || '',
  section: item.currentDepartment || '',
  category: item.category || '',
  largeClass: item.largeClass || '',
  mediumClass: item.mediumClass || '',
  item: item.itemName || '',
  name: item.itemName || '',
  maker: item.manufacturer || '',
  model: item.model || '',
  quantity: item.quantity || 0,
  width: '', depth: '', height: '',
  roomName: item.currentRoom || '',
  commonDivision: item.commonDivision || '',
  commonDepartment: item.commonDepartment || '',
  roomCategory1: item.roomCategory1 || '',
  roomCategory2: item.roomCategory2 || '',
  divisionId: item.divisionId || '',
  departmentId: item.departmentId || '',
  roomId: item.roomId || '',
  currentBuilding: item.currentBuilding || '',
  currentFloor: item.currentFloor || '',
  currentDivision: item.currentDivision || '',
  currentDepartment: item.currentDepartment || '',
  currentRoom: item.currentRoom || '',
  newBuilding: item.newBuilding || '',
  newFloor: item.newFloor || '',
  newDivision: item.newDivision || '',
  newDepartment: item.newDepartment || '',
  newRoom: item.newRoom || '',
  serialNo: item.serialNo || '',
  fixedAssetNo: item.fixedAssetNo || '',
  meNo: item.meNo || '',
  assetMasterId: item.assetMasterId || '',
  itemType: item.itemType || '',
  parentItem: item.parentItem || '',
  itemName: item.itemName || '',
  manufacturer: item.manufacturer || '',
  unit: item.unit || '',
  managementDept: item.managementDept || '',
  deviceType: item.deviceType || '',
  assetGroupName: item.assetGroupName || '',
  purpose: item.purpose || '',
  remarks: item.remarks || '',
  applicationType: item.applicationType || '',
  fiscalYear: item.fiscalYear || '',
  priority: item.priority || '',
  systemConnection: item.systemConnection || '',
  systemTarget: item.systemTarget || '',
  wish1Manufacturer: item.wish1Manufacturer || '',
  wish1Model: item.wish1Model || '',
  wish2Manufacturer: item.wish2Manufacturer || '',
  wish2Model: item.wish2Model || '',
  wish3Manufacturer: item.wish3Manufacturer || '',
  wish3Model: item.wish3Model || '',
  rfqNo: item.rfqNo || '',
  rfqGroupName: item.rfqGroupName || '',
  quotationPhase: item.quotationPhase || '',
  quotationDate: item.quotationDate || '',
  accountCategory: item.accountCategory || '',
  listPriceUnit: item.listPriceUnit || 0,
  listPriceTotal: item.listPriceTotal || 0,
  quotationPriceUnit: item.quotationPriceUnit || 0,
  quotationPriceExTax: item.quotationPriceExTax || 0,
  quotationPriceInTax: item.quotationPriceInTax || 0,
}));

interface EditListState {
  editLists: EditList[];
  addEditList: (input: CreateEditListInput) => EditList;
  updateEditList: (id: string, data: Partial<EditList>) => void;
  deleteEditList: (id: string) => void;
  getEditListById: (id: string) => EditList | undefined;
  addItemsFromApplications: (editListId: string, applications: PurchaseApplication[]) => number;
  updateRfqInfo: (editListId: string, selectedNos: Set<number>, rfqNo: string, rfqGroupName: string) => void;
  updateBaseAsset: (editListId: string, assetNo: number, patch: Record<string, unknown>) => void;
  addBaseAssets: (editListId: string, newAssets: import('@/lib/types').Asset[], afterNo?: number) => void;
  getItemsByEditListId: (editListId: string) => EditListItem[];
  getTotalItemCount: (editListId: string) => number;
}

// サンプルデータ（顧客Excelから変換した原本資産を設定）
const sampleEditLists: EditList[] = [
  {
    id: 'edit-list-001',
    name: 'サンプル病院 編集分析リスト',
    facilities: ['サンプル病院'],
    baseAssets: customerBaseAssets,
    items: [],
    createdAt: '2025-01-10T10:00:00',
    updatedAt: '2025-01-10T10:00:00',
  },
];

export const useEditListStore = create<EditListState>((set, get) => ({
  editLists: sampleEditLists,

  addEditList: (input: CreateEditListInput) => {
    const now = new Date().toISOString();
    const newEditList: EditList = {
      id: `edit-list-${Date.now()}`,
      name: input.name,
      facilities: input.facilities,
      baseAssets: [...input.baseAssets],  // 原本資産を複製
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      editLists: [...state.editLists, newEditList],
    }));

    return newEditList;
  },

  updateEditList: (id: string, data: Partial<EditList>) => {
    set((state) => ({
      editLists: state.editLists.map((list) =>
        list.id === id
          ? { ...list, ...data, updatedAt: new Date().toISOString() }
          : list
      ),
    }));
  },

  deleteEditList: (id: string) => {
    set((state) => ({
      editLists: state.editLists.filter((list) => list.id !== id),
    }));
  },

  getEditListById: (id: string) => {
    return get().editLists.find((list) => list.id === id);
  },

  // 申請から要望機器をアイテムとして追加
  addItemsFromApplications: (editListId: string, applications: PurchaseApplication[]) => {
    const now = new Date().toISOString();
    let addedCount = 0;

    set((state) => {
      const updatedLists = state.editLists.map((list) => {
        if (list.id !== editListId) return list;

        const newItems: EditListItem[] = [];

        applications.forEach((app) => {
          app.assets.forEach((asset, index) => {
            newItems.push({
              id: `item-${Date.now()}-${app.id}-${index}`,
              applicationId: app.id,
              applicationNo: app.applicationNo,
              applicationType: app.applicationType,
              applicationReason: app.applicationReason,
              applicantName: app.applicantName,
              applicantDepartment: app.applicantDepartment,
              applicationDate: app.applicationDate,
              assetId: asset.assetId,
              qrCode: asset.qrCode,
              name: asset.name,
              maker: asset.maker,
              model: asset.model,
              category: asset.category,
              largeClass: asset.largeClass,
              mediumClass: asset.mediumClass,
              item: asset.item,
              quantity: asset.quantity,
              unit: asset.unit,
              facility: app.facility,
              building: app.building,
              floor: app.floor,
              department: app.department,
              section: app.section,
              roomName: app.roomName,
              desiredDeliveryDate: app.desiredDeliveryDate,
              priority: app.priority,
              usagePurpose: app.usagePurpose,
              caseCount: app.caseCount,
              comment: app.comment,
              attachedFiles: app.attachedFiles,
              currentConnectionStatus: app.currentConnectionStatus,
              currentConnectionDestination: app.currentConnectionDestination,
              requestConnectionStatus: app.requestConnectionStatus,
              requestConnectionDestination: app.requestConnectionDestination,
              status: 'pending',
              addedAt: now,
            });
          });
        });

        addedCount = newItems.length;

        return {
          ...list,
          items: [...list.items, ...newItems],
          updatedAt: now,
        };
      });

      return { editLists: updatedLists };
    });

    return addedCount;
  },

  updateRfqInfo: (editListId: string, selectedNos: Set<number>, rfqNo: string, rfqGroupName: string) => {
    set((state) => ({
      editLists: state.editLists.map((list) => {
        if (list.id !== editListId) return list;

        // baseAssets の更新（asset.no で照合）
        const updatedBaseAssets = list.baseAssets.map((asset) => {
          if (selectedNos.has(asset.no)) {
            return { ...asset, rfqNo, rfqGroupName };
          }
          return asset;
        });

        // items の更新（90000 + index で照合）
        const updatedItems = list.items.map((item, index) => {
          if (selectedNos.has(90000 + index)) {
            return { ...item, rfqNo, rfqGroupId: rfqNo, status: 'rfq_assigned' as const };
          }
          return item;
        });

        return {
          ...list,
          baseAssets: updatedBaseAssets,
          items: updatedItems,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  updateBaseAsset: (editListId: string, assetNo: number, patch: Record<string, unknown>) => {
    set((state) => ({
      editLists: state.editLists.map((list) => {
        if (list.id !== editListId) return list;
        return {
          ...list,
          baseAssets: list.baseAssets.map((asset) =>
            asset.no === assetNo ? { ...asset, ...patch } : asset
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  addBaseAssets: (editListId: string, newAssets: import('@/lib/types').Asset[], afterNo?: number) => {
    set((state) => ({
      editLists: state.editLists.map((list) => {
        if (list.id !== editListId) return list;
        let updated: import('@/lib/types').Asset[];
        if (afterNo != null) {
          const idx = list.baseAssets.findIndex(a => a.no === afterNo);
          if (idx >= 0) {
            updated = [...list.baseAssets.slice(0, idx + 1), ...newAssets, ...list.baseAssets.slice(idx + 1)];
          } else {
            updated = [...list.baseAssets, ...newAssets];
          }
        } else {
          updated = [...list.baseAssets, ...newAssets];
        }
        return {
          ...list,
          baseAssets: updated,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  getItemsByEditListId: (editListId: string) => {
    const list = get().editLists.find((l) => l.id === editListId);
    return list?.items || [];
  },

  getTotalItemCount: (editListId: string) => {
    const list = get().editLists.find((l) => l.id === editListId);
    return list?.items.length || 0;
  },
}));
