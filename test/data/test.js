/*eslint-env node*/

import {
	FrameCollection,
	defaultCellsForSize,
	defaultExpandedFrameForCells,
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
	GIF_COMMAND,
	DISABLE_COMMAND,
	SET_COLORS_COMMAND
} from "../../src/frame.js";

import {
	color
} from '../../src/color.js';

import assert from "assert";

describe("data parsing", () => {
	it("supports basic parsing", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
			}
		];
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("errors if no set_size in first command", async () => {
		const input = [
			{
				foo: [2,3],
			}
		];
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(0);
		assert.throws(() => map.expandedData);
	});

	it("supports selecting a single cell", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [0,0]]],
			}
		];
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		const cell = getCellFromMap(golden, 0, 0);
		cell.highlighted = true;
		cell.autoOpacity = 1.0;

		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;
		getCellFromMap(golden, 0, 1).value = 1.0;

		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;
		getCellFromMap(golden, 0, 1).value = -1.0;
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0;
		getCellFromMap(golden, 0, 0).active = true;
		getCellFromMap(golden, 0, 0).captured = true;
		getCellFromMap(golden, 0, 0).autoOpacity = 1.0;
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).fillOpacity = 0.5;
		getCellFromMap(golden, 0, 0).strokeOpacity = 0.5;
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).fillOpacity = 0.5;
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).strokeOpacity = 0.5;
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 1;
		getCellFromMap(golden, 0, 0).captured = true;
		getCellFromMap(golden, 0, 0).autoOpacity = 1.0;
		getCellFromMap(golden, 1, 0).autoOpacity = 0.75 - (1.0 / Math.sqrt(8));
		getCellFromMap(golden, 1, 1).autoOpacity = 0.25;
		getCellFromMap(golden, 0, 1).autoOpacity = 0.75 - (1.0 / Math.sqrt(8));

		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 2;
		getCellFromMap(golden, 0, 0).captured = true;
		getCellFromMap(golden, 0, 0).autoOpacity = 1.0;
		getCellFromMap(golden, 1, 0).autoOpacity = 0.75 - (1.0 / Math.sqrt(18));
		getCellFromMap(golden, 1, 1).autoOpacity = 0.75 - (Math.sqrt(2) / Math.sqrt(18));
		getCellFromMap(golden, 0, 1).autoOpacity = 0.75 - (1.0 / Math.sqrt(18));
		getCellFromMap(golden, 0, 2).autoOpacity = 0.75 - (2.0 / Math.sqrt(18));
		getCellFromMap(golden, 1, 2).autoOpacity = 0.75 - (Math.sqrt(5) / Math.sqrt(18));
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("supports a rectangular region", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_VALUE_COMMAND]: [[1.0, [0,0,1,2]]],
			}
		];
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;
		getCellFromMap(golden, 0, 1).value = 1.0;
		getCellFromMap(golden, 0, 2).value = 1.0;
		getCellFromMap(golden, 1, 0).value = 1.0;
		getCellFromMap(golden, 1, 1).value = 1.0;
		getCellFromMap(golden, 1, 2).value = 1.0;

		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;

		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("doesnt support a rectangular region that starts col after it begins", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [0,1,0,0]]],
			}
		];
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("supports a rectangular region of the entire map", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_VALUE_COMMAND]: [[1.0, []]],
			}
		];
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;
		getCellFromMap(golden, 0, 1).value = 1.0;
		getCellFromMap(golden, 0, 2).value = 1.0;
		getCellFromMap(golden, 1, 0).value = 1.0;
		getCellFromMap(golden, 1, 1).value = 1.0;
		getCellFromMap(golden, 1, 2).value = 1.0;

		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("doesnt support a reference that is too high row", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [2,0]]],
			}
		];
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("doesnt support a reference that is too low col", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [0,-1]]],
			}
		];
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
		assert.throws(() => map.expandedData);
	});

	it("doesnt support a reference that is too high col", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[SET_HIGHLIGHTED_COMMAND]: [[true, [0,3]]],
			}
		];
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 2.0;

		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0.0;

		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0.0;

		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.scale = 2.2;

		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).scale = 0.5;
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0;
		getCellFromMap(golden, 1, 0).active = true;
		getCellFromMap(golden, 1, 0).captured = true;
		getCellFromMap(golden, 1, 0).autoOpacity = 1.0;
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0;
		getCellFromMap(golden, 0, 1).active = true;
		getCellFromMap(golden, 0, 1).captured = true;
		getCellFromMap(golden, 0, 1).autoOpacity = 1.0;
		const collection = new FrameCollection(input);
		const map = collection.frameForIndex(input.length - 1);
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
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		const collection = new FrameCollection(input);
		assert.deepStrictEqual(collection.length, 4);
		const map = collection.frameForIndex(collection.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports disable block", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
			},
			{
				[DISABLE_COMMAND]: true
			},
			{
				[SET_VALUE_COMMAND]: [
					[1.0, [0, 0]]
				]
			}
		];
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		getCellFromMap(golden, 0, 0).value = 1.0;
		const collection = new FrameCollection(input);
		assert.deepStrictEqual(collection.length, 2);
		const map = collection.frameForIndex(collection.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("supports gif block", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
				[GIF_COMMAND]: true,
				[REPEAT_COMMAND]: 2,
			},
			{
				[SET_ADJACENT_POSSIBLE_STEPS_COMMAND]: 0
			}
		];
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.adjacentPossibleSteps = 0;
		//gif should only be set on frames that specifically request it
		const collection = new FrameCollection(input);
		assert.deepStrictEqual(collection.length, 3);
		const map = collection.frameForIndex(collection.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
		//Verify that the earlier two have a gif of "" (true)
		const goldenGif = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		goldenGif.gif = '';
		assert.deepStrictEqual(collection.frameForIndex(0).expandedData, goldenGif);
		assert.deepStrictEqual(collection.frameForIndex(1).expandedData, goldenGif);
	});

	it("supports colors", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
			},
			{
				[SET_COLORS_COMMAND]: {
					'zero': 'green',
				}
			}
		];
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		golden.colors.zero = color('green');
		const collection = new FrameCollection(input);
		assert.deepStrictEqual(collection.length, 2);
		const map = collection.frameForIndex(collection.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

	it("throws if illegal color given", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
			},
			{
				[SET_COLORS_COMMAND]: {
					'zero': 'whatever',
				}
			}
		];
		const collection = new FrameCollection(input);
		assert.throws(() => collection.frameForIndex(collection.length - 1).expandedData);
	});

	it("throws if illegal color name given", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
			},
			{
				[SET_COLORS_COMMAND]: {
					'foo': 'green',
				}
			}
		];

		//noocmmit doesn't pass
		const collection = new FrameCollection(input);

		assert.throws(() => collection.frameForIndex(collection.length - 1).expandedData);
	});

	it("supports unsetting a color", async () => {
		const input = [
			{
				[SET_SIZE_COMMAND]: [2,3],
			},
			{
				[SET_COLORS_COMMAND]: {
					'zero': 'green',
				}
			},
			{
				[SET_COLORS_COMMAND]: {
					'zero': undefined,
				}
			}
		];
		const golden = defaultExpandedFrameForCells(defaultCellsForSize(2,3));
		const collection = new FrameCollection(input);
		assert.deepStrictEqual(collection.length, 3);
		const map = collection.frameForIndex(collection.length - 1);
		const data = map ? map.expandedData : null;
		assert.deepStrictEqual(data, golden);
	});

});

