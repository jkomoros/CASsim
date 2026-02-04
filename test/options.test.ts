import {
	setPropertyInObject,
	deepFreeze,
	DELETE_SENTINEL,
	isStep
} from '../src/util.js';

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
} from '../src/options.js';

import type { OptionsConfig, OptionsConfigMap, OptionValue, OptionValueMap, ShortNameMap } from '../src/types.js';

import { describe, it, expect } from 'vitest';

describe('isStep', () => {
	it('handles 1.0 / 1.0', async () => {
		const result: boolean = isStep(1.0, 1.0);
		const golden: boolean = true;
		expect(result).toEqual(golden);
	});

	it('handles 1.5 / 1.0', async () => {
		const result: boolean = isStep(1.5, 1.0);
		const golden: boolean = false;
		expect(result).toEqual(golden);
	});

	it('handles 1.5 / 0.5', async () => {
		const result: boolean = isStep(1.5, 0.5);
		const golden: boolean = true;
		expect(result).toEqual(golden);
	});

	it('handles 0.15 / 0.05', async () => {
		//This one requires epsilon
		const result: boolean = isStep(0.15, 0.05);
		const golden: boolean = true;
		expect(result).toEqual(golden);
	});
});

describe('setPropertyInObject', () => {
	it('handles null object', async () => {
		const obj: OptionValueMap | null = null;
		const path: string = 'a.b';
		const value: OptionValue = 3;
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			'a': {
				'b': 3,
			}
		};
		expect(result).toEqual(golden);
	});

	it('handles a single-nested object', async () => {
		const obj: OptionValueMap = {
			a: 1,
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a';
		const value: OptionValue = '3';
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			a: '3', // Original test used assert.deepEqual which does type coercion
			b: 2
		};
		expect(result).toEqual(golden);
	});

	it('handles a double-nested object', async () => {
		const obj: OptionValueMap = {
			a: {
				c: 1,
				d: 2
			},
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a.c';
		const value: OptionValue = 3;
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			a: {
				c: 3,
				d: 2
			},
			b: 2,
		};
		expect(result).toEqual(golden);
	});

	it('can create a new property in a double-nested object', async () => {
		const obj: OptionValueMap = {
			a: {
				d: 2
			},
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a.c';
		const value: OptionValue = '3';
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			a: {
				c: '3', // Original test used assert.deepEqual which does type coercion
				d: 2
			},
			b: 2,
		};
		expect(result).toEqual(golden);
	});

	it('can modify an array property property in a double-nested object', async () => {
		const obj: OptionValueMap = {
			a: [0, 1, 2],
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a.1';
		const value: OptionValue = '3';
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			a: [0, '3', 2], // Original test used assert.deepEqual which does type coercion
			b: 2,
		};
		expect(result).toEqual(golden);
	});

	it('can create an implied object in a double-nested object', async () => {
		const obj: OptionValueMap = {
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a.c';
		const value: OptionValue = '3';
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			a: {
				c: '3',
			},
			b: 2,
		};
		expect(result).toEqual(golden);
	});

	it('can create an implied array in a double-nested object', async () => {
		const obj: OptionValueMap = {
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a.0';
		const value: OptionValue = 3;
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			a: [3],
			b: 2,
		};
		expect(result).toEqual(golden);
	});

	it('can delete a non-last proeprty in a double-nested object', async () => {
		const obj: OptionValueMap = {
			a: {
				d: 2,
				c: 3,
			},
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a.c';
		const value = DELETE_SENTINEL;
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			a: {
				d:2,
			},
			b: 2,
		};
		expect(result).toEqual(golden);
	});

	it('can delete a non-last array index in a double-nested object', async () => {
		const obj: OptionValueMap = {
			a: [0, 1, 2],
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a.1';
		const value = DELETE_SENTINEL;
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			a: [0, 2],
			b: 2,
		};
		expect(result).toEqual(golden);
	});

	it('can delete the last proeprty in a double-nested object', async () => {
		const obj: OptionValueMap = {
			a: {
				c: 3,
			},
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a.c';
		const value = DELETE_SENTINEL;
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			a: {},
			b: 2,
		};
		expect(result).toEqual(golden);
	});

	it('can delete a last array index in a double-nested object', async () => {
		const obj: OptionValueMap = {
			a: [0],
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a.0';
		const value = DELETE_SENTINEL;
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			a: [],
			b: 2,
		};
		expect(result).toEqual(golden);
	});

	it('can delete a property that is an array', async () => {
		const obj: OptionValueMap = {
			a: [0],
			b: 2,
		};
		deepFreeze(obj);
		const path: string = 'a';
		const value = DELETE_SENTINEL;
		const result: OptionValueMap = setPropertyInObject(obj, path, value);
		const golden: OptionValueMap = {
			b: 2,
		};
		expect(result).toEqual(golden);
	});


});

