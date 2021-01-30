/*eslint-env node*/

import {
	VisualizationMapCollection,
	defaultCellsForSize,
	defaultVisualizationMapExpandedForCells,
	getCellFromMap,
	SET_SIZE_COMMAND,
	SET_SELECTED_COMMAND
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
				[SET_SELECTED_COMMAND]: [[true, [0,0]]],
			}
		];
		const golden = defaultVisualizationMapExpandedForCells(defaultCellsForSize(2,3));
		const cell = getCellFromMap(golden, 0, 0);
		cell.selected = true;
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

});