/*eslint-env node*/

import {
	VisualizationMapCollection,
	defaultCellData,
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
		const cells = [];
		for (let r = 0; r < 2; r++) {
			for (let c = 0; c < 3; c++) {
				cells.push(defaultCellData(r,c));
			}
		}
		const golden = {
			rows: 2,
			cols: 3,
			cells,
		};
		const collection = new VisualizationMapCollection(input);
		const map = collection.dataForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

});