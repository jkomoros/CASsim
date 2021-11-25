/*eslint-env node*/

import {
	setPropertyInObject
} from '../../src/util.js';

import assert from 'assert';

describe('getObjectPath', () => {
	it('handles null object', async () => {
		const obj = null;
		const path = ['a.b'];
		const value = '3';
		const result = setPropertyInObject(obj, path, value);
		const golden = undefined;
		assert.strictEqual(result, golden);
	});
	
});