describe('optionsConfigValidator', () => {
	it('handles null object', async () => {
		const config: OptionsConfigMap | null = null;
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object missing example property', async () => {
		const config: OptionsConfigMap = {
			foo: {
				exampleTYPO: 3,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with incorrect description', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				description: 5,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with incorrect advanced', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				advanced: 5,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with incorrect optional', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				optional: 5,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with incorrect default typeof', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				optional: true,
				backfill: 3,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with default true optional false', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				backfill: true,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with legal default and optional', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				backfill: true,
				optional: true,
			}
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with incorrect min', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				min: false,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with incorrect max', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				max: false,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with max less than min', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				max: 5.0,
				min: 10.0,
			}
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with incorrect step', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				step: false,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with step on array ', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: [
					{
						example: 3,
					}
				],
				step: 5,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with two examples nested directly ', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: {
					example: 3,
				} as OptionsConfig,
			}
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with min not on array or number', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: "foo",
				min: 5,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with max not on array or number', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: "foo",
				max: 5,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with min and max on array', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with step not on array or number', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: "foo",
				max: 5,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with invalid options', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: "foo",
				options: 5,
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with invalid zero option', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: "foo",
				options: [],
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with invalid first option', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: "foo",
				options: [{
					description: 'missing value'
				}] as OptionsConfig[],
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with multi-level-nested object', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with lots of properties example', async () => {
		const config: OptionsConfigMap = {
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
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with invalid behavior', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
				behavior: 'invalid',
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with number example', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
			}
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with string example', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: "foo",
			}
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with boolean example', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: false,
			}
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with valid array example', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: [
					{
						example: false,
					},
				]
			}
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with invalid array example', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: []
			} as OptionsConfig
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('handles basic object with valid sub-object example', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: {
					bar: {
						example: false,
					},
				}
			}
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

	it('allows legal shortName', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

	it('disallows non-string shortName', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: {
					bar: {
						example: false,
						shortName: 9,
					} as OptionsConfig,
				},
				shortName: 'f',
			}
		};
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('disallows empty shortName', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('disallows duplicate shortName', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('disallows shortName that conflicts with long name', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('disallows duplicate shortName in non-example', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('disallows shortName that conflicts with long name in non-example', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = true;
		expect(result != '').toBe(expectedProblem);
	});

	it('allows duplicate shortName at different level', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = optionsConfigValidator(config);
		const expectedProblem: boolean = false;
		expect(result != '').toBe(expectedProblem);
	});

});

