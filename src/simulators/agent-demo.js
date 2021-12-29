import {
	AgentSimulator
} from '../agent-simulator.js';

import {
	GRAZING_FARM_ANIMALS_EMOJIS
} from '../emojis.js';

import {
	RectangleGraph
}from '../graph.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'agent-demo';

class AgentDemoSimulator extends AgentSimulator {

	get name() {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	generateAgent(index, graph, simOptions, rnd) {
		const emojiValues = Object.values(GRAZING_FARM_ANIMALS_EMOJIS);
		return {
			emoji: emojiValues[Math.floor(emojiValues.length * rnd())]
		};
	}

	generateGraph(simOptions) {
		return RectangleGraph.make(simOptions.rows, simOptions.cols, {value:0.0, growthRate: 0.05});
	}

	numStarterAgents(graph, simOptions) {
		return simOptions.agents;
	}

	simulationComplete(frame) {
		return frame.index >= frame.simOptions.rounds;
	}

	defaultAgentTick(agent, agents, graph, frame, rnd) {
		const node = this.selectNodeToMoveTo(agent, agents, graph, frame, rnd, 1, (node) => node.value);
		//Sometimes there won't be any open cells next to us.
		if (!node) return agent;
		graph.setNodeProperty(node, 'value', 0.0);
		return {...agent, node};
	}

	defaultNodeTick(node) {
		return {...node, value: node.value + node.growthRate};
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
			},
			'growthRate': {
				example: 0.05,
				optional: true,
				default: true,
				shortName: 'gR',
				description: "How quickly value grows in each cell"
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