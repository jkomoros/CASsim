/*eslint-env node*/

import {
	VisualizationMapCollection,
	defaultCellsForSize,
	defaultVisualizationMapExpandedForCells,
	getCellFromMap,
	SET_SIZE_COMMAND,
	SET_HIGHLIGHTED_COMMAND,
	SET_VALUE_COMMAND,
	SET_OPACITY_COMMAND,
	SET_FILL_OPACITY_COMMAND,
	SET_STROKE_OPACITY_COMMAND,
	SET_CAPTURED_COMMAND,
	RESET_TO_COMMAND,
	NAME_COMMAND,
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
		getCellFromMap(golden, 1, 0).autoOpacity = 0.5;
		getCellFromMap(golden, 1, 1).autoOpacity = 0.5;
		getCellFromMap(golden, 0, 1).autoOpacity = 0.5;

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
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).captured = true;
		getCellFromMap(golden, 0, 0).autoOpacity = 1.0;
		getCellFromMap(golden, 1, 0).autoOpacity = 0.5;
		getCellFromMap(golden, 1, 1).autoOpacity = 0.5;
		getCellFromMap(golden, 0, 1).autoOpacity = 0.5;

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

});