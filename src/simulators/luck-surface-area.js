import {
	AgentSimulator
} from '../agent-simulator.js';

import {
	ForceLayoutGraph
}from '../graph/force-layout.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'luck-surface-area';

class AgentDemoSimulator extends AgentSimulator {

	get name() {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	generateGraph(simOptions, rnd, simWidth, simHeight) {
		return ForceLayoutGraph.makeBloomGraph(simWidth, simHeight, {levels:simOptions.levels});
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
			levels: {
				example: 3,
				max: 100.0,
				step: 1.0,
				optional: true,
				default: true,
				backfill: true,
				description: 'Number of levels'
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