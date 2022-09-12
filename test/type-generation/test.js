/*eslint-env node*/

import {
	typescriptTypeForOptionsConfig
} from '../../tools/types.js';

import assert from 'assert';

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

	it('basic result nested', async () => {
		const importsMap = {};
		const input = {
			foo: {
				example: 3,
				optional: true,
			},
			bar: {
				example: {
					baz: {
						example: 3,
					},
					buz: {
						example: 'bam',
						optional: true
					}
				},
				optional: true
			}
		};
		const result = typescriptTypeForOptionsConfig(input, importsMap);
		const golden = `{
	foo?: number;
	bar?: {
		baz: number;
		buz?: string;
	};
};`;
		const goldenImport = {};
		assert.deepStrictEqual(result, golden);
		assert.deepStrictEqual(importsMap, goldenImport);
	});

	it('basic result with import', async () => {
		const importsMap = {};
		const input = {
			foo: {
				example: 3,
				optional: true,
			},
			bar: {
				example: true,
				typeInfo: {
					typeName: 'DistributionOptions',
					import: 'src/types.js'
				}
			}
		};
		const result = typescriptTypeForOptionsConfig(input, importsMap);
		const golden = `{
	foo?: number;
	bar: DistributionOptions;
};`;
		const goldenImport = {
			'DistributionOptions': 'src/types.js'
		};
		assert.deepStrictEqual(result, golden);
		assert.deepStrictEqual(importsMap, goldenImport);
	});
});