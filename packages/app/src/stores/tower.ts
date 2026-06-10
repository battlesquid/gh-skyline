import { create } from "zustand";
import type { ContributionDay } from "@/api/types";

interface TowerPosition {
	x: number;
	y: number;
}

interface TowerStore {
	position: TowerPosition;
	target: ContributionDay | null;
	setPosition(position: TowerPosition): void;
	setTarget(target: ContributionDay | null): void;
}

export const useTowerStore = create<TowerStore>((set) => ({
	position: {
		x: 0,
		y: 0,
	},
	target: null,
	setPosition: (position) => set(() => ({ position })),
	setTarget: (target) => set(() => ({ target })),
}));
