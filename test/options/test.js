/*eslint-env node*/

import {
	setPropertyInObject,
	deepFreeze,
	DELETE_SENTINEL,
	isStep
} from '../../src/util.js';

import {
	maySetPropertyInConfigObject,
	optionsConfigValidator,
	defaultValueForConfig,
	configForPath,
	shortenPathWithConfig,
	expandPathWithConfig,
	ensureBackfill,
	suggestMissingShortNames,
	optionsConfigWithDefaultedShortNames
} from '../../src/options.js';

import assert from 'assert';

describe('isStep', () => {
	it('handles 1.0 / 1.0', async () => {
		const result = isStep(1.0, 1.0);
		const golden = true;
		assert.deepStrictEqual(result, golden);
	});

	it('handles 1.5 / 1.0', async () => {
		const result = isStep(1.5, 1.0);
		const golden = false;
		assert.deepStrictEqual(result, golden);
	});

	it('handles 1.5 / 0.5', async () => {
		const result = isStep(1.5, 0.5);
		const golden = true;
		assert.deepStrictEqual(result, golden);
	});

	it('handles 0.15 / 0.05', async () => {
		//This one requires epsilon
		const result = isStep(0.15, 0.05);
		const golden = true;
		assert.deepStrictEqual(result, golden);
	});
});

