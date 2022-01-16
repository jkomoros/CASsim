import {
	prng_alea
} from 'esm-seedrandom';

import {
	deepFreeze,
	deepCopy,
	stringHash,
	idToTitle,
	setPropertyInObject,
	DEFAULT_SENTINEL,
	DELETE_SENTINEL
} from './util.js';

import {
	configObjectIsValid,
	optionsConfigValidator,
	defaultValueForConfig,
	configForPath,
	SIM_PROPERTY,
	SIM_OPTIONS_PROPERTY,
	SIM_PROPERTY_SHORT_NAME,
	ensureBackfill,
	optionsConfigWithDefaultedShortNames
} from './options.js';

import {
	color
} from './color.js';

import {
	NAME_PROPERTY as CONFIG_NAME_PROPERTY
} from './config.js';

const HEIGHT_PROPERTY = 'height';
const WIDTH_PROPERTY = 'width';
const RUNS_PROPERTY = 'runs';
const SEED_PROPERTY = 'seed';
const COLORS_PROPERTY = 'colors';
const COLOR_PRIMARY_PROPERTY = 'primary';
const COLOR_SECONDARY_PROPERTY = 'secondary';
const COLOR_DISABLED_PROPERTY = 'disabled';
const COLOR_BACKGROUND_PROPERTY = 'background';
const DESCRIPTION_PROPERTY = 'description';
const AUTO_GENERATE_PROPERTY = 'autoGenerate';
const AUTO_PLAY_PROPERTY = 'autoPlay';
const DISPLAY_PROPERTY = 'display';
const STATUS_DISPLAY_PROPERTY = 'status';
const SCREENSHOT_STATUS_DISPLAY_PROPERTY = 'screenshotStatus';
const CLIP_STATUS_PROPERTY = 'clipStatus';
const TITLE_PROPERTY = 'title';

//Also duplicated into screenshot.js
export const NAME_PROPERTY = CONFIG_NAME_PROPERTY;
const REPEAT_PROPERTY = 'repeat';
const FRAME_DELAY_PROPERTY = 'frameDelay';
const EXTRA_FINAL_FRAME_COUNT_PROPERTY = 'extraFinalFrameCount';
const DEFAULT_FRAME_DELAY = 100;
const DEFAULT_EXTRA_FINAL_FRAME_COUNT = 0;
const DEFAULT_REPEAT = false;

export const SIMULATORS = {};
export const KNOWN_SIMULATOR_NAMES = {};

//Returns an array of the names of simulators in this data blob.
export const extractSimulatorNamesFromRawConfig = data => {
	const result = {};
	for (const item of data) {
		if (!item[SIM_PROPERTY]) continue;
		result[item[SIM_PROPERTY]] = true;
	}
	return Object.keys(result);
};

export const extractSimulatorNamesFromModifications = modifications => {
	const result = {};
	for (const mod of modifications) {
		if (mod.path != SIM_PROPERTY) continue;
		result[mod.value] = true;
	}
	return Object.keys(result);
};

export const configWithDefaultedSimOptions = (config) => {
	if (config[SIM_OPTIONS_PROPERTY]) return config;
	return {
		...config,
		[SIM_OPTIONS_PROPERTY]: defaultValueForConfigPath(config, SIM_OPTIONS_PROPERTY)
	};
};

export const defaultValueForConfigPath = (config, path) => {
	const simulation = new Simulation(config, 0);
	return simulation.defaultValueForOptionsPath(path);
};

