/*eslint-env node*/

import {
	typescriptTypeForOptionsConfig
} from '../../tools/types.js';

import assert from 'assert';

//TODO: replace with real tests
describe('typescriptTypeForOptionsConfig', () => {
	it('basic result', async () => {
		const importsMap = {};
		const input = {
			foo: {
				example: 3,
				optional: true,
			},
			bar: {
				example: true
			}
		};
		const result = typescriptTypeForOptionsConfig(input, importsMap);
		const golden = `{
	foo?: number;
	bar: boolean;
};`;
		const goldenImport = {};
		assert.deepStrictEqual(result, golden);
		assert.deepStrictEqual(importsMap, goldenImport);
	});
});