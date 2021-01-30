/*eslint-env node*/

import {
	VisualizationMapCollection,
	defaultCellsForSize,
	SET_SIZE_COMMAND,
} from "../../src/map-data.js";

import assert from "assert";

describe("data parsing", () => {
	it("supports basic parsing", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
			}
		];
		const golden = {
			rows: 2,
			cols: 3,
			cells: defaultCellsForSize(2,3)
		};
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

});