export const setSimulationPropertyInConfig = (config, path, value) => {
	if (value == DEFAULT_SENTINEL) {
		try {
			value = defaultValueForConfigPath(config, path);
		} catch(err) {
			console.warn('Couldn\'t fetch default value from simulator: ' + err);
			return config;
		}
	}
	//When we switch sim name, we should wipe away all of simOptions, allowing
	//it to be set to the default based on the simOptionsConfig, because the
	//simOptions for the old one definitely won't be valid for the new one.

	//NOte: shadowedModificationsForSimIndex basically reimplemnts this behavior

	//When we switch to a different sim, the simOptions we had set might be
	//invalid, and setSimulationInConfig will create a new simulation. So first
	//clear out simOptions so it's guaranteed to work.
	if (path == SIM_PROPERTY) config = setPropertyInObject(config, SIM_OPTIONS_PROPERTY, DELETE_SENTINEL);
	config = setPropertyInObject(config, path, value);
	if (path == SIM_PROPERTY) config = setSimulationPropertyInConfig(config, SIM_OPTIONS_PROPERTY, DEFAULT_SENTINEL);
	return config;
};

export const SimulationCollection = class {
	constructor(configs, unmodifiedConfigs) {
		if (!configs) configs = [];
		if (!unmodifiedConfigs) unmodifiedConfigs = [];
		const seenNames = {};
		const arr = [];
		for (let i = 0; i < configs.length; i++) {
			let sim;
			const config = configs[i];
			try {
				sim = new Simulation(config, i, unmodifiedConfigs[i]);
			} catch(err) {
				throw new Error('Config #' + i + ' errored: ' + err);
			}
			if (sim.name) {
				if (seenNames[sim.name]) {
					throw new Error('Config #' + i + ' had the same name as a previous config.');
				}
				seenNames[sim.name] = sim;
			}
			arr.push(sim);
		}
		this._simulations = arr;
		this._nameIndex = seenNames;
	}

	simulation(nameOrIndex) {
		if (this._nameIndex[nameOrIndex]) return this._nameIndex[nameOrIndex];
		if (typeof nameOrIndex == 'string') {
			const index = parseInt(nameOrIndex);
			if (!isNaN(index)) nameOrIndex = index;
		}
		return this._simulations[nameOrIndex];
	}

	get simulationsMap() {
		return this._nameIndex;
	}

	get simulations() {
		return this._simulations;
	}
};

