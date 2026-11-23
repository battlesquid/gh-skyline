type Stage =
	| "tower data"
	| "tower matrices"
	| "tower colors"
	| "base blank"
	| "base boolean"
	| "text extrusion"
	| "logo extrusion"
	| "export";

export const pipelineMetrics: Partial<
	Record<Stage, { calls: number; ms: number }>
> = {};

export function measureWork<T>(stage: Stage, work: () => T): T {
	if (!import.meta.env.DEV) return work();
	const start = performance.now();
	try {
		return work();
	} finally {
		const result = pipelineMetrics[stage] ?? { calls: 0, ms: 0 };
		result.calls++;
		result.ms += performance.now() - start;
		pipelineMetrics[stage] = result;
	}
}
