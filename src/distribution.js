export const LINEAR = 'linear';
export const MIN_MAX = 'min-max';

const LEGAL_TYPES = {
	[LINEAR]: 'A linear distribution between average +/- spread',
	[MIN_MAX]: 'A linear distribution between min and max',
};

//Get a new one from DistributionConfig.distribution()
class Distribution {
	constructor(options = {}) {
		//Already validated by DistributionConfig.
		this._options = options;
	}

	sample(rnd = Math.random) {
		//TODO: do different things based on type;
		let max = this._options.limitMax;
		let min = this._options.limitMin;
		switch (this._options.type) {
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

		let value = (max - min) * rnd() + min;
		if (value < this._options.limitMin) value = this._options.limitMin;
		if (value > this._options.limitMax) value = this._options.limitMax;
		return value;
	}
}

const EXAMPLE_OPTIONS = {
	types: [LINEAR, MIN_MAX],
	type: LINEAR,
	average: 0.5,
	spread: 0.0,
	min: 0.0,
	max: 1.0,
	limitMin: 0.0,
	limitMax: 1.0,
	step: 0.01,
	name: 'value',
	shortName: 'value',
	description: 'A value with a ' + LINEAR + ' distribution',
};

/*
	options includes:
	- types: an array of allowed types (e.g. LINEAR, MIN_MAX)
	- type: the default type
	- average: the default average value if type = LINEAR
	- spread: the spread value if type = LINEAR
	- min: the lower value if type = MIN_MAX. Defaults to limitMin.
	- max: the upper value if type = MIN_MAX. Defaults to limitMax.
	- limitMin: the clip value. Defaults to 0.0.
	- limitMax: the clip value. Defaults to 1.0.
	- step: defaults to 0.01
	- description: A description for the overall value
	- name: a name for the overall value
*/
export class DistributionConfig {
	constructor(options = {}) {
		const normalizedOptions = {
			...EXAMPLE_OPTIONS,
			...options,
		};
		normalizedOptions.types = options.types || (options.type ? [options.type] : EXAMPLE_OPTIONS.types);
		normalizedOptions.type = options.type || normalizedOptions.types[0];
		normalizedOptions.shortName = options.shortName || normalizedOptions.name;
		normalizedOptions.description = options.description === undefined ? 'A value with a ' + normalizedOptions.type + ' distribution' : options.description;
		normalizedOptions.min = options.min === undefined ? normalizedOptions.limitMin : options.min;
		normalizedOptions.max = options.max === undefined ? normalizedOptions.limitMax : options.max;

		//Validate
		this._validateOptions(normalizedOptions);

		this._options = normalizedOptions;
	}

	get optionsConfig() {
		const example = {};

		const includedTypes = Object.fromEntries(this._options.types.map(type => [type, true]));

		if (includedTypes[LINEAR]) {
			example.average = {
				example: this._options.average,
				min: this._options.limitMin,
				max: this._options.limitMax,
				step: this._options.step,
				shortName: 'a',
				description: 'The average value for ' + this._options.name + '.' + (includedTypes[MIN_MAX] ? ' Only for type ' + LINEAR : '')
			};
			example.spread = {
				example: this._options.spread,
				min: this._options.limitMin,
				max: this._options.limitMax,
				step: this._options.step,
				shortName: 's',
				optional:true,
				default: true,
				description: 'The amount that ' + this._options.name + ' will be +/- of.' + (includedTypes[MIN_MAX] ? ' Only for type ' + LINEAR : '')
			};
		}

		if (includedTypes[MIN_MAX]) {
			example.min = {
				example: this._options.min,
				min: this._options.limitMin,
				max: this._options.limitMax,
				step: this._options.step,
				shortName: 'min',
				description: 'The min bound for the sample for ' + this._options.name + '.' + (includedTypes[LINEAR] ? ' Only for type ' + MIN_MAX : '')
			};

			example.max = {
				example: this._options.max,
				min: this._options.limitMin,
				max: this._options.limitMax,
				step: this._options.step,
				shortName: 'max',
				description: 'The max bound for the sample for ' + this._options.name + '.' + (includedTypes[LINEAR] ? ' Only for type ' + MIN_MAX : '')
			};
		}

		if (this._options.types.length > 1) {
			example.type = {
				example: this._options.type,
				shortName: 't',
				description: 'The type of distribution for ' + this._options.name,
				options: this._options.types.map(type => ({value: type, description: LEGAL_TYPES[type]}))
			};
		}

		return {
			example: example,
			optional: true,
			default: true,
			shortName: this._options.shortName,
			description: this._options.description,
		};
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
		const seenTypes = {};
		for (const type of normalizedOptions.types) {
			if (!LEGAL_TYPES[type]) throw new Error(type + ' is not a legal type');
			if (seenTypes[type]) throw new Error(type + ' was duplicated in the list');
			seenTypes[type] = true;
		}
		if (!normalizedOptions.types.some(type => type == normalizedOptions.type)) throw new Error(normalizedOptions.type + ' was set as type but was not in types');
	}
}

export class LinearDistributionConfig extends DistributionConfig {
	constructor(options = {}) {
		super({...options, types: [LINEAR], type: LINEAR});
	}
}

export class MinMaxDistributionConfig extends DistributionConfig {
	constructor(options = {}) {
		super({...options, types: [MIN_MAX], type: MIN_MAX});
	}
}