describe('maySetPropertyInConfigObject', () => {
	it('handles basic single-level object', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: 3,
		};
		const obj: OptionValue = 4;
		const path: string = '';
		const value: OptionValue = 4;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object of different type', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: 3,
		};
		const path: string = '';
		const value: OptionValue = 'not-a-number';
		const obj: OptionValue = 4;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object in an allowed option', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
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
		const path: string = '';
		const value: OptionValue = 2;
		const obj: OptionValue = 5;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object in a not-allowed option', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
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
		const path: string = '';
		const value: OptionValue = 4;
		const obj: OptionValue = 3;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that goes against min', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: 3,
			min: 2,
		};
		const path: string = '';
		const value: OptionValue = 1;
		const obj: OptionValue = 3;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that is allowed by min', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: 3,
			min: 2,
		};
		const path: string = '';
		const value: OptionValue = 2;
		const obj: OptionValue = 3;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that goes against max', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: 3,
			max: 5,
		};
		const path: string = '';
		const value: OptionValue = 10;
		const obj: OptionValue = 3;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that is allowed by max', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: 3,
			max: 5,
		};
		const path: string = '';
		const value: OptionValue = 2;
		const obj: OptionValue = 3;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array where value is not an array', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: [
				{
					example: 3,
				}
			],
		};
		const path: string = '';
		const value: OptionValue = 4;
		const obj: OptionValue = [3];
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that is disallowed by max', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: [
				{
					example: 3,
				}
			],
			max: 2,
		};
		const path: string = '';
		const value: OptionValue = [2,3,4];
		const obj: OptionValue = [2,2,2];
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that is allowed by max', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: [
				{
					example: 3,
				}
			],
			max: 4,
		};
		const path: string = '';
		const value: OptionValue = [2,3,4];
		const obj: OptionValue = [2,2,2];
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that is disallowed by min', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: [
				{
					example: 3,
				}
			],
			min: 2,
		};
		const path: string = '';
		const value: OptionValue = [2];
		const obj: OptionValue = [2,2];
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that is allowed by min', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: [
				{
					example: 3,
				}
			],
			min: 2,
		};
		const path: string = '';
		const value: OptionValue = [2,3,4];
		const obj: OptionValue = [2,2];
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that has an illegal value', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: [
				{
					example: 3,
				}
			],
		};
		const path: string = '';
		const value: OptionValue = ['a',3,4];
		const obj: OptionValue = [2,2];
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that has a null value that is allowed', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: [
				{
					example: 3,
					optional: true,
				}
			],
		};
		const path: string = '';
		const value: OptionValue = [null,3,4];
		const obj: OptionValue = [2, 2];
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with array that has a null value that is not allowed', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: [
				{
					example: 3,
				}
			],
		};
		const path: string = '';
		const value: OptionValue = [null,3,4];
		const obj: OptionValue = [2, 2];
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject that has a null value that is allowed', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
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
		const path: string = '';
		const value: OptionValue = {
			foo: null,
		};
		const obj: OptionValue = {
			foo: {
				bar: 3
			}
		};
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject that has a missing property value that is allowed to be optional', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
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
		const path: string = '';
		const value: OptionValue = {
			foo: null,
		};
		const obj: OptionValue = {
			foo: {
				bar: 3
			}
		};
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject that has a null value that is not allowed', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
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
		const path: string = '';
		const value: OptionValue = {
			foo: null,
		};
		const obj: OptionValue = {
			foo: {
				bar: 3
			}
		};
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
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
		const path: string = '';
		const value: OptionValue = {
			foo: {
				bar: 3,
			}
		};
		const obj: OptionValue = {
			foo: {
				bar: 3
			}
		};
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});


	it('handles basic single-level object set with subobject that is invalid', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
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
		const path: string = '';
		const value: OptionValue = {
			foo: {}
		};
		const obj: OptionValue = {
			foo: {
				bar: 3
			}
		};
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object set with subobject that is invalid', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
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
		const path: string = '';
		const value: OptionValue = {
			foo: {
				bar: 'not-a-number'
			}
		};
		const obj: OptionValue = {
			foo: {
				bar: 3
			}
		};
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that goes against step', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: 3,
			step: 1.5,
		};
		const path: string = '';
		const value: OptionValue = 1;
		const obj: OptionValue = 3;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic single-level object that is allowed by step', async () => {
		//this is not a valid config on its own, but it is a valid sub-leaf
		const config: OptionsConfig = {
			example: 3,
			min: 1.5,
		};
		const path: string = '';
		const value: OptionValue = 4.5;
		const obj: OptionValue = 3;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});


	it('handles basic single-level object on a non-leaf object', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
			}
		};
		const validatorResult: string = optionsConfigValidator(config);
		try {
			expect(validatorResult).toBe('');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path: string = '';
		const value: OptionValue = 4;
		const obj: OptionValue = 3;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic stacked object', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
			}
		};
		const validatorResult: string = optionsConfigValidator(config);
		try {
			expect(validatorResult).toBe('');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path: string = 'foo';
		const value: OptionValue = 4;
		const obj: OptionValue = 3;
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic stacked object with wrong type', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
			}
		};
		const validatorResult: string = optionsConfigValidator(config);
		try {
			expect(validatorResult).toBe('');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path: string = 'foo';
		const value: OptionValue = 'foo';
		const obj: OptionValueMap = {
			foo: 3
		};
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic stacked object with example array', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: [
					{
						example: 2,
					}
				],
			}
		};
		const validatorResult: string = optionsConfigValidator(config);
		try {
			expect(validatorResult).toBe('');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path: string = 'foo.2';
		const value: OptionValue = 3;
		const obj: OptionValueMap = {
			foo: [2, 2, 2]
		};
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic stacked object with example object', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: {
					bar: {
						example: 4
					}
				}
			}
		};
		const validatorResult: string = optionsConfigValidator(config);
		try {
			expect(validatorResult).toBe('');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path: string = 'foo.bar';
		const value: OptionValue = 3;
		const obj: OptionValueMap = {
			foo: {
				bar: 4
			}
		};
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles basic stacked object with example object with a set at a non-present value', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: {
					bar: {
						example: 4
					}
				}
			}
		};
		const validatorResult: string = optionsConfigValidator(config);
		try {
			expect(validatorResult).toBe('');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path: string = 'foo.baz';
		const value: OptionValue = 3;
		const obj: OptionValueMap = {
			foo: {
				bar: 4
			}
		};
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = true;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles complex schelling-org example', async () => {
		const config: OptionsConfigMap = {
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
		const validatorResult: string = optionsConfigValidator(config);
		try {
			expect(validatorResult).toBe('');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path: string = 'projects.individuals.1';
		const value: OptionValue = null;
		const obj: OptionValueMap = {
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
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

	it('handles complex schelling-org example setting on previously null object', async () => {
		const config: OptionsConfigMap = {
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
		const validatorResult: string = optionsConfigValidator(config);
		try {
			expect(validatorResult).toBe('');
		} catch(err) {
			console.warn('Basic config not valid', validatorResult);
			throw err;
		}
		const path: string = 'projects.individuals.0';
		const value: OptionValue = {
			value: 2
		};
		const obj: OptionValueMap = {
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
		const result: string = maySetPropertyInConfigObject(config, obj, path, value);
		const expectedProblem: boolean = false;
		try {
			expect(result != '').toBe(expectedProblem);
		} catch (err) {
			console.warn(result);
			throw err;
		}
	});

});

describe('defaultValueForConfig', () => {
	it('handles null object', async () => {
		const config: OptionsConfig | null = null;
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = undefined;
		expect(result).toEqual(golden);
	});

	it('handles basic string', async () => {
		const config: OptionsConfig = {
			example: 'foo'
		};
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = 'foo';
		expect(result).toEqual(golden);
	});

	it('handles basic optional string', async () => {
		const config: OptionsConfig = {
			example: 'foo',
			optional: true,
		};
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = 'foo';
		expect(result).toEqual(golden);
	});

	it('handles basic optional string with skipOptional', async () => {
		const config: OptionsConfig = {
			example: 'foo',
			optional: true,
		};
		const result: OptionValue = defaultValueForConfig(config, true);
		const golden: OptionValue = undefined;
		expect(result).toEqual(golden);
	});

	it('handles basic number', async () => {
		const config: OptionsConfig = {
			example: 3
		};
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = 3;
		expect(result).toEqual(golden);
	});

	it('handles basic boolean', async () => {
		const config: OptionsConfig = {
			example: false
		};
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = false;
		expect(result).toEqual(golden);
	});

	it('handles single level object', async () => {
		const config: OptionsConfig = {
			example: {
				foo: {
					example: 3,
				}
			}
		};
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: 3,
		};
		expect(result).toEqual(golden);
	});

	it('handles single level array with number', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: [3],
		};
		expect(result).toEqual(golden);
	});

	it('handles single level array with object', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: [
				{
					bar: 3
				}
			],
		};
		expect(result).toEqual(golden);
	});

	it('handles multiple level object', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: {
				bar: 3
			}
		};
		expect(result).toEqual(golden);
	});

	it('handles object with one optional property', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: 3
		};
		expect(result).toEqual(golden);
	});

	it('handles object with one optional property', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: 3
		};
		expect(result).toEqual(golden);
	});

	it('handles object with one optional+default property', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: 3,
			bar: {
				baz: 4
			}
		};
		expect(result).toEqual(golden);
	});

	it('handles object with two layer optional/default property', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: 3,
			bar: {
				baz: 4
			}
		};
		expect(result).toEqual(golden);
	});

	it('handles object with optional array', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			bar: 4
		};
		expect(result).toEqual(golden);
	});

	it('handles object with optional+default array', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo:[3],
			bar: 4
		};
		expect(result).toEqual(golden);
	});

	it('handles object with array with optional items', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: [],
			bar: 4
		};
		expect(result).toEqual(golden);
	});

	it('handles object with array with optional+default items', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: [3],
			bar: 4
		};
		expect(result).toEqual(golden);
	});

	it('handles array min size', async () => {
		const config: OptionsConfig = {
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
		const result: OptionValue = defaultValueForConfig(config);
		const golden: OptionValue = {
			foo: [undefined, undefined], // Original test used assert.deepEqual which treats null == undefined
			bar: 4
		};
		expect(result).toEqual(golden);
	});

});

