import {
	CoordinatesMap,
	_TESTING
} from '../src/coordinates-map.js';

import type {
	CoordinatesMapItem,
	Size,
	CoordinatesMapBounds,
	Position,
	CoordinatesMapData,
	Coordinates
} from '../src/types.js';

import { describe, it, expect } from 'vitest';

const circleIntersectsBounds = _TESTING.circleIntersectsBounds;

type TestItem = CoordinatesMapItem & {
	otherProperty?: string;
};

const makeDefaultItems = (): TestItem[] => {
	return [
		{
			id: '0',
			x: 100,
			y: 100,
			radius: 0,
			otherProperty: '0',
		},
		{
			id: '1',
			x: 50,
			y: 50,
			//no radius, checking it's implicitly 0
			otherProperty: '1'
		},
		{
			id: '2',
			x: 50,
			y: 200,
			radius: 25,
			otherProperty: '2',
		},
		{
			id: '3',
			x: 25,
			y: 25,
			radius: 0,
			otherProperty: '3'
		},
		{
			id: '4',
			x: 125,
			y: 150,
			radius: 0,
			otherProperty: '4'
		},
		{
			id: '5',
			x: 5,
			y: 200,
			radius: 0,
			otherProperty: '5'
		},
		{
			id: '6',
			x: 100,
			y: 150,
			radius: 0,
			otherProperty: '6'
		}
	];
};

const makeDefaultFrameData = (): CoordinatesMapData => {
	const map = new CoordinatesMap(makeDefaultItems(), makeDefaultSize());
	return map.frameData;
};

const makeDefaultSize = (): Size => {
	return {
		width: 200,
		height: 250
	};
};

const makeBucketedMap = (defaultItems?: TestItem[], minBucketSize: number = 2, maxBucketSize: number = 4): CoordinatesMap => {
	if (!defaultItems) defaultItems = makeDefaultItems();
	const map = new CoordinatesMap([], makeDefaultSize());
	map._minBucketSize = minBucketSize;
	map._maxBucketSize = maxBucketSize;
	for (const item of defaultItems) {
		map.insertObject(item);
	}
	return map;
};

