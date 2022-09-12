/*eslint-env node*/

import {
	isStep
} from '../../src/util.js';

import assert from 'assert';

//TODO: replace with real tests
describe('isStep', () => {
	it('handles 1.0 / 1.0', async () => {
		const result = isStep(1.0, 1.0);
		const golden = true;
		assert.deepStrictEqual(result, golden);
	});
});