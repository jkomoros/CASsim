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

describe('CoordinatesMap', () => {
	it('Basic getAllObjects', async () => {
		const defaultItems = makeDefaultItems();
		const map = new CoordinatesMap(defaultItems, {width: 200, height: 200});
		const result = map.getAllObjects();
		assert.deepStrictEqual(result, defaultItems);
	});

	it('Basic bounds', async () => {
		const defaultItems = makeDefaultItems();
		const map = new CoordinatesMap(defaultItems, {width: 200, height: 200});
		const result = map.bounds;
		assert.deepStrictEqual(result, {x: 0, y:0, width: 200, height: 200});
	});
});