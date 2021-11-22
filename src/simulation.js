import {
	prng_alea
} from 'esm-seedrandom';

import SchellingOrgSimulator from "./simulators/schelling-org.js";

//A string or "" to request gif output include this frame. Only frames that explicitly include this will be outputed.
//Duplicated in screenshot.js
export const GIF_COMMAND = 'gif';

/*
{
	//Must be a string with only a-zA-z0-9_- characters. Will be shown in the URL. May be omitted.
	"name": "this-is-a-name",
	//The human-readable description of the config. Optional. Will use name if not provided.
	"description": "This is a description",
	//A tuple of width, height
	"size": [16, 9],
	//How many runs to generate in the set
	"runs": 12,
	//If omitted, will use a value derived from current time. The deterministic value to feed to seed.
	"seed": "abc",
	//The simulator type to run. Currently only "schelling-org" is supported.
	"sim": "schelling-org",
	//The options to feed to the simulator. These will be different shapes depending on the value of "sim". See each specific simulator's documentation.
	"simOptions": {}
}

*/

const SIM_PROPERTY = 'sim';
const SIZE_PROPERTY = 'size';
const SIM_OPTIONS_PROPERTY = 'simOptions';
const RUNS_PROPERTY = 'runs';
const SEED_PROPERTY = 'seed';
const NAME_PROPERTY = 'name';
const DESCRIPTION_PROPERTY = 'description';

const SCHELLING_ORG_SIMULATION_NAME = 'schelling-org';

/*
	Simulators are classes that have the following static methods:

	generator(previousFrames, simOptions, randomGenerator, runIndex) => nextFrameData, or null if the simulation run is terminated

	optionsValidator(simOptions) => array of problem strings, or [] if OK

	frameScorer(frame) => an array of numbers between 0.0 and 1.0

	successScorer(frameScore) => 0.0 if failure, 1.0 if full success, negative numbers to say indeterminate

	frameValidator(frame) => array of strings defining problems, or [] if OK
*/
const SIMULATORS = {
	[SCHELLING_ORG_SIMULATION_NAME]: SchellingOrgSimulator,
};

//Returns an array of strings describing problems, or [] if everything is OK.
const simulatorConfigValid = (config) => {
	if (!config) return ['Not an object'];
	const problems = [];
	if (config.runs == undefined) problems.push('Required property runs is not provided');
	if (typeof config.runs != 'number' || config.runs < 1.0) problems.push('Runs must be a number greater than 1');

	if (!config[SIZE_PROPERTY]) {
		problems.push('size is required');
		return problems;
	}
	if (typeof config[SIZE_PROPERTY] != 'object' || !Array.isArray(config[SIZE_PROPERTY]) || config[SIZE_PROPERTY].length != 2 || typeof config[SIZE_PROPERTY][0] != 'number' || typeof config[SIZE_PROPERTY][1] != 'number') problems.push('size property must be a two-number array');

	if (config.sim != SCHELLING_ORG_SIMULATION_NAME) problems.push('Only ' + SCHELLING_ORG_SIMULATION_NAME + ' is supported as a sim');

	//TODO: verify other properties

	const sim = SIMULATORS[config[SIM_PROPERTY]];
	if (!sim) {
		problems.push('Unknown sim');
		return problems;
	}

	const simProblems = sim.optionsValidator(config[SIM_OPTIONS_PROPERTY] || {}) || [];
	if (simProblems.length) {
		problems.push('Sim problems: ' + simProblems.join(', '));
	}

	return problems;
};

const deepFreeze = (obj) => {
	if (!obj) return;
	if (typeof obj != 'object') return;
	Object.freeze(obj);
	for (const val of Object.values(obj)) {
		deepFreeze(val);
	}
};

