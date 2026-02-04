import {
	Agent,
	AgentSimulationFrame,
	AgentSimulator,
	NodeScorer
} from '../agent-simulator.js';

import {
	DistributionConfig,
	FIXED
} from '../distribution.js';

import {
	Urn
} from '../util.js';

import {
	pickEmoji,
	PROFESSIONAL_PEOPLE_EMOJIS
} from '../emojis.js';

import {
	graphOptionsConfig,
	graphOptionsFromConfig
} from '../graph/options-config.js';

import {
	GraphNodeValues,
	OptionsConfigMap,
	RandomGenerator,
	ScoreConfigItem,
	SimulationFrame,
	SimulatorType
} from '../types.js';

import {
	Graph
} from '../graph/graph.js';

import {
	PositionedGraph
} from '../graph/positioned.js';

import {
	LuckSurfaceAreaSimOptions
} from './types/luck-surface-area.GENERATED.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'luck-surface-area';

const starterStrength = new DistributionConfig({
	average: 1.0,
	distribution: FIXED,
	default: true,
	description: 'The starter strength of agents that start at the beginning'
});

const starterValue = new DistributionConfig({
	average: 100.0,
	distribution: FIXED,
	limitMax: 1000.0,
	default: true,
	description: 'The starter value of agents that start at the beginning'
});

const cost = new DistributionConfig({
	average: 0.05,
	step: 0.001,
	limitMax: 100,
	distribution: FIXED,
	default: true,
	description: 'How much value cost an agent takes per time step'
});

type LuckSurfaceAreaAgent = Agent & {
	type : string;
	strength : number;
	emoji : string;
	value : number;
	cost : number;
};

interface LuckSurfaceAreaSimulationFrame extends AgentSimulationFrame<LuckSurfaceAreaAgent, PositionedGraph> {
	agents : LuckSurfaceAreaAgent[];
	simOptions : LuckSurfaceAreaSimOptions;
}

interface LuckSurfaceAreaGraphNodeValues extends GraphNodeValues {
	size : number;
	value : number;
	valueFalloff : number;
}

class LuckSurfaceAreaSimulator extends AgentSimulator<LuckSurfaceAreaAgent, LuckSurfaceAreaSimulationFrame, PositionedGraph> {

