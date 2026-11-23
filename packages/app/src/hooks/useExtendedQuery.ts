import type { ResultOf } from "gql.tada";
import { useEffect, useState } from "react";
import type { OperationResult } from "urql";
import { isAuthenticated } from "../api/auth";
import { client } from "../api/client";
import { ContributionQuery } from "../api/query";
import type { ContributionWeeks } from "../api/types";
import { SkylineDatasource, useParametersContext } from "../stores/parameters";

interface ExtendedQueryProps {
	name?: string;
	start: number;
	end: number;
}

export interface ExtendedQueryResult {
	years: ContributionWeeks[];
	firstYear: number;
	fetching: boolean;
	ok: boolean;
}

const doRangeQuery = async (props: ExtendedQueryProps) => {
	if (props.name === undefined) {
		return [];
	}
	const { name, start, end } = props;
	try {
		const queries: Promise<
			OperationResult<ResultOf<typeof ContributionQuery>>
		>[] = [];
		for (let i = start; i <= end; i++) {
			const promise = client
				.query(ContributionQuery, {
					name,
					start: `${i}-01-01T00:00:00Z`,
					end: `${i}-12-31T00:00:00Z`,
				})
				.toPromise();
			queries.push(promise);
		}
		const results = await Promise.all(queries);
		const years: ContributionWeeks[] = [];
		for (const result of results) {
			if (result.data?.user) {
				years.push(
					result.data.user.contributionsCollection.contributionCalendar.weeks,
				);
			} else {
				return [];
			}
		}
		return years;
	} catch (error) {
		console.error("Unable to load GitHub contributions", error);
		return [];
	}
};

export const useExtendedQuery = (): ExtendedQueryResult => {
	const name = useParametersContext((state) => state.inputs.name);
	const start = useParametersContext((state) => state.inputs.startYear);
	const end = useParametersContext((state) => state.inputs.endYear);
	const datasource = useParametersContext((state) => state.inputs.datasource);
	const customData = useParametersContext((state) => state.inputs.customData);

	const enabled = datasource === SkylineDatasource.Github && isAuthenticated();
	const query = `${name}:${start}:${end}`;
	const [result, setResult] = useState({
		query: "",
		years: [[]] as ContributionWeeks[],
		firstYear: start,
		ok: true,
	});

	useEffect(() => {
		if (!enabled) return;
		let cancelled = false;
		void doRangeQuery({ name, start, end }).then((years) => {
			if (!cancelled) {
				setResult({ query, years, firstYear: start, ok: years.length > 0 });
			}
		});
		return () => {
			cancelled = true;
		};
	}, [enabled, name, start, end, query]);
	if (datasource === SkylineDatasource.Custom) {
		const index = customData.findIndex((weeks) => weeks.length > 0);
		const firstYear =
			index < 0
				? start
				: new Date(customData[index][0].firstDay).getUTCFullYear() - index;
		return { years: customData, firstYear, fetching: false, ok: true };
	}
	const fetching = enabled && result.query !== query;
	return {
		years: result.years,
		firstYear: result.firstYear,
		fetching,
		ok: fetching || result.ok,
	};
};
