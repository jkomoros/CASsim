import {
	AgentSimulator
} from '../agent-simulator.js';

import {
	RectangleGraph
}from '../graph.js';

import {
	linearDistribution
} from '../distribution.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'standing-ovation';

class StandingOvationSimulator extends AgentSimulator {

	get name() {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	generateAgent(index, graph, simOptions, rnd) {
		return {
			...this.baseAgent(rnd),
			standing: false,
			ovationPropensity: linearDistribution(simOptions.averageOvationPropensity, simOptions.ovationPropensitySpread, rnd),
			//how good this person thought the performance was
			performanceQuality: linearDistribution(simOptions.averagePerformanceQuality, simOptions.performanceQualitySpread, rnd),
		};
	}

	generateGraph(simOptions, rnd, simWidth, simHeight) {
		//Stage is to the left 
		return RectangleGraph.make(simOptions.rows, simOptions.cols, simWidth, simHeight, {diagonalLeft: true, noVertical: true, noRight: true});
	}

	generateFirstFrameExtra() {
		return {
			changesMade: false,
		};
	}

	numStarterAgents(graph, simOptions) {
		return Math.floor(Object.keys(graph.nodes()).length * simOptions.filledSeatProportion);
	}

	simulationComplete(frame) {
		return frame.index > 0 && !frame.changesMade;
	}

	beforeGenerateFrame(frame) {
		frame.changesMade = false;
	}

	defaultAgentTick(agent, agents, graph, frame) {
		//Agents that are already standing never sit again.
		if (agent.standing) return agent;
		//TODO: also consider standing if people in front of us are standing
		
		//Stand if we though the performance was good enough.
		if (agent.performanceQuality > (1.0 - agent.ovationPropensity)) {
			frame.changesMade = true;
			return {
				...agent,
				standing: true,
			};
		}
		return agent;
	}

	defaultNodeTick(node) {
		return {...node, value: node.value + node.growthRate};
	}

	frameScorer(frame) {
		return [this.simulationComplete(frame) ? (frame.agents.every(agent => agent.standing) ? 1.0 : 0.0) : -1];
	}
	
	get optionsConfig() {
		return {
			rows: {
				example: 5,
				shortName: 'r',
				description: 'Number of rows in the theater',
			},
			cols: {
				example: 5,
				shortName: 'c',
				description: 'Number of cols in the theater',
			},
			filledSeatProportion: {
				example: 0.75,
				min: 0.0,
				max: 1.0,
				step: 0.01,
				optional: true,
				default: true,
				shortName: 'fSP',
				description: 'What percentage of seats should be filled'
			},
			averagePerformanceQuality: {
				example: 0.5,
				min: 0.0,
				max: 1.0,
				step: 0.01,
				optional: true,
				default: true,
				shortName: 'aPQ',
				description: 'The average intrinsic quality of a performance'
			},
			performanceQualitySpread: {
				example: 0.5,
				min: 0.0,
				max: 1.0,
				step: 0.01,
				optional: true,
				default: true,
				shortName: 'pQS',
				description: 'The spread of how much a given performance\'s quality might differ from average'
			},
			averageOvationPropensity: {
				example: 0.75,
				min: 0.0,
				max: 1.0,
				step: 0.01,
				optional: true,
				default: true,
				shortName: 'aOP',
				description: 'How likely a typical person is to do a standing ovation'
			},
			ovationPropensitySpread: {
				example: 0.15,
				min: 0.0,
				max: 1.0,
				step: 0.01,
				optional: true,
				default: true,
				shortName: 'oPS',
				description: 'How much +/- range there is in agents\' propensity to do a standing ovation.'
			}
		};
	}

	renderer() {
		return new StandingOvationRenderer();
	}
}

export default StandingOvationSimulator;

import { PositionedGraphRenderer } from '../renderer.js';

class StandingOvationRenderer extends PositionedGraphRenderer {
	agentEmoji(agent) {
		return agent.standing ? '🧍' : '🧎';
	}
}

window.customElements.define(SIMULATOR_NAME + "-renderer", StandingOvationRenderer);