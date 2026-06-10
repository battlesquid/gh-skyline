import { create } from "zustand";
import { ContributionWeeks } from "@/api/types";

export interface ContributionQuery {
    loading: boolean;
    setLoading(loading: boolean): void;

    ok: boolean;
    setOk(ok: boolean): void;

    results: ContributionWeeks[];
    setResults(results: ContributionWeeks[]): void;
}

export const useContributionQueryStore = create<ContributionQuery>((set) => ({
    loading: false,
    setLoading: (loading) => ({ loading }),
    ok: false,
    setOk: (ok) => ({ ok }),
    results: [],
    setResults: (results) => set(({ results })),
}));
