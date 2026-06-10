import { initGraphQLTada } from "gql.tada";
import type { introspection } from "@/api/graphql-env.d.ts";

export const graphql = initGraphQLTada<{
	introspection: introspection;
	scalars: {
		DateTime: string;
		Date: Date;
	};
}>();

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada";
export { readFragment } from "gql.tada";
