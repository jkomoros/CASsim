import {
	Agent,
	AgentSimulationFrame,
	AgentSimulator
} from '../agent-simulator.js';

import {
	RectangleGraph,
	RectangleGraphNodeValues
} from '../graph/rectangle.js';

import {
	Graph
} from '../graph/graph.js';

import {
	Interaction,
	InteractionDefinition,
	NormalizedSimOptions,
	OptionsConfigMap,
	RandomGenerator,
	ScoreConfigItem,
	SimulationFrame,
	SimulatorType
} from '../types.js';

import {
	WildflowerMeadowSimOptions
} from './types/wildflower-meadow.GENERATED.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'wildflower-meadow';

type CellState = 'bare' | 'fertile' | 'seed' | 'growing' | 'blooming' | 'wilting' | 'weed';

const BLOOM_EMOJIS = ['🌸', '🌼', '🌺', '🌻', '🌷'] as const;

type MeadowAgent = Agent & {
	state: CellState;
	age: number;
	flowerType: number;
}

type MeadowSimulationFrameExtra = {
	agentsByNode: {[nodeId: string]: MeadowAgent};
}

interface MeadowSimulationFrame extends AgentSimulationFrame<MeadowAgent, RectangleGraph>, MeadowSimulationFrameExtra {
	simOptions: WildflowerMeadowSimOptions;
	agents: MeadowAgent[];
}

class WildflowerMeadowSimulator extends AgentSimulator<MeadowAgent, MeadowSimulationFrame, RectangleGraph> {

	override get name(): SimulatorType {
		return SIMULATOR_NAME;
	}

	override interactionsConfig(): InteractionDefinition[] {
		return [{
			type: 'tend',
			label: 'Tend',
			description: 'Plant a seed on bare/fertile ground, or remove a weed',
			shortcut: 't',
		}];
	}

	override applyAgentInteraction(interaction: Interaction, frame: MeadowSimulationFrame): void {
		if (interaction.type !== 'tend') return;

		const agentIndex = frame.agents.findIndex(a => a.id === interaction.agentID);
		if (agentIndex < 0) return;

		const agent = frame.agents[agentIndex];

		if (agent.state === 'bare' || agent.state === 'fertile') {
			frame.agents = [...frame.agents];
			frame.agents[agentIndex] = {
				...agent,
				state: 'seed',
				age: 0,
			};
		} else if (agent.state === 'weed') {
			frame.agents = [...frame.agents];
			frame.agents[agentIndex] = {
				...agent,
				state: 'bare',
				age: 0,
			};
		}
		// All other states: no-op
	}

	override generatePositions(baseFrame: SimulationFrame): RectangleGraph {
		const simOptions = baseFrame.simOptions as WildflowerMeadowSimOptions;
		return RectangleGraph.make(simOptions.rows, simOptions.cols, baseFrame.width, baseFrame.height, {diagonal: true});
	}

	override numStarterAgents(graph: Graph): number {
		return Object.keys(graph.nodes()).length;
	}

	override generateAgent(_parentAgent: MeadowAgent, _otherAgents: MeadowAgent[], _graph: Graph, _baseFrame: SimulationFrame, rnd: RandomGenerator): MeadowAgent {
		return {
			...this.baseAgent(rnd),
			state: 'bare',
			age: 0,
			flowerType: Math.floor(rnd() * 5),
		};
	}

	override generateFirstFrameExtra(): MeadowSimulationFrameExtra {
		return {
			agentsByNode: {},
		};
	}

	override beforeGenerateFrame(frame: MeadowSimulationFrame): void {
		// Build agentsByNode lookup for efficient neighbor checks
		const agentsByNode: {[nodeId: string]: MeadowAgent} = {};
		for (const agent of frame.agents) {
			if (agent.node) {
				agentsByNode[agent.node] = agent;
			}
		}
		frame.agentsByNode = agentsByNode;
	}

