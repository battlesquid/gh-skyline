import { useEffect, useRef } from "react";
import {
	encodeShareState,
	getInitialInputsFromUrl,
	toFull,
	toMinimal,
	URL_PARAM_KEY,
} from "../share/urlShare";
import { useParametersContext } from "../stores/parameters";

export function useUrlStateSync() {
	const inputs = useParametersContext((s) => s.inputs);
	const setInputs = useParametersContext((s) => s.setInputs);

	useEffect(() => {
		const initial = getInitialInputsFromUrl(window.location.href);
		if (Object.keys(initial).length) {
			setInputs(initial);
		}
	}, []);

	const prevEncodedRef = useRef<string | null>(null);
	useEffect(() => {
		const full = toFull(inputs);
		const encoded = encodeShareState(full);
		if (prevEncodedRef.current === encoded) return;
		prevEncodedRef.current = encoded;
		const url = new URL(window.location.href);
		url.searchParams.set(URL_PARAM_KEY, encoded);
		window.history.replaceState({}, "", url);
	}, [inputs]);

	return {
		getMinimalLink: () => {
			const minimal = toMinimal(inputs);
			const encoded = encodeShareState(minimal);
			const url = new URL(window.location.href);
			url.searchParams.set(URL_PARAM_KEY, encoded);
			return url.toString();
		},
		getFullLink: () => {
			const full = toFull(inputs);
			const encoded = encodeShareState(full);
			const url = new URL(window.location.href);
			url.searchParams.set(URL_PARAM_KEY, encoded);
			return url.toString();
		},
	};
}
