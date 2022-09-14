import {
	makeSeededRandom
} from './random.js';

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
	optionsConfigWithDefaultedShortNames,
	IS_ROOT_PROPERTY_NAME,
} from './options.js';

import {
	color
} from './color.js';

import {
	OptionsPath,
	ScoreConfig,
	ChartData,
	SimulationConfig,
	SimulationConfigName,
	SimulationFrame,
	Modifications,
	OptionValue,
	SimulationConfigDisplay,
	ScoreConfigItem,
	ColorsMap,
	OptionValueMap,
	WithRequiredProperty,
	SimulatorType,
	KNOWN_SIMULATOR_TYPES,
	RawSimulationConfig
} from './types.js';

import {
	BaseSimulator
} from './simulator.js';

import {
	DEFAULT_FRAME_DELAY,
	DEFAULT_EXTRA_FINAL_FRAME_COUNT,
	DEFAULT_REPEAT
} from './constants.js';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 450;
const DEFAULT_RUNS = 10;

export const SIMULATORS : {[name in SimulatorType] +? : BaseSimulator} = {};

export type SimulationsMap = {[name : SimulationConfigName] : Simulation};

//Returns an array of the names of simulators in this data blob.
export const extractSimulatorNamesFromRawConfig = (data : RawSimulationConfig[]) => {
	const result : {[name : string] : true} = {};
	for (const item of data) {
		if (!item[SIM_PROPERTY]) continue;
		result[item[SIM_PROPERTY]] = true;
	}
	return Object.keys(result);
};

export const extractSimulatorNamesFromModifications = (modifications : Modifications) => {
	const result : {[name : string] : true} = {};
	for (const mod of modifications) {
		if (mod.path != SIM_PROPERTY) continue;
		//mod.value is safely string because mod.path is SIM_PROPERTY
		result[mod.value as string] = true;
	}
	return Object.keys(result);
};

export const configWithDefaultedSimOptions = <T extends RawSimulationConfig>(config : T) : WithRequiredProperty<T, 'simOptions'> => {
	if (config[SIM_OPTIONS_PROPERTY]) return config as WithRequiredProperty<T, 'simOptions'>;
	const simOptions = defaultValueForConfigPath({...config, simOptions: null}, SIM_OPTIONS_PROPERTY);
	if (typeof simOptions != 'object') throw new Error('simOptions property not object');
	return {
		...config,
		simOptions
	} as WithRequiredProperty<T, 'simOptions'>;
};

export const defaultValueForConfigPath = (config : SimulationConfig, path : OptionsPath) => {
	const simulation = new Simulation(config, 0);
	return simulation.defaultValueForOptionsPath(path);
};