export const SimulationCollection = class {
	constructor(configs) {
		if (!configs) configs = [];
		const seenNames = {};
		const arr = [];
		for (let i = 0; i < configs.length; i++) {
			let sim;
			const config = configs[i];
			try {
				sim = new Simulation(config, i.toString());
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
		this._frameScores = [];
		this._successScores = [];
		this._maxFrameIndex = Number.MAX_SAFE_INTEGER;
	}

	frame(frameIndex) {
		this._ensureFrameDataUpTo(frameIndex);
		if (frameIndex >= this._frames.length) return null;
		return this._frames[frameIndex];
	}

	frameScore(frameIndex) {
		this._ensureFrameDataUpTo(frameIndex);
		if (frameIndex >= this._frames.length) return null;
		return this._frameScores[frameIndex];
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

	//This returns the max valid frame index with the tighest known limit. It
	//starts off effectively infinite, but once we discover the last frame, we
	//update it to that.
	get maxFrameIndex() {
		return this._maxFrameIndex;
	}

	_ensureFrameDataUpTo(frameIndex) {
		if (frameIndex > this._maxFrameIndex) return;
		//We deliberately try to fetch one more frame than requested, so we'll
		//see the end of the run of frames happening one index before we
		//actually get there. This prevents a problem where we allow the UI to
		//select a frameIndex, only later to realize it's past the end.
		frameIndex++;
		while(frameIndex > this._frames.length - 1) {
			const result = this._calculateFrameAt(this._frames.length);
			if (!result) {
				//We foudn the last valid frame, keep track of where it is.
				this._maxFrameIndex = this._frames.length - 1;
				return null;
			}
			const problems = this._simulation.simulator.frameValidator(result);
			if (problems.length) {
				throw new Error('Couldn\'t generate frame at index ' + this.frameIndex + ' problem: ' + problems.join(', '));
			}
			//By freezing this, we'll make sure that others don't accidentally mutate a property in an old frame when creating a later one.
			//Because modules are `use strict`, trying to modify one will give a descriptive TypeError instead of failing silently.
			deepFreeze(result);
			this._frames.push(result);
			const frameScores = this._simulation.simulator.frameScorer(result);
			this._frameScores.push(frameScores);
			const successScore = this._simulation.simulator.successScorer(frameScores);
			this._successScores.push(successScore);
		}
	}

	//Will only be called when all lower frames exist
	_calculateFrameAt(frameIndex) {
		const previousFrames = frameIndex == 0 ? [] : this._frames.slice(0, frameIndex);
		const rnd = prng_alea('' + this._simulation.seed + this._index + frameIndex);
		const sim = this._simulation.simulator;
		return sim.generator(previousFrames, this._simulation.simOptions, rnd, this._index);
	}
};

const Simulation = class {
	constructor(config, altName) {

		const problems = simulatorConfigValid(config);
		if (problems.length > 0) {
			throw new Error('Invalid config: ' + problems.join(', '));
		}
		const name = config[NAME_PROPERTY];
		if (name) {
			if (typeof name != 'string') throw new Error('Name was provided but not a string');
			if (!name.match(/^[0-9a-zA-Z-_]+$/)) throw new Error('Name had invalid characters in it');
		}
		this._simulator = SIMULATORS[config.sim];
		this._config = config;
		this._altName = altName;
		this._seed = this._config[SEED_PROPERTY] || '' + Date.now();
		this._runs = new Array(config[RUNS_PROPERTY]);
	}

	get simulator() {
		return this._simulator;
	}

	get config() {
		return this._config;
	}

	get width() {
		return this._config[SIZE_PROPERTY][0];
	}

	get height() {
		return this._config[SIZE_PROPERTY][1];
	}

	get name() {
		return this._config[NAME_PROPERTY] || this._altName || '';
	}

	get description() {
		return this._config[DESCRIPTION_PROPERTY] || this.name;
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

	run(index) {
		if (index < 0 || index >= this._runs.length) return null;
		if (!this._runs[index]) {
			this._runs[index] = new SimulationRun(this, index);
		}
		return this._runs[index];
	}
};