import { getRouteApi } from "@tanstack/react-router";
import { useRef } from "react";
import { EditorAppShell } from "@/components/appshell";
import { getInitialInputs } from "@/share/urlShare";
import { createParametersStore, ParametersContext } from "@/stores/parameters";
import "@/styles/editor.css";
import "@/styles/page.css";

const routeApi = getRouteApi("/$name/$years");

export function Editor() {
	const profile = routeApi.useLoaderData();
	const params = routeApi.useParams();
	const { s } = routeApi.useSearch();

	// Seed once. name/years come from the path, the rest from `?s=`; the path
	// name overrides the profile login so shared links render the other user.
	const store = useRef(
		createParametersStore({
			name: profile?.login,
			...getInitialInputs(params, s),
		}),
	).current;

	return (
		<ParametersContext.Provider value={store}>
			<EditorAppShell profile={profile} />
		</ParametersContext.Provider>
	);
}