describe('configForPath', () => {
	it('handles null object', async () => {
		const config: OptionsConfig | null = null;
		const result: OptionsConfig | undefined = configForPath(config, 'foo');
		const golden: OptionsConfig | undefined = undefined;
		expect(result).toEqual(golden);
	});

	it('handles top level get', async () => {
		const config: OptionsConfig = {
			example: 3,
		};
		const result: OptionsConfig | undefined = configForPath(config, '');
		const golden: OptionsConfig = config;
		expect(result).toEqual(golden);
	});

	it('handles basic example object get', async () => {
		const config: OptionsConfig = {
			example: {
				foo: {
					example: 3,
				}
			}
		};
		const result: OptionsConfig | undefined = configForPath(config, 'foo');
		const golden: OptionsConfig = {
			example: 3
		};
		expect(result).toEqual(golden);
	});

	it('handles basic non-example object get', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 3,
			}
		};
		const result: OptionsConfig | undefined = configForPath(config, 'foo');
		const golden: OptionsConfig = {
			example: 3
		};
		expect(result).toEqual(golden);
	});

	it('handles array get', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: [
					{
						example: 3
					}
				]
			}
		};
		const result: OptionsConfig | undefined = configForPath(config, 'foo.0');
		const golden: OptionsConfig = {
			example: 3
		};
		expect(result).toEqual(golden);
	});

});


