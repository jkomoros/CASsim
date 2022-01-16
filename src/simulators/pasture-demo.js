import {
	AgentSimulator
} from '../agent-simulator.js';

import {
	GRAZING_FARM_ANIMALS_EMOJIS,
	pickEmoji
} from '../emojis.js';

import {
	RectangleGraph
}from '../graph/rectangle.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'pasture-demo';

class AgentDemoSimulator extends AgentSimulator {

	get name() {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	generateAgent(parentAgent, otherAgents, graph, simOptions, rnd) {
		const [emojiKey, emoji] = pickEmoji(GRAZING_FARM_ANIMALS_EMOJIS, parentAgent ? parentAgent.type : rnd);
		return {
			...this.baseAgent(rnd),
			emoji: emoji,
			type: emojiKey,
			deathLikelihood: simOptions.deathLikelihood,
			spawnLikelihood: simOptions.spawnLikelihood,
		};
	}

	generateGraph(simOptions, rnd, simWidth, simHeight) {
		return RectangleGraph.make(simOptions.rows, simOptions.cols, simWidth, simHeight, {starterValues: {value:0.0, growthRate: 0.05, emoji:'🌿'}, nodeMargin: 0.1, diagonal:true});
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
			const spawnedAgent = this.generateAgent(agent, agents, graph, frame.simOptions, rnd);
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
				id:'agent-count',
				description: 'Number of total active agents in the simulation',
			},
			{
				id: 'total-node-value',
				description: 'The sum of values for all cells',
			}
		];
	}
	
	get optionsConfig() {
		return {
			'agents': {
				example: 6,
				optional: true,
				backfill: true,
				default: true,
				description: 'The number of agents',
			},
			'rows': {
				example: 5,
				optional:true,
				backfill: true,
				default: true,
				description: 'Number of rows in the map',
			},
			'cols': {
				example: 5,
				optional:true,
				backfill: true,
				default: true,
				description: 'Number of cols in the map',
			},
			'rounds': {
				example: 15,
				optional: true,
				backfill: true,
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
				backfill: true,
				default: true,
				description: "How quickly value grows in each cell"
			},
			'spawnLikelihood': {
				example: 0.05,
				step: 0.01,
				max: 1.0,
				min: 0.0,
				optional:true,
				backfill: true,
				default: true,
				description: 'On each frame, how likely a given agent is to spawn a child',
			},
			'deathLikelihood': {
				example: 0.03,
				step: 0.01,
				max:  1.0,
				min: 0.0,
				optional:true,
				backfill:true,
				default: true,
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

import { css } from "lit-element";

class AgentDemoRenderer extends PositionedGraphRenderer {
	static get styles() {
		return [
			PositionedGraphRenderer.styles,
			css`
				/* because our agents have a .type, that className is rendered out so we can style them */
				.agent.cow {
					filter: invert(100%);
				}
			`
		];
	}

	nodeTextOpacity(node) {
		return node.value;
	}
}

window.customElements.define(SIMULATOR_NAME + "-renderer", AgentDemoRenderer);