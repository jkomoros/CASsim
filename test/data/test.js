/*eslint-env node*/

import {
	VisualizationMapCollection,
	defaultCellsForSize,
	defaultVisualizationMapExpandedForCells,
	getCellFromMap,
	SET_SIZE_COMMAND,
	SET_HIGHLIGHTED_COMMAND,
	SET_VALUE_COMMAND
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
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports selecting multiple cells", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [0,0]], [true, [0,1]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).highlighted = true;
		getCellFromMap(golden, 0, 1).highlighted = true;

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

});