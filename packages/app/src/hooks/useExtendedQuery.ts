import type { ResultOf } from "gql.tada";
import { useEffect, useState } from "react";
import type { OperationResult } from "urql";
import { client } from "../api/client";
import { ContributionQuery } from "../api/query";
import type { ContributionWeeks } from "../api/types";
import { isAuthenticated } from "../api/auth";
import { SkylineDatasource, useParametersContext } from "../stores/parameters";

interface ExtendedQueryProps {
	name?: string;
	start: number;
	end: number;
}

export interface ExtendedQueryResult {
	years: ContributionWeeks[];
	fetching: boolean;
	ok: boolean;
}

const doRangeQuery = async (props: ExtendedQueryProps) => {
	if (props.name === undefined) {
		return [];
	}
	const { name, start, end } = props;
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
	try {
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
	} catch (_e) {
		return [];
	}
};

export const useExtendedQuery = (): ExtendedQueryResult => {
	const name = useParametersContext((state) => state.inputs.name);
	const start = useParametersContext((state) => state.inputs.startYear);
	const end = useParametersContext((state) => state.inputs.endYear);
	const datasource = useParametersContext((state) => state.inputs.datasource);
	const customData = useParametersContext((state) => state.inputs.customData);

	const [years, setYears] = useState<ContributionWeeks[]>([[]]);
	const [fetching, setFetching] = useState(false);
	const [ok, setOk] = useState(true);

	useEffect(() => {
		if (datasource === SkylineDatasource.Custom && customData.length > 0) {
			setYears(customData);
			setOk(true);
			setFetching(false);
			return;
		}

		if (!isAuthenticated() || name === undefined) {
			return;
		}

		setFetching(true);
		setOk(true);
		setYears([[]]);
		doRangeQuery({ name, start, end })
			.then((result) => {
				setYears(result);
				if (result.length === 0) {
					setOk(false);
				}
			})
			.catch(console.error)
			.finally(() => setFetching(false));
	}, [datasource, customData, name, start, end]);
	return { years, fetching, ok };
};
