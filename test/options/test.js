/*eslint-env node*/

import {
	setPropertyInObject,
	deepFreeze
} from '../../src/util.js';

import assert from 'assert';

describe('setPropertyInObject', () => {
	it('handles null object', async () => {
		const obj = null;
		const path = 'a.b';
		const value = '3';
		const result = setPropertyInObject(obj, path, value);
		const golden = undefined;
		assert.strictEqual(result, golden);
	});

	it('handles a single-nested object', async () => {
		const obj = {
			a: 1,
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a';
		const value = '3';
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			a: 3,
			b: 2
		};
		assert.deepEqual(result, golden);
	});

	it('handles a double-nested object', async () => {
		const obj = {
			a: {
				c: 1,
				d: 2
			},
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a.c';
		const value = '3';
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			a: {
				c: 3,
				d: 2
			},
			b: 2,
		};
		assert.deepEqual(result, golden);
	});

	it('can create a new property in a double-nested object', async () => {
		const obj = {
			a: {
				d: 2
			},
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a.c';
		const value = '3';
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			a: {
				c: 3,
				d: 2
			},
			b: 2,
		};
		assert.deepEqual(result, golden);
	});

	it('can modify an array property property in a double-nested object', async () => {
		const obj = {
			a: [0, 1, 2],
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a.1';
		const value = '3';
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			a: [0, 3, 2],
			b: 2,
		};
		assert.deepEqual(result, golden);
	});


});