import { create } from "zustand";

export interface ControlsStore {
	reset: true | null;
	resetView(): void;
	clearReset(): void;
}

export const useControlsStore = create<ControlsStore>((set) => ({
	reset: null,
	resetView: () => set(() => ({ reset: true })),
	clearReset: () => set(() => ({ reset: null })),
}));
