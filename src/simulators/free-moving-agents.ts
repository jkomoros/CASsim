import {
	Agent,
	AgentSimulationFrame,
	AgentSimulator
} from '../agent-simulator.js';

import {
	OptionsConfigMap,
	SimulationFrame,
	RandomGenerator,
	SimulatorType
} from '../types.js';

import {
	Graph
} from '../graph/graph.js';

import {
	FreeMovingAgentsSimOptions
} from './types/free-moving-agents.GENERATED.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'free-moving-agents';

type FreeMovingAgentsAgent = Agent & {
	emoji : string;
};

interface FreeMovingAgentsSimulationFrame extends AgentSimulationFrame {
	agents : FreeMovingAgentsAgent[];
	simOptions : FreeMovingAgentsSimOptions;
}

class FreeMovingAgentsSimulator extends AgentSimulator {

	override get name() : SimulatorType {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	override generateGraph() : Graph {
		return null;
	}

	override simulationComplete(frame : FreeMovingAgentsSimulationFrame) : boolean {
		return frame.index >= frame.simOptions.rounds;
	}

	override numStarterAgents(_graph : Graph, baseFrame : SimulationFrame) : number {
		const simOptions = baseFrame.simOptions as FreeMovingAgentsSimOptions;
		return simOptions.agents;
	}

	override generateAgent(_parentAgent : FreeMovingAgentsAgent, _otherAgents : FreeMovingAgentsAgent[], _graph : Graph, baseFrame : SimulationFrame, rnd : RandomGenerator) : FreeMovingAgentsAgent {
		return {
			...this.baseAgent(rnd),
			emoji: '🐞',
			x: baseFrame.width * rnd(),
			y: baseFrame.height * rnd()
		};
	}
	
	override get optionsConfig() : OptionsConfigMap {
		//When you modify this method, re-run `npm run generate` to update the types and schema checking
		return {
			agents: {
				example: 5,
				optional: true,
				backfill: true,
				default: true,
				description: 'The number of starter agents'
			},
			rounds: {
				example: 150,
				optional: true,
				backfill: true,
				default: true,
				shortName: 'n',
				description: 'The number of rounds'
			}
		};
	}

	override renderer() {
		return new FreeMovingAgentsRenderer();
	}
}

export default FreeMovingAgentsSimulator;

/************************************************************************
*  All imports (including transitive ones) of lit must occur below the  *
*  `export default ...` line that is immediately above this comment     *
************************************************************************/

import { PositionedGraphRenderer } from '../renderer.js';

class FreeMovingAgentsRenderer extends PositionedGraphRenderer {

	override agentDefaultMaxNodeSize() : number {
		return 50;
	}

}

window.customElements.define(SIMULATOR_NAME + "-renderer", FreeMovingAgentsRenderer);