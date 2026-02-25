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
	Angle,
	ScoreConfigItem,
	SimOptions
} from '../types.js';

import {
	newPosition,
	randomAngle,
	angleDiff,
	normalizeAngle,
	randomString
} from '../util.js';

import {
	CoordinatesMap
} from '../coordinates-map.js';

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

type BugState = 'wandering' | 'seeking' | 'eating';

type FoodItem = {
	id: string;
	x: number;
	y: number;
	emoji: string;
	age: number;
};

type FreeMovingAgentsCoordinatesMap = CoordinatesMap<FreeMovingAgentsAgent>;

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
	state : BugState;
	targetFoodId? : string;
	eatTimer? : number;
};

interface FreeMovingAgentsSimulationFrame extends AgentSimulationFrame<FreeMovingAgentsAgent, FreeMovingAgentsCoordinatesMap> {
	agents : FreeMovingAgentsAgent[];
	simOptions : FreeMovingAgentsSimOptions;
	food : FoodItem[];
	totalFoodEaten : number;
}

const FOOD_EMOJIS: {value: string}[] = [
	{value: '🌸'}, {value: '🌼'}, {value: '🌺'}, {value: '🌻'}, {value: '🌷'}, {value: '🍎'}, {value: '🍄'}
];

const generateFoodItem = (rnd: RandomGenerator, width: number, height: number, emoji: string): FoodItem => ({
	id: randomString(6, rnd),
	x: width * rnd(),
	y: height * rnd(),
	emoji,
	age: 0,
});

class FreeMovingAgentsSimulator extends AgentSimulator<FreeMovingAgentsAgent, FreeMovingAgentsSimulationFrame, FreeMovingAgentsCoordinatesMap> {

