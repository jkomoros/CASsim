import {
	prng_alea
} from 'esm-seedrandom';

import SchellingOrgSimulator from "./simulators/schelling-org.js";

//A string or "" to request gif output include this frame. Only frames that explicitly include this will be outputed.
//Duplicated in screenshot.js
export const GIF_COMMAND = 'gif';

const SIM_PROPERTY = 'sim';
const SIM_OPTIONS_PROPERTY = 'simOptions';
const RUNS_PROPERTY = 'runs';
const SEED_PROPERTY = 'seed';

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

	if (config.sim != SCHELLING_ORG_SIMULATION_NAME) problems.push('Only ' + SCHELLING_ORG_SIMULATION_NAME + ' is supported as a sim');

	//TODO: verify other properties

	const sim = SIMULATORS[config[SIM_PROPERTY]];
	if (!sim) {
		problems.push('Unknown sim');
		return problems;
	}

	const simProblems = sim.optionsValidator(config[SIM_OPTIONS_PROPERTY] || {});
	if (simProblems.length) {
		problems.push('Sim problems: ' + simProblems.join(', '));
	}

	return problems;
};

export const SimulationCollection = class {
	constructor(configs) {
		if (!configs) configs = [];
		const arr = [];
		for (let i = 0; i < configs.length; i++) {
			let sim;
			const config = configs[i];
			try {
				sim = new Simulation(config);
			} catch(err) {
				throw new Error('Config #' + i + ' errored: ' + err);
			}
			arr.push(sim);
		}
		this._simulations = arr;
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

	_ensureFrameDataUpTo(frameIndex) {
		while(frameIndex > this._frames.length - 1) {
			const result = this._calculateFrameAt(this._frames.length);
			//TODO: keep track of when we hit this end-of-simulation and never try to generate it again
			if (!result) return null;
			const problems = this._simulation.simulator.frameValidator(result);
			if (problems.length) {
				throw new Error('Couldn\'t generate frame at index ' + this.frameIndex + ' problem: ' + problems.join(', '));
			}
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
	constructor(config) {

		const problems = simulatorConfigValid(config);
		if (problems.length > 0) {
			throw new Error('Invalid config: ' + problems.join(', '));
		}
		this._simulator = SIMULATORS[config.sim];
		this._config = config;
		this._seed = this._config[SEED_PROPERTY] || '' + Date.now();
		this._runs = new Array(config[RUNS_PROPERTY]);
	}

	get simulator() {
		return this._simulator;
	}

	get config() {
		return this._config;
	}

	get simOptions() {
		return this.config[SIM_OPTIONS_PROPERTY];
	}

	get seed() {
		return this._seed;
	}

	run(index) {
		if (index < 0 || index >= this._runs.length) return null;
		if (!this._runs[index]) {
			this._runs[index] = new SimulationRun(this, index);
		}
		return this._runs[index];
	}
};