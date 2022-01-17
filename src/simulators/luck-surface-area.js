import {
	AgentSimulator
} from '../agent-simulator.js';

import {
	ForceLayoutGraph
}from '../graph/force-layout.js';

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

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'luck-surface-area';

const nodePercentage = new DistributionConfig({average: 0.5, spread:0.5, default: true, description: 'The percentage size of nodes to start'});
const starterStrength = new DistributionConfig({average: 1.0, distribution: FIXED, default: true, description: 'The starter strength of agents that start at the beginning'});
const starterValue = new DistributionConfig({average: 100.0, distribution: FIXED, limitMax: 1000.0, default: true, description: 'The starter value of agents that start at the beginning'});
const cost = new DistributionConfig({average: 0.05, step: 0.001, distribution: FIXED, default: true, description: 'How much value cost an agent takes per time step'});

class AgentDemoSimulator extends AgentSimulator {

	get name() {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	generateGraph(simOptions, rnd, simWidth, simHeight) {
		const oS = simOptions.opportunities.structure;
		const oV = simOptions.opportunities.value;
		const d = nodePercentage.distribution(oS.size.percentange);
		return ForceLayoutGraph.makeBloomGraph(simWidth, simHeight, rnd, {
			levels: oS.levels,
			childCount: oS.childCount,
			childFactor: oS.childFactor,
			childLinkLikelihood: oS.childLinkLikelihood,
			randomLinkLikelihood: oS.randomLinkLikelihood,
			nodeValues: {
				value: 0.0,
				valueFalloff: oV.falloff,
			},
			minNodeSize: oS.size.min,
			maxNodeSize: oS.size.max,
			nodeSize: (node, rnd) => d.sample(rnd)
		});
	}

	generateAgent(parentAgent, otherAgents, graph, simOptions, rnd) {
		const [emojiType, emoji] = pickEmoji(PROFESSIONAL_PEOPLE_EMOJIS, parentAgent ? parentAgent.type : rnd);
		return {
			...this.baseAgent(rnd),
			//Your own properties would go here in your own generateAgent
			strength: starterStrength.distribution(simOptions.agents.starterStrength).sample(rnd),
			type:emojiType,
			emoji: emoji,
			value: starterValue.distribution(simOptions.agents.starterValue).sample(rnd),
			cost: cost.distribution(simOptions.agents.cost).sample(rnd),
		};
	}

	framePreTick(graph, frame, rnd) {
		if (rnd() < frame.simOptions.opportunities.value.likelihood) {
			const urn = new Urn(rnd);
			for (const node of Object.values(graph.nodes())) {
				urn.add(node, node.size);
			}
			const node = urn.pick();
			graph.setNodeProperty(node, 'value', 1.0);
		}
	}

	defaultNodeTick(node) {
		if (node.value == 0.0) return node;
		return {
			...node,
			value: node.value * node.valueFalloff,
		};
	}

	defaultAgentTick(agent, agents, graph) {
		const node = graph.node(agent.node);
		const newAgent = {
			...agent,
		};
		//Harvest any value for the node that we are currently sitting in if
		//there is any. Note that this doesn't take the value from the node.
		if (node.value) {
			newAgent.value = newAgent.value + (node.value * newAgent.strength);
		}
		newAgent.value -= newAgent.cost;

		//Die if no more value left.
		if (newAgent.value <= 0.0) return null;

		return newAgent;
	}

	numStarterAgents(graph, simOptions) {
		return simOptions.agents.count;
	}

	simulationComplete(frame) {
		return frame.index >= frame.simOptions.rounds;
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
				description: 'The count of all active agents',
			}
		];
	}
	
	get optionsConfig() {
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
						example: {
							levels: {
								example: 3,
								max: 100.0,
								step: 1.0,
								optional: true,
								default: true,
								backfill: true,
								description: 'Number of levels'
							},
							childCount: {
								example: 5.0,
								max: 100.0,
								min: 0.0,
								step: 1.0,
								optional: true,
								default: true,
								backfill: true,
								description: 'Number of children per level to start'
							},
							childFactor: {
								example: 1.0,
								max: 1.5,
								min: 0.0,
								step: 0.01,
								optional: true,
								default: true,
								backfill: true,
								description: 'Child factor'
							},
							childLinkLikelihood: {
								example: 0.0,
								min: 0.0,
								max: 1.0,
								step: 0.01,
								optional: true,
								default: true,
								backfill: true,
								description: 'How likely children of a parent are to have a link between each other',
							},
							randomLinkLikelihood: {
								example: 0.0,
								min: 0.0,
								max: 1.0,
								step: 0.001,
								optional: true,
								default: true,
								backfill: true,
								description: 'How likely two random nodes are to have a link between each other. This gets extremely strong even for small values',
							},
							size: {
								example: {
									max: {
										example: 50.0,
										max: 500.0,
										step: 1.0,
										default: true,
										backfill: true,
										optional: true,
										description: 'The max rendered size of an opportunity'
									},
									min: {
										example: 5.0,
										max: 500.0,
										step: 1.0,
										default: true,
										backfill: true,
										optional: true,
										description: 'The max rendered size of an opportunity'
									},
									percentange: nodePercentage.optionsConfig,
								},
								optional: true,
								default: true,
								backfill: true,
								description: 'Configuration for the size of the nodes'
							}
						},
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

	renderer() {
		return new LuckSurfaceAreaRenderer();
	}
}

export default AgentDemoSimulator;

import { PositionedGraphRenderer } from '../renderer.js';

class LuckSurfaceAreaRenderer extends PositionedGraphRenderer {

	renderEdges() {
		return true;
	}

	agentOpacity(agent) {
		return agent.value / 100.0;
	}
}

window.customElements.define(SIMULATOR_NAME + "-renderer", LuckSurfaceAreaRenderer);