const SimulationRun = class {
	constructor(simulation, index) {
		this._simulation = simulation;
		this._index = index;
		this._frames = [];
		this._scoreData = Object.fromEntries(this._simulation.scoreConfig.filter(config => config && config.id).map(config => config.title ? config : {...config, title:idToTitle(config.id)}).map(config => [config.id, [{data: [], config: config}]]));
		this._successScores = [];
		this._simulatorMaxFrameIndex = this._simulation.maxFrameIndex;
		this._maxFrameIndex = Number.MAX_SAFE_INTEGER;
		this._lastChanged = Date.now();
	}

	get simulation() {
		return this._simulation;
	}

	frame(frameIndex) {
		this._ensureFrameDataUpTo(frameIndex);
		if (frameIndex >= this._frames.length) return null;
		return this._frames[frameIndex];
	}

	get scoreData() {
		return this._scoreData;	
	}

	successScore(frameIndex) {
		this._ensureFrameDataUpTo(frameIndex);
		if (frameIndex >= this._frames.length) return -1;
		return this._successScores[frameIndex];
	}

	//maxFrameIndex only updates to a tighter bound once it's discovered the
	//end. If you're incremeting up by one each time, we'll notice the end just
	//before you get to it. But if you try to jump to some index, we won't
	//notice it's illegal until after you jump to it. This allows you to
	//explicitly probe.
	frameIndexLegal(frameIndex) {
		this._ensureFrameDataUpTo(frameIndex);
		return frameIndex < this._frames.length;
	}

	//Ensure that we know the state of all frames
	run() {
		this._ensureFrameDataUpTo(this._simulation.maxFrameIndex);
	}

	get lastChanged() {
		return this._lastChanged;
	}

	_changed() {
		this._lastChanged = Date.now();
	}

	//Whether this has been run to completion (the state of all frames up to the
	//null frame is known), either directly via run() or indirectly by having
	//requested all frames up to and past the end.
	get complete() {
		return this._maxFrameIndex != Number.MAX_SAFE_INTEGER;
	}
	
	//Returns 0.0 for complete failure, 1.0 for complete success, inbetween for
	//inbetween, and negative value if indeterminate (e.g. it is not yet
	//complete or the simulator doesn't implement a frameScorer)
	get finalStatus() {
		if (!this.complete) return -1.0;
		return this.successScore(this.maxFrameIndex);
	}

	//This returns the max valid frame index with the tighest known limit. It
	//starts off effectively infinite, but once we discover the last frame, we
	//update it to that.
	get maxFrameIndex() {
		return this._maxFrameIndex;
	}

	_ensureFrameDataUpTo(frameIndex) {
		if (frameIndex > this._maxFrameIndex) return;
		if (frameIndex > this._simulatorMaxFrameIndex) frameIndex = this._simulatorMaxFrameIndex;
		//We deliberately try to fetch one more frame than requested, so we'll
		//see the end of the run of frames happening one index before we
		//actually get there. This prevents a problem where we allow the UI to
		//select a frameIndex, only later to realize it's past the end.
		//We do get MAX_SAFE_INTEGER somtimes, so we need to check for that.
		if (frameIndex != Number.MAX_SAFE_INTEGER) frameIndex++;
		while(frameIndex > this._frames.length - 1) {
			const result = this._calculateFrameAt(this._frames.length);
			if (!result) {
				//We foudn the last valid frame, keep track of where it is.
				this._maxFrameIndex = this._frames.length - 1;
				return null;
			}
			try {
				this._simulation.simulator.frameValidator(result, this._simulation.simOptions);
			} catch(err) {
				throw new Error('Couldn\'t generate frame at index ' + this.frameIndex + ' problem: ' + err);
			}
			//By freezing this, we'll make sure that others don't accidentally mutate a property in an old frame when creating a later one.
			//Because modules are `use strict`, trying to modify one will give a descriptive TypeError instead of failing silently.
			deepFreeze(result);
			this._frames.push(result);
			const frameScores = this._simulation.simulator.frameScorer(result, this._simulation.simOptions);
			for (const [index, scoreConfig] of this._simulation.scoreConfig.entries()) {
				if (!scoreConfig) continue;
				this._scoreData[scoreConfig.id][0].data.push(frameScores[index]);
			}
			const successScore = this._simulation.simulator.successScorer(frameScores, this._simulation.simOptions);
			this._successScores.push(successScore);
			this._changed();
		}
	}

	//Will only be called when all lower frames exist
	_calculateFrameAt(frameIndex) {
		const previousFrame = frameIndex == 0 ? null : this._frames[frameIndex - 1];
		const rnd = makeSeededRandom('' + this._simulation.seed + this._index + frameIndex);
		const sim = this._simulation.simulator;
		return sim.generator(frameIndex, previousFrame, this._simulation.simOptions, rnd, this._index, this._simulation.width, this._simulation.height);
	}
};

const makeSeededRandom = seed => {
	const rnd = prng_alea(seed);
	return () => rnd.quick();
};

