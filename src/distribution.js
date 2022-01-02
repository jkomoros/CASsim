export const LINEAR = 'linear';

const LEGAL_TYPES = {
	[LINEAR]: 'A linear distribution between average +/- spread'
};

//Get a new one from DistributionConfig.distribution()
class Distribution {
	constructor(options = {}) {
		//Already validated by DistributionConfig.
		this._options = options;
	}

	sample(rnd = Math.random) {
		//TODO: do different things based on type;
		let value = (this._options.limitMax - this._options.limitMin) * rnd() + this._options.limitMin;
		if (value < this._options.limitMin) value = this._options.limitMin;
		if (value > this._options.limitMax) value = this._options.limitMax;
		return value;
	}
}

/*
	options includes:
	- types: an array of allowed types (e.g. LINEAR)
	- type: the default type
	- average: the default average value
	- spread: the spread value
	- limitMin: the clip value. Defaults to 0.0.
	- limitMax: the clip value. Defaults to 1.0.
	- step: defaults to 0.01
	- description: A description for the overall value
	- name: a name for the overall value
*/
export class DistributionConfig {
	constructor(options = {}) {
		const normalizedOptions = {};
		normalizedOptions.types = options.types || (options.type ? [options.type] : [LINEAR]);
		normalizedOptions.type = options.type || normalizedOptions.types[0];
		normalizedOptions.average = options.average === undefined ? 0.5 : options.average;
		normalizedOptions.spread = options.spread === undefined ? 0.0 : options.spread;
		normalizedOptions.limitMin = options.limitMin === undefined ? 0.0 : options.limitMin;
		normalizedOptions.limitMax = options.limitMax === undefined ? 1.0 : options.limitMax;
		normalizedOptions.step = options.step === undefined ? 0.01 : options.step;
		normalizedOptions.name = options.name === undefined ? 'value' : options.name;
		normalizedOptions.shortName = options.shortName || normalizedOptions.name;
		normalizedOptions.description = options.description === undefined ? 'A value with a ' + normalizedOptions.type + ' distribution' : options.description;

		//Validate
		this._validateOptions(normalizedOptions);

		this._options = normalizedOptions;
	}

	get optionsConfig() {
		const example = {
			average: {
				example: this._options.average,
				min: this._options.limitMax,
				max: this._options.limitMax,
				step: this._options.step,
				shortName: 'a',
				description: 'The average value for ' + this._options.name
			},
			spread: {
				example: this._options.spread,
				min: this._options.limitMax,
				max: this._options.limitMax,
				step: this._options.step,
				shortName: 's',
				optional:true,
				default: true,
				description: this._options.type == LINEAR ? 'The amount that ' + this._options.name + ' will be +/- of' : 'The spread for ' + this._options.name
			}
		};

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
		for (const key of ['average', 'spread', 'limitMin', 'limitMax', 'step']) {
			if (typeof normalizedOptions[key] != 'number') throw new Error(key + ' must be a number');
		}
		if (normalizedOptions.min > normalizedOptions.max) throw new Error('min was greater than max');
		for (const key of ['name', 'description', 'shortName']) {
			if (typeof normalizedOptions[key] != 'string') throw new Error(key + ' must be a string');
		}
		if (!Array.isArray(normalizedOptions.types)) throw new Error('types must be an array');
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
