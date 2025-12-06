import { create } from 'zustand';
import { Application } from '@/lib/types';

interface ApplicationState {
  applications: Application[];
  addApplication: (application: Omit<Application, 'id'>) => void;
  updateApplication: (id: number, application: Partial<Application>) => void;
  deleteApplication: (id: number) => void;
  getApplicationById: (id: number) => Application | undefined;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],

  addApplication: (application) => {
    const newId = get().applications.length > 0
      ? Math.max(...get().applications.map(a => a.id)) + 1
      : 1;

    const newApplication: Application = {
      ...application,
      id: newId,
    };

    set((state) => ({
      applications: [...state.applications, newApplication],
    }));
  },

  updateApplication: (id, updates) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, ...updates } : app
      ),
    }));
  },

  deleteApplication: (id) => {
    set((state) => ({
      applications: state.applications.filter((app) => app.id !== id),
    }));
  },

  getApplicationById: (id) => {
    return get().applications.find((app) => app.id === id);
  },
}));
