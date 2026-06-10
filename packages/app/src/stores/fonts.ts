import { create } from "zustand";
import { useTTFLoader } from "../hooks/use-ttf-loader";

const FONT_KEY = "fonts";

interface FontStore {
	fonts: FontMap;
	addFont(name: string, url: string): boolean;
}

export type FontMap = Record<string, string>;

export const DEFAULT_FONTS = Object.freeze({
	"Mona Sans": "/fonts/MonaSansSemiExpanded-Bold.ttf",
	"Inter Bold": "/fonts/Inter_Bold.ttf",
	Quicksilver: "/fonts/Quicksilver_Regular.ttf",
	Inter: "/fonts/Inter_Regular.ttf",
	"Press Start": "/fonts/PressStart2P_Regular.ttf",
	"Arvo Bold": "/fonts/Arvo_Bold.ttf",
	"Space Mono": "/fonts/SpaceMono-Bold.ttf",
	"Bebas Neue": "/fonts/BebasNeue_Regular.ttf",
	"Noto Serif": "/fonts/NotoSerif.ttf",
});

export const DEFAULT_FONT_SELECTION = "Mona Sans";

export const DEFAULT_FONT = DEFAULT_FONTS[DEFAULT_FONT_SELECTION];

export const preloadDefaultFonts = () => {
	Object.values(DEFAULT_FONTS).forEach(useTTFLoader.preload);
};

export const getFontsLocal = (): FontMap => {
	try {
		return JSON.parse(localStorage.getItem(FONT_KEY) ?? "{}");
	} catch (e) {
		console.error(e);
		return {};
	}
};

export const addFontLocal = (name: string, font: string) => {
	const fonts = getFontsLocal();
	localStorage.setItem(FONT_KEY, JSON.stringify({ ...fonts, [name]: font }));
};

export const useFontStore = create<FontStore>((set) => ({
	fonts: {
		...DEFAULT_FONTS,
		...getFontsLocal(),
	},
	addFont: (name, url) => {
		try {
			useTTFLoader.preload(url);
			set((state) => ({ fonts: { ...state.fonts, [name]: url } }));
			addFontLocal(name, url);
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	},
}));
