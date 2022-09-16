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
	ANGLE_MAX,
	normalizeAngle,
	randomAngle
} from '../util.js';

import {
	Graph
} from '../graph/graph.js';

import {
	DistributionConfig,
	FIXED
} from '../distribution.js';

import {
	FreeMovingAgentsSimOptions
} from './types/free-moving-agents.GENERATED.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'free-moving-agents';

const agentSpeed = new DistributionConfig({
	average: 1.0,
	distribution: FIXED,
	default: true,
	description: 'The starter strength of agents that start at the beginning'
});

type FreeMovingAgentsAgent = Agent & {
	emoji : string;
	angle : Angle;
	speed : number;
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
		return simOptions.agents.count;
	}

	override generateAgent(_parentAgent : FreeMovingAgentsAgent, _otherAgents : FreeMovingAgentsAgent[], _graph : Graph, baseFrame : SimulationFrame, rnd : RandomGenerator) : FreeMovingAgentsAgent {
		const simOptions = baseFrame.simOptions as FreeMovingAgentsSimOptions;
		return {
			...this.baseAgent(rnd),
			emoji: '🐞',
			x: baseFrame.width * rnd(),
			y: baseFrame.height * rnd(),
			angle: randomAngle(rnd),
			speed: agentSpeed.distribution(simOptions.agents.speed).sample(rnd),
		};
	}

	override defaultAgentTick(agent: FreeMovingAgentsAgent): FreeMovingAgentsAgent | FreeMovingAgentsAgent[] {
		//TODO: each node should get its own speed
		const speed = agent.speed;
		const rotatedAgentAngle = normalizeAngle(agent.angle - ANGLE_MAX / 4);
		const x = agent.x + (Math.cos(rotatedAgentAngle) * speed);
		const y = agent.y + (Math.sin(rotatedAgentAngle) * speed);
		return {
			...agent,
			x,
			y
		};
	}
	
	override get optionsConfig() : OptionsConfigMap {
		//When you modify this method, re-run `npm run generate` to update the types and schema checking
		return {
			agents: {
				example: {
					count: {
						example: 5,
						description: 'The number of starter agents',
						shortName: 'n',
						optional: true,
						backfill: true,
						default: true
					},
					speed: agentSpeed.optionsConfig
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

class FreeMovingAgentsRenderer extends PositionedGraphRenderer {

	override agentDefaultMaxNodeSize() : number {
		return 50;
	}

	override agentRotation(agent: FreeMovingAgentsAgent): Angle {
		return agent.angle;
	}

}

window.customElements.define(SIMULATOR_NAME + "-renderer", FreeMovingAgentsRenderer);