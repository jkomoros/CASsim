import {
	DistributionOptions,
	OptionsConfig,
	RandomGenerator
} from './types.js';

export const ROUND_TYPE_NONE = '';
export const ROUND_TYPE_ROUND = 'round';
export const ROUND_TYPE_FLOOR = 'floor';

const LEGAL_ROUND_TYPES = {
	[ROUND_TYPE_NONE]: true,
	[ROUND_TYPE_ROUND]: true,
	[ROUND_TYPE_FLOOR]: true,
};

export const LINEAR = 'linear';
export const NORMAL = 'normal';
export const MIN_MAX = 'min-max';
export const FIXED = 'fixed';

const LEGAL_TYPES = {
	[LINEAR]: 'A linear distribution between average +/- spread',
	[NORMAL]: 'A normal distributino with mean of average and standard deviation of spread',
	[MIN_MAX]: 'A linear distribution between min and max',
	[FIXED]: 'A distribution that always returns precisely average with no variation',
};

//sum sums up the array of numbers passed to it
export const sum = (nums : number[]) : number => nums.reduce((a, b) => a + b, 0);
//mean is the arithmetic mean of the array of numbers passed to it.
export const mean = (nums: number[]) : number => nums.length == 0 ? 0 : sum(nums) / nums.length;
//median is the median number in the distribution of the array of numbers passed to it.
export const median = (nums : number[]) : number => {
	if (nums.length == 0) return 0;
	nums = [...nums];
	nums.sort();
	return nums[Math.floor(nums.length / 2)];
};
//mode returns the mode of array of nums
export const mode = (nums : number[]) : number => {
	if (nums.length == 0) return 0;
	const m = new Map();
	nums.forEach(num => m.set(num, (m.get(num) || 0) + 1));
	let maxKey = nums[0];
	let maxVal = -1;
	for (const [key, val] of m.entries()) {
		if (val > maxVal) {
			maxKey = key;
			maxVal = val;
		}
	}
	return maxKey;
};

const gaussianRandom = (mean : number, std : number, rnd : RandomGenerator = Math.random) => {
	//https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
	const u1 = rnd();
	const u2 = rnd();
	const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(Math.PI * 2 * u2);
	return z0 * std + mean;
};

/*

This package defines convenience methods for allowing the user to specify a distribution of values.

You typically use it in your simulator by in the top-level of your function defining a global:
```
const performanceQuality = LinearDistributionConfig({average: 0.5, description: 'The overall quality of the performance'})
```

(See DistributionConfig's constructor packagedoc for options that can be passed to any config constructor)

Then, in your simulator's optionsConfig, for that value, you emit:

```
	{
		//... Other things precede
		performanceQuality: performanceQuality.optionsConfig
	}
```

Then to actually use it, you pass in the simOptions property and call sample:

```
const value = performanceQuality.distibution(simOptions.performanceQuality).sample(rnd);
```

*/

//Get a new one from DistributionConfig.distribution()
class Distribution {

	_options : DistributionOptions;

	constructor(options : DistributionOptions = {}) {
		//Already validated by DistributionConfig.
		this._options = options;
	}

	sample(rnd : RandomGenerator = Math.random) : number {
		//TODO: do different things based on type;
		let max = this._options.limitMax;
		let min = this._options.limitMin;
		switch (this._options.distribution) {
		case MIN_MAX:
			max = this._options.max;
			min = this._options.min;
			break;
		case LINEAR:
		default:
			max = this._options.average + this._options.spread;
			min = this._options.average - this._options.spread;
			break;
		}

		let value = this._options.average;
		if (this._options.distribution == NORMAL) {
			value = gaussianRandom(this._options.average, this._options.spread, rnd);
		}
		if (this._options.distribution != FIXED) {
			value = (max - min) * rnd() + min;
		}

		if (value < this._options.limitMin) value = this._options.limitMin;
		if (value > this._options.limitMax) value = this._options.limitMax;

		switch(this._options.round) {
		case ROUND_TYPE_ROUND:
			value = Math.round(value);
			break;
		case ROUND_TYPE_FLOOR:
			value = Math.floor(value);
			break;
		case ROUND_TYPE_NONE:
		default:
			//no op
		}

		return value;
	}
}

