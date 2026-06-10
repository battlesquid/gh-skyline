import type { ResultOf } from "gql.tada";
import { useEffect, useState } from "react";
import type { OperationResult } from "urql";
import { client } from "@/api/client";
import { ContributionQuery } from "@/api/query";
import type { ContributionWeeks } from "@/api/types";
import { useContributionQueryStore } from "@/stores/query";
import { useShallow } from "zustand/shallow";
import { useParametersContext } from "@/stores/parameters";

interface ExtendedQueryProps {
	name?: string;
	start: number;
	end: number;
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
				end: `${i}-12-31T00:00:00Z`, // TODO: push to end of day, make sure it's still ok
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

export const useContributionQuery = (
) => {
	const { name, start, end } = useParametersContext(useShallow((state) => ({
		name: state.inputs.name,
		start: state.inputs.startYear,
		end: state.inputs.endYear
	})));
	const setLoading = useContributionQueryStore((state) => state.setLoading);
	const setOk = useContributionQueryStore((state) => state.setOk);
	const setResults = useContributionQueryStore((state) => state.setResults);
	useEffect(() => {
		if (name === undefined) {
			return;
		}

		setLoading(true);
		setOk(true);
		setResults([[]]);
		doRangeQuery({ name, start, end })
			.then((result) => {
				setResults(result);
				if (result.length === 0) {
					setOk(false);
				}
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [name, start, end]);
};
