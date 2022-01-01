import {
	AgentSimulator
} from '../agent-simulator.js';

import {
	RectangleGraph
}from '../graph.js';

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
		};
	}

	generateGraph(simOptions, rnd, simWidth, simHeight) {
		return RectangleGraph.make(simOptions.rows, simOptions.cols, simWidth, simHeight);
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

	defaultAgentTick(agent) {
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
			'rows': {
				example: 5,
				shortName: 'r',
				description: 'Number of rows in the theater',
			},
			'cols': {
				example: 5,
				shortName: 'c',
				description: 'Number of cols in the theater',
			},
			'filledSeatProportion': {
				example: 0.75,
				min: 0.0,
				max: 1.0,
				step: 0.01,
				optional: true,
				default: true,
				shortName: 'fSP',
				description: 'What percentage of seats should be filled'
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