export const setSimulationPropertyInConfig = (config : SimulationConfig, path : OptionsPath, value : OptionValue) : SimulationConfig => {
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

export class SimulationCollection {

	_nameIndex : {[name : SimulationConfigName] : Simulation };
	_simulations : Simulation[];

	constructor(configs : SimulationConfig[], unmodifiedConfigs : RawSimulationConfig[]) {
		if (!configs) configs = [];
		if (!unmodifiedConfigs) unmodifiedConfigs = [];
		const seenNames : {[name : SimulationConfigName] : Simulation } = {};
		const arr : Simulation[] = [];
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

	simulation(nameOrIndex : SimulationConfigName | number) : Simulation {
		if (this._nameIndex[nameOrIndex]) return this._nameIndex[nameOrIndex];
		const index = typeof nameOrIndex == 'number' ? nameOrIndex : parseInt(nameOrIndex);
		return this._simulations[index];
	}

	get simulationsMap() : SimulationsMap {
		return this._nameIndex;
	}

	get simulations() : Simulation[] {
		return this._simulations;
	}
}

export class SimulationRun {

	_simulation : Simulation;
	_index : number;
	_frames : SimulationFrame[];
	_scoreData : ChartData;
	_successScores : number[];
	_simulatorMaxFrameIndex : number;
	_maxFrameIndex : number;
	_lastChanged : number;

	constructor(simulation : Simulation, index : number) {
		this._simulation = simulation;
		this._index = index;
		this._frames = [];
		this._scoreData = Object.fromEntries(this._simulation.scoreConfig.filter(config => config && config.id).map(config => config.title ? config : {...config, title:idToTitle(config.id)}).map(config => [config.id, [{data: [], config: config}]]));
		this._successScores = [];
		this._simulatorMaxFrameIndex = this._simulation.maxFrameIndex;
		this._maxFrameIndex = Number.MAX_SAFE_INTEGER;
		this._lastChanged = Date.now();
	}

	get simulation() : Simulation {
		return this._simulation;
	}

	frame(frameIndex : number) : SimulationFrame {
		this._ensureFrameDataUpTo(frameIndex);
		if (frameIndex >= this._frames.length) return null;
		return this._frames[frameIndex];
	}

	get scoreData() : ChartData {
		return this._scoreData;	
	}

	successScore(frameIndex : number) : number {
		this._ensureFrameDataUpTo(frameIndex);
		if (frameIndex >= this._frames.length) return -1;
		return this._successScores[frameIndex];
	}

	//maxFrameIndex only updates to a tighter bound once it's discovered the
	//end. If you're incremeting up by one each time, we'll notice the end just
	//before you get to it. But if you try to jump to some index, we won't
	//notice it's illegal until after you jump to it. This allows you to
	//explicitly probe.
	frameIndexLegal(frameIndex : number) : boolean {
		this._ensureFrameDataUpTo(frameIndex);
		return frameIndex < this._frames.length;
	}

	//Ensure that we know the state of all frames
	run() : void {
		this._ensureFrameDataUpTo(this._simulation.maxFrameIndex);
	}

	get lastChanged() : number {
		return this._lastChanged;
	}

	_changed() : void {
		this._lastChanged = Date.now();
	}

	//Whether this has been run to completion (the state of all frames up to the
	//null frame is known), either directly via run() or indirectly by having
	//requested all frames up to and past the end.
	get complete() : boolean {
		return this._maxFrameIndex != Number.MAX_SAFE_INTEGER;
	}
	
	//Returns 0.0 for complete failure, 1.0 for complete success, inbetween for
	//inbetween, and negative value if indeterminate (e.g. it is not yet
	//complete or the simulator doesn't implement a frameScorer)
	get finalStatus() : number {
		if (!this.complete) return -1.0;
		return this.successScore(this.maxFrameIndex);
	}

	//This returns the max valid frame index with the tighest known limit. It
	//starts off effectively infinite, but once we discover the last frame, we
	//update it to that.
	get maxFrameIndex() : number {
		return this._maxFrameIndex;
	}

	_ensureFrameDataUpTo(frameIndex : number) : void {
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
				this._simulation.simulator.frameValidator(result);
			} catch(err) {
				throw new Error('Couldn\'t generate frame at index ' + frameIndex + ' problem: ' + err);
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
	_calculateFrameAt(frameIndex : number) : SimulationFrame {
		const previousFrame = frameIndex == 0 ? null : this._frames[frameIndex - 1];
		const rnd = makeSeededRandom('' + this._simulation.seed + this._index + frameIndex);
		const sim = this._simulation.simulator;
		return sim.generator(frameIndex, previousFrame, this._simulation.simOptions, rnd, this._index, this._simulation.width, this._simulation.height);
	}
}

export class Simulation {

	_simulator : BaseSimulator;

	_unmodifiedConfig : RawSimulationConfig;

	_config : SimulationConfig;

	_rawConfig : SimulationConfig;

	_altName : string;

	_seed : string;

	_fingerprint : string;

	_runs : SimulationRun[];

	_optionConfig : unknown;

	_index : number;

	_maxFrameIndex : number;

	_scoreConfig : ScoreConfig;

	_colors : ColorsMap;

	_lastChanged : number;

	_activated : boolean;

	constructor(config : SimulationConfig, index : number, unmodifiedConfig? : RawSimulationConfig) {

		const name = config.name;
		if (name) {
			if (typeof name != 'string') throw new Error('Name was provided but not a string');
			if (!name.match(/^[0-9a-zA-Z-_]+$/)) throw new Error('Name had invalid characters in it');
		}
		this._simulator = SIMULATORS[config.sim];
		if (!this._simulator) {
			throw new Error('Unknown simulator name: ' + config.sim);
		}
		const configCopy = deepCopy(config);
		const rawSimOptions = configCopy.simOptions || this._simulator.defaultValueForPath('', null);
		const [updatedSimOptionsConfig] = ensureBackfill(optionsConfigWithDefaultedShortNames(this._simulator.optionsConfig), rawSimOptions);
		configCopy.simOptions = this._simulator.normalizeOptions(updatedSimOptionsConfig as OptionValueMap);
		try {
			this._simulator.optionsValidator(configCopy.simOptions);
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
		this._seed = this._config.seed || '' + Date.now();
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
		this._colors = Object.fromEntries(Object.entries(this._config.colors || {}).map(entry => [entry[0], color(entry[1])]));
		this._lastChanged = Date.now();
		this._activated = false;
		const runCount = config.runs || DEFAULT_RUNS;
		for (let i = 0; i < runCount; i++) {
			const run = new SimulationRun(this, i);
			this._runs.push(run);
		}
	}

	cloneWithModification(path : OptionsPath, value : OptionValue) : Simulation {
		return this.cloneWithConfig(setSimulationPropertyInConfig(this.config, path, value));
	}

	cloneWithConfig(config : SimulationConfig) : Simulation {
		return new Simulation(config, this.index, config);
	}

	get lastChanged() : number {
		return Math.max(this._lastChanged, ...this._runs.map(run => run.lastChanged));
	}

	get scoreData() : ChartData {
		//TODO memoize somehow
		const result : ChartData = {};
		for (const run of this._runs) {
			const data = run.scoreData;
			for (const [key, value] of Object.entries(data)) {
				if (!result[key]) result[key] = [];
				result[key] = [...result[key], ...value];
			}
		}
		return result;
	}

	get simulatorName() : SimulatorType {
		return this._config.sim;
	}

	get simulator() : BaseSimulator {
		return this._simulator;
	}

	//config might have a different shape than the underlying data because it will have normalization on it.
	get config() : SimulationConfig {
		return this._config;
	}

	//rawConfig is the un-normalized config, exactly as passed in from data.
	get rawConfig() : SimulationConfig {
		return this._rawConfig;
	}

	get index() : number {
		return this._index;
	}

	get colors() : ColorsMap {
		return this._colors;
	}

	get frameDelay() : number {
		return this._config.frameDelay || DEFAULT_FRAME_DELAY;
	}

	get display() : SimulationConfigDisplay {
		return this._config.display || {};
	}

	get displayStatus() : boolean {
		return this.display.status ? true : false;
	}

	get screenshotDisplayStatus() : boolean {
		const result = this.display.screenshotStatus;
		if (result != undefined) return result;
		return this.displayStatus;
	}

	get clipStatus() : boolean {
		return this.display.clipStatus ? true : false;
	}

	get width() : number {
		return this._config.width || DEFAULT_WIDTH;
	}

	get height() : number {
		return this._config.height || DEFAULT_HEIGHT;
	}

	get name() : string {
		return this._config.name || this._altName || '';
	}

	get title() : string {
		if (this._config.title) return this._config.title;
		return idToTitle(this.name);
	}

	get rawDescription() : string {
		return this._config.description || '';
	}

	get description() : string {
		return this.rawDescription || this.title;
	}

	get simOptions() {
		return this.config[SIM_OPTIONS_PROPERTY];
	}

	get seed() : string {
		return this._seed;
	}

	get maxRunIndex() : number {
		return this._runs.length - 1;
	}

	get runs() : SimulationRun[] {
		return this._runs;
	}

	get autoPlay() : boolean {
		return this._config.autoPlay || false;
	}

	get repeat() : boolean {
		return this._config.repeat || DEFAULT_REPEAT;
	}

	get maxFrameIndex() : number {
		return this._maxFrameIndex;
	}

	get scoreConfig() : ScoreConfigItem[] {
		return this._scoreConfig;
	}

	get unmodifiedConfig() : RawSimulationConfig {
		return this._unmodifiedConfig;
	}

	get baseFingerprint() : string {
		if (!this._fingerprint) {
			const config = this._unmodifiedConfig || this._config;
			this._fingerprint = stringHash(JSON.stringify(config));
		}
		return this._fingerprint;
	}

	//Called when the simulation is active in the view. Might be called multiple
	//times. Will return true if it did something.
	activate() {
		if (! this.config.autoGenerate) return false;
		if (this._activated) return false;
		if (!this._runs.some(run => !run.complete)) return false;
		this._runs.forEach(run => run.run());
		this._activated = true;
		return true;
	}

	defaultValueForOptionsPath(path : OptionsPath) : OptionValue {
		const parts = path.split('.');
		if (parts[0] == SIM_OPTIONS_PROPERTY) {
			return this._simulator.defaultValueForPath(parts.slice(1).join('.'), this.simOptions);
		}
		return defaultValueForConfig(configForPath(this.optionsConfig, path));
	}

	get extraFinalFrameCount() : number {
		return this._config.extraFinalFrameCount || DEFAULT_EXTRA_FINAL_FRAME_COUNT;
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
				name: {
					example: '',
					shortName: 'n',
					description: 'Must be a string with only a-zA-z0-9_- characters. Will be shown in the URL.',
					advanced: true
				},
				title: {
					example: '',
					shortName: 't',
					description: 'The human-readable version of name, with pretty formatting. Will use a transformation of name like "two-words" -> "Two Words" if not provided.',
					advanced: true,
					optional: true
				},
				description: {
					example: '',
					shortName: 'd',
					description: 'The human-readable description of the config. Optional. Will use name if not provided.',
					advanced: true,
					optional: true
				},
				width: {
					example: DEFAULT_WIDTH,
					shortName: 'w',
					description: 'The width of the canvas in pixels. For the interactive view, this is mainly used for aspect ratio, but for screenshot generation this will be the literal width in pixels.',
					advanced: true
				},
				height: {
					example: DEFAULT_HEIGHT,
					shortName: 'h',
					description: 'The height of the canvas in pixels. For the interactive view, this is mainly used for aspect ratio, but for screenshot generation this will be the literal height in pixels--although if displayf status is true then it will be slightly taller.',
					advanced: true
				},
				frameDelay: {
					example: DEFAULT_FRAME_DELAY,
					shortName: 'fD',
					step: 50,
					description: 'How many milliseconds to wait before advancing to next frame when playing',
					optional: true,
					advanced: true
				},
				runs: {
					example: DEFAULT_RUNS,
					shortName: 'r',
					description: 'How many runs in the simulation to run',
				},
				seed: {
					example: '',
					shortName: 'sd',
					description: 'If omitted, will use a value derived from current time. The deterministic value to feed to seed.',
					advanced: true,
					optional: true
				},
				autoGenerate: {
					example: true,
					shortName: 'aG',
					description: 'if true, then it will automatically generate all frames for all runs immediately on creation. This can be very expensive; this should only be set to true for simulations with limited computational overhead.',
					advanced: true,
					optional: true
				},
				autoPlay: {
					example: true,
					shortName: 'aP',
					description: 'If set, will automatically start playing when simulation is loaded',
					advanced: true,
					optional: true
				},
				repeat: {
					example: true,
					shortName: 'rpt',
					description: 'If true, will loop back around to the beginning of the round when being played. Gif screenshotting also respects this value',
					advanced: true,
					optional: true
				},
				extraFinalFrameCount: {
					example: DEFAULT_EXTRA_FINAL_FRAME_COUNT,
					shortName: 'eFFC',
					description: 'The number of additional frames to pause at the end of a round',
					advanced: true,
					optional: true
				},
				display: {
					example: {
						status: {
							example: true,
							shortName: 's',
							description: "If provided, will render a status line of runs summary beneath the visuazliation, including in the screenshot output",
							optional: true,
						},
						screenshotStatus: {
							example: true,
							shortName: 'sS',
							description: "If true, then the status line will be included (as in status) but only in the screenshot output",
							optional: true,
						},
						clipStatus: {
							example: true,
							shortName: 'cS',
							description: "If provided, and status is true, then it will hide future runs in the rendered status bar.",
							optional: true
						}
					},
					shortName: 'dsp',
					description: 'Properties to configure optional display characteristics',
					optional: true,
					advanced: true,
				},
				colors: {
					example: {
						primary: {
							example: "#fb8c00",
							shortName: 'p',
							description: "Primary color",
							behavior: "color",
							optional: true,
						},
						secondary: {
							example: "#51b9a3",
							shortName: 's',
							description: "Secondary color",
							behavior: "color",
							optional: true
						},
						disabled: {
							example: "ECCCCCC",
							shortName: 'd',
							description: "Disabled color",
							behavior: "color",
							optional: true
						},
						background: {
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
					example: KNOWN_SIMULATOR_TYPES.length ? KNOWN_SIMULATOR_TYPES[0] : '',
					shortName: SIM_PROPERTY_SHORT_NAME,
					options: KNOWN_SIMULATOR_TYPES.map(name => ({value: name})),
					description: 'The simulator type to run. Only simulators in the simulators directory are supported',
					//Advanced while this is the only option
					advanced: true,
				},
				[SIM_OPTIONS_PROPERTY]: {
					example: simOptionsConfig,
					shortName: 'o',
					description: 'Settings specific to this simulator',
					//If not provided, the main harness will generate a default based on the simConfig
					optional: true,
					//Make sure hide() doesn't get the whole top level value but only things rooted to here or below
					[IS_ROOT_PROPERTY_NAME]: true
				}
			}
		};
		deepFreeze(result);
		this._optionConfig = result;
		return result;
	}
}