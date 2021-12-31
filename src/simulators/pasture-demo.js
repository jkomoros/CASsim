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
const SIMULATOR_NAME = 'pasture-demo';

class AgentDemoSimulator extends AgentSimulator {

	get name() {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	generateAgent(index, graph, simOptions, rnd) {
		const emojiValues = Object.values(GRAZING_FARM_ANIMALS_EMOJIS);
		return {
			...this.baseAgent(rnd),
			emoji: emojiValues[Math.floor(emojiValues.length * rnd())],
			deathLikelihood: simOptions.deathLikelihood,
			spawnLikelihood: simOptions.spawnLikelihood,
		};
	}

	generateGraph(simOptions, rnd, simWidth, simHeight) {
		return RectangleGraph.make(simOptions.rows, simOptions.cols, simWidth, simHeight, {value:0.0, growthRate: 0.05, emoji:'🌿'}, {nodeMargin: 0.1, diagonal:true});
	}

	numStarterAgents(graph, simOptions) {
		return simOptions.agents;
	}

	simulationComplete(frame) {
		return frame.index >= frame.simOptions.rounds;
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

	scoreConfig() {
		return [
			null,
			{
				id:'agent-count'
			},
			{
				id: 'total-node-value'
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
				step: 0.01,
				max: 1.0,
				min: 0.0,
				optional: true,
				default: true,
				shortName: 'gR',
				description: "How quickly value grows in each cell"
			},
			'spawnLikelihood': {
				example: 0.05,
				step: 0.01,
				max: 1.0,
				min: 0.0,
				optional:true,
				default: true,
				shortName: 'sL',
				description: 'On each frame, how likely a given agent is to spawn a child',
			},
			'deathLikelihood': {
				example: 0.03,
				step: 0.01,
				max:  1.0,
				min: 0.0,
				optional:true,
				default:true,
				shortName: 'dL',
				description: 'On each frame, how likely a given agent is to die.',
			}
		};
	}

	renderer() {
		return new AgentDemoRenderer();
	}
}

export default AgentDemoSimulator;

import { PositionedGraphRenderer } from '../renderer.js';

class AgentDemoRenderer extends PositionedGraphRenderer {
	opacityForNodeText(node) {
		return node.value;
	}
}

window.customElements.define(SIMULATOR_NAME + "-renderer", AgentDemoRenderer);