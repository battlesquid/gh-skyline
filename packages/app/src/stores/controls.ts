import { create } from "zustand";

export type ProjectionMode = "perspective" | "orthographic";

export interface ControlsStore {
	reset: string
	resetView(): void;

	autoRotate: boolean;
	toggleAutoRotate(): void;

	projectionMode: ProjectionMode;
	toggleProjectionMode(): void;
}

export const useControlsStore = create<ControlsStore>((set) => ({
	reset: "",
	resetView: () => set(() => ({ reset: `${Math.random()}` })),
	autoRotate: false,
	toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
	projectionMode: "perspective",
	toggleProjectionMode: () =>
		set((state) => {
			const projectionMode =
				state.projectionMode === "perspective" ? "orthographic" : "perspective";
			return { projectionMode };
		}),
}));
