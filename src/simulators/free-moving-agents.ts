import {
	Agent,
	AgentSimulationFrame,
	AgentSimulator
} from '../agent-simulator.js';

import {
	OptionsConfigMap,
	SimulationFrame,
	RandomGenerator,
	SimulatorType,
	Angle
} from '../types.js';

import {
	newPosition,
	randomAngle
} from '../util.js';

import {
	Graph
} from '../graph/graph.js';

import {
	PositionedGraph
} from '../graph/positioned.js';

import {
	DistributionConfig,
	NORMAL
} from '../distribution.js';

import {
	INSECT_EMOJIS
} from '../emojis.js';

import {
	FreeMovingAgentsSimOptions
} from './types/free-moving-agents.GENERATED.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'free-moving-agents';

const agentSpeed = new DistributionConfig({
	average: 3.0,
	spread: 1.5,
	limitMax: 10.0,
	distribution: NORMAL,
	default: true,
	description: 'The starter strength of agents that start at the beginning'
});

type FreeMovingAgentsAgent = Agent & {
	//Make a few optional properties in Agent required
	emoji : string;
	x : number;
	y : number;
	//Add a few new ones
	angle : Angle;
	speed : number;
};

interface FreeMovingAgentsSimulationFrame extends AgentSimulationFrame<FreeMovingAgentsAgent, Graph> {
	agents : FreeMovingAgentsAgent[];
	simOptions : FreeMovingAgentsSimOptions;
}

class FreeMovingAgentsSimulator extends AgentSimulator<FreeMovingAgentsAgent, FreeMovingAgentsSimulationFrame, Graph> {

	override get name() : SimulatorType {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	override generatePositions() : Graph {
		return null;
	}

	override simulationComplete(frame : FreeMovingAgentsSimulationFrame) : boolean {
		return frame.index >= frame.simOptions.rounds;
	}

	override numStarterAgents(_graph : Graph, baseFrame : SimulationFrame) : number {
		const simOptions = baseFrame.simOptions as FreeMovingAgentsSimOptions;
		return simOptions.agents.count;
	}

	override generateAgent(_parentAgent : FreeMovingAgentsAgent, _otherAgents : FreeMovingAgentsAgent[], _graph : Graph, baseFrame : SimulationFrame, rnd : RandomGenerator) : FreeMovingAgentsAgent {
		const simOptions = baseFrame.simOptions as FreeMovingAgentsSimOptions;
		return {
			...this.baseAgent(rnd),
			emoji: simOptions.agents.emoji,
			x: baseFrame.width * rnd(),
			y: baseFrame.height * rnd(),
			angle: randomAngle(rnd),
			speed: agentSpeed.distribution(simOptions.agents.speed).sample(rnd),
		};
	}

	override defaultAgentTick(agent: FreeMovingAgentsAgent, _agents : FreeMovingAgentsAgent[], _graph : Graph, frame : FreeMovingAgentsSimulationFrame): FreeMovingAgentsAgent | FreeMovingAgentsAgent[] {
		//frame contains width, height, so we can pass it to express the
		//allowable bounds, which will be reflected when they exceed them.
		const [x, y, angle] = newPosition(agent, frame);
		return {
			...agent,
			x,
			y,
			angle
		};
	}
	
	override get optionsConfig() : OptionsConfigMap {
		//When you modify this method, re-run `npm run generate` to update the types and schema checking
		return {
			agents: {
				example: {
					count: {
						example: 20,
						description: 'The number of starter agents',
						shortName: 'n',
						optional: true,
						backfill: true,
						default: true
					},
					speed: agentSpeed.optionsConfig,
					emoji: {
						example: '🐞',
						description: 'What emoji to use for the agents',
						optional: true,
						backfill: true,
						default: true,
						options: Object.values(INSECT_EMOJIS).map(emoji => ({value: emoji.emoji}))
					}
				},
				optional: true,
				backfill: true,
				default: true,
				description: 'Information on agents'
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

class FreeMovingAgentsRenderer extends PositionedGraphRenderer<FreeMovingAgentsAgent, FreeMovingAgentsSimulationFrame, PositionedGraph> {

	override agentDefaultMaxNodeSize() : number {
		return 50;
	}

}

window.customElements.define(SIMULATOR_NAME + "-renderer", FreeMovingAgentsRenderer);