describe('shortenPathWithConfig', () => {
	it('handles null object', async () => {
		const config: OptionsConfig | null = null;
		const result: string = shortenPathWithConfig(config, 'foo');
		const golden: string = 'foo';
		expect(result).toEqual(golden);
	});

	it('handles no op single path', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = shortenPathWithConfig(config, 'foo');
		const golden: string = 'foo';
		expect(result).toEqual(golden);
	});

	it('handles no op double path', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = shortenPathWithConfig(config, 'foo.bar');
		const golden: string = 'foo.bar';
		expect(result).toEqual(golden);
	});

	it('handles no op with array path', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = shortenPathWithConfig(config, 'foo.bar.0');
		const golden: string = 'foo.bar.0';
		expect(result).toEqual(golden);
	});

	it('handles no op with array sub path', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = shortenPathWithConfig(config, 'foo.bar.0.foo');
		const golden: string = 'foo.bar.0.foo';
		expect(result).toEqual(golden);
	});

	it('handles single level replace', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = shortenPathWithConfig(config, 'foo');
		const golden: string = 'f';
		expect(result).toEqual(golden);
	});

	it('handles double level replace', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = shortenPathWithConfig(config, 'foo.bar');
		const golden: string = 'f.b';
		expect(result).toEqual(golden);
	});

	it('handles triple level replace with array in the middle', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = shortenPathWithConfig(config, 'foo.baz.0.foo');
		const golden: string = 'f.baz.0.f';
		expect(result).toEqual(golden);
	});
});