	override defaultAgentTick(agent: MeadowAgent, _agents: MeadowAgent[], graph: Graph, frame: MeadowSimulationFrame, rnd: RandomGenerator): MeadowAgent {
		const simOptions = frame.simOptions;
		const neighbors = graph.neighbors(agent.node!, 1);
		const neighborAgents = Object.keys(neighbors).map(nodeId => frame.agentsByNode[nodeId]).filter(a => a);

		const numWeedNeighbors = neighborAgents.filter(a => a.state === 'weed').length;
		const numBloomingNeighbors = neighborAgents.filter(a => a.state === 'blooming').length;

		switch (agent.state) {
		case 'seed': {
			const newAge = agent.age + 1;
			if (newAge >= simOptions.seedGrowthTime) {
				return {...agent, state: 'growing', age: 0};
			}
			return {...agent, age: newAge};
		}
		case 'growing': {
			const newAge = agent.age + 1;
			if (newAge >= simOptions.growGrowthTime) {
				return {...agent, state: 'blooming', age: 0};
			}
			return {...agent, age: newAge};
		}
		case 'blooming': {
			const newAge = agent.age + 1;
			if (newAge >= simOptions.bloomDuration) {
				return {...agent, state: 'wilting', age: 0};
			}
			return {...agent, age: newAge};
		}
		case 'wilting': {
			// Weed neighbors can overtake wilting flowers
			if (numWeedNeighbors > 0) {
				const weedProb = simOptions.weedSpreadRate * numWeedNeighbors;
				if (rnd() < weedProb) {
					return {...agent, state: 'weed', age: 0};
				}
			}
			const newAge = agent.age + 1;
			if (newAge >= simOptions.wiltDuration) {
				return {...agent, state: 'fertile', age: 0};
			}
			return {...agent, age: newAge};
		}
		case 'bare':
		case 'fertile': {
			// Priority: weed spread > weed spawn > pollination

			// Weed spread from neighbors
			if (numWeedNeighbors > 0) {
				const weedProb = simOptions.weedSpreadRate * numWeedNeighbors;
				if (rnd() < weedProb) {
					return {...agent, state: 'weed', age: 0};
				}
			}

			// Edge cells: spontaneous weed spawn
			const rectNode = graph.nodes()[agent.node!] as RectangleGraphNodeValues;
			const rows = simOptions.rows;
			const cols = simOptions.cols;
			const isEdge = rectNode.row === 0 || rectNode.row === rows - 1 || rectNode.col === 0 || rectNode.col === cols - 1;
			if (isEdge) {
				if (rnd() < simOptions.weedSpawnRate) {
					return {...agent, state: 'weed', age: 0};
				}
			}

			// Pollination from blooming neighbors
			if (numBloomingNeighbors > 0) {
				const fertilityMultiplier = agent.state === 'fertile' ? 2 : 1;
				const pollinationProb = simOptions.basePollination * numBloomingNeighbors * fertilityMultiplier;
				if (rnd() < pollinationProb) {
					return {...agent, state: 'seed', age: 0};
				}
			}

			return agent;
		}
		case 'weed':
			// Weeds persist until player removes them
			return agent;
		default:
			return agent;
		}
	}

	override simulationComplete(): boolean {
		// Interactive sandbox: never auto-completes
		return false;
	}

	override maxFrameIndex(_normalizedSimOptions: NormalizedSimOptions): number {
		// Interactive sandbox with slow frame delay — 500 frames is ~6 minutes of play
		return 500;
	}

	override frameScorer(frame: MeadowSimulationFrame): [number, number] {
		const totalCells = frame.agents.length;
		const bloomingCount = frame.agents.filter(a => a.state === 'blooming').length;
		const proportionBlooming = totalCells > 0 ? bloomingCount / totalCells : 0;
		// -1 for final score means "not complete"
		return [-1, proportionBlooming];
	}

	override scoreConfig(): [ScoreConfigItem, ScoreConfigItem] {
		return [
			{
				id: '',
				description: '',
			},
			{
				id: 'proportion-blooming',
				description: 'The proportion of cells currently blooming',
			}
		];
	}

	override get optionsConfig(): OptionsConfigMap {
		//When you modify this method, re-run `npm run generate` to update the types and schema checking
		return {
			rows: {
				example: 10,
				description: 'Number of rows in the meadow',
			},
			cols: {
				example: 15,
				description: 'Number of columns in the meadow',
			},
			weedSpawnRate: {
				example: 0.005,
				min: 0.0,
				max: 1.0,
				step: 0.001,
				description: 'Probability per frame for edge bare/fertile cells to spawn a weed',
			},
			weedSpreadRate: {
				example: 0.03,
				min: 0.0,
				max: 1.0,
				step: 0.01,
				description: 'Probability per adjacent weed neighbor to convert bare/fertile/wilting cells',
			},
			basePollination: {
				example: 0.08,
				min: 0.0,
				max: 1.0,
				step: 0.01,
				description: 'Probability per adjacent blooming neighbor to seed bare/fertile cells',
			},
			bloomDuration: {
				example: 6,
				min: 1,
				step: 1,
				description: 'Frames a flower stays blooming',
			},
			seedGrowthTime: {
				example: 2,
				min: 1,
				step: 1,
				description: 'Frames as seed before growing',
			},
			growGrowthTime: {
				example: 3,
				min: 1,
				step: 1,
				description: 'Frames as growing before blooming',
			},
			wiltDuration: {
				example: 2,
				min: 1,
				step: 1,
				description: 'Frames wilting before becoming fertile soil',
			},
		};
	}

	override renderer() {
		return new MeadowRenderer();
	}
}

export default WildflowerMeadowSimulator;

/************************************************************************
*  All imports (including transitive ones) of lit must occur below the  *
*  `export default ...` line that is immediately above this comment     *
************************************************************************/

import { PositionedAgentsRenderer } from '../renderer.js';

class MeadowRenderer extends PositionedAgentsRenderer<MeadowAgent, MeadowSimulationFrame, RectangleGraph> {

	override agentEmoji(agent: MeadowAgent): string {
		switch (agent.state) {
		case 'bare':
			return '';
		case 'fertile':
			return '🟤';
		case 'seed':
			return '🌱';
		case 'growing':
			return '🌿';
		case 'blooming':
			return BLOOM_EMOJIS[agent.flowerType % BLOOM_EMOJIS.length];
		case 'wilting':
			return '🥀';
		case 'weed':
			return '🌲';
		default:
			return '';
		}
	}
}

window.customElements.define(SIMULATOR_NAME + "-renderer", MeadowRenderer);
