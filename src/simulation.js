
import SchellingOrgSimulator from "./simulators/schelling-org.js";

//A string or "" to request gif output include this frame. Only frames that explicitly include this will be outputed.
//Duplicated in screenshot.js
export const GIF_COMMAND = 'gif';

const SCHELLING_ORG_SIMULATION_NAME = 'schelling-org';

/*
	Simulators are classes that have the following static methods:

	generator(previousFrames, simOptions, seedValue, runIndex) => nextFrameData
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

	//TODO: verify the simulator properties

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

export const Simulation = class {
	constructor(config) {

		const problems = simulatorConfigValid(config);
		if (problems.length > 0) {
			throw new Error('Invalid config: ' + problems.join(', '));
		}

		const arr = [];
		for (let i = 0; i < config.runs; i++) {
			arr.push({
				frames: [
					{},
				],
			});
		}
		this._simulator = SIMULATORS[config.sim];
		this._config = config;
		this._runs = arr;
	}

	get runs() {
		return this._runs;
	}
};