import { createFileRoute, redirect } from "@tanstack/react-router";
import { useRef } from "react";
import { fetchProfile, isAuthenticated } from "../api/auth";
import { EditorAppShell } from "../components/appshell";
import { createParametersStore, ParametersContext } from "../stores/parameters";
import "../styles/editor.css";
import { getInitialInputsFromUrl } from "../share/urlShare";
import { preloadDefaultFonts } from "../stores/fonts";
import "../styles/editor.css";
import "../styles/page.css";

export const Route = createFileRoute("/")({
	component: Editor,
	beforeLoad: ({ location }) => {
		if (!isAuthenticated()) {
			throw redirect({
				to: "/login",
				reloadDocument: true,
				search: {
					redirect: location.href,
				},
			});
		}
	},
	loader: async () => {
		preloadDefaultFonts();
		const profile = await fetchProfile();
		return profile;
	},
});

export function Editor() {
	const profile = Route.useLoaderData();
	const initialFromUrl = getInitialInputsFromUrl(window.location.href);
	const store = useRef(
		createParametersStore({ name: profile?.login ?? "", ...initialFromUrl }),
	).current;

	return (
		<ParametersContext.Provider value={store}>
			<EditorAppShell profile={profile} />
		</ParametersContext.Provider>
	);
}
