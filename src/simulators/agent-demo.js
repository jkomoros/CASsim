import {
	BaseSimulator
} from '../simulator.js';

import {
	RectangleGraph
} from '../graph.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'agent-demo';

class AgentDemoSimulator extends BaseSimulator {

	get name() {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	generateFirstFrame(simOptions, rnd) {
		//The default generator will expand this with index and simOptions.
		const graph = RectangleGraph.make(simOptions.rows, simOptions.cols);
		const agents = [];
		const nodes = Object.keys(graph.nodes());
		for (let i = 0; i < simOptions.agents; i++) {
			const node = nodes[Math.floor(rnd() * nodes.length)];
			agents.push({node});
		}
		return {
			agents,
			graph: graph.data
		};
	}

	simulationComplete(frame) {
		return frame.index >= frame.simOptions.rounds;
	}

	generateFrame(frame, rnd) {
		const graph = new RectangleGraph(frame.graph);
		const newAgents = [];
		for (const [index, agent] of frame.agents.entries()) {
			const neighbors = Object.keys(graph.neighbors(agent.node));
			newAgents[index] = {...agent, node: neighbors[Math.floor(neighbors.length * rnd())]};
		}
		frame.agents = newAgents;
	}

	frameScorer(frame) {
		const finalScore = this.simulationComplete(frame) ? 1.0 : -1;
		return [finalScore, Object.keys(frame.agents).length];
	}

	scoreConfig() {
		return [
			null,
			{
				id:'agent-count',
				title: 'Agent Count'
			}
		];
	}
	
	get optionsConfig() {
		return {
			'agents': {
				example: 6,
				optional: true,
				default: true,
				shortName: 'a',
				description: 'The number of agents',
			},
			'rows': {
				example: 5,
				optional:true,
				default: true,
				shortName: 'r',
				description: 'Number of rows in the map',
			},
			'cols': {
				example: 5,
				optional:true,
				default: true,
				shortName: 'c',
				description: 'Number of cols in the map',
			},
			'rounds': {
				example: 15,
				optional: true,
				default: true,
				shortName: 'n',
				description: 'The number of rounds'
			}
		};
	}

	renderer() {
		return new RectangleGraphRenderer();
	}
}

export default AgentDemoSimulator;

import { RectangleGraphRenderer } from '../renderer.js';

window.customElements.define(SIMULATOR_NAME + "-renderer", RectangleGraphRenderer);