	override get name() : SimulatorType {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	override generatePositions(baseFrame : FreeMovingAgentsSimulationFrame) : FreeMovingAgentsCoordinatesMap {
		return new CoordinatesMap(baseFrame.agents, baseFrame);
	}

	override simulationComplete(frame : FreeMovingAgentsSimulationFrame) : boolean {
		return frame.index >= frame.simOptions.rounds!;
	}

	override numStarterAgents(_graph : FreeMovingAgentsCoordinatesMap, baseFrame : SimulationFrame) : number {
		const simOptions = baseFrame.simOptions as FreeMovingAgentsSimOptions;
		return simOptions.agents!.count!;
	}

	override generateAgent(_parentAgent : FreeMovingAgentsAgent, _otherAgents : FreeMovingAgentsAgent[], _graph : FreeMovingAgentsCoordinatesMap, baseFrame : SimulationFrame, rnd : RandomGenerator) : FreeMovingAgentsAgent {
		const simOptions = baseFrame.simOptions as FreeMovingAgentsSimOptions;
		return {
			...this.baseAgent(rnd),
			emoji: simOptions.agents!.emoji!,
			x: baseFrame.width * rnd(),
			y: baseFrame.height * rnd(),
			angle: randomAngle(rnd),
			speed: agentSpeed.distribution(simOptions.agents!.speed).sample(rnd),
			state: 'wandering',
		};
	}

	override generateFirstFrameExtra(simOptions: SimOptions, rnd: RandomGenerator, simWidth: number, simHeight: number): {food: FoodItem[], totalFoodEaten: number} {
		const opts = simOptions as FreeMovingAgentsSimOptions;
		const maxCount = opts.food?.maxCount ?? 15;
		const emoji = opts.food?.emoji ?? '🌸';
		const initialCount = Math.floor(maxCount / 2);
		const food: FoodItem[] = [];
		for (let i = 0; i < initialCount; i++) {
			food.push(generateFoodItem(rnd, simWidth, simHeight, emoji));
		}
		return { food, totalFoodEaten: 0 };
	}

	override framePreTick(_positions: FreeMovingAgentsCoordinatesMap, frame: FreeMovingAgentsSimulationFrame, rnd: RandomGenerator): void {
		const simOptions = frame.simOptions;
		const maxCount = simOptions.food!.maxCount!;
		const spawnRate = simOptions.food!.spawnRate!;
		const emoji = simOptions.food!.emoji!;
		if (frame.food.length < maxCount && rnd() < spawnRate) {
			frame.food = [...frame.food, generateFoodItem(rnd, frame.width, frame.height, emoji)];
		}
	}

	override defaultAgentTick(agent: FreeMovingAgentsAgent, _agents: FreeMovingAgentsAgent[], _graph: FreeMovingAgentsCoordinatesMap, frame: FreeMovingAgentsSimulationFrame, rnd: RandomGenerator): FreeMovingAgentsAgent | FreeMovingAgentsAgent[] {
		const simOptions = frame.simOptions;
		const sightRadius = simOptions.agents!.sightRadius!;
		const eatRadius = simOptions.agents!.eatRadius!;
		const eatDuration = simOptions.agents!.eatDuration!;
		const turnRate = simOptions.agents!.turnRate!;
		const wanderTurnRate = simOptions.agents!.wanderTurnRate!;

		switch (agent.state) {
		case 'eating': {
			const newTimer = (agent.eatTimer ?? 0) - 1;
			if (newTimer <= 0) {
				return { ...agent, state: 'wandering', eatTimer: undefined, targetFoodId: undefined };
			}
			return { ...agent, eatTimer: newTimer };
		}
		case 'seeking': {
			const targetFood = frame.food.find(f => f.id === agent.targetFoodId);
			if (!targetFood) {
				// Food is gone, fall back to wandering behavior for this tick
				return this.tickWandering({ ...agent, state: 'wandering', targetFoodId: undefined }, wanderTurnRate, sightRadius, frame, rnd);
			}

			const dx = targetFood.x - agent.x;
			const dy = targetFood.y - agent.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist <= eatRadius) {
				// Close enough to eat
				frame.food = frame.food.filter(f => f.id !== targetFood.id);
				frame.totalFoodEaten = (frame.totalFoodEaten || 0) + 1;
				return { ...agent, state: 'eating', eatTimer: eatDuration, targetFoodId: undefined };
			}

			// Turn toward food, clamped by turnRate
			const targetAngle = Math.atan2(dy, dx);
			const diff = angleDiff(agent.angle, targetAngle);
			const clampedDiff = Math.max(-turnRate, Math.min(turnRate, diff));
			const newAngle = normalizeAngle(agent.angle + clampedDiff);

			const [x, y, angle] = newPosition({ ...agent, angle: newAngle }, frame);
			return { ...agent, x, y, angle };
		}
		case 'wandering':
		default:
			return this.tickWandering(agent, wanderTurnRate, sightRadius, frame, rnd);
		}
	}

	private tickWandering(agent: FreeMovingAgentsAgent, wanderTurnRate: number, sightRadius: number, frame: FreeMovingAgentsSimulationFrame, rnd: RandomGenerator): FreeMovingAgentsAgent {
		// Random angle perturbation
		const perturbation = (rnd() - 0.5) * 2 * wanderTurnRate;
		const newAngle = normalizeAngle(agent.angle + perturbation);

		// Move
		const [x, y, angle] = newPosition({ ...agent, angle: newAngle }, frame);

		// Check for nearby food
		let nearestFood: FoodItem | null = null;
		let nearestDist = sightRadius;
		for (const food of frame.food) {
			const fdx = food.x - x;
			const fdy = food.y - y;
			const dist = Math.sqrt(fdx * fdx + fdy * fdy);
			if (dist < nearestDist) {
				nearestDist = dist;
				nearestFood = food;
			}
		}

		if (nearestFood) {
			return { ...agent, x, y, angle, state: 'seeking', targetFoodId: nearestFood.id };
		}

		return { ...agent, x, y, angle };
	}

	override framePostTick(_positions: FreeMovingAgentsCoordinatesMap, frame: FreeMovingAgentsSimulationFrame, _rnd: RandomGenerator): void {
		const lifespan = frame.simOptions.food!.lifespan!;
		if (lifespan > 0) {
			frame.food = frame.food
				.map(f => ({...f, age: f.age + 1}))
				.filter(f => f.age < lifespan);
		} else {
			frame.food = frame.food.map(f => ({...f, age: f.age + 1}));
		}
	}