describe('setPropertyInObject', () => {
	it('handles null object', async () => {
		const obj = null;
		const path = 'a.b';
		const value = 3;
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			'a': {
				'b': 3,
			}
		};
		assert.deepEqual(result, golden);
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
		const value = 3;
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

	it('can create an implied object in a double-nested object', async () => {
		const obj = {
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a.c';
		const value = '3';
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			a: {
				c: '3',
			},
			b: 2,
		};
		assert.deepEqual(result, golden);
	});

	it('can create an implied array in a double-nested object', async () => {
		const obj = {
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a.0';
		const value = 3;
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			a: [3],
			b: 2,
		};
		assert.deepEqual(result, golden);
	});

	it('can delete a non-last proeprty in a double-nested object', async () => {
		const obj = {
			a: {
				d: 2,
				c: 3,
			},
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a.c';
		const value = DELETE_SENTINEL;
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			a: {
				d:2,
			},
			b: 2,
		};
		assert.deepEqual(result, golden);
	});

	it('can delete a non-last array index in a double-nested object', async () => {
		const obj = {
			a: [0, 1, 2],
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a.1';
		const value = DELETE_SENTINEL;
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			a: [0, 2],
			b: 2,
		};
		assert.deepEqual(result, golden);
	});

	it('can delete the last proeprty in a double-nested object', async () => {
		const obj = {
			a: {
				c: 3,
			},
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a.c';
		const value = DELETE_SENTINEL;
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			a: {},
			b: 2,
		};
		assert.deepEqual(result, golden);
	});

	it('can delete a last array index in a double-nested object', async () => {
		const obj = {
			a: [0],
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a.0';
		const value = DELETE_SENTINEL;
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			a: [],
			b: 2,
		};
		assert.deepEqual(result, golden);
	});

	it('can delete a property that is an array', async () => {
		const obj = {
			a: [0],
			b: 2,
		};
		deepFreeze(obj);
		const path = 'a';
		const value = DELETE_SENTINEL;
		const result = setPropertyInObject(obj, path, value);
		const golden = {
			b: 2,
		};
		assert.deepEqual(result, golden);
	});


});

describe('optionsConfigValidator', () => {
	it('handles null object', async () => {
		const config = null;
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object missing example property', async () => {
		const config = {
			foo: {
				exampleTYPO: 3,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with incorrect description', async () => {
		const config = {
			foo: {
				example: 3,
				description: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with incorrect advanced', async () => {
		const config = {
			foo: {
				example: 3,
				advanced: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with incorrect optional', async () => {
		const config = {
			foo: {
				example: 3,
				optional: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with incorrect default typeof', async () => {
		const config = {
			foo: {
				example: 3,
				optional: true,
				backfill: 3,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with default true optional false', async () => {
		const config = {
			foo: {
				example: 3,
				backfill: true,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with legal default and optional', async () => {
		const config = {
			foo: {
				example: 3,
				backfill: true,
				optional: true,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with incorrect min', async () => {
		const config = {
			foo: {
				example: 3,
				min: false,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with incorrect max', async () => {
		const config = {
			foo: {
				example: 3,
				max: false,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with max less than min', async () => {
		const config = {
			foo: {
				example: 3,
				max: 5.0,
				min: 10.0,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with incorrect step', async () => {
		const config = {
			foo: {
				example: 3,
				step: false,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with step on array ', async () => {
		const config = {
			foo: {
				example: [
					{
						example: 3,
					}
				],
				step: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with two examples nested directly ', async () => {
		const config = {
			foo: {
				example: {
					example: 3,
				},
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with min not on array or number', async () => {
		const config = {
			foo: {
				example: "foo",
				min: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with max not on array or number', async () => {
		const config = {
			foo: {
				example: "foo",
				max: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with min and max on array', async () => {
		const config = {
			foo: {
				example: [
					{
						example: 3,
					}
				],
				min: 2,
				max: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with step not on array or number', async () => {
		const config = {
			foo: {
				example: "foo",
				max: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with invalid options', async () => {
		const config = {
			foo: {
				example: "foo",
				options: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with invalid zero option', async () => {
		const config = {
			foo: {
				example: "foo",
				options: [],
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with invalid first option', async () => {
		const config = {
			foo: {
				example: "foo",
				options: [{
					description: 'missing value'
				}],
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with multi-level-nested object', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						baz: {
							example: 5,
						}
					}
				},
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with lots of properties example', async () => {
		const config = {
			foo: {
				example: 3,
				description: '3 is an example',
				optional: true,
				advanced: true,
				behavior: 'color',
				min: 2,
				max: 3,
				step: 1,
				options: [
					{
						value: 3,
					},
					{
						value: 4,
						display: "four",
					}
				]
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with invalid behavior', async () => {
		const config = {
			foo: {
				example: 3,
				behavior: 'invalid',
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with number example', async () => {
		const config = {
			foo: {
				example: 3,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with string example', async () => {
		const config = {
			foo: {
				example: "foo",
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with boolean example', async () => {
		const config = {
			foo: {
				example: false,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with valid array example', async () => {
		const config = {
			foo: {
				example: [
					{
						example: false,
					},
				]
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with invalid array example', async () => {
		const config = {
			foo: {
				example: []
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('handles basic object with valid sub-object example', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
				}
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('allows legal shortName', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: 'b',
					},
					baz: {
						example: true,
						shortName: 'bz',
					}
				},
				shortName: 'f',
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('disallows non-string shortName', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: 9,
					},
				},
				shortName: 'f',
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('disallows empty shortName', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: '',
					},
				},
				shortName: 'f',
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('disallows duplicate shortName', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: 'b',
					},
					baz: {
						example: true,
						shortName: 'b',
					}
				},
				shortName: 'f',
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('disallows shortName that conflicts with long name', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: 'b',
					},
					baz: {
						example: true,
						shortName: 'bar',
					}
				},
				shortName: 'f',
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('disallows duplicate shortName in non-example', async () => {
		const config = {
			foo: {
				bar: {
					example: false,
					shortName: 'b',
				},
				baz: {
					example: true,
					shortName: 'b',
				}
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('disallows shortName that conflicts with long name in non-example', async () => {
		const config = {
			foo: {
				bar: {
					example: false,
					shortName: 'b',
				},
				baz: {
					example: true,
					shortName: 'bar',
				}
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = true;
		assert.strictEqual(result != '', expectedProblem);
	});

	it('allows duplicate shortName at different level', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: 'b',
					},
					baz: {
						example: true,
						shortName: 'f',
					}
				},
				shortName: 'f',
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblem = false;
		assert.strictEqual(result != '', expectedProblem);
	});

});

describe('maySetPropertyInConfigObject', () => {
	it('handles basic single-level object', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: 3,
		};
		const obj = 4;
		const path = '';
		const value = 4;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object of different type', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: 3,
		};
		const path = '';
		const value = 'not-a-number';
		const obj = 4;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object in an allowed option', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: 3,
			options: [
				{
					value: 1,
				},
				{
					value: 2,
				}
			]	
		};
		const path = '';
		const value = 2;
		const obj = 5;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object in a not-allowed option', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: 3,
			options: [
				{
					value: 1,
				},
				{
					value: 2,
				}
			]	
		};
		const path = '';
		const value = 4;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that goes against min', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: 3,
			min: 2,
		};
		const path = '';
		const value = 1;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that is allowed by min', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: 3,
			min: 2,
		};
		const path = '';
		const value = 2;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that goes against max', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: 3,
			max: 5,
		};
		const path = '';
		const value = 10;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that is allowed by max', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: 3,
			max: 5,
		};
		const path = '';
		const value = 2;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array where value is not an array', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: [
				{
					example: 3,
				}
			],
		};
		const path = '';
		const value = 4;
		const obj = [3];
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that is disallowed by max', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: [
				{
					example: 3,
				}
			],
			max: 2,
		};
		const path = '';
		const value = [2,3,4];
		const obj = [2,2,2];
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that is allowed by max', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: [
				{
					example: 3,
				}
			],
			max: 4,
		};
		const path = '';
		const value = [2,3,4];
		const obj = [2,2,2];
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that is disallowed by min', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: [
				{
					example: 3,
				}
			],
			min: 2,
		};
		const path = '';
		const value = [2];
		const obj = [2,2];
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that is allowed by min', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: [
				{
					example: 3,
				}
			],
			min: 2,
		};
		const path = '';
		const value = [2,3,4];
		const obj = [2,2];
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that has an illegal value', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: [
				{
					example: 3,
				}
			],
		};
		const path = '';
		const value = ['a',3,4];
		const obj = [2,2];
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that has a null value that is allowed', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: [
				{
					example: 3,
					optional: true,
				}
			],
		};
		const path = '';
		const value = [null,3,4];
		const obj = [2, 2];
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that has a null value that is not allowed', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: [
				{
					example: 3,
				}
			],
		};
		const path = '';
		const value = [null,3,4];
		const obj = [2, 2];
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject that has a null value that is allowed', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: 3,
						}
					},
					optional: true,
				}
			},
		};
		const path = '';
		const value = {
			foo: null,
		};
		const obj = {
			foo: {
				bar: 3
			}
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject that has a missing property value that is allowed to be optional', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: 3,
						}
					},
					optional: true,
				}
			},
		};
		const path = '';
		const value = {
			foo: null,
		};
		const obj = {
			foo: {
				bar: 3
			}
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject that has a null value that is not allowed', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: 3,
						}
					},
					optional: false,
				}
			},
		};
		const path = '';
		const value = {
			foo: null,
		};
		const obj = {
			foo: {
				bar: 3
			}
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: 2,
						}
					}
				}
			}
		};
		const path = '';
		const value = {
			foo: {
				bar: 3,
			}
		};
		const obj = {
			foo: {
				bar: 3
			}
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});


	it('handles basic single-level object set with subobject that is invalid', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: 2,
						}
					}
				}
			}
		};
		const path = '';
		const value = {
			foo: {}
		};
		const obj = {
			foo: {
				bar: 3
			}
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject that is invalid', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: 2,
						}
					}
				}
			}
		};
		const path = '';
		const value = {
			foo: {
				bar: 'not-a-number'
			}
		};
		const obj = {
			foo: {
				bar: 3
			}
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that goes against step', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: 3,
			step: 1.5,
		};
		const path = '';
		const value = 1;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that is allowed by step', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: 3,
			min: 1.5,
		};
		const path = '';
		const value = 4.5;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});


	it('handles basic single-level object on a non-leaf object', async () => {
		const config = {
			foo: {
				example: 3,
			}
		};
		const validatorResult = optionsConfigValidator(config);
		try {
			assert.strictEqual(validatorResult, '');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path = '';
		const value = 4;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic stacked object', async () => {
		const config = {
			foo: {
				example: 3,
			}
		};
		const validatorResult = optionsConfigValidator(config);
		try {
			assert.strictEqual(validatorResult, '');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path = 'foo';
		const value = 4;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic stacked object with wrong type', async () => {
		const config = {
			foo: {
				example: 3,
			}
		};
		const validatorResult = optionsConfigValidator(config);
		try {
			assert.strictEqual(validatorResult, '');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path = 'foo';
		const value = 'foo';
		const obj = {
			foo: 3
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic stacked object with example array', async () => {
		const config = {
			foo: {
				example: [
					{
						example: 2,
					}
				],
			}
		};
		const validatorResult = optionsConfigValidator(config);
		try {
			assert.strictEqual(validatorResult, '');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path = 'foo.2';
		const value = 3;
		const obj = {
			foo: [2, 2, 2]
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic stacked object with example object', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: 4
					}
				}
			}
		};
		const validatorResult = optionsConfigValidator(config);
		try {
			assert.strictEqual(validatorResult, '');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path = 'foo.bar';
		const value = 3;
		const obj = {
			foo: {
				bar: 4
			}
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic stacked object with example object with a set at a non-present value', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: 4
					}
				}
			}
		};
		const validatorResult = optionsConfigValidator(config);
		try {
			assert.strictEqual(validatorResult, '');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path = 'foo.baz';
		const value = 3;
		const obj = {
			foo: {
				bar: 4
			}
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = true;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles complex schelling-org example', async () => {
		const config = {
			projects: {
				example: {
					count: {
						example: 4
					},
					individuals: {
						example: [
							{
								example: {
									value: {
										example: 2,
									}
								},
								optional: true
							}
						]
					}
				}
			},
			communication: {
				example: 2,
			}
		};
		const validatorResult = optionsConfigValidator(config);
		try {
			assert.strictEqual(validatorResult, '');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path = 'projects.individuals.1';
		const value = null;
		const obj = {
			projects: {
				count: 4,
				individuals: [
					null,
					{
						value: 3
					}
				]
			},
			communication: 2
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles complex schelling-org example setting on previously null object', async () => {
		const config = {
			projects: {
				example: {
					count: {
						example: 4
					},
					individuals: {
						example: [
							{
								example: {
									value: {
										example: 2,
									}
								},
								optional: true
							}
						]
					}
				}
			},
			communication: {
				example: 2,
			}
		};
		const validatorResult = optionsConfigValidator(config);
		try {
			assert.strictEqual(validatorResult, '');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path = 'projects.individuals.0';
		const value = {
			value: 2
		};
		const obj = {
			projects: {
				count: 4,
				individuals: [
					null,
					{
						value: 3
					}
				]
			},
			communication: 2
		};
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem = false;
		try {
			assert.strictEqual(result != '', expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

});

describe('defaultValueForConfig', () => {
	it('handles null object', async () => {
		const config = null;
		const result = defaultValueForConfig(config);
		const golden = undefined;
		assert.deepEqual(result, golden);
	});

	it('handles basic string', async () => {
		const config = {
			example: 'foo'
		};
		const result = defaultValueForConfig(config);
		const golden = 'foo';
		assert.deepEqual(result, golden);
	});

	it('handles basic optional string', async () => {
		const config = {
			example: 'foo',
			optional: true,
		};
		const result = defaultValueForConfig(config);
		const golden = 'foo';
		assert.deepEqual(result, golden);
	});

	it('handles basic optional string with skipOptional', async () => {
		const config = {
			example: 'foo',
			optional: true,
		};
		const result = defaultValueForConfig(config, true);
		const golden = undefined;
		assert.deepEqual(result, golden);
	});

	it('handles basic number', async () => {
		const config = {
			example: 3
		};
		const result = defaultValueForConfig(config);
		const golden = 3;
		assert.deepEqual(result, golden);
	});

	it('handles basic boolean', async () => {
		const config = {
			example: false
		};
		const result = defaultValueForConfig(config);
		const golden = false;
		assert.deepEqual(result, golden);
	});

	it('handles single level object', async () => {
		const config = {
			example: {
				foo: {
					example: 3,
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: 3,
		};
		assert.deepEqual(result, golden);
	});

	it('handles single level array with number', async () => {
		const config = {
			example: {
				foo: {
					example: [
						{
							example: 3,
						}
					]
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: [3],
		};
		assert.deepEqual(result, golden);
	});

	it('handles single level array with object', async () => {
		const config = {
			example: {
				foo: {
					example: [
						{
							bar: {
								example: 3,
							}
						}
					]
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: [
				{
					bar: 3
				}
			],
		};
		assert.deepEqual(result, golden);
	});

	it('handles multiple level object', async () => {
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: 3,
						}
					}
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: {
				bar: 3
			}
		};
		assert.deepEqual(result, golden);
	});

	it('handles object with one optional property', async () => {
		const config = {
			example: {
				foo: {
					example: 3
				},
				bar: {
					example: 4,
					optional: true,
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: 3
		};
		assert.deepEqual(result, golden);
	});

	it('handles object with one optional property', async () => {
		const config = {
			example: {
				foo: {
					example: 3
				},
				bar: {
					example: {
						baz: {
							example: 4,
						}
					},
					optional: true,
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: 3
		};
		assert.deepEqual(result, golden);
	});

	it('handles object with one optional+default property', async () => {
		const config = {
			example: {
				foo: {
					example: 3
				},
				bar: {
					example: {
						baz: {
							example: 4,
						}
					},
					optional: true,
					default: true,
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: 3,
			bar: {
				baz: 4
			}
		};
		assert.deepEqual(result, golden);
	});

	it('handles object with two layer optional/default property', async () => {
		const config = {
			example: {
				foo: {
					example: 3
				},
				bar: {
					example: {
						baz: {
							example: 4,
							default: true,
							optional: true,
						}
					},
					optional: true,
					default: true,
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: 3,
			bar: {
				baz: 4
			}
		};
		assert.deepEqual(result, golden);
	});

	it('handles object with optional array', async () => {
		const config = {
			example: {
				foo: {
					example: [
						{
							example: 3,
						}
					],
					optional: true,
				},
				bar: {
					example: 4
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			bar: 4
		};
		assert.deepEqual(result, golden);
	});

	it('handles object with optional+default array', async () => {
		const config = {
			example: {
				foo: {
					example: [
						{
							example: 3,
						}
					],
					optional: true,
					default:true,
				},
				bar: {
					example: 4
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo:[3],
			bar: 4
		};
		assert.deepEqual(result, golden);
	});

	it('handles object with array with optional items', async () => {
		const config = {
			example: {
				foo: {
					example: [
						{
							example: 3,
							optional: true,
						}
					],
				},
				bar: {
					example: 4
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: [],
			bar: 4
		};
		assert.deepEqual(result, golden);
	});

	it('handles object with array with optional+default items', async () => {
		const config = {
			example: {
				foo: {
					example: [
						{
							example: 3,
							optional: true,
							default: true,
						}
					],
				},
				bar: {
					example: 4
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: [3],
			bar: 4
		};
		assert.deepEqual(result, golden);
	});

	it('handles array min size', async () => {
		const config = {
			example: {
				foo: {
					example: [
						{
							example: 3,
							optional: true,
						}
					],
					min: 2,
				},
				bar: {
					example: 4
				}
			}
		};
		const result = defaultValueForConfig(config);
		const golden = {
			foo: [null, null],
			bar: 4
		};
		assert.deepEqual(result, golden);
	});

});

describe('configForPath', () => {
	it('handles null object', async () => {
		const config = null;
		const result = configForPath(config, 'foo');
		const golden = undefined;
		assert.deepEqual(result, golden);
	});

	it('handles top level get', async () => {
		const config = {
			example: 3,
		};
		const result = configForPath(config, '');
		const golden = config;
		assert.deepEqual(result, golden);
	});

	it('handles basic example object get', async () => {
		const config = {
			example: {
				foo: {
					example: 3,
				}
			}
		};
		const result = configForPath(config, 'foo');
		const golden = {
			example: 3
		};
		assert.deepEqual(result, golden);
	});

	it('handles basic non-example object get', async () => {
		const config = {
			foo: {
				example: 3,
			}
		};
		const result = configForPath(config, 'foo');
		const golden = {
			example: 3
		};
		assert.deepEqual(result, golden);
	});

	it('handles array get', async () => {
		const config = {
			foo: {
				example: [
					{
						example: 3
					}
				]
			}
		};
		const result = configForPath(config, 'foo.0');
		const golden = {
			example: 3
		};
		assert.deepEqual(result, golden);
	});

});


describe('shortenPathWithConfig', () => {
	it('handles null object', async () => {
		const config = null;
		const result = shortenPathWithConfig(config, 'foo');
		const golden = 'foo';
		assert.deepEqual(result, golden);
	});

	it('handles no op single path', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				}
			},
		};
		const result = shortenPathWithConfig(config, 'foo');
		const golden = 'foo';
		assert.deepEqual(result, golden);
	});

	it('handles no op double path', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				}
			},
		};
		const result = shortenPathWithConfig(config, 'foo.bar');
		const golden = 'foo.bar';
		assert.deepEqual(result, golden);
	});

	it('handles no op with array path', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				}
			},
		};
		const result = shortenPathWithConfig(config, 'foo.bar.0');
		const golden = 'foo.bar.0';
		assert.deepEqual(result, golden);
	});

	it('handles no op with array sub path', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				}
			},
		};
		const result = shortenPathWithConfig(config, 'foo.bar.0.foo');
		const golden = 'foo.bar.0.foo';
		assert.deepEqual(result, golden);
	});

	it('handles single level replace', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				},
				shortName: 'f'
			},
		};
		const result = shortenPathWithConfig(config, 'foo');
		const golden = 'f';
		assert.deepEqual(result, golden);
	});

	it('handles double level replace', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: 'b',
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				},
				shortName: 'f'
			},
		};
		const result = shortenPathWithConfig(config, 'foo.bar');
		const golden = 'f.b';
		assert.deepEqual(result, golden);
	});

	it('handles triple level replace with array in the middle', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: 'b',
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
									shortName: 'f'
								}
							}
						],
					}
				},
				shortName: 'f'
			},
		};
		const result = shortenPathWithConfig(config, 'foo.baz.0.foo');
		const golden = 'f.baz.0.f';
		assert.deepEqual(result, golden);
	});
});

