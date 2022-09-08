import {
	Agent,
	AgentSimulationFrame,
	AgentSimulator
} from '../agent-simulator.js';

import {
	GRAZING_FARM_ANIMALS_EMOJIS,
	pickEmoji
} from '../emojis.js';

import {
	RectangleGraph
}from '../graph/rectangle.js';

import {
	Graph
} from '../graph/graph.js';

import {
	GraphNodeID,
	GraphNodeValues,
	OptionsConfigMap,
	RandomGenerator,
	ScoreConfigItem
} from '../types.js';

import {
	SimulatorType
} from '../dynamic-types.js';

import {
	PastureSimOptions
} from './types/pasture-demo.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'pasture-demo';

type PastureAgent = Agent & {
	emoji: string;
	type: string;
	deathLikelihood: number;
	spawnLikelihood: number;
	node: GraphNodeID;
};

interface PastureSimulationFrame extends AgentSimulationFrame {
	agents : PastureAgent[];
	simOptions: PastureSimOptions;
}

interface PastureGraphNodeValues extends GraphNodeValues {
	value: number;
	growthRate: number;
	emoji: string;
}

class AgentDemoSimulator extends AgentSimulator {

	override get name() : SimulatorType {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	override generateAgent(parentAgent : PastureAgent, _otherAgents : PastureAgent[], _graph : Graph, simOptions : PastureSimOptions, rnd : RandomGenerator) : PastureAgent {
		const [emojiKey, emoji] = pickEmoji(GRAZING_FARM_ANIMALS_EMOJIS, parentAgent ? parentAgent.type : rnd);
		return {
			...this.baseAgent(rnd),
			node: '',
			emoji: emoji,
			type: emojiKey,
			deathLikelihood: simOptions.deathLikelihood,
			spawnLikelihood: simOptions.spawnLikelihood,
		};
	}

	override generateGraph(simOptions : PastureSimOptions, _rnd : RandomGenerator, simWidth : number, simHeight : number) : Graph {
		const starterValues : PastureGraphNodeValues =  {id: '', value:0.0, growthRate: simOptions.growthRate, emoji:'🌿'};
		return RectangleGraph.make(simOptions.rows, simOptions.cols, simWidth, simHeight, {starterValues, nodeMargin: 0.1, diagonal:true});
	}

	override numStarterAgents(_graph : Graph, simOptions : PastureSimOptions) : number {
		return simOptions.agents;
	}

	override simulationComplete(frame : PastureSimulationFrame) : boolean {
		return frame.index >= frame.simOptions.rounds;
	}

	override defaultAgentTick(agent : PastureAgent, agents : PastureAgent[], graph : Graph, frame : PastureSimulationFrame, rnd : RandomGenerator) : PastureAgent | PastureAgent[] {
		if (rnd() < agent.deathLikelihood) return null;
		const node = this.selectNodeToMoveTo(agent, agents, graph, frame, rnd, 1, (node : PastureGraphNodeValues) => node.value);
		//Sometimes there won't be any open cells next to us.
		if (!node) return agent;
		graph.setNodeProperty(node, 'value', 0.0);
		const newAgent = {...agent, node : node.id};
		if (rnd() < agent.spawnLikelihood) {
			//Spawn a new agent
			const spawnedAgent = this.generateAgent(agent, agents, graph, frame.simOptions, rnd);
			spawnedAgent.node = agent.node;
			return [newAgent, spawnedAgent];
		}
		return newAgent;
	}

	override defaultNodeTick(node : PastureGraphNodeValues) : PastureGraphNodeValues {
		return {...node, value: node.value + node.growthRate};
	}

	override frameScorer(frame : PastureSimulationFrame) : [number, number, number] {
		const finalScore = this.simulationComplete(frame) ? 1.0 : -1;
		const graph = new RectangleGraph(frame.graph);
		return [finalScore, Object.keys(frame.agents).length, Object.values(graph.nodes()).map((values : PastureGraphNodeValues) => values.value).reduce((prev, next) => prev + next, 0)];
	}

	override scoreConfig() : [ScoreConfigItem, ScoreConfigItem, ScoreConfigItem] {
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
	
	override get optionsConfig() : OptionsConfigMap {
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

	override renderer() {
		return new AgentDemoRenderer();
	}
}

export default AgentDemoSimulator;

import { PositionedGraphRenderer } from '../renderer.js';

import { css } from 'lit';

class AgentDemoRenderer extends PositionedGraphRenderer {
	static override get styles() {
		return [
			...PositionedGraphRenderer.styles,
			css`
				/* because our agents have a .type, that className is rendered out so we can style them */
				.agent.cow {
					filter: invert(100%);
				}
			`
		];
	}

	override nodeTextOpacity(node : PastureGraphNodeValues) : number {
		return node.value;
	}
}

window.customElements.define(SIMULATOR_NAME + "-renderer", AgentDemoRenderer);