	override get name() : SimulatorType {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	override generatePositions(baseFrame : SimulationFrame, rnd : RandomGenerator) : PositionedGraph {
		const simOptions = baseFrame.simOptions as LuckSurfaceAreaSimOptions;
		const oS = simOptions.opportunities.structure;
		const oV = simOptions.opportunities.value;

		const [graphType, graphOptions] = graphOptionsFromConfig(oS);

		const extendedGraphOptions = {
			...graphOptions,
			nodeValues: {
				value: 0.0,
				valueFalloff: oV.falloff,
			},
		};

		return graphType.make(baseFrame.width, baseFrame.height, rnd, extendedGraphOptions);
	}

	override generateAgent(parentAgent : LuckSurfaceAreaAgent, _otherAgents : LuckSurfaceAreaAgent[], _graph : Graph, baseFrame : SimulationFrame, rnd : RandomGenerator) : LuckSurfaceAreaAgent {
		const simOptions = baseFrame.simOptions as LuckSurfaceAreaSimOptions;
		const emoji = pickEmoji(PROFESSIONAL_PEOPLE_EMOJIS, parentAgent ? parentAgent.type : rnd);
		return {
			...this.baseAgent(rnd),
			//Your own properties would go here in your own generateAgent
			strength: starterStrength.distribution(simOptions.agents.starterStrength).sample(rnd),
			type: emoji.name,
			emoji: emoji.emoji,
			value: starterValue.distribution(simOptions.agents.starterValue).sample(rnd),
			cost: cost.distribution(simOptions.agents.cost).sample(rnd),
		};
	}

	override framePreTick(graph : Graph, frame : LuckSurfaceAreaSimulationFrame, rnd : RandomGenerator) : void {
		if (rnd() < frame.simOptions.opportunities.value.likelihood) {
			const urn = new Urn<LuckSurfaceAreaGraphNodeValues>(rnd);
			for (const node of Object.values(graph.nodes()) as LuckSurfaceAreaGraphNodeValues[]) {
				urn.add(node, node.size);
			}
			const node = urn.pick();
			graph.setNodeProperty(node, 'value', 1.0);
		}
	}

	override defaultNodeTick(node : LuckSurfaceAreaGraphNodeValues) : LuckSurfaceAreaGraphNodeValues {
		if (node.value == 0.0) return node;
		return {
			...node,
			value: node.value * node.valueFalloff,
		};
	}

	override allowOverlappingAgents() : boolean {
		return true;
	}

	override defaultAgentTick(agent : LuckSurfaceAreaAgent, agents : LuckSurfaceAreaAgent[], graph : PositionedGraph, frame : LuckSurfaceAreaSimulationFrame, rnd : RandomGenerator) : LuckSurfaceAreaAgent {
		const node = graph.node(agent.node) as LuckSurfaceAreaGraphNodeValues;
		const newAgent = {
			...agent,
		};
		const targetNode = this.selectNodeToMoveTo(agent, agents, graph, frame, rnd, 3, ((node : GraphNodeValues) => (node as LuckSurfaceAreaGraphNodeValues).value) as NodeScorer) as LuckSurfaceAreaGraphNodeValues;
		if (targetNode && targetNode.value > node.value) {
			//Move. We might not be one step away.
			const [,path] = graph.shortestPath(node, targetNode);
			if (path) {
				newAgent.node = path[0].to;
			}
			
		} else {
			//Don't move.

			//Harvest any value for the node that we are currently sitting in if
			//there is any. Note that this doesn't take the value from the node.
			if (node.value) {
				newAgent.value = newAgent.value + (node.value * newAgent.strength);
			}
			newAgent.value -= newAgent.cost;
		}

		//Die if no more value left.
		if (newAgent.value <= 0.0) return null;

		return newAgent;
	}

	override numStarterAgents(_graph : Graph, baseFrame : SimulationFrame) : number {
		const simOptions = baseFrame.simOptions as LuckSurfaceAreaSimOptions;
		return simOptions.agents.count;
	}

	override simulationComplete(frame : LuckSurfaceAreaSimulationFrame) : boolean {
		return frame.index >= frame.simOptions.rounds;
	}

	override frameScorer(frame : LuckSurfaceAreaSimulationFrame) : [number, number] {
		const finalScore = this.simulationComplete(frame) ? 1.0 : -1;
		return [finalScore, Object.keys(frame.agents).length];
	}

	override scoreConfig() : [ScoreConfigItem, ScoreConfigItem] {
		return [
			null,
			{
				id:'agent-count',
				description: 'The count of all active agents',
			}
		];
	}
	
	override get optionsConfig() : OptionsConfigMap {
		//When you modify this method, re-run `npm run generate` to update the types and schema checking
		return {
			agents: {
				description: 'Configuration related to agents',
				example: {
					count: {
						example: 1,
						optional: true,
						backfill: true,
						default: true,
						description: 'The number of agents',
					},
					cost: cost.optionsConfig,
					starterStrength: starterStrength.optionsConfig,
					starterValue: starterValue.optionsConfig,
				},
				default: true,
				optional: true,
				backfill: true,
			},
			rounds: {
				example: 150,
				optional: true,
				backfill: true,
				default: true,
				shortName: 'n',
				description: 'The number of rounds'
			},
			opportunities: {
				example: {
					value: {
						description: 'Properties related to how value shows up in the graph',
						example: {
							likelihood: {
								example: 0.25,
								min: 0.0,
								max: 1.0,
								step: 0.005,
								optional: true,
								backfill: true,
								default: true,
								description: 'In each time tick, the likelihood that a random node is '
							},
							falloff: {
								example: 0.9,
								min: 0.0,
								max: 2.0,
								step: 0.001,
								optional: true,
								backfill: true,
								default: true,
								description: 'On each frame tick, what multiplier we should use to get the new node value'
							},
						},
						optional: true,
						default: true,
						backfill: true,
					},
					structure: {
						example: graphOptionsConfig(),
						optional: true,
						default: true,
						backfill: true,
						description: 'The static structure of the opportunity graph'
					},
				},
				optional: true,
				default: true,
				backfill: true,
				description: 'The opportunities to show up in the graph'
			}

		};
	}

	override renderer() {
		return new LuckSurfaceAreaRenderer();
	}
}

export default LuckSurfaceAreaSimulator;

/************************************************************************
*  All imports (including transitive ones) of lit must occur below the  *
*  `export default ...` line that is immediately above this comment     *
************************************************************************/

import { PositionedAgentsRenderer } from '../renderer.js';

class LuckSurfaceAreaRenderer extends PositionedAgentsRenderer<LuckSurfaceAreaAgent, LuckSurfaceAreaSimulationFrame, PositionedGraph> {

	override renderEdges() : boolean {
		return true;
	}

	override agentOpacity(agent : LuckSurfaceAreaAgent) : number {
		return agent.value / 100.0;
	}
}

window.customElements.define(SIMULATOR_NAME + "-renderer", LuckSurfaceAreaRenderer);