const EXAMPLE_OPTIONS = {
	types: [...Object.keys(LEGAL_TYPES)],
	distribution: LINEAR,
	average: 0.5,
	spread: 0.0,
	min: 0.0,
	max: 1.0,
	limitMin: 0.0,
	limitMax: 1.0,
	step: 0.01,
	round: ROUND_TYPE_NONE,
	default: false,
	name: 'value',
	shortName: '',
	description: 'A value with a ' + LINEAR + ' distribution',
};

/*
	options includes:
	- types: an array of allowed distribution types (e.g. LINEAR, MIN_MAX). If not provided, will default to [type]. If neith types nor type is provided, all distribution types are allowed.
	- distribution: the default type
	- average: the default average value if type = LINEAR
	- spread: the spread value if type = LINEAR
	- min: the lower value if type = MIN_MAX. Defaults to limitMin.
	- max: the upper value if type = MIN_MAX. Defaults to limitMax.
	- limitMin: the clip value. If the final sample is below this value it will be clipped to this. Defaults to 0.0.
	- limitMax: the clip value. If the final sample is abvove this value it will be clipped to this. Defaults to 1.0.
	- step: defaults to 0.01
	- round: if the final generated number should be rounded. legal values are '', 'round', floor'.
	- default: if ture, then the optionsConfig for the overall distributionObject will have default set to true.
	- description: A description for the overall value
	- shortName: the shortName to be returned in optionsConfig.
	- name: a name for the overall value
*/
export class DistributionConfig {

	_options : DistributionOptions;

	constructor(options : DistributionOptions = {}) {
		const normalizedOptions = {
			...EXAMPLE_OPTIONS,
			...options,
		};
		normalizedOptions.types = options.types || (options.distribution ? [options.distribution] : EXAMPLE_OPTIONS.types);
		normalizedOptions.distribution = options.distribution || normalizedOptions.types[0];
		normalizedOptions.shortName = options.shortName || '';
		normalizedOptions.description = options.description === undefined ? 'A value with a ' + normalizedOptions.distribution + ' distribution' : options.description;
		normalizedOptions.min = options.min === undefined ? normalizedOptions.limitMin : options.min;
		normalizedOptions.max = options.max === undefined ? normalizedOptions.limitMax : options.max;

		//Validate
		this._validateOptions(normalizedOptions);

		this._options = normalizedOptions;
	}

	get options() {
		return this._options;
	}

