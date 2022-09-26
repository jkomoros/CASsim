import {
	Agent,
	AgentSimulationFrame,
	AgentSimulator
} from '../agent-simulator.js';

import {
	OptionsConfigMap,
	SimulatorType
} from '../types.js';

import {
	Graph
} from '../graph/graph.js';

import {
	PositionedGraph
} from '../graph/positioned.js';

import {
	StubSimOptions
} from './types/stub.GENERATED.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'stub';

type StubAgent = Agent & {
	emoji : string;
};

interface StubSimulationFrame extends AgentSimulationFrame<StubAgent> {
	agents : StubAgent[];
	simOptions : StubSimOptions;
}

class StubSimulator extends AgentSimulator<StubAgent, StubSimulationFrame, Graph> {

	override get name() : SimulatorType {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	override generatePositions() : Graph {
		return null;
	}

	override simulationComplete(frame : StubSimulationFrame) : boolean {
		return frame.index >= frame.simOptions.rounds;
	}
	
	override get optionsConfig() : OptionsConfigMap {
		//When you modify this method, re-run `npm run generate` to update the types and schema checking
		return {
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
		return new StubRenderer();
	}
}

export default StubSimulator;

/************************************************************************
*  All imports (including transitive ones) of lit must occur below the  *
*  `export default ...` line that is immediately above this comment     *
************************************************************************/

import { PositionedGraphRenderer } from '../renderer.js';

class StubRenderer extends PositionedGraphRenderer<StubAgent, StubSimulationFrame, PositionedGraph> {}

window.customElements.define(SIMULATOR_NAME + "-renderer", StubRenderer);