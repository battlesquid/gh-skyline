import type { ResultOf } from "gql.tada";
import type { ContributionQuery } from "@/api/query";

export type ContributionWeeks = NonNullable<
	ResultOf<typeof ContributionQuery>["user"]
>["contributionsCollection"]["contributionCalendar"]["weeks"];

export type ContributionWeek = ContributionWeeks[number];

export type ContributionDay =
	ContributionWeeks[number]["contributionDays"][number];