describe('CoordinatesMap', () => {
	it('Basic getAllObjects', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const result = map.getAllObjects();
		expect(result).toEqual(defaultItems);
	});

	it('Basic getAllObjects bucketed', async () => {
		const defaultItems = makeDefaultItems();
		const map = makeBucketedMap();
		const result = map.getAllObjects();
		expect(result).toEqual(defaultItems);
	});

	it('Basic bounds', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const result = map.bounds;
		expect(result).toEqual({...defaultSize, x: 0, y:0, includeRight: true, includeBottom: true});
	});

	it('Basic bounds bucketed', async () => {
		const defaultSize = makeDefaultSize();
		const map = makeBucketedMap();
		const result = map.bounds;
		expect(result).toEqual({...defaultSize, x: 0, y:0, includeRight: true, includeBottom: true});
	});

	it('Basic getObjects with large radius', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const result = map.getObjects(100, 100, 300);
		const simplifiedResult = Object.fromEntries([...result.entries()].map(entry => [entry[0].id, entry[1]]));
		const golden = {
			'0': 0,
			'1': 70.71067811865476,
			'2': 111.80339887498948,
			'3': 106.06601717798213,
			'4': 55.90169943749474,
			'5': 137.93114224133723,
			'6': 50
		};
		expect(simplifiedResult).toEqual(golden);
	});

	it('Basic getObjects with large radius bucketed', async () => {
		const map = makeBucketedMap();
		const result = map.getObjects(100, 100, 300);
		const simplifiedResult = Object.fromEntries([...result.entries()].map(entry => [entry[0].id, entry[1]]));
		const golden = {
			'0': 0,
			'1': 70.71067811865476,
			'2': 111.80339887498948,
			'3': 106.06601717798213,
			'4': 55.90169943749474,
			'5': 137.93114224133723,
			'6': 50
		};
		expect(simplifiedResult).toEqual(golden);
	});

	it('Basic getObjects with smaller radius', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const result = map.getObjects(100, 100, 75);
		const simplifiedResult = Object.fromEntries([...result.entries()].map(entry => [entry[0].id, entry[1]]));
		const golden = {
			'0': 0,
			'1': 70.71067811865476,
			'4': 55.90169943749474,
			'6': 50
		};
		expect(simplifiedResult).toEqual(golden);
	});

	it('Basic getObjects with smaller radius bucketed', async () => {
		const map = makeBucketedMap();
		const result = map.getObjects(100, 100, 75);
		const simplifiedResult = Object.fromEntries([...result.entries()].map(entry => [entry[0].id, entry[1]]));
		const golden = {
			'0': 0,
			'1': 70.71067811865476,
			'4': 55.90169943749474,
			'6': 50
		};
		expect(simplifiedResult).toEqual(golden);
	});

	it('Basic getObjects with an item that shouldnt work if it didnt have a radius', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const result = map.getObjects(50, 150, 26);
		const simplifiedResult = Object.fromEntries([...result.entries()].map(entry => [entry[0].id, entry[1]]));
		const golden = {
			'2': 50,
		};
		expect(simplifiedResult).toEqual(golden);
	});

	it('Basic getObjects with an item that shouldnt work if it didnt have a radius bucketed', async () => {
		const map = makeBucketedMap();
		const result = map.getObjects(50, 150, 26);
		const simplifiedResult = Object.fromEntries([...result.entries()].map(entry => [entry[0].id, entry[1]]));
		const golden = {
			'2': 50,
		};
		expect(simplifiedResult).toEqual(golden);
	});

	it('Basic getObjects with large radius and an exclude', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const result = map.getObjects(100, 100, 300, [defaultItems[2]]);
		const simplifiedResult = Object.fromEntries([...result.entries()].map(entry => [entry[0].id, entry[1]]));
		const golden = {
			'0': 0,
			'1': 70.71067811865476,
			'3': 106.06601717798213,
			'4': 55.90169943749474,
			'5': 137.93114224133723,
			'6': 50
		};
		expect(simplifiedResult).toEqual(golden);
	});

	it('Basic getObjects with large radius and an exclude bucketed', async () => {
		const defaultItems = makeDefaultItems();
		const map = makeBucketedMap();
		const result = map.getObjects(100, 100, 300, [defaultItems[2]]);
		const simplifiedResult = Object.fromEntries([...result.entries()].map(entry => [entry[0].id, entry[1]]));
		const golden = {
			'0': 0,
			'1': 70.71067811865476,
			'3': 106.06601717798213,
			'4': 55.90169943749474,
			'5': 137.93114224133723,
			'6': 50
		};
		expect(simplifiedResult).toEqual(golden);
	});

	it('Basic set an object and try to remove it from the bounds', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const fn = () => {
			const obj = {...defaultItems[0]};
			obj.x = -25;
			map.updateObject(obj);
		};
		expect(fn).toThrow();
	});

	it('Basic set an object and try to remove it from the bounds', async () => {
		const defaultItems = makeDefaultItems();
		const map = makeBucketedMap();
		const fn = () => {
			const obj = {...defaultItems[0]};
			obj.x = -25;
			map.updateObject(obj);
		};
		expect(fn).toThrow();
	});

	it('Basic frame data round trip', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const data = map.frameData;
		const newMap = new CoordinatesMap(defaultItems, defaultSize, data);
		const result = newMap.getAllObjects();
		expect(result).toEqual(defaultItems);
	});

	it('Basic frame data round trip bucketed', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = makeBucketedMap();
		const data = map.frameData;
		const newMap = new CoordinatesMap(defaultItems, defaultSize, data);
		const result = newMap.getAllObjects();
		expect(result).toEqual(defaultItems);
	});

	it('Basic frame data boot with invalid items that dont match what was saved', async () => {
		const defaultItems = makeDefaultItems();
		defaultItems.pop();
		const fn = () => {
			new CoordinatesMap(defaultItems, makeDefaultSize(), makeDefaultFrameData());
		};
		expect(fn).toThrow();
	});

	it('Basic frame data boot with out of bounds item', async () => {
		//TODO: do a version of this text with bucketed items
		const defaultItems = makeDefaultItems();
		defaultItems[0].x = -50;
		const fn = () => {
			new CoordinatesMap(defaultItems, makeDefaultSize());
		};
		expect(fn).toThrow();
	});

	it('Basic frame data boot with item on right edge', async () => {
		const defaultItems = makeDefaultItems();
		defaultItems[0].x = 200;
		const fn = () => {
			new CoordinatesMap(defaultItems, makeDefaultSize());
		};
		expect(() => fn()).not.toThrow();
	});

	it('Basic frame data boot with item on bottom edge', async () => {
		const defaultItems = makeDefaultItems();
		defaultItems[0].y = 250;
		const fn = () => {
			new CoordinatesMap(defaultItems, makeDefaultSize());
		};
		expect(() => fn()).not.toThrow();
	});

	it('Basic frame data getLeafBucket', async () => {
		const map = new CoordinatesMap(makeDefaultItems(), makeDefaultSize());
		const bucket = map._rootBucket.getLeafBucket({x: 25, y: 25});
		expect(bucket).toEqual(map._rootBucket);
	});

	it('Basic frame data getLeafBucket bucketed', async () => {
		const map = makeBucketedMap();
		const bucket = map._rootBucket.getLeafBucket({x: 25, y: 25});
		expect(bucket).toEqual(map._rootBucket._subBuckets.upperLeft);
	});

	it('Basic frame data getLeafBuckets', async () => {
		const map = new CoordinatesMap(makeDefaultItems(), makeDefaultSize());
		const buckets = map._rootBucket.getLeafBuckets({x: 25, y: 25}, 25);
		expect(buckets).toEqual([map._rootBucket]);
	});

	it('Basic frame data getLeafBuckets bucketed', async () => {
		const map = makeBucketedMap();
		const buckets = map._rootBucket.getLeafBuckets({x: 25, y: 25}, 25);
		expect(buckets).toEqual([map._rootBucket._subBuckets.upperLeft, map._rootBucket._subBuckets.lowerLeft]);
	});

	it('Basic frame data get leafBounds bucketed', async () => {
		const map = makeBucketedMap();
		const bounds = map.leafBounds;
		const golden = [
			map._rootBucket._subBuckets.upperLeft.bounds,
			map._rootBucket._subBuckets.upperRight.bounds,
			map._rootBucket._subBuckets.lowerLeft.bounds,
			map._rootBucket._subBuckets.lowerRight.bounds
		];
		expect(bounds).toEqual(golden);
	});

	it('Basic updateAllObjects works for bucketed with multiple changes since update', async () => {
		const map = makeBucketedMap();
		const defaultItems = makeDefaultItems();
		//Move two items out of their buckets.
		defaultItems[0].y = 150;
		defaultItems[1].x = 150;
		const fn = () => {
			map.updateAllObjects(defaultItems);
		};
		expect(() => fn()).not.toThrow();
	});

	//TODO: test that getLeafBucket works within nested buckets
	//TODO: test that getLeafBuckets works within nested buckets

	it('Bug fix: Items with large radius near bucket boundary are found', async () => {
		// Test for Bug 1: An item with a large radius just beyond searchRadius
		// in another bucket should be found if its radius intersects with the search area.
		// This tests that we search buckets within searchRadius + maxItemRadius.
		const items: CoordinatesMapItem[] = [
			{
				id: 'center',
				x: 50,
				y: 50,
				radius: 0
			},
			{
				id: 'far-with-radius',
				x: 120,
				y: 50,
				radius: 30  // Large radius
			}
		];
		const size: Size = {width: 200, height: 200};
		const map = new CoordinatesMap(items, size);

		// Search from center with radius 50. The far item's center is at distance 70,
		// which is beyond searchRadius (50), but its radius (30) means its edge is at
		// distance 40 from the center, which IS within searchRadius.
		const result = map.getObjects(50, 50, 50);
		const resultIds = [...result.keys()].map(item => item.id).sort();

		// Should find both items: center (distance 0) and far-with-radius (edge within range)
		const golden = ['center', 'far-with-radius'];
		expect(resultIds).toEqual(golden);
	});

	it('Bug fix: Items with large radius near bucket boundary are found (bucketed)', async () => {
		// Same test as above but with bucketing enabled
		const items: CoordinatesMapItem[] = [
			{
				id: 'center',
				x: 50,
				y: 50,
				radius: 0
			},
			{
				id: 'far-with-radius',
				x: 120,
				y: 50,
				radius: 30
			}
		];
		const size: Size = {width: 200, height: 200};
		// Create a bucketed map (small bucket sizes to force bucketing)
		const map = new CoordinatesMap([], size);
		map._minBucketSize = 40;
		map._maxBucketSize = 4;
		for (const item of items) {
			map.insertObject(item);
		}

		const result = map.getObjects(50, 50, 50);
		const resultIds = [...result.keys()].map(item => item.id).sort();

		const golden = ['center', 'far-with-radius'];
		expect(resultIds).toEqual(golden);
	});

	it('Bug fix: getPosition centers radius around object coordinates', async () => {
		// Test for Bug 2: getPosition should center the radius around the object's x,y
		// instead of having the radius extend only down and right.
		const item: CoordinatesMapItem = {
			id: 'test',
			x: 100,
			y: 100,
			radius: 20
		};
		const size: Size = {width: 200, height: 200};
		const map = new CoordinatesMap([item], size);

		const position = map.getPosition(item);

		// With radius 20 centered at (100, 100), the position box should be:
		// x: 100 - 20 = 80
		// y: 100 - 20 = 80
		// width: 20 * 2 = 40
		// height: 20 * 2 = 40
		const golden: Position = {
			x: 80,
			y: 80,
			width: 40,
			height: 40
		};
		expect(position).toEqual(golden);
	});

	it('Bug fix: getPosition with zero radius', async () => {
		// Edge case: zero radius should result in a zero-size box at the object's coordinates
		const item: CoordinatesMapItem = {
			id: 'test',
			x: 50,
			y: 75,
			radius: 0
		};
		const size: Size = {width: 200, height: 200};
		const map = new CoordinatesMap([item], size);

		const position = map.getPosition(item);

		const golden: Position = {
			x: 50,
			y: 75,
			width: 0,
			height: 0
		};
		expect(position).toEqual(golden);
	});

});