describe('expandPathWithConfig', () => {
	it('handles null object', async () => {
		const config = null;
		const result = expandPathWithConfig(config, 'foo');
		const golden = 'foo';
		assert.deepEqual(result, golden);
	});

	it('handles no op single path', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				}
			},
		};
		const result = expandPathWithConfig(config, 'foo');
		const golden = 'foo';
		assert.deepEqual(result, golden);
	});

	it('handles no op double path', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				}
			},
		};
		const result = expandPathWithConfig(config, 'foo.bar');
		const golden = 'foo.bar';
		assert.deepEqual(result, golden);
	});

	it('handles no op with array path', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				}
			},
		};
		const result = expandPathWithConfig(config, 'foo.bar.0');
		const golden = 'foo.bar.0';
		assert.deepEqual(result, golden);
	});

	it('handles no op with array sub path', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				}
			},
		};
		const result = expandPathWithConfig(config, 'foo.bar.0.foo');
		const golden = 'foo.bar.0.foo';
		assert.deepEqual(result, golden);
	});

	it('handles single level replace', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				},
				shortName: 'f'
			},
		};
		const result = expandPathWithConfig(config, 'f');
		const golden = 'foo';
		assert.deepEqual(result, golden);
	});

	it('handles double level replace', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: 'b',
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
								}
							}
						],
					}
				},
				shortName: 'f'
			},
		};
		const result = expandPathWithConfig(config, 'f.b');
		const golden = 'foo.bar';
		assert.deepEqual(result, golden);
	});

	it('handles triple level replace with array in the middle', async () => {
		const config = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: 'b',
					},
					baz: {
						example: [
							{
								foo: {
									example: 5,
									shortName: 'f'
								}
							}
						],
					}
				},
				shortName: 'f'
			},
		};
		const result = expandPathWithConfig(config, 'f.baz.0.f');
		const golden = 'foo.baz.0.foo';
		assert.deepEqual(result, golden);
	});
});

