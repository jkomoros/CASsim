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

	numStarterAgents(graph, simOptions) {
		return Math.floor(Object.keys(graph.nodes()).length * simOptions.filledSeatProportion);
	}

	simulationComplete(frame) {
		//TODO: return true if the count of standing people in this frame and lastFrame are the same
		return frame.index >= 10;
	}

	defaultAgentTick(agent, agents, graph, frame, rnd) {
		if (rnd() < agent.deathLikelihood) return null;
		const node = this.selectNodeToMoveTo(agent, agents, graph, frame, rnd, 1, (node) => node.value);
		//Sometimes there won't be any open cells next to us.
		if (!node) return agent;
		graph.setNodeProperty(node, 'value', 0.0);
		const newAgent = {...agent, node};
		if (rnd() < agent.spawnLikelihood) {
			//Spawn a new agent
			const spawnedAgent = this.generateAgent(0, graph, frame.simOptions, rnd);
			spawnedAgent.node = agent.node;
			return [newAgent, spawnedAgent];
		}
		return newAgent;
	}

	defaultNodeTick(node) {
		return {...node, value: node.value + node.growthRate};
	}

	frameScorer(frame) {
		const finalScore = this.simulationComplete(frame) ? 1.0 : -1;
		const graph = new RectangleGraph(frame.graph);
		return [finalScore, Object.keys(frame.agents).length, Object.values(graph.nodes()).map(values => values.value).reduce((prev, next) => prev + next, 0)];
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
		return new PositionedGraphRenderer();
	}
}

export default StandingOvationSimulator;

import { PositionedGraphRenderer } from '../renderer.js';

window.customElements.define(SIMULATOR_NAME + "-renderer", PositionedGraphRenderer);