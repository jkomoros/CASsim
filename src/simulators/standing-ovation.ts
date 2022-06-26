import {
	Agent,
	AgentSimulationFrame,
	AgentSimulator
} from '../agent-simulator.js';

import {
	RectangleGraph
}from '../graph/rectangle.js';

import {
	DistributionConfig
} from '../distribution.js';

import {
	Graph
} from '../graph/graph.js';

import {
	DistributionOptions,
	OptionsConfigMap,
	RandomGenerator,
	ScoreConfigItem
} from '../types.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'standing-ovation';

const ovationPropensity = new DistributionConfig({average: 0.75, description: 'How likely individuals are to do a standing ovation in the first place'});
const standingThreshold = new DistributionConfig({average: 1.0, limitMax: 100.0, description: 'How high of a threshold individuals have for deciding to stand if individuals visible ahead of them stood'});
const performanceQuality = new DistributionConfig({average: 0.5, default: true, description: 'How high of quality the performance was'});
const forwardStandingFalloff = new DistributionConfig({average: 0.95, step: 0.001, description: 'How quickly the impact of someone standing in front of this person falls off in mattering'});
const fomoThreshold = new DistributionConfig({average: 0.95, description: 'The threshold of what proportion in the audience must be standing before this person decideds to stand, too'});

type StandingOvationAgent = Agent & {
	standing: boolean;
	ovationPropensity: number;
	performanceQuality: number;
	standingThreshold: number;
	forwardStandingFalloff: number;
	fomoThreshold: number;
}

type StandingOvationSimOptions = {
	filledSeatProportion : number;
	rows: number;
	cols: number;
	performanceQuality: DistributionOptions;
	ovationPropensity: DistributionOptions;
	standingThreshold: DistributionOptions;
	forwardStandingFalloff: DistributionOptions;
	fomoThreshold: DistributionOptions;
};

type StandingOvationSimulationFrameExtra = {
	changesMade: boolean;
}

interface StandingOvationSimulationFrame extends AgentSimulationFrame,  StandingOvationSimulationFrameExtra {
	agents : StandingOvationAgent[]
}

class StandingOvationSimulator extends AgentSimulator {

	override get name() {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	override generateAgent(parentAgent : StandingOvationAgent, otherAgents : StandingOvationAgent[], graph : Graph, simOptions : StandingOvationSimOptions, rnd : RandomGenerator) : StandingOvationAgent {
		return {
			...this.baseAgent(rnd),
			standing: false,
			ovationPropensity: ovationPropensity.distribution(simOptions.ovationPropensity).sample(rnd),
			performanceQuality: performanceQuality.distribution(simOptions.performanceQuality).sample(rnd),
			standingThreshold: standingThreshold.distribution(simOptions.standingThreshold).sample(rnd),
			forwardStandingFalloff: forwardStandingFalloff.distribution(simOptions.forwardStandingFalloff).sample(rnd),
			fomoThreshold: fomoThreshold.distribution(simOptions.fomoThreshold).sample(rnd)
		};
	}

	override generateGraph(simOptions : StandingOvationSimOptions, _rnd : RandomGenerator, simWidth : number, simHeight : number) : Graph {
		//Stage is to the left 
		return RectangleGraph.make(simOptions.rows, simOptions.cols, simWidth, simHeight, {diagonalUp: true, noHorizontal: true, noDown: true});
	}

	override generateFirstFrameExtra() : StandingOvationSimulationFrameExtra {
		return {
			changesMade: false,
		};
	}

	override numStarterAgents(graph: Graph, simOptions : StandingOvationSimOptions) : number {
		return Math.floor(Object.keys(graph.nodes()).length * simOptions.filledSeatProportion);
	}

	override simulationComplete(frame : StandingOvationSimulationFrame) : boolean {
		return frame.index > 0 && !frame.changesMade;
	}

	override beforeGenerateFrame(frame : StandingOvationSimulationFrame) : void {
		frame.changesMade = false;
	}

	override defaultAgentTick(agent : StandingOvationAgent, agents : StandingOvationAgent[], graph : Graph, frame : StandingOvationSimulationFrame) : StandingOvationAgent {
		//Agents that are already standing never sit again.
		if (agent.standing) return agent;
		
		if (frame.index <= 1) {
			//Stand if we though the performance was good enough.
			if (agent.performanceQuality > (1.0 - agent.ovationPropensity)) {
				frame.changesMade = true;
				return {
					...agent,
					standing: true,
				};
			}
		}

		//Also stand if our fomo threshold is reached.
		const standingProportion = agents.filter(agent => agent.standing).length / agents.length;
		if (standingProportion >= agent.fomoThreshold) {
			frame.changesMade = true;
			return {
				...agent,
				standing: true
			};
		}

		//Also stand if the people in front of us are standing.
		const nodes = graph.exploreGraph(agent.node, undefined, (edge) => edge.distance);
		const agentsByNode = Object.fromEntries(agents.map(agent => [agent.node, agent]));
		const falloff = agent.forwardStandingFalloff;
		const standingThreshold = agent.standingThreshold;
		//Sum up all agents who are standing in front of us (discounted by how far away they are, at exponential drop off)
		const standingStrength = Object.entries(nodes).filter(entry => (agentsByNode[entry[0]] || {}).standing).map(entry =>  Math.pow(falloff, entry[1].length - 1)).reduce((prev, curr) => prev + curr, 0);
		if (standingStrength >= standingThreshold) {
			frame.changesMade = true;
			return {
				...agent,
				standing: true,
			};
		}
		return agent;
	}

	override frameScorer(frame : StandingOvationSimulationFrame) : [number, number] {
		const finalScore = this.simulationComplete(frame) ? (frame.agents.every(agent => agent.standing) ? 1.0 : 0.0) : -1;
		const proportionStanding = frame.agents.filter(agent => agent.standing).length / frame.agents.length;
		return [finalScore, proportionStanding];
	}

	override scoreConfig() : [ScoreConfigItem, ScoreConfigItem] {
		return [
			null,
			{
				id: 'proportion-standing',
				description: 'The proportion of agents who are currently standing',
			}
		];
	}
	
	override get optionsConfig() : OptionsConfigMap {
		return {
			rows: {
				example: 5,
				description: 'Number of rows in the theater',
			},
			cols: {
				example: 5,
				description: 'Number of cols in the theater',
			},
			filledSeatProportion: {
				example: 0.75,
				min: 0.0,
				max: 1.0,
				step: 0.01,
				optional: true,
				backfill: true,
				default: true,
				description: 'What percentage of seats should be filled'
			},
			performanceQuality: performanceQuality.optionsConfig,
			ovationPropensity: ovationPropensity.optionsConfig,
			standingThreshold: standingThreshold.optionsConfig,
			forwardStandingFalloff: forwardStandingFalloff.optionsConfig,
			fomoThreshold: fomoThreshold.optionsConfig
		};
	}

	override renderer() {
		return new StandingOvationRenderer();
	}
}

export default StandingOvationSimulator;

import { PositionedGraphRenderer } from '../renderer.js';

class StandingOvationRenderer extends PositionedGraphRenderer {

	agentEmoji(agent) {
		return agent.standing ? '👏' : '😐';
	}

	nodeAdditionalStyles(node) {
		if (node.row == 0) {
			return {
				'border-top-width': '20px',
				'border-top-color': 'firebrick',
			};
		}
		return {};
	}
}

window.customElements.define(SIMULATOR_NAME + "-renderer", StandingOvationRenderer);