export const Simulation = class {
	constructor(config, index, unmodifiedConfig) {

		const name = config[NAME_PROPERTY];
		if (name) {
			if (typeof name != 'string') throw new Error('Name was provided but not a string');
			if (!name.match(/^[0-9a-zA-Z-_]+$/)) throw new Error('Name had invalid characters in it');
		}
		this._simulator = SIMULATORS[config.sim];
		if (!this._simulator) {
			throw new Error('Unknown simulator name: ' + config.sim);
		}
		const configCopy = deepCopy(config);
		const rawSimOptions = configCopy[SIM_OPTIONS_PROPERTY] || this._simulator.defaultValueForPath('', null);
		const [updatedSimOptionsConfig] = ensureBackfill(optionsConfigWithDefaultedShortNames(this._simulator.optionsConfig), rawSimOptions);
		configCopy[SIM_OPTIONS_PROPERTY] = this._simulator.normalizeOptions(updatedSimOptionsConfig);
		try {
			this._simulator.optionsValidator(configCopy[SIM_OPTIONS_PROPERTY]);
		} catch (err) {
			throw new Error('Sim problems: ' + err);
		}
		deepFreeze(unmodifiedConfig);
		this._unmodifiedConfig = unmodifiedConfig;
		deepFreeze(configCopy);
		this._config = configCopy;
		deepFreeze(config);
		this._rawConfig = config;
		const configProblem = configObjectIsValid(this.optionsConfig, this._config);
		if (configProblem) {
			throw new Error('Invalid config: ' + configProblem);
		}
		this._altName = (index || 0).toString();
		this._seed = this._config[SEED_PROPERTY] || '' + Date.now();
		this._fingerprint = '';
		this._runs = [];
		this._optionConfig = null;
		this._index = index;
		this._maxFrameIndex = this._simulator.maxFrameIndex(this.simOptions);
		this._scoreConfig = this._simulator.scoreConfig(this.simOptions);
		deepFreeze(this._scoreConfig);
		if (!Array.isArray(this._scoreConfig)) throw new Error('scoreConfig must return an array');
		for (const [index, config] of this._scoreConfig.entries()) {
			if (!config) continue;
			if (!config.id) throw new Error('scoreConfig #' + index + ' is missing id, a requried property');
		}
		this._colors = Object.fromEntries(Object.entries(this._config[COLORS_PROPERTY] || {}).map(entry => [entry[0], color(entry[1])]));
		this._lastChanged = Date.now();
		this._activated = false;
		for (let i = 0; i < config[RUNS_PROPERTY]; i++) {
			const run = new SimulationRun(this, i);
			this._runs.push(run);
		}
	}

	cloneWithModification(path, value) {
		return this.cloneWithConfig(setSimulationPropertyInConfig(this.config, path, value));
	}

	cloneWithConfig(config) {
		return new Simulation(config, this.index, config);
	}

	get lastChanged() {
		return Math.max(this._lastChanged, ...this._runs.map(run => run.lastChanged));
	}

	get scoreData() {
		//TODO memoize somehow
		const result = {};
		for (const run of this._runs) {
			const data = run.scoreData;
			for (const [key, value] of Object.entries(data)) {
				if (!result[key]) result[key] = [];
				result[key] = [...result[key], ...value];
			}
		}
		return result;
	}

	get simulatorName() {
		return this._config.sim;
	}

	get simulator() {
		return this._simulator;
	}

	//config might have a different shape than the underlying data because it will have normalization on it.
	get config() {
		return this._config;
	}

	//rawConfig is the un-normalized config, exactly as passed in from data.
	get rawConfig() {
		return this._rawConfig;
	}

	get index() {
		return this._index;
	}

	get colors() {
		return this._colors;
	}

	get frameDelay() {
		return this._config[FRAME_DELAY_PROPERTY] || DEFAULT_FRAME_DELAY;
	}

	get display() {
		return this._config[DISPLAY_PROPERTY] || {};
	}

	get displayStatus() {
		return this.display[STATUS_DISPLAY_PROPERTY] ? true : false;
	}

	get screenshotDisplayStatus() {
		const result = this.display[SCREENSHOT_STATUS_DISPLAY_PROPERTY];
		if (result != undefined) return result;
		return this.displayStatus;
	}

	get clipStatus() {
		return this.display[CLIP_STATUS_PROPERTY] ? true : false;
	}

	get width() {
		return this._config[WIDTH_PROPERTY];
	}

	get height() {
		return this._config[HEIGHT_PROPERTY];
	}

	get name() {
		return this._config[NAME_PROPERTY] || this._altName || '';
	}

	get title() {
		if (this._config[TITLE_PROPERTY]) return this._config[TITLE_PROPERTY];
		return idToTitle(this.name);
	}

	get rawDescription() {
		return this._config[DESCRIPTION_PROPERTY] || '';
	}

	get description() {
		return this.rawDescription || this.title;
	}

	get simOptions() {
		return this.config[SIM_OPTIONS_PROPERTY];
	}

	get seed() {
		return this._seed;
	}

	get maxRunIndex() {
		return this._runs.length - 1;
	}

	get runs() {
		return this._runs;
	}

	get autoPlay() {
		return this._config[AUTO_PLAY_PROPERTY] || false;
	}

	get repeat() {
		return this._config[REPEAT_PROPERTY] || DEFAULT_REPEAT;
	}

	get maxFrameIndex() {
		return this._maxFrameIndex;
	}

	get scoreConfig() {
		return this._scoreConfig;
	}

	get unmodifiedConfig() {
		return this._unmodifiedConfig;
	}

	get baseFingerprint() {
		if (!this._fingerprint) {
			const config = this._unmodifiedConfig || this._config;
			this._fingerprint = stringHash(JSON.stringify(config));
		}
		return this._fingerprint;
	}

	//Called when the simulation is active in the view. Might be called multiple
	//times. Will return true if it did something.
	activate() {
		if (! this.config[AUTO_GENERATE_PROPERTY]) return false;
		if (this._activated) return false;
		if (!this._runs.some(run => !run.complete)) return false;
		this._runs.forEach(run => run.run());
		this._activated = true;
		return true;
	}

	defaultValueForOptionsPath(path) {
		const parts = path.split('.');
		if (parts[0] == SIM_OPTIONS_PROPERTY) {
			return this._simulator.defaultValueForPath(parts.slice(1).join('.'), this.simOptions);
		}
		return defaultValueForConfig(configForPath(this.optionsConfig, path));
	}

	get extraFinalFrameCount() {
		return this._config[EXTRA_FINAL_FRAME_COUNT_PROPERTY] || DEFAULT_EXTRA_FINAL_FRAME_COUNT;
	}

	get optionsConfig() {
		if (this._optionConfig) return this._optionConfig;
		const simOptionsConfig = optionsConfigWithDefaultedShortNames(this._simulator.optionsConfig);
		const problem = optionsConfigValidator(simOptionsConfig);
		if (problem) {
			throw new Error('Invalid simOptions: ' + problem);
		}
		const result = {
			example: {
				[NAME_PROPERTY]: {
					example: '',
					shortName: 'n',
					description: 'Must be a string with only a-zA-z0-9_- characters. Will be shown in the URL.',
					advanced: true
				},
				[TITLE_PROPERTY]: {
					example: '',
					shortName: 't',
					description: 'The human-readable version of name, with pretty formatting. Will use a transformation of ' + NAME_PROPERTY + 'like "two-words" -> "Two Words" if not provided.',
					advanced: true,
					optional: true
				},
				[DESCRIPTION_PROPERTY]: {
					example: '',
					shortName: 'd',
					description: 'The human-readable description of the config. Optional. Will use name if not provided.',
					advanced: true,
					optional: true
				},
				[WIDTH_PROPERTY]: {
					example: 800,
					shortName: 'w',
					description: 'The width of the canvas in pixels. For the interactive view, this is mainly used for aspect ratio, but for screenshot generation this will be the literal width in pixels.',
					advanced: true
				},
				[HEIGHT_PROPERTY]: {
					example: 450,
					shortName: 'h',
					description: 'The height of the canvas in pixels. For the interactive view, this is mainly used for aspect ratio, but for screenshot generation this will be the literal height in pixels--although if ' + DISPLAY_PROPERTY + '.' + STATUS_DISPLAY_PROPERTY + ' is true then it will be slightly taller.',
					advanced: true
				},
				[FRAME_DELAY_PROPERTY]: {
					example: DEFAULT_FRAME_DELAY,
					shortName: 'fD',
					step: 50,
					description: 'How many milliseconds to wait before advancing to next frame when playing',
					optional: true,
					advanced: true
				},
				[RUNS_PROPERTY]: {
					example: 10,
					shortName: 'r',
					description: 'How many runs in the simulation to run',
				},
				[SEED_PROPERTY]: {
					example: '',
					shortName: 'sd',
					description: 'If omitted, will use a value derived from current time. The deterministic value to feed to seed.',
					advanced: true,
					optional: true
				},
				[AUTO_GENERATE_PROPERTY]: {
					example: true,
					shortName: 'aG',
					description: 'if true, then it will automatically generate all frames for all runs immediately on creation. This can be very expensive; this should only be set to true for simulations with limited computational overhead.',
					advanced: true,
					optional: true
				},
				[AUTO_PLAY_PROPERTY]: {
					example: true,
					shortName: 'aP',
					description: 'If set, will automatically start playing when simulation is loaded',
					advanced: true,
					optional: true
				},
				[REPEAT_PROPERTY]: {
					example: true,
					shortName: 'rpt',
					description: 'If true, will loop back around to the beginning of the round when being played. Gif screenshotting also respects this value',
					advanced: true,
					optional: true
				},
				[EXTRA_FINAL_FRAME_COUNT_PROPERTY]: {
					example: DEFAULT_EXTRA_FINAL_FRAME_COUNT,
					shortName: 'eFFC',
					description: 'The number of additional frames to pause at the end of a round',
					advanced: true,
					optional: true
				},
				[DISPLAY_PROPERTY]: {
					example: {
						[STATUS_DISPLAY_PROPERTY]: {
							example: true,
							shortName: 's',
							description: "If provided, will render a status line of runs summary beneath the visuazliation, including in the screenshot output",
							optional: true,
						},
						[SCREENSHOT_STATUS_DISPLAY_PROPERTY]: {
							example: true,
							shortName: 'sS',
							description: "If true, then the status line will be included (as in " + STATUS_DISPLAY_PROPERTY + ") but only in the screenshot output",
							optional: true,
						},
						[CLIP_STATUS_PROPERTY]: {
							example: true,
							shortName: 'cS',
							description: "If provided, and " + STATUS_DISPLAY_PROPERTY + " is true, then it will hide future runs in the rendered status bar.",
							optional: true
						}
					},
					shortName: 'dsp',
					description: 'Properties to configure optional display characteristics',
					optional: true,
					advanced: true,
				},
				[COLORS_PROPERTY]: {
					example: {
						[COLOR_PRIMARY_PROPERTY]: {
							example: "#fb8c00",
							shortName: 'p',
							description: "Primary color",
							behavior: "color",
							optional: true,
						},
						[COLOR_SECONDARY_PROPERTY]: {
							example: "#51b9a3",
							shortName: 's',
							description: "Secondary color",
							behavior: "color",
							optional: true
						},
						[COLOR_DISABLED_PROPERTY]: {
							example: "ECCCCCC",
							shortName: 'd',
							description: "Disabled color",
							behavior: "color",
							optional: true
						},
						[COLOR_BACKGROUND_PROPERTY]: {
							example: "transparent",
							shortName: 'b',
							description: "Background color",
							behavior: "color",
							optional: true
						}
					},
					shortName: 'clrs',
					advanced: true,
					description: "Colors",
					optional: true,
				},
				[SIM_PROPERTY]: {
					//TODO: use the constant
					example: Object.keys(KNOWN_SIMULATOR_NAMES).length ? Object.keys(SIMULATORS)[0] : '',
					shortName: SIM_PROPERTY_SHORT_NAME,
					options: Object.keys(KNOWN_SIMULATOR_NAMES).map(name => ({value: name})),
					description: 'The simulator type to run. Only simulators in the simulators directory are supported',
					//Advanced while this is the only option
					advanced: true,
				},
				[SIM_OPTIONS_PROPERTY]: {
					example: simOptionsConfig,
					shortName: 'o',
					description: 'Settings specific to this simulator',
					//If not provided, the main harness will generate a default based on the simConfig
					optional: true
				}
			}
		};
		deepFreeze(result);
		this._optionConfig = result;
		return result;
	}
};