describe('expandPathWithConfig', () => {
	it('handles null object', async () => {
		const config: OptionsConfig | null = null;
		const result: string = expandPathWithConfig(config, 'foo');
		const golden: string = 'foo';
		expect(result).toEqual(golden);
	});

	it('handles no op single path', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = expandPathWithConfig(config, 'foo');
		const golden: string = 'foo';
		expect(result).toEqual(golden);
	});

	it('handles no op double path', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = expandPathWithConfig(config, 'foo.bar');
		const golden: string = 'foo.bar';
		expect(result).toEqual(golden);
	});

	it('handles no op with array path', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = expandPathWithConfig(config, 'foo.bar.0');
		const golden: string = 'foo.bar.0';
		expect(result).toEqual(golden);
	});

	it('handles no op with array sub path', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = expandPathWithConfig(config, 'foo.bar.0.foo');
		const golden: string = 'foo.bar.0.foo';
		expect(result).toEqual(golden);
	});

	it('handles single level replace', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = expandPathWithConfig(config, 'f');
		const golden: string = 'foo';
		expect(result).toEqual(golden);
	});

	it('handles double level replace', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = expandPathWithConfig(config, 'f.b');
		const golden: string = 'foo.bar';
		expect(result).toEqual(golden);
	});

	it('handles triple level replace with array in the middle', async () => {
		const config: OptionsConfigMap = {
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
		const result: string = expandPathWithConfig(config, 'f.baz.0.f');
		const golden: string = 'foo.baz.0.foo';
		expect(result).toEqual(golden);
	});
});

