import { create } from 'zustand';
import { EditList, EditListItem, CreateEditListInput } from '@/lib/types';
import { PurchaseApplication } from '@/lib/types/purchaseApplication';
import { generateMockAssets } from '@/lib/data/generateMockAssets';

interface EditListState {
  editLists: EditList[];
  addEditList: (input: CreateEditListInput) => EditList;
  updateEditList: (id: string, data: Partial<EditList>) => void;
  deleteEditList: (id: string) => void;
  getEditListById: (id: string) => EditList | undefined;
  addItemsFromApplications: (editListId: string, applications: PurchaseApplication[]) => number;
  getItemsByEditListId: (editListId: string) => EditListItem[];
  getTotalItemCount: (editListId: string) => number;
}

// サンプルデータ（原本資産を生成して設定）
const sampleEditLists: EditList[] = [
  {
    id: 'edit-list-001',
    name: '2025年度リモデル計画',
    facilities: ['A病院', 'B病院'],
    baseAssets: generateMockAssets(['A病院', 'B病院']),
    items: [],
    createdAt: '2025-01-10T10:00:00',
    updatedAt: '2025-01-10T10:00:00',
  },
  {
    id: 'edit-list-002',
    name: 'C病院設備更新',
    facilities: ['C病院'],
    baseAssets: generateMockAssets(['C病院']),
    items: [],
    createdAt: '2025-01-08T14:30:00',
    updatedAt: '2025-01-09T09:15:00',
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

  getItemsByEditListId: (editListId: string) => {
    const list = get().editLists.find((l) => l.id === editListId);
    return list?.items || [];
  },

  getTotalItemCount: (editListId: string) => {
    const list = get().editLists.find((l) => l.id === editListId);
    return list?.items.length || 0;
  },
}));