describe('expandDefaults', () => {
	it('handles basic object', async () => {
		const config = {
			foo: {
				example: 5,
				optional: true,
				backfill: true,
			}
		};
		deepFreeze(config);
		const obj = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden = {
			foo: 5,
		};
		const goldenChanged = true;
		assert.deepEqual(result, golden);
		assert.deepEqual(changed, goldenChanged);
	});

	it('handles basic object that doesn\'t need a change', async () => {
		const config = {
			foo: {
				example: 5,
				optional: true,
				backfill: true,
			}
		};
		deepFreeze(config);
		const obj = {
			foo: 3,
		};
		const [result, changed] = ensureBackfill(config, obj);
		const golden = {
			foo: 3,
		};
		const goldenChanged = false;
		assert.deepEqual(result, golden);
		assert.deepEqual(changed, goldenChanged);
	});

	it('handles example object that doesn\'t need a change', async () => {
		const config = {
			example: {
				foo: {
					example: 5,
					optional: true,
					backfill: true,
				}
			},
			optional:true,
			backfill: true,
		};
		deepFreeze(config);
		const obj = {
			foo: 3,
		};
		const [result, changed] = ensureBackfill(config, obj);
		const golden = {
			foo: 3,
		};
		const goldenChanged = false;
		assert.deepEqual(result, golden);
		assert.deepEqual(changed, goldenChanged);
	});

	it('handles example object that does need a change', async () => {
		const config = {
			example: {
				foo: {
					example: 5,
					optional: true,
					backfill: true,
				}
			},
			optional:true,
			backfill: true,
		};
		deepFreeze(config);
		const obj = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden = {
			foo: 5,
		};
		const goldenChanged = true;
		assert.deepEqual(result, golden);
		assert.deepEqual(changed, goldenChanged);
	});

	it('handles example object that does need a change nested', async () => {
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: 3,
						}
					},
					optional: true,
					backfill: true,
				}
			},
			optional:true,
			backfill: true,
		};
		deepFreeze(config);
		const obj = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden = {
			foo: {
				bar: 3,
			},
		};
		const goldenChanged = true;
		assert.deepEqual(result, golden);
		assert.deepEqual(changed, goldenChanged);
	});

	it('handles example object that has a nested optional non default object', async () => {
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: 3,
						}
					},
					optional: true,
				}
			},
			optional:true,
			backfill: true,
		};
		deepFreeze(config);
		const obj = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden = {};
		const goldenChanged = false;
		assert.deepEqual(result, golden);
		assert.deepEqual(changed, goldenChanged);
	});

	it('handles example object that has a nested array', async () => {
		const config = {
			example: {
				foo: {
					example: {
						bar:{
							example: [
								{
									example: 3,
								}
							]
						}
					},
					optional: true,
					backfill: true,
				},
				bar: {
					example: 'baz',
					backfill: true,
					optional: true,
				}
			},
			optional:true,
			backfill: true,
		};
		deepFreeze(config);
		const obj = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden = {
			foo: {
				bar: [
					3,
				]
			},
			bar: 'baz'
		};
		const goldenChanged = true;
		assert.deepEqual(result, golden);
		assert.deepEqual(changed, goldenChanged);
	});

	it('handles example object that does need a change nested defaults', async () => {
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: {
								baz: {
									example: 3,
								},
								blam: {
									example: 'foo',
								}
							},
							optional:true,
							backfill: true,
						}
					},
					optional: true,
					backfill: true,
				}
			},
			optional:true,
			backfill: true,
		};
		deepFreeze(config);
		const obj = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden = {
			foo: {
				bar: {
					baz: 3,
					blam: 'foo',
				},
			},
		};
		const goldenChanged = true;
		assert.deepEqual(result, golden);
		assert.deepEqual(changed, goldenChanged);
	});

});