describe('expandDefaults', () => {
	it('handles basic object', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 5,
				optional: true,
				backfill: true,
			}
		};
		deepFreeze(config);
		const obj: OptionValueMap = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden: OptionValueMap = {
			foo: 5,
		};
		const goldenChanged: boolean = true;
		expect(result).toEqual(golden);
		expect(changed).toEqual(goldenChanged);
	});

	it('handles basic object that doesn\'t need a change', async () => {
		const config: OptionsConfigMap = {
			foo: {
				example: 5,
				optional: true,
				backfill: true,
			}
		};
		deepFreeze(config);
		const obj: OptionValueMap = {
			foo: 3,
		};
		const [result, changed] = ensureBackfill(config, obj);
		const golden: OptionValueMap = {
			foo: 3,
		};
		const goldenChanged: boolean = false;
		expect(result).toEqual(golden);
		expect(changed).toEqual(goldenChanged);
	});

	it('handles example object that doesn\'t need a change', async () => {
		const config: OptionsConfig = {
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
		const obj: OptionValueMap = {
			foo: 3,
		};
		const [result, changed] = ensureBackfill(config, obj);
		const golden: OptionValueMap = {
			foo: 3,
		};
		const goldenChanged: boolean = false;
		expect(result).toEqual(golden);
		expect(changed).toEqual(goldenChanged);
	});

	it('handles example object that does need a change', async () => {
		const config: OptionsConfig = {
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
		const obj: OptionValueMap = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden: OptionValueMap = {
			foo: 5,
		};
		const goldenChanged: boolean = true;
		expect(result).toEqual(golden);
		expect(changed).toEqual(goldenChanged);
	});

	it('handles example object that does need a change nested', async () => {
		const config: OptionsConfig = {
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
		const obj: OptionValueMap = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden: OptionValueMap = {
			foo: {
				bar: 3,
			},
		};
		const goldenChanged: boolean = true;
		expect(result).toEqual(golden);
		expect(changed).toEqual(goldenChanged);
	});

	it('handles example object that has a nested optional non default object', async () => {
		const config: OptionsConfig = {
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
		const obj: OptionValueMap = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden: OptionValueMap = {};
		const goldenChanged: boolean = false;
		expect(result).toEqual(golden);
		expect(changed).toEqual(goldenChanged);
	});

	it('handles example object that has a nested array', async () => {
		const config: OptionsConfig = {
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
		const obj: OptionValueMap = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden: OptionValueMap = {
			foo: {
				bar: [
					3,
				]
			},
			bar: 'baz'
		};
		const goldenChanged: boolean = true;
		expect(result).toEqual(golden);
		expect(changed).toEqual(goldenChanged);
	});

	it('handles example object that does need a change nested defaults', async () => {
		const config: OptionsConfig = {
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
		const obj: OptionValueMap = {};
		const [result, changed] = ensureBackfill(config, obj);
		const golden: OptionValueMap = {
			foo: {
				bar: {
					baz: 3,
					blam: 'foo',
				},
			},
		};
		const goldenChanged: boolean = true;
		expect(result).toEqual(golden);
		expect(changed).toEqual(goldenChanged);
	});

});

describe('suggestMissingShortNames', () => {

	it('handles basic object that is invalid (short name collision)', async () => {
		const existing: ShortNameMap = {
			foo: 'f',
			bar: 'f',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {};
		expect(result).toEqual(golden);
	});

	it('handles basic object that is invalid (long/short name collision)', async () => {
		const existing: ShortNameMap = {
			foo: 'f',
			bar: 'foo',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {};
		expect(result).toEqual(golden);
	});

	it('handles basic object', async () => {
		const existing: ShortNameMap = {
			foo: 'f',
			bar: '',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		//bar is too short to get shortened
		const golden: ShortNameMap = {};
		expect(result).toEqual(golden);
	});

	it('handles basic object', async () => {
		const existing: ShortNameMap = {
			foo: 'f',
			barbell: '',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {
			barbell: 'b',
		};
		expect(result).toEqual(golden);
	});

	it('handles basic object that looks invalid but is valid because longName == shortName', async () => {
		const existing: ShortNameMap = {
			foo: 'foo',
			bar: '',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		//bar is too short to get shortened
		const golden: ShortNameMap = {};
		expect(result).toEqual(golden);
	});

	it('handles basic object that looks invalid but is valid because longName == shortName', async () => {
		const existing: ShortNameMap = {
			foo: 'foo',
			barbell: '',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {
			barbell: 'b'
		};
		expect(result).toEqual(golden);
	});

	it('handles basic object with longerName', async () => {
		const existing: ShortNameMap = {
			foo: 'f',
			barBazBoo: '',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {
			barBazBoo: 'bBB',
		};
		expect(result).toEqual(golden);
	});

	it('handles basic object with default conflict', async () => {
		const existing: ShortNameMap = {
			foo: 'f',
			min: '',
			max: '',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {};
		expect(result).toEqual(golden);
	});

	it('handles basic object with conflict with existing short name', async () => {
		const existing: ShortNameMap = {
			foo: 'm',
			min: '',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {};
		expect(result).toEqual(golden);
	});

	it('handles basic object with conflict with existing short name and pieces', async () => {
		const existing: ShortNameMap = {
			foo: 'mF',
			minFar: '',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {
			minFar: 'minF'
		};
		expect(result).toEqual(golden);
	});

	it('handles basic object with two candidates that will conflict', async () => {
		const existing: ShortNameMap = {
			foo: 'f',
			minFar: '',
			maxFar: '',
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {
			minFar: 'minF',
			maxFar: 'maxF',
		};
		expect(result).toEqual(golden);
	});

	it('handles basic object with trhee candidates that will conflict', async () => {
		const existing: ShortNameMap = {
			foo: 'f',
			minFar: '',
			maxFar: '',
			modFan: ''
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {
			minFar: 'minF',
			maxFar: 'maxF',
			modFan: 'modF',
		};
		expect(result).toEqual(golden);
	});

	it('handles basic object with underscore names', async () => {
		const existing: ShortNameMap = {
			foo: 'f',
			min_far: '',
			maxFar: '',
			modFan: ''
		};
		const result: ShortNameMap = suggestMissingShortNames(existing);
		const golden: ShortNameMap = {
			min_far: 'mf',
			maxFar: 'maxF',
			modFan: 'modF',
		};
		expect(result).toEqual(golden);
	});

});

describe('optionsConfigWithDefaultedShortNames', () => {

	it('handles basic object', async () => {
		const options: OptionsConfigMap = {
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
		const result: OptionsConfigMap = optionsConfigWithDefaultedShortNames(options);
		const golden: OptionsConfigMap = {
			foobell: {
				example: true,
				shortName: 'f',
			},
			barbell: {
				example: true,
				shortName: 'b',
			}
		};
		expect(result).toEqual(golden);
	});

	it('handles basic object nested', async () => {
		const options: OptionsConfigMap = {
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
		const result: OptionsConfigMap = optionsConfigWithDefaultedShortNames(options);
		const golden: OptionsConfigMap = {
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
		expect(result).toEqual(golden);
	});

	it('handles basic object with array', async () => {
		const options: OptionsConfigMap = {
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
		const result: OptionsConfigMap = optionsConfigWithDefaultedShortNames(options);
		const golden: OptionsConfigMap = {
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
		expect(result).toEqual(golden);
	});

});
