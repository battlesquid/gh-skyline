import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { isAuthenticated } from "../api/auth";
import { EditorAppShell } from "../components/appshell";
import { useProfile } from "../hooks/useProfile";
import { getInitialInputsFromUrl } from "../share/urlShare";
import { preloadDefaultFonts } from "../stores/fonts";
import { createParametersStore, DEFAULT_INPUT_PARAMETERS, ParametersContext, SkylineDatasource } from "../stores/parameters";
import "../styles/editor.css";
import "../styles/page.css";

export const Route = createFileRoute("/")({
	component: Editor,
	beforeLoad: async ({ location }) => {
		// await fetchProfile();
		// if (!isAuthenticated()) {
		// 	throw redirect({
		// 		to: "/login",
		// 		reloadDocument: true,
		// 		search: {
		// 			redirect: location.href,
		// 		},
		// 	});
		// }
	},
	loader: async () => {
		preloadDefaultFonts();
		// const profile = await fetchProfile();
		// return profile;
	},
});

export function Editor() {
	const profile = useProfile();
	const initialFromUrl = isAuthenticated()
		? getInitialInputsFromUrl(window.location.href)
		: null;
	const name = profile?.login ?? DEFAULT_INPUT_PARAMETERS.name;
	const store = useRef(
		createParametersStore({ name, ...initialFromUrl }),
	).current;

	return (
		<ParametersContext.Provider value={store}>
			<EditorAppShell profile={profile} />
		</ParametersContext.Provider>
	);
}