describe('suggestMissingShortNames', () => {

	it('handles basic object that is invalid (short name collision)', async () => {
		const existing = {
			foo: 'f',
			bar: 'f',
		};
		const result = suggestMissingShortNames(existing);
		const golden = {};
		assert.deepEqual(result, golden);
	});

	it('handles basic object that is invalid (long/short name collision)', async () => {
		const existing = {
			foo: 'f',
			bar: 'foo',
		};
		const result = suggestMissingShortNames(existing);
		const golden = {};
		assert.deepEqual(result, golden);
	});

	it('handles basic object', async () => {
		const existing = {
			foo: 'f',
			bar: '',
		};
		const result = suggestMissingShortNames(existing);
		//bar is too short to get shortened
		const golden = {};
		assert.deepEqual(result, golden);
	});

	it('handles basic object', async () => {
		const existing = {
			foo: 'f',
			barbell: '',
		};
		const result = suggestMissingShortNames(existing);
		const golden = {
			barbell: 'b',
		};
		assert.deepEqual(result, golden);
	});

	it('handles basic object that looks invalid but is valid because longName == shortName', async () => {
		const existing = {
			foo: 'foo',
			bar: '',
		};
		const result = suggestMissingShortNames(existing);
		//bar is too short to get shortened
		const golden = {};
		assert.deepEqual(result, golden);
	});

	it('handles basic object that looks invalid but is valid because longName == shortName', async () => {
		const existing = {
			foo: 'foo',
			barbell: '',
		};
		const result = suggestMissingShortNames(existing);
		const golden = {
			barbell: 'b'
		};
		assert.deepEqual(result, golden);
	});

	it('handles basic object with longerName', async () => {
		const existing = {
			foo: 'f',
			barBazBoo: '',
		};
		const result = suggestMissingShortNames(existing);
		const golden = {
			barBazBoo: 'bBB',
		};
		assert.deepEqual(result, golden);
	});

	it('handles basic object with default conflict', async () => {
		const existing = {
			foo: 'f',
			min: '',
			max: '',
		};
		const result = suggestMissingShortNames(existing);
		const golden = {};
		assert.deepEqual(result, golden);
	});

	it('handles basic object with conflict with existing short name', async () => {
		const existing = {
			foo: 'm',
			min: '',
		};
		const result = suggestMissingShortNames(existing);
		const golden = {};
		assert.deepEqual(result, golden);
	});

	it('handles basic object with conflict with existing short name and pieces', async () => {
		const existing = {
			foo: 'mF',
			minFar: '',
		};
		const result = suggestMissingShortNames(existing);
		const golden = {
			minFar: 'minF'
		};
		assert.deepEqual(result, golden);
	});

	it('handles basic object with two candidates that will conflict', async () => {
		const existing = {
			foo: 'f',
			minFar: '',
			maxFar: '',
		};
		const result = suggestMissingShortNames(existing);
		const golden = {
			minFar: 'minF',
			maxFar: 'maxF',
		};
		assert.deepEqual(result, golden);
	});

	it('handles basic object with trhee candidates that will conflict', async () => {
		const existing = {
			foo: 'f',
			minFar: '',
			maxFar: '',
			modFan: ''
		};
		const result = suggestMissingShortNames(existing);
		const golden = {
			minFar: 'minF',
			maxFar: 'maxF',
			modFan: 'modF',
		};
		assert.deepEqual(result, golden);
	});

	it('handles basic object with underscore names', async () => {
		const existing = {
			foo: 'f',
			min_far: '',
			maxFar: '',
			modFan: ''
		};
		const result = suggestMissingShortNames(existing);
		const golden = {
			min_far: 'mf',
			maxFar: 'maxF',
			modFan: 'modF',
		};
		assert.deepEqual(result, golden);
	});

});

