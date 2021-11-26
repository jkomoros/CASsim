/*eslint-env node*/

import {
	setPropertyInObject,
	deepFreeze,
	DELETE_SENTINEL
} from '../../src/util.js';

import {
	maySetPropertyInConfigObject,
	optionsConfigValidator
} from '../../src/options.js';

import assert from 'assert';

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
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object missing example property', async () => {
		const config = {
			foo: {
				exampleTYPO: 3,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with incorrect description', async () => {
		const config = {
			foo: {
				example: 3,
				description: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with incorrect advanced', async () => {
		const config = {
			foo: {
				example: 3,
				advanced: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with incorrect nullable', async () => {
		const config = {
			foo: {
				example: 3,
				nullable: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with incorrect min', async () => {
		const config = {
			foo: {
				example: 3,
				min: false,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with incorrect max', async () => {
		const config = {
			foo: {
				example: 3,
				max: false,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with incorrect step', async () => {
		const config = {
			foo: {
				example: 3,
				step: false,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with min not on array or number', async () => {
		const config = {
			foo: {
				example: "foo",
				min: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with max not on array or number', async () => {
		const config = {
			foo: {
				example: "foo",
				max: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with step not on array or number', async () => {
		const config = {
			foo: {
				example: "foo",
				max: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with invalid options', async () => {
		const config = {
			foo: {
				example: "foo",
				options: 5,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with invalid zero option', async () => {
		const config = {
			foo: {
				example: "foo",
				options: [],
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with lots of properties example', async () => {
		const config = {
			foo: {
				example: 3,
				description: '3 is an example',
				nullable: true,
				advanced: true,
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
		const expectedProblemLength = 0;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with number example', async () => {
		const config = {
			foo: {
				example: 3,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 0;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with string example', async () => {
		const config = {
			foo: {
				example: "foo",
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 0;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with boolean example', async () => {
		const config = {
			foo: {
				example: false,
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 0;
		assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		assert.strictEqual(result.length, expectedProblemLength);
	});

	it('handles basic object with invalid array example', async () => {
		const config = {
			foo: {
				example: []
			}
		};
		const result = optionsConfigValidator(config);
		const expectedProblemLength = 1;
		assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	/*
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
					nullable: true,
				}
			],
		};
		const path = '';
		const value = [null,3,4];
		const obj = [2, 2];
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
					nullable: true,
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject that has a missing property value that is allowed to be nullable', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config = {
			example: {
				foo: {
					example: {
						bar: {
							example: 3,
						}
					},
					nullable: true,
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
					nullable: false,
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	*/

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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
			assert.strictEqual(validatorResult.length, 0);
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path = '';
		const value = 4;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
			assert.strictEqual(validatorResult.length, 0);
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path = 'foo';
		const value = 4;
		const obj = 3;
		const result = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
			assert.strictEqual(validatorResult.length, 0);
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
		const expectedProblemLength = 1;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	/*

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
			assert.strictEqual(validatorResult.length, 0);
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
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
			assert.strictEqual(validatorResult.length, 0);
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
		const expectedProblemLength = 0;
		try {
			assert.strictEqual(result.length, expectedProblemLength);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	*/

});