import { create } from 'zustand';
import { EditList, CreateEditListInput } from '@/lib/types';

interface EditListState {
  editLists: EditList[];
  addEditList: (input: CreateEditListInput) => EditList;
  updateEditList: (id: string, data: Partial<EditList>) => void;
  deleteEditList: (id: string) => void;
  getEditListById: (id: string) => EditList | undefined;
}

// サンプルデータ
const sampleEditLists: EditList[] = [
  {
    id: 'edit-list-001',
    name: '2025年度リモデル計画',
    facilities: ['A病院', 'B病院'],
    createdAt: '2025-01-10T10:00:00',
    updatedAt: '2025-01-10T10:00:00',
  },
  {
    id: 'edit-list-002',
    name: 'C病院設備更新',
    facilities: ['C病院'],
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
}));