describe('optionsConfigWithDefaultedShortNames', () => {

	it('handles basic object', async () => {
		const options = {
			foobell: {
				example: true,
				shortName: 'f',
			},
			barbell: {
				example: true,
			}
		};
		//Verify that the optionsConfigWithDefaultedShortNames doesn't modify it
		deepFreeze(options);
		const result = optionsConfigWithDefaultedShortNames(options);
		const golden = {
			foobell: {
				example: true,
				shortName: 'f',
			},
			barbell: {
				example: true,
				shortName: 'b',
			}
		};
		assert.deepEqual(result, golden);
	});

	it('handles basic object nested', async () => {
		const options = {
			foobell: {
				example: true,
				shortName: 'f',
			},
			barbell: {
				example: {
					fooBar: {
						example: true,
					},
					foodBar: {
						example: true,
					}
				}
			}
		};
		//Verify that the optionsConfigWithDefaultedShortNames doesn't modify it
		deepFreeze(options);
		const result = optionsConfigWithDefaultedShortNames(options);
		const golden = {
			foobell: {
				example: true,
				shortName: 'f',
			},
			barbell: {
				example: {
					fooBar: {
						example: true,
						shortName: 'fooB',
					},
					foodBar: {
						example: true,
						shortName: 'foodB',
					}
				},
				shortName: 'b',
			}
		};
		assert.deepEqual(result, golden);
	});

	it('handles basic object with array', async () => {
		const options = {
			foobell: {
				example: true,
				shortName: 'f',
			},
			barbell: {
				example: [
					{
						fooBar: {
							example: true,
						},
						foodBar: {
							example: true,
						}
					}
				]
			}
		};
		//Verify that the optionsConfigWithDefaultedShortNames doesn't modify it
		deepFreeze(options);
		const result = optionsConfigWithDefaultedShortNames(options);
		const golden = {
			foobell: {
				example: true,
				shortName: 'f',
			},
			barbell: {
				example: [
					{
						fooBar: {
							example: true,
							shortName: 'fooB',
						},
						foodBar: {
							example: true,
							shortName: 'foodB'
						}
					}
				],
				shortName: 'b',
			}
		};
		assert.deepEqual(result, golden);
	});

});