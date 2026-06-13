import { create } from 'zustand';

interface EmailStore {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export const useEmailStore = create<EmailStore>((set) => ({
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
}));
