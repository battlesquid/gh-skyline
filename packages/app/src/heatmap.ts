import { HEATMAP_COLORS } from "./api/constants";

const computeMedian = (items: number[]): [median: number, idx: [number] | [number, number]] => {
    const sorted = [...items]
        .map((item, idx) => ([item, idx]))
        .sort(([itemA], [itemB]) => itemA - itemB);
    if (sorted.length % 2 === 1) {
        const [item, idx] = sorted[Math.floor(sorted.length / 2)];
        return [item, [idx]];
    }
    const [itemA, idxA] = sorted[sorted.length / 2 - 1];
    const [itemB, idxB] = sorted[sorted.length / 2]
    return [(itemA + itemB) / 2, [idxA, idxB]];
}

const computeIQR = (items: number[]) => {
    console.log(items)
    if (items.length === 0) {
        return null;
    }
    const [q2, q2idx] = computeMedian(items);

    const q1slice = items.slice(0, q2idx[0]);
    const q3slice = items.slice(q2idx.at(-1)! + 1, items.length);

    const [q1, q1idx] = computeMedian(q1slice);
    const [q3, q3idx] = computeMedian(q3slice);

    const iqr = q3 - q1;
    const lowerOutlierBound = (q1) - (1.5 * iqr);
    const upperOutlierBound = (q3) + (1.5 * iqr);
    return { iqr, q1, q2, q3, lowerOutlierBound, upperOutlierBound };
}

export const getHeatmapColors = <T>(
    items: T[],
    valueGetter: (item: T) => number,
    colors: string[] = HEATMAP_COLORS
): string[] => {
    const max = Math.max(...items.map(valueGetter));
    const buckets = colors.length;
    const bucketSize = max / buckets;
    console.log("Bucket Size: ", bucketSize, "Max: ", max)

    const heatmap = items.map(item => {
        const value = Math.min(valueGetter(item), max);
        const bucket = Math.min(Math.floor(value / bucketSize), colors.length - 1);
        console.log(value, bucket)
        return colors[bucket];
    });
    return heatmap;
}


// 1 2 3 4 5 6 7 8

// 0-19 20-39 40-59 60-79 80-100