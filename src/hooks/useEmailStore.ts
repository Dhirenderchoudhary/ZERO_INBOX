import { create } from "zustand";

interface EmailStore {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  composeOpen: boolean;
  setComposeOpen: (open: boolean) => void;
  replyTo: { from: string; subject: string; body?: string } | null;
  setReplyTo: (
    reply: { from: string; subject: string; body?: string } | null,
  ) => void;
}

export const useEmailStore = create<EmailStore>((set) => ({
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
  composeOpen: false,
  setComposeOpen: (open) => set({ composeOpen: open }),
  replyTo: null,
  setReplyTo: (reply) => set({ replyTo: reply }),
}));
