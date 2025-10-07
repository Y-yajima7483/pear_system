import { create } from "zustand";

interface OverlayStore {
  open: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
  toggleOverlay: () => void;
};

export const overlayStore = create<OverlayStore>((set) => ({
  open: false,
  openOverlay: () => set({ open: true }),
  closeOverlay: () => set({ open: false }),
  toggleOverlay: () => set((s) => ({ open: !s.open })),
}));
