import { create } from "zustand";

export const useForgeStore = create(set => ({
  queue: [],
  setQueue: q => set({ queue: q }),
}));