describe("ring ply", () => {
	it("same cell", async () => {
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const other = getCellFromMap(map, 2, 2);
		const result = ringPly(other, center);
		assert.deepStrictEqual(result, 0);
	});

	it("one ply left", async () => {
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const other = getCellFromMap(map, 2, 1);
		const result = ringPly(other, center);
		assert.deepStrictEqual(result, 1);
	});

	it("one ply left top corner", async () => {
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const other = getCellFromMap(map, 1, 1);
		const result = ringPly(other, center);
		assert.deepStrictEqual(result, 1);
	});

	it("two ply right diagonal", async () => {
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const other = getCellFromMap(map, 3, 4);
		const result = ringPly(other, center);
		assert.deepStrictEqual(result, 2);
	});

	it("two ply right bottom corner", async () => {
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const other = getCellFromMap(map, 4, 4);
		const result = ringPly(other, center);
		assert.deepStrictEqual(result, 2);
	});
});

describe("ring cells", () => {
	it("zero ply", async () => {
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
		const center = getCellFromMap(map, 2, 2);
		const ply = 0;
		const result = ringCells(map, center, ply);
		const golden = [
			[2,2]
		].map(pair => getCellFromMap(map, pair[0], pair[1]));
		assert.deepStrictEqual(result, golden);
	});

	it("one ply center", async () => {
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
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
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
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
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
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
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
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
		const map = defaultExpandedFrameForCells(defaultCellsForSize(5,5));
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

describe("color parsing", () => {

	it("3 tuple", async () => {
		const input = [198, 6, 252];
		const golden = {
			r: 198,
			g: 6,
			b: 252,
			a: 1.0,
			rgb: [198, 6, 252],
			rgba: [198, 6, 252, 1.0],
			rgbStr: 'rgb(198,6,252)',
			rgbaStr: 'rgba(198,6,252,1)',
			hex: '#C606FCFF'
		};
		const result = color(input);
		assert.deepStrictEqual(result, golden);
	});

	it("4 tuple", async () => {
		const input = [198, 6, 252, 0.0];
		const golden = {
			r: 198,
			g: 6,
			b: 252,
			a: 0.0,
			rgb: [198, 6, 252],
			rgba: [198, 6, 252, 0.0],
			rgbStr: 'rgb(198,6,252)',
			rgbaStr: 'rgba(198,6,252,0)',
			hex: '#C606FC00'
		};
		const result = color(input);
		assert.deepStrictEqual(result, golden);
	});

	it("6 char hex", async () => {
		const input = '#C606FC';
		const golden = {
			r: 198,
			g: 6,
			b: 252,
			a: 1.0,
			rgb: [198, 6, 252],
			rgba: [198, 6, 252, 1.0],
			rgbStr: 'rgb(198,6,252)',
			rgbaStr: 'rgba(198,6,252,1)',
			hex: '#C606FCFF'
		};
		const result = color(input);
		assert.deepStrictEqual(result, golden);
	});

	it("8 char hex", async () => {
		const input = '#C606FC00';
		const golden = {
			r: 198,
			g: 6,
			b: 252,
			a: 0.0,
			rgb: [198, 6, 252],
			rgba: [198, 6, 252, 0.0],
			rgbStr: 'rgb(198,6,252)',
			rgbaStr: 'rgba(198,6,252,0)',
			hex: '#C606FC00'
		};
		const result = color(input);
		assert.deepStrictEqual(result, golden);
	});

	it("3 char hex", async () => {
		const input = '#C6F';
		const golden = {
			r: 204,
			g: 102,
			b: 255,
			a: 1.0,
			rgb: [204, 102, 255],
			rgba: [204, 102, 255, 1.0],
			rgbStr: 'rgb(204,102,255)',
			rgbaStr: 'rgba(204,102,255,1)',
			hex: '#CC66FFFF'
		};
		const result = color(input);
		assert.deepStrictEqual(result, golden);
	});

	it("4 char hex", async () => {
		const input = '#C6F0';
		const golden = {
			r: 204,
			g: 102,
			b: 255,
			a: 0.0,
			rgb: [204, 102, 255],
			rgba: [204, 102, 255, 0.0],
			rgbStr: 'rgb(204,102,255)',
			rgbaStr: 'rgba(204,102,255,0)',
			hex: '#CC66FF00'
		};
		const result = color(input);
		assert.deepStrictEqual(result, golden);
	});

	it("named color", async () => {
		const input = 'aliceblue';
		const golden = {
			r: 240,
			g: 248,
			b: 255,
			a: 1.0,
			rgb: [240, 248, 255],
			rgba: [240, 248, 255, 1.0],
			rgbStr: 'rgb(240,248,255)',
			rgbaStr: 'rgba(240,248,255,1)',
			hex: '#F0F8FFFF'
		};
		const result = color(input);
		assert.deepStrictEqual(result, golden);
	});

	it("named color transparent", async () => {
		const input = 'transparent';
		const golden = {
			r: 0,
			g: 0,
			b: 0,
			a: 0.0,
			rgb: [0, 0 , 0],
			rgba: [0, 0 ,0, 0],
			rgbStr: 'rgb(0,0,0)',
			rgbaStr: 'rgba(0,0,0,0)',
			hex: '#00000000'
		};
		const result = color(input);
		assert.deepStrictEqual(result, golden);
	});

	it("undefined treated as black", async () => {
		const input = undefined;
		const golden = {
			r: 0,
			g: 0,
			b: 0,
			a: 1.0,
			rgb: [0, 0 , 0],
			rgba: [0, 0 ,0, 1],
			rgbStr: 'rgb(0,0,0)',
			rgbaStr: 'rgba(0,0,0,1)',
			hex: '#000000FF'
		};
		const result = color(input);
		assert.deepStrictEqual(result, golden);
	});

	it("throws for illegal string", async () => {
		const input = 'whatever';
		assert.throws(() => color(input));
	});

});