/*eslint-env node*/

import {
	VisualizationMapCollection,
	defaultCellsForSize,
	defaultVisualizationMapExpandedForCells,
	getCellFromMap,
	SET_SIZE_COMMAND,
	SET_HIGHLIGHTED_COMMAND,
	SET_VALUE_COMMAND,
	SET_ACTIVE_COMMAND,
	SET_ACTIVE_ONLY_COMMAND,
	SET_OPACITY_COMMAND,
	SET_FILL_OPACITY_COMMAND,
	SET_STROKE_OPACITY_COMMAND,
	SET_CAPTURED_COMMAND,
	SET_SCALE_COMMAND,
	SET_CELL_SCALE_COMMAND,
	RESET_TO_COMMAND,
	NAME_COMMAND,
	GROW_COMMAND,
	SET_ADJACENT_POSSIBLE_STEPS_COMMAND,
	REPEAT_COMMAND,
	ringPly,
	ringCells,
	outerNeighbors,
} from "../../src/map-data.js";

import assert from "assert";

describe("data parsing", () => {
	it("supports basic parsing", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("errors if no set_size in first command", async () => {
		const input = [
			{
				foo: [2,3],
			}
		];
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(0);
		assert.throws(() => map.expandedData);
	});

	it("supports selecting a single cell", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [0,0]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		const cell = getCellFromMap(golden, 0, 0);
		cell.highlighted = true;
		cell.autoOpacity = 1.0;

		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports selecting multiple cells", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_VALUE_COMMAND]: [[1.0, [0,0]], [1.0, [0,1]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;
		getCellFromMap(golden, 0, 1).value = 1.0;

		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports unselecting a cell", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [0,0]]],
			},
			{
				[SET_HIGHLIGHTED_COMMAND]: [[false, [0,0]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports setting cell's value", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_VALUE_COMMAND]: [[1.0, [0,0]], [-1.0, [0,1]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;
		getCellFromMap(golden, 0, 1).value = -1.0;
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports setting cell to active", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_ACTIVE_COMMAND]: [[true, [0,0]]],
				[SET_ADJACENT_POSSIBLE_STEPS_COMMAND]: 0,
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0;
		getCellFromMap(golden, 0, 0).active = true;
		getCellFromMap(golden, 0, 0).captured = true;
		getCellFromMap(golden, 0, 0).autoOpacity = 1.0;
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports setting cell's opacity", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_OPACITY_COMMAND]: [[0.5, [0,0]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).fillOpacity = 0.5;
		getCellFromMap(golden, 0, 0).strokeOpacity = 0.5;
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports setting cell's fill opacity", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_FILL_OPACITY_COMMAND]: [[0.5, [0,0]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).fillOpacity = 0.5;
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports setting cell's stroke opacity", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_STROKE_OPACITY_COMMAND]: [[0.5, [0,0]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).strokeOpacity = 0.5;
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports capturing cells", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_CAPTURED_COMMAND]: [[true, [0,0]]],
				[SET_ADJACENT_POSSIBLE_STEPS_COMMAND]: 1,
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 1;
		getCellFromMap(golden, 0, 0).captured = true;
		getCellFromMap(golden, 0, 0).autoOpacity = 1.0;
		getCellFromMap(golden, 1, 0).autoOpacity = 1.0 - (1.0 / Math.sqrt(8));
		getCellFromMap(golden, 1, 1).autoOpacity = 0.5;
		getCellFromMap(golden, 0, 1).autoOpacity = 1.0 - (1.0 / Math.sqrt(8));

		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports adjacent possible fading cells", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_CAPTURED_COMMAND]: [[true, [0,0]]],
				[SET_ADJACENT_POSSIBLE_STEPS_COMMAND]: 2,
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 2;
		getCellFromMap(golden, 0, 0).captured = true;
		getCellFromMap(golden, 0, 0).autoOpacity = 1.0;
		getCellFromMap(golden, 1, 0).autoOpacity = 1.0 - (1.0 / Math.sqrt(18));
		getCellFromMap(golden, 1, 1).autoOpacity = 1.0 - (Math.sqrt(2) / Math.sqrt(18));
		getCellFromMap(golden, 0, 1).autoOpacity = 1.0 - (1.0 / Math.sqrt(18));
		getCellFromMap(golden, 0, 2).autoOpacity = 1.0 - (2.0 / Math.sqrt(18));
		getCellFromMap(golden, 1, 2).autoOpacity = 1.0 - (Math.sqrt(5) / Math.sqrt(18));
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports reset to", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[NAME_COMMAND]: 'foo'
			},
			{
				[SET_CAPTURED_COMMAND]: [
					[true, [0,0]]
				]
			},
			{
				[RESET_TO_COMMAND]: 'foo'
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("reset to with illegal name errors", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[NAME_COMMAND]: 'bar'
			},
			{
				[SET_CAPTURED_COMMAND]: [
					[true, [0,0]]
				]
			},
			{
				[RESET_TO_COMMAND]: 'foo'
			}
		];
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("reset to with future name errors", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[NAME_COMMAND]: 'bar'
			},
			{
				[SET_CAPTURED_COMMAND]: [
					[true, [0,0]]
				]
			},
			{
				[RESET_TO_COMMAND]: 'foo'
			},
			{
				[NAME_COMMAND]: 'foo',
			}
		];
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("supports a rectangular region", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_VALUE_COMMAND]: [[1.0, [0,0,1,2]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;
		getCellFromMap(golden, 0, 1).value = 1.0;
		getCellFromMap(golden, 0, 2).value = 1.0;
		getCellFromMap(golden, 1, 0).value = 1.0;
		getCellFromMap(golden, 1, 1).value = 1.0;
		getCellFromMap(golden, 1, 2).value = 1.0;

		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports a rectangular region of size 1", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_VALUE_COMMAND]: [[1.0, [0,0,0,0]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;

		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("doesnt support a rectangular region that starts row after it begins", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [1,0,0,0]]],
			}
		];
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("doesnt support a rectangular region that starts col after it begins", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [0,1,0,0]]],
			}
		];
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("supports a rectangular region of the entire map", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_VALUE_COMMAND]: [[1.0, []]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;
		getCellFromMap(golden, 0, 1).value = 1.0;
		getCellFromMap(golden, 0, 2).value = 1.0;
		getCellFromMap(golden, 1, 0).value = 1.0;
		getCellFromMap(golden, 1, 1).value = 1.0;
		getCellFromMap(golden, 1, 2).value = 1.0;

		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("doesnt support a reference that is too low row", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [-1,0]]],
			}
		];
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("doesnt support a reference that is too high row", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [2,0]]],
			}
		];
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("doesnt support a reference that is too low col", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [0,-1]]],
			}
		];
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("doesnt support a reference that is too high col", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [0,3]]],
			}
		];
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("supports changing set adjacent possible to a normal number", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				//Check that it rounds it
				[SET_ADJACENT_POSSIBLE_STEPS_COMMAND]: 2.2,
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 2.0;

		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports settig a 0.0 value for adjacnet possible steps", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_ADJACENT_POSSIBLE_STEPS_COMMAND]: 0,
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0.0;

		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports clips setting a negative value for adjacent steps", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_ADJACENT_POSSIBLE_STEPS_COMMAND]: -1,
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0.0;

		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports changing scale", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_SCALE_COMMAND]: 2.2,
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		golden.scale = 2.2;

		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports setting a cell's scale", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_CELL_SCALE_COMMAND]: [[0.5, [0,0]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).scale = 0.5;
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports grow with no parameters", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_ACTIVE_ONLY_COMMAND]: [[true, [0,0]]],
				[SET_ADJACENT_POSSIBLE_STEPS_COMMAND]: 0,
				[GROW_COMMAND]: true,
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0;
		getCellFromMap(golden, 0, 1).active = true;
		getCellFromMap(golden, 0, 1).captured = true;
		getCellFromMap(golden, 0, 1).autoOpacity = 1.0;
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports grow with seed", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_ACTIVE_ONLY_COMMAND]: [[true, [0,0]]],
				[SET_ADJACENT_POSSIBLE_STEPS_COMMAND]: 0,
				[GROW_COMMAND]: {
					seed: 'foo',
				},
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0;
		getCellFromMap(golden, 1, 0).active = true;
		getCellFromMap(golden, 1, 0).captured = true;
		getCellFromMap(golden, 1, 0).autoOpacity = 1.0;
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports repeat block", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
			},
			{
				[REPEAT_COMMAND]: 3,
				[GROW_COMMAND]: true
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		const collection = new VisualizationMapCollection(input);
		assert.deepStrictEqual(collection.length, 4);
		const map = collection.dataForIndex(collection.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

});

describe("ring ply", () => {
	it("same cell", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const other = getCellFromMap(map, 2, 2);
		const result = ringPly(other, center);
		assert.deepStrictEqual(result, 0);
	});

	it("one ply left", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const other = getCellFromMap(map, 2, 1);
		const result = ringPly(other, center);
		assert.deepStrictEqual(result, 1);
	});

	it("one ply left top corner", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const other = getCellFromMap(map, 1, 1);
		const result = ringPly(other, center);
		assert.deepStrictEqual(result, 1);
	});

	it("two ply right diagonal", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const other = getCellFromMap(map, 3, 4);
		const result = ringPly(other, center);
		assert.deepStrictEqual(result, 2);
	});

	it("two ply right bottom corner", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const other = getCellFromMap(map, 4, 4);
		const result = ringPly(other, center);
		assert.deepStrictEqual(result, 2);
	});
});

describe("ring cells", () => {
	it("zero ply", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const ply = 0;
		const result = ringCells(map, center, ply);
		const golden = [
			[2,2]
		].map(pair => getCellFromMap(map, pair[0], pair[1]));
		assert.deepStrictEqual(result, golden);
	});

	it("one ply center", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const ply = 1;
		const result = ringCells(map, center, ply);
		const golden = [
			[1,1],
			[1,2],
			[1,3],
			[2,3],
			[3,3],
			[3,2],
			[3,1],
			[2,1]
		].map(pair => getCellFromMap(map, pair[0], pair[1]));
		assert.deepStrictEqual(result, golden);
	});

	it("two ply center", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const ply = 2;
		const result = ringCells(map, center, ply);
		const golden = [
			[0,0],
			[0,1],
			[0,2],
			[0,3],
			[0,4],
			[1,4],
			[2,4],
			[3,4],
			[4,4],
			[4,3],
			[4,2],
			[4,1],
			[4,0],
			[3,0],
			[2,0],
			[1,0]
		].map(pair => getCellFromMap(map, pair[0], pair[1]));
		assert.deepStrictEqual(result, golden);
	});

	it("two ply off-center", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 1, 1);
		const ply = 2;
		const result = ringCells(map, center, ply);
		const golden = [
			[0,3],
			[1,3],
			[2,3],
			[3,3],
			[3,2],
			[3,1],
			[3,0]
		].map(pair => getCellFromMap(map, pair[0], pair[1]));
		assert.deepStrictEqual(result, golden);
	});
});

describe("outer neighbors", () => {
	it("basic operation left", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const cell = getCellFromMap(map, 2, 1);
		const result = outerNeighbors(map, cell, center);
		const golden = [
			[1,0],
			[3,0],
			[2,0],
		].map(pair => getCellFromMap(map, pair[0], pair[1]));
		assert.deepStrictEqual(result, golden);
	});

	it("basic operation upper left corner", async () => {
		const map = defaultVisualizationMapExpandedForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const cell = getCellFromMap(map, 1, 1);
		const result = outerNeighbors(map, cell, center);
		const golden = [
			[0,0],
			[0,1],
			[0,2],
			[2,0],
			[1,0]
		].map(pair => getCellFromMap(map, pair[0], pair[1]));
		assert.deepStrictEqual(result, golden);
	});
});