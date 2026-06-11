import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
	buildShareLinks,
	encodeRestIfNeeded,
	formatYearsPath,
} from "@/share/urlShare";
import { useParametersContext } from "@/stores/parameters";

/**
 * Keeps the URL in sync with the parameters store:
 * name/years drive the path, the rest is encoded into `?s=` (omitted at defaults).
 * Must be called from within the `/$name/$years` route subtree.
 */
export function useUrlStateSync() {
	const navigate = useNavigate();
	const params = useParams({ from: "/$name/$years" });
	const inputs = useParametersContext((s) => s.inputs);

	// Seed from the mounted URL so the first effect run (which matches the URL the
	// store was seeded from) is a no-op and never triggers a redundant navigation.
	const prevSRef = useRef<string | null>(encodeRestIfNeeded(inputs));

	useEffect(() => {
		const years = formatYearsPath(inputs.startYear, inputs.endYear);
		const nextS = encodeRestIfNeeded(inputs);
		if (
			inputs.name === params.name &&
			years === params.years &&
			nextS === prevSRef.current
		) {
			return;
		}
		prevSRef.current = nextS;
		navigate({
			to: "/$name/$years",
			params: { name: inputs.name, years },
			search: nextS ? { s: nextS } : {},
			replace: true,
		});
	}, [inputs, params.name, params.years, navigate]);

	return {
		getMinimalLink: () => buildShareLinks(inputs).minimal,
		getFullLink: () => buildShareLinks(inputs).full,
	};
}