	override frameScorer(frame: FreeMovingAgentsSimulationFrame): number[] {
		return [-1, frame.food.length, frame.totalFoodEaten];
	}

	override scoreConfig(): ScoreConfigItem[] {
		return [
			{ id: '', description: '' },
			{ id: 'food-on-map', description: 'Current number of food items on the map' },
			{ id: 'total-food-eaten', description: 'Cumulative total of food items eaten by agents' },
		];
	}

	override get optionsConfig() : OptionsConfigMap {
		//When you modify this method, re-run `npm run generate` to update the types and schema checking
		return {
			display: {
				example: {
					bounds: {
						example: false,
						description: 'Render debug bounds for coordinates map',
						optional: true,
						backfill: true
					}
				},
				description: 'Optional display properties',
				optional: true,
				backfill: true,
				advanced: true
			},
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
					},
					sightRadius: {
						example: 100,
						min: 0,
						step: 1,
						description: 'How far agents can detect food',
						optional: true,
						backfill: true,
						default: true
					},
					eatRadius: {
						example: 10,
						min: 0,
						step: 1,
						description: 'How close agents must be to eat food',
						optional: true,
						backfill: true,
						default: true
					},
					eatDuration: {
						example: 5,
						min: 1,
						step: 1,
						description: 'How many frames agents pause while eating',
						optional: true,
						backfill: true,
						default: true
					},
					turnRate: {
						example: 0.3,
						min: 0.0,
						max: 3.15,
						step: 0.05,
						description: 'Maximum angle change per tick when seeking food (radians)',
						optional: true,
						backfill: true,
						default: true
					},
					wanderTurnRate: {
						example: 0.2,
						min: 0.0,
						max: 3.15,
						step: 0.05,
						description: 'Maximum random angle change per tick when wandering (radians)',
						optional: true,
						backfill: true,
						default: true
					}
				},
				optional: true,
				backfill: true,
				default: true,
				description: 'Information on agents'
			},
			food: {
				example: {
					spawnRate: {
						example: 0.1,
						min: 0.0,
						max: 1.0,
						step: 0.01,
						description: 'Probability per frame of spawning a new food item',
						optional: true,
						backfill: true,
						default: true
					},
					maxCount: {
						example: 15,
						min: 0,
						step: 1,
						description: 'Maximum number of food items on the map',
						optional: true,
						backfill: true,
						default: true
					},
					emoji: {
						example: '🌸',
						description: 'What emoji to use for food',
						optional: true,
						backfill: true,
						default: true,
						options: FOOD_EMOJIS
					},
					lifespan: {
						example: 0,
						min: 0,
						step: 1,
						description: 'How many frames food lasts before expiring (0 = never)',
						optional: true,
						backfill: true,
						default: true
					}
				},
				optional: true,
				backfill: true,
				default: true,
				description: 'Configuration for food items on the map'
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

import { PositionedAgentsRenderer } from '../renderer.js';

class FreeMovingAgentsRenderer extends PositionedAgentsRenderer<FreeMovingAgentsAgent, FreeMovingAgentsSimulationFrame, FreeMovingAgentsCoordinatesMap> {

	override agentDefaultMaxNodeSize() : number {
		return 50;
	}

	override renderBounds(frame : FreeMovingAgentsSimulationFrame): boolean {
		return frame.simOptions.display?.bounds ?? false;
	}

	override agentData(frame: FreeMovingAgentsSimulationFrame): FreeMovingAgentsAgent[] {
		const foodAgents: FreeMovingAgentsAgent[] = (frame.food || []).map(f => ({
			id: f.id,
			emoji: f.emoji,
			x: f.x,
			y: f.y,
			angle: 0,
			speed: 0,
			state: 'wandering' as BugState,
		}));
		return [...foodAgents, ...frame.agents];
	}

}

window.customElements.define(SIMULATOR_NAME + "-renderer", FreeMovingAgentsRenderer);
