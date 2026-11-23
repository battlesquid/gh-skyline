import { create } from "zustand";
import type { ExportTarget, SkylineAssembly } from "../three/assembly";

interface ModelSnapshot {
	revision: number;
	model: SkylineAssembly;
	waiting: boolean;
	warnings: string[];
	fontError?: string;
}

interface ModelStore {
	snapshot: ModelSnapshot | null;
	target: ExportTarget;
	busy: boolean;
	error: string;
	frontDraft: { item: "name" | "year"; axis: "x" | "y"; value: number } | null;
	setSnapshot: (snapshot: ModelSnapshot | null) => void;
	setTarget: (target: ExportTarget) => void;
}

export const useModelStore = create<ModelStore>((set) => ({
	snapshot: null,
	target: "assembled",
	busy: false,
	error: "",
	frontDraft: null,
	setSnapshot: (snapshot) => set({ snapshot }),
	setTarget: (target) => set({ target, error: "" }),
}));