describe('circleIntersectsBounds', () => {
	it('Circle within bounds', async () => {
		const center: Coordinates = {
			x: 50,
			y: 50
		};
		const radius = 25;
		const bounds: CoordinatesMapBounds = {
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			includeBottom: false,
			includeRight: false
		};
		const result = circleIntersectsBounds(center, radius, bounds);
		const golden = true;
		expect(result).toEqual(golden);
	});

	it('Circle outside of bounds', async () => {
		const center: Coordinates = {
			x: -50,
			y: 50
		};
		const radius = 25;
		const bounds: CoordinatesMapBounds = {
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			includeBottom: false,
			includeRight: false
		};
		const result = circleIntersectsBounds(center, radius, bounds);
		const golden = false;
		expect(result).toEqual(golden);
	});

	it('Circle outside of rect above but within radius', async () => {
		const center: Coordinates = {
			x: 50,
			y: -10
		};
		const radius = 25;
		const bounds: CoordinatesMapBounds = {
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			includeBottom: false,
			includeRight: false
		};
		const result = circleIntersectsBounds(center, radius, bounds);
		const golden = true;
		expect(result).toEqual(golden);
	});

	it('Circle outside of rect left but within radius', async () => {
		const center: Coordinates = {
			x: -10,
			y: 50
		};
		const radius = 25;
		const bounds: CoordinatesMapBounds = {
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			includeBottom: false,
			includeRight: false
		};
		const result = circleIntersectsBounds(center, radius, bounds);
		const golden = true;
		expect(result).toEqual(golden);
	});

	it('Circle outside of rect bottom but within radius', async () => {
		const center: Coordinates = {
			x: 50,
			y: 110
		};
		const radius = 25;
		const bounds: CoordinatesMapBounds = {
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			includeBottom: false,
			includeRight: false
		};
		const result = circleIntersectsBounds(center, radius, bounds);
		const golden = true;
		expect(result).toEqual(golden);
	});

	it('Circle outside of rect right but within radius', async () => {
		const center: Coordinates = {
			x: 110,
			y: 50
		};
		const radius = 25;
		const bounds: CoordinatesMapBounds = {
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			includeBottom: false,
			includeRight: false
		};
		const result = circleIntersectsBounds(center, radius, bounds);
		const golden = true;
		expect(result).toEqual(golden);
	});

	it('Circle outside of rect diagonal left up but within radius', async () => {
		const center: Coordinates = {
			x: -10,
			y: -10
		};
		const radius = 25;
		const bounds: CoordinatesMapBounds = {
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			includeBottom: false,
			includeRight: false
		};
		const result = circleIntersectsBounds(center, radius, bounds);
		const golden = true;
		expect(result).toEqual(golden);
	});

});
