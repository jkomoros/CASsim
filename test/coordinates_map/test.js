/*eslint-env node*/

import {
	CoordinatesMap
} from '../../src/coordinates-map.js';

import assert from 'assert';

const makeDefaultItems = () => {
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
		}
	];
};

const makeDefaultSize = () => {
	return {
		width: 200,
		height: 250
	};
};

describe('CoordinatesMap', () => {
	it('Basic getAllObjects', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const result = map.getAllObjects();
		assert.deepStrictEqual(result, defaultItems);
	});

	it('Basic bounds', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const result = map.bounds;
		assert.deepStrictEqual(result, {...defaultSize, x: 0, y:0});
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
			'2': 111.80339887498948
		};
		assert.deepStrictEqual(simplifiedResult, golden);
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
		};
		assert.deepStrictEqual(simplifiedResult, golden);
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
		assert.deepStrictEqual(simplifiedResult, golden);
	});

	it('Basic getObjects with large radius and an exclude', async () => {
		const defaultItems = makeDefaultItems();
		const defaultSize = makeDefaultSize();
		const map = new CoordinatesMap(defaultItems, defaultSize);
		const result = map.getObjects(100, 100, 300, [defaultItems[2]]);
		const simplifiedResult = Object.fromEntries([...result.entries()].map(entry => [entry[0].id, entry[1]]));
		const golden = {
			'0': 0,
			'1': 70.71067811865476
		};
		assert.deepStrictEqual(simplifiedResult, golden);
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
		assert.throws(fn);
	});
});