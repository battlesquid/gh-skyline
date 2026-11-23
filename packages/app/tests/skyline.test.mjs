import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import { Box3, Vector3 } from "three";
import { createServer } from "vite";

const server = await createServer({
	configFile: false,
	root: fileURLToPath(new URL("../", import.meta.url)),
	server: { middlewareMode: true, watch: null, ws: false },
	optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());

const {
	addBaseJoints,
	composeBase,
	makeBaseBlank,
	makeTextPart,
	makeTileBody,
	makeTowerCarrier,
} = await server.ssrLoadModule("/src/manifold/parts.ts");
const {
	wasm: { Manifold },
} = await server.ssrLoadModule("/src/manifold/module.ts");
const { DEFAULT_FRONT_OPTIONS, ExportFormat } = await server.ssrLoadModule(
	"/src/three/types.ts",
);
const { assemblyBounds, exportBounds, frontBounds } =
	await server.ssrLoadModule("/src/three/assembly.ts");
const { makeDownload, prepareExport } = await server.ssrLoadModule(
	"/src/three/export.ts",
);
const { reconcileTowerYears, towerBounds } = await server.ssrLoadModule(
	"/src/three/tower_parts.ts",
);
const { placeFront } = await server.ssrLoadModule(
	"/src/three/skyline_base.tsx",
);
const { toPolygons } = await server.ssrLoadModule("/src/hooks/useTTFLoader.ts");

const dims = {
	width: 136.5,
	depth: 21.5,
	height: 8,
	widthTaper: 0,
	depthTaper: 0,
	frontJoint: null,
	backJoint: null,
};
const settings = { size: 2.5, width: 132.5, dampening: 4 };
const daylight = (year, count) => [
	{
		firstDay: `${year}-01-01`,
		contributionDays: [
			{ date: `${year}-01-01`, contributionCount: count, color: "#216e39" },
		],
	},
];

function assertConnected(part) {
	const solid = Manifold.ofMesh(part.mesh);
	const components = solid.decompose();
	try {
		assert.equal(solid.status(), "NoError");
		assert.equal(components.length, 1);
		assert.ok(solid.volume() > 0);
	} finally {
		components.forEach((value) => value.delete());
		solid.delete();
	}
}

test("reusing a year does not depend on array identity or on tower count", () => {
	const original = reconcileTowerYears(
		[daylight(2024, 2), daylight(2025, 3)],
		2024,
		[],
	);
	const extended = reconcileTowerYears(
		[daylight(2023, 5), daylight(2024, 2), daylight(2025, 4)],
		2023,
		original,
	);
	assert.strictEqual(extended[1].days, original[0].days);
	assert.notStrictEqual(extended[2].days, original[1].days);
	assert.equal(towerBounds(extended[2], settings).max.y, 2.5);
});

test("default raised and inset text preserve legacy overall dimensions", async () => {
	const file = await readFile(
		new URL("../public/fonts/MonaSansSemiExpanded-Bold.ttf", import.meta.url),
	);
	const font = opentype.parse(Uint8Array.from(file).buffer);
	const nameText = makeTextPart(
		toPolygons(font, "Github Skyline", dims.height / 1.65),
	);
	for (const fixture of [
		{ dim: dims, year: "2025", inset: false, depth: 22.5002 },
		{
			dim: { ...dims, depth: 74, widthTaper: 5, depthTaper: 7 },
			year: "2022-2025",
			inset: false,
			depth: 81.0457,
		},
		{
			dim: { ...dims, widthTaper: 5, depthTaper: 7 },
			year: "2025",
			inset: true,
			depth: 28.5,
		},
	]) {
		const { dim, inset } = fixture;
		const yearText = makeTextPart(
			toPolygons(font, fixture.year, dim.height / 1.65),
		);
		const base = makeBaseBlank(dim);
		const name = placeFront(
			"name",
			nameText,
			DEFAULT_FRONT_OPTIONS,
			dim,
			15,
			inset,
		);
		const year = placeFront(
			"year",
			yearText,
			DEFAULT_FRONT_OPTIONS,
			dim,
			10,
			inset,
		);
		const result = composeBase(base, [name.text, year.text], inset);
		assertConnected(result);
		const bounds = result.bounds.getSize(new Vector3());
		assert.ok(
			Math.abs(bounds.z - fixture.depth) < 0.01,
			`${fixture.year}: got ${bounds.z}, expected ${fixture.depth}`,
		);
		assert.equal(bounds.x, dim.width + dim.widthTaper);
		assert.equal(bounds.y, dim.height);
		const moved = placeFront(
			"name",
			nameText,
			{ ...DEFAULT_FRONT_OPTIONS, x: -2 },
			dim,
			15,
			inset,
		);
		assert.strictEqual(moved.text.solid, name.text.solid);
		assert.equal(frontBounds(name).min.x - frontBounds(moved).min.x, 2);
		assert.equal(
			placeFront(
				"name",
				nameText,
				{ ...DEFAULT_FRONT_OPTIONS, visible: false },
				dim,
				15,
				inset,
			),
			null,
		);
	}
});

test("sparse towers fuse to one thin carrier, and an empty tower export is unavailable", () => {
	const footprint = new Box3(
		new Vector3(-66, 0, -8.75),
		new Vector3(66, 0, 8.75),
	);
	const towers = [
		{ x: -61, z: 5, height: 12 },
		{ x: 65, z: -5, height: 2 },
	];
	assertConnected(makeTowerCarrier(towers, 2, footprint));
	assert.throws(
		() => makeTowerCarrier([], 2, footprint),
		/No contribution towers/,
	);
});

test("mating prism and frustum tiles are connected solids with clearance", () => {
	for (const taper of [0, 7]) {
		const shape = { ...dims, depthTaper: taper, widthTaper: taper ? 5 : 0 };
		const male = { ...shape, frontJoint: 8 };
		const female = { ...shape, backJoint: 8 };
		const rear = addBaseJoints(makeBaseBlank(male), male);
		const front = addBaseJoints(makeBaseBlank(female), female);
		assertConnected(makeTileBody(rear, [{ x: 6, z: 0, height: 3 }], 2.5));
		assertConnected(front);
		const a = Manifold.ofMesh(rear.mesh);
		const b = Manifold.ofMesh(front.mesh);
		try {
			for (const lateral of [0, 0.1, 0.6]) {
				const joined = b.translate([lateral, 0, dims.depth]);
				const collision = a.intersect(joined);
				try {
					assert.equal(collision.volume() > 0.00001, lateral > 0.25);
				} finally {
					collision.delete();
					joined.delete();
				}
			}
		} finally {
			a.delete();
			b.delete();
		}
	}
});

test("download builds only the requested print part and preserves orientation and scale", async () => {
	const [year] = reconcileTowerYears([daylight(2025, 8)], 2025, []);
	const years = [{ year, bounds: towerBounds(year, settings), z: 0 }];
	const shell = makeBaseBlank(dims);
	const bases = [
		{ year: null, solid: shell, front: [], inset: false, z: 0, shift: 0 },
	];
	const model = {
		bases,
		years,
		settings,
		paint: { custom: false, showContributionColor: true, color: "#000000" },
		baseColor: "#787878",
		carrierFootprint: shell.bounds,
		bounds: assemblyBounds(bases, years),
	};
	const base = prepareExport(model, "base", 2);
	try {
		assert.equal(base.group.children.length, 1);
		assert.deepEqual(
			new Box3()
				.setFromObject(base.group)
				.getSize(new Vector3())
				.toArray()
				.map(Math.round),
			[273, 43, 16],
		);
	} finally {
		base.dispose();
	}
	assert.ok(exportBounds(model, "logo").isEmpty());
	const stl = await makeDownload(model, "towers", 1, ExportFormat.Stl);
	const view = new DataView(await stl.arrayBuffer());
	assert.equal(view.byteLength, 84 + 50 * view.getUint32(80, true));
	const package3mf = await makeDownload(
		model,
		"assembled",
		1,
		ExportFormat.ThreeMF,
	);
	assert.deepEqual(
		[...new Uint8Array(await package3mf.slice(0, 4).arrayBuffer())],
		[0x50, 0x4b, 3, 4],
	);
});

test("full links preserve front and joint settings and older full links keep their offsets", async () => {
	const storageBefore = Object.getOwnPropertyDescriptor(
		globalThis,
		"localStorage",
	);
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: { getItem: () => null },
	});
	try {
		const { DEFAULT_INPUT_PARAMETERS } = await server.ssrLoadModule(
			"/src/stores/parameters.ts",
		);
		const { decodeShareState, encodeShareState, toFull, toMinimal } =
			await server.ssrLoadModule("/src/share/urlShare.ts");
		const input = {
			...DEFAULT_INPUT_PARAMETERS,
			front: {
				...DEFAULT_INPUT_PARAMETERS.front,
				logo: { ...DEFAULT_FRONT_OPTIONS, alignment: "left", x: 5 },
			},
			frontLogo: "Star",
			connectYears: true,
			jointOffsets: { 2025: -2 },
		};
		const full = toFull(input);
		assert.deepEqual(decodeShareState(encodeShareState(full)), full);
		const older = decodeShareState(
			encodeShareState({ v: 1, type: "full", nameOffset: 17 }),
		);
		assert.equal(older.nameOffset, 17);
		assert.deepEqual(older.front.name, DEFAULT_FRONT_OPTIONS);
		assert.deepEqual(
			decodeShareState(encodeShareState(toMinimal(input))),
			toMinimal(input),
		);
	} finally {
		if (storageBefore)
			Object.defineProperty(globalThis, "localStorage", storageBefore);
		else delete globalThis.localStorage;
	}
});