	get optionsConfig() : OptionsConfig {

		const example = {};

		const includedTypes = Object.fromEntries(this._options.types.map(type => [type, true]));

		if (includedTypes[LINEAR] || includedTypes[NORMAL] || includedTypes[FIXED]) {
			const includesOtherTypes = includedTypes[MIN_MAX];
			example.average = {
				example: this._options.average,
				min: this._options.limitMin,
				max: this._options.limitMax,
				step: this._options.step,
				backfill: includesOtherTypes,
				optional: includesOtherTypes,
				default: includesOtherTypes,
				hide: values => values.distribution && values.distribution == MIN_MAX,
				shortName: 'a',
				description: 'The average value for ' + this._options.name + '.' + (includesOtherTypes ? ' Only for types ' + LINEAR + ', ' + FIXED + ', and ' + NORMAL : '')
			};
			example.spread = {
				example: this._options.spread,
				min: this._options.limitMin,
				max: this._options.limitMax,
				step: this._options.step,
				shortName: 's',
				hide: values => values.distribution && (values.distribution == MIN_MAX || values.distribution == FIXED),
				optional:true,
				backfill: true,
				default: true,
				description: 'The amount that ' + this._options.name + ' will be +/- of, or for ' + NORMAL + ' the standard deviation.' + (includesOtherTypes ? ' Only for types ' + LINEAR + ' and ' + NORMAL : '')
			};
		}

		if (includedTypes[MIN_MAX]) {
			const includesOtherTypes = Object.keys(includedTypes).length > 1;
			const hide = values => values.distribution && values.distribution != MIN_MAX;
			example.min = {
				example: this._options.min,
				min: this._options.limitMin,
				max: this._options.limitMax,
				step: this._options.step,
				//min is a fine shortName, don't specify one
				hide: hide,
				backfill: true,
				optional: true,
				default: true,
				description: 'The min bound for the sample for ' + this._options.name + '.' + (includesOtherTypes ? ' Only for distribution ' + MIN_MAX : '')
			};

			example.max = {
				example: this._options.max,
				min: this._options.limitMin,
				max: this._options.limitMax,
				step: this._options.step,
				//max is a fine shortName, don't specify one
				hide: hide,
				backfill: true,
				optional: true,
				default: true,
				description: 'The max bound for the sample for ' + this._options.name + '.' + (includesOtherTypes ? ' Only for distribution ' + MIN_MAX : '')
			};
		}

		if (this._options.types.length > 1) {
			example.distribution = {
				example: this._options.distribution,
				backfill: true,
				optional: true,
				default: true,
				shortName: 'd',
				description: 'The type of distribution for ' + this._options.name,
				options: this._options.types.map(type => ({value: type, description: LEGAL_TYPES[type]}))
			};
		}

		const result = {
			example: example,
			optional: true,
			default: this._options.default,
			backfill: true,
			description: this._options.description,
		};
		if (this._options.shortName) result.shortName = this._options.shortName;
		return result;
	}

	distribution(overrides = {}) {
		const options = {...this._options, ...overrides};
		this._validateOptions(options);
		return new Distribution(options);
	}

	_validateOptions(normalizedOptions) {
		for (const [key, value] of Object.entries(normalizedOptions)) {
			if (EXAMPLE_OPTIONS[key] === undefined) throw new Error('Unexpected option: ' + key);
			if (typeof value != typeof EXAMPLE_OPTIONS[key]) throw new Error(key + ' must be a ' + typeof EXAMPLE_OPTIONS[value]);
			if (Array.isArray(EXAMPLE_OPTIONS[key]) != Array.isArray(value)) throw new Error(key + ' must ' + (Array.isArray(EXAMPLE_OPTIONS[key]) ? '' : 'not') + ' be an Array');
		}
		if (normalizedOptions.min > normalizedOptions.max) throw new Error('min was greater than max');
		if (normalizedOptions.limitMin > normalizedOptions.limitMax) throw new Error('limitMin was greater than limitMax');
		if (!Object.keys(LEGAL_ROUND_TYPES).some(type => normalizedOptions.round === type)) throw new Error('round was not a legal value: \'' + normalizedOptions.round + '\'. Legal values are: ' + Object.keys(LEGAL_ROUND_TYPES).map(str => "'" + str + "'").join(', '));
		const seenTypes = {};
		for (const type of normalizedOptions.types) {
			if (!LEGAL_TYPES[type]) throw new Error(type + ' is not a legal type');
			if (seenTypes[type]) throw new Error(type + ' was duplicated in the list');
			seenTypes[type] = true;
		}
		if (!normalizedOptions.types.some(type => type == normalizedOptions.distribution)) throw new Error(normalizedOptions.distribution + ' was set as type but was not in types');
	}
}

export class LinearDistributionConfig extends DistributionConfig {
	constructor(options = {}) {
		super({...options, types: [LINEAR], distribution: LINEAR});
	}
}

export class MinMaxDistributionConfig extends DistributionConfig {
	constructor(options = {}) {
		super({...options, types: [MIN_MAX], distribution: MIN_MAX});
	}
}

export class NormalDistributionConfig extends DistributionConfig {
	constructor(options = {}) {
		super({...options, types: [NORMAL], distribution: NORMAL});
	}
}
