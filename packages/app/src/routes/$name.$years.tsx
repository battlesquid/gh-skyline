import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchProfile, isAuthenticated } from "@/api/auth";
import { Editor } from "@/components/editor";
import { parseYears } from "@/share/urlShare";
import { preloadDefaultFonts } from "@/stores/fonts";

type SkylineSearch = { s?: string };

export const Route = createFileRoute("/$name/$years")({
	component: Editor,
	validateSearch: (search: Record<string, unknown>): SkylineSearch => ({
		s: typeof search.s === "string" ? search.s : undefined,
	}),
	beforeLoad: async ({ params, location }) => {
		await fetchProfile();
		if (!isAuthenticated()) {
			throw redirect({
				to: "/login",
				reloadDocument: true,
				search: {
					redirect: location.href,
				},
			});
		}
		if (parseYears(params.years) === null) {
			throw redirect({
				to: "/$name/$years",
				params: {
					name: params.name,
					years: `${new Date().getFullYear()}`,
				},
				replace: true,
			});
		}
	},
	loader: async () => {
		preloadDefaultFonts();
		const profile = await fetchProfile();
		return profile;
	},
});
