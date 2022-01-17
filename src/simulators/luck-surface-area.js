import {
	AgentSimulator
} from '../agent-simulator.js';

import {
	ForceLayoutGraph
}from '../graph/force-layout.js';

import {
	DistributionConfig
} from '../distribution.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'luck-surface-area';

const nodePercentage = new DistributionConfig({average: 1.0, default: true, description: 'The percentage size of nodes to start'});

class AgentDemoSimulator extends AgentSimulator {

	get name() {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	generateGraph(simOptions, rnd, simWidth, simHeight) {
		const o = simOptions.opportunities;
		const d = nodePercentage.distribution(o.size.percentange);
		return ForceLayoutGraph.makeBloomGraph(simWidth, simHeight, rnd, {
			levels: o.levels,
			childCount: o.childCount,
			childFactor: o.childFactor,
			minNodeSize: o.size.min,
			maxNodeSize: o.size.max,
			nodeSize: (node, rnd) => d.sample(rnd)
		});
	}

	numStarterAgents(graph, simOptions) {
		return simOptions.agents;
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
			'agents': {
				example: 6,
				optional: true,
				backfill: true,
				default: true,
				description: 'The number of agents',
			},
			'rounds': {
				example: 15,
				optional: true,
				backfill: true,
				default: true,
				shortName: 'n',
				description: 'The number of rounds'
			},
			opportunities: {
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
}

window.customElements.define(SIMULATOR_NAME + "-renderer", LuckSurfaceAreaRenderer);