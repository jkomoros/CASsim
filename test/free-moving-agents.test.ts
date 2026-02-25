import { describe, it, expect } from 'vitest';

import FreeMovingAgentsSimulator from '../src/simulators/free-moving-agents.js';

import {
	angleDiff,
	normalizeAngle
} from '../src/util.js';

// -- helpers ------------------------------------------------------------------

const DEFAULT_SIM_OPTIONS = {
	agents: {
		count: 5,
		emoji: '🐞',
		speed: { distribution: 'normal', average: 3.0, spread: 1.5, limitMax: 10.0 },
		sightRadius: 100,
		eatRadius: 10,
		eatDuration: 5,
		turnRate: 0.3,
		wanderTurnRate: 0.2,
	},
	food: {
		spawnRate: 0.1,
		maxCount: 15,
		emoji: '🌸',
		lifespan: 0,
	},
	rounds: 150,
};

type BugState = 'wandering' | 'seeking' | 'eating';

const makeBug = (overrides: Record<string, unknown> = {}) => ({
	id: 'bug-0',
	emoji: '🐞',
	x: 100,
	y: 100,
	angle: 0,
	speed: 3,
	state: 'wandering' as BugState,
	...overrides,
});

const makeFood = (overrides: Record<string, unknown> = {}) => ({
	id: 'food-0',
	x: 200,
	y: 200,
	emoji: '🌸',
	age: 0,
	...overrides,
});

const makeFrame = (options: {
	agents?: Record<string, unknown>[],
	food?: Record<string, unknown>[],
	simOptionsOverrides?: Record<string, unknown>,
	totalFoodEaten?: number,
} = {}) => {
	const agents = (options.agents || [{}]).map((o, i) => makeBug({ id: `bug-${i}`, ...o }));
	const food = (options.food || []).map((o, i) => makeFood({ id: `food-${i}`, ...o }));
	return {
		index: 1,
		simOptions: { ...DEFAULT_SIM_OPTIONS, ...options.simOptionsOverrides },
		runIndex: 0,
		width: 800,
		height: 450,
		agents,
		positions: null,
		food,
		totalFoodEaten: options.totalFoodEaten ?? 0,
	};
};

// -- Tests --------------------------------------------------------------------

describe('FreeMovingAgentsSimulator', () => {
	const sim = new FreeMovingAgentsSimulator();

	describe('state machine: wandering', () => {
		it('wandering bug moves and stays wandering when no food nearby', () => {
			const frame = makeFrame({
				agents: [{ x: 400, y: 225, angle: 0, speed: 3 }],
				food: [], // no food
			});
			const rnd = () => 0.5; // zero perturbation
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, rnd);
			const agent = result as typeof frame.agents[0];
			expect(agent.state).toBe('wandering');
			// Should have moved rightward (angle 0) by speed 3
			expect(agent.x).toBeCloseTo(403, 0);
			expect(agent.y).toBeCloseTo(225, 0);
		});

		it('wandering bug applies random angle perturbation', () => {
			const frame = makeFrame({
				agents: [{ x: 400, y: 225, angle: 0, speed: 3 }],
				food: [],
			});
			// rnd() = 0.0 → perturbation = (0 - 0.5) * 2 * 0.2 = -0.2
			const rnd = () => 0.0;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, rnd);
			const agent = result as typeof frame.agents[0];
			// Angle should have changed from 0 by -0.2 → normalizeAngle(-0.2) ≈ 2π - 0.2
			const expectedAngle = normalizeAngle(-0.2);
			expect(agent.angle).toBeCloseTo(expectedAngle, 5);
		});

		it('transitions from wandering to seeking when food is in sight', () => {
			const frame = makeFrame({
				agents: [{ x: 400, y: 225, angle: 0, speed: 3 }],
				food: [{ x: 450, y: 225 }], // 50 units away, within sightRadius of 100
			});
			const rnd = () => 0.5; // no perturbation
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, rnd);
			const agent = result as typeof frame.agents[0];
			expect(agent.state).toBe('seeking');
			expect(agent.targetFoodId).toBe('food-0');
		});

		it('does not transition to seeking when food is outside sight radius', () => {
			const frame = makeFrame({
				agents: [{ x: 400, y: 225, angle: 0, speed: 3 }],
				food: [{ x: 600, y: 225 }], // 200 units away, outside sightRadius of 100
			});
			const rnd = () => 0.5;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, rnd);
			const agent = result as typeof frame.agents[0];
			expect(agent.state).toBe('wandering');
			expect(agent.targetFoodId).toBeUndefined();
		});
	});

	describe('state machine: seeking', () => {
		it('turns toward food clamped by turnRate', () => {
			// Bug facing right (angle 0), food is directly above
			const frame = makeFrame({
				agents: [{ x: 400, y: 300, angle: 0, speed: 3, state: 'seeking', targetFoodId: 'food-0' }],
				food: [{ x: 400, y: 100 }], // directly above, far away
				simOptionsOverrides: { agents: { ...DEFAULT_SIM_OPTIONS.agents, turnRate: 0.1 } },
			});
			const rnd = () => 0.5;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, rnd);
			const agent = result as typeof frame.agents[0];
			// Angle should change by at most turnRate (0.1) from 0
			const wrappedDelta = Math.abs(angleDiff(0, agent.angle));
			expect(wrappedDelta).toBeCloseTo(0.1, 5);
		});

		it('transitions to eating when close enough to food', () => {
			const frame = makeFrame({
				agents: [{ x: 195, y: 200, angle: 0, speed: 3, state: 'seeking', targetFoodId: 'food-0' }],
				food: [{ x: 200, y: 200 }], // 5 units away, within eatRadius of 10
			});
			const rnd = () => 0.5;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, rnd);
			const agent = result as typeof frame.agents[0];
			expect(agent.state).toBe('eating');
			expect(agent.eatTimer).toBe(5);
			expect(agent.targetFoodId).toBeUndefined();
		});

		it('removes food from frame when eating', () => {
			const frame = makeFrame({
				agents: [{ x: 200, y: 200, state: 'seeking', targetFoodId: 'food-0' }],
				food: [{ x: 200, y: 200 }],
			});
			sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, () => 0.5);
			expect(frame.food).toHaveLength(0);
		});

		it('increments totalFoodEaten when eating', () => {
			const frame = makeFrame({
				agents: [{ x: 200, y: 200, state: 'seeking', targetFoodId: 'food-0' }],
				food: [{ x: 200, y: 200 }],
				totalFoodEaten: 5,
			});
			sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, () => 0.5);
			expect(frame.totalFoodEaten).toBe(6);
		});

		it('reverts to wandering when target food is gone', () => {
			const frame = makeFrame({
				agents: [{ x: 400, y: 225, angle: 0, speed: 3, state: 'seeking', targetFoodId: 'food-nonexistent' }],
				food: [], // no food at all
			});
			const rnd = () => 0.5;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, rnd);
			const agent = result as typeof frame.agents[0];
			expect(agent.state).toBe('wandering');
			expect(agent.targetFoodId).toBeUndefined();
		});
	});

	describe('state machine: eating', () => {
		it('decrements eat timer each tick', () => {
			const frame = makeFrame({
				agents: [{ state: 'eating', eatTimer: 3 }],
			});
			const rnd = () => 0.5;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, rnd);
			const agent = result as typeof frame.agents[0];
			expect(agent.state).toBe('eating');
			expect(agent.eatTimer).toBe(2);
		});

		it('transitions to wandering when eat timer expires', () => {
			const frame = makeFrame({
				agents: [{ state: 'eating', eatTimer: 1 }],
			});
			const rnd = () => 0.5;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, rnd);
			const agent = result as typeof frame.agents[0];
			expect(agent.state).toBe('wandering');
			expect(agent.eatTimer).toBeUndefined();
			expect(agent.targetFoodId).toBeUndefined();
		});

		it('does not move while eating', () => {
			const frame = makeFrame({
				agents: [{ x: 100, y: 100, state: 'eating', eatTimer: 3 }],
			});
			const rnd = () => 0.5;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, rnd);
			const agent = result as typeof frame.agents[0];
			expect(agent.x).toBe(100);
			expect(agent.y).toBe(100);
		});
	});

	describe('multiple bugs competing for food', () => {
		it('second bug cannot eat already-eaten food', () => {
			const frame = makeFrame({
				agents: [
					{ id: 'bug-0', x: 200, y: 200, state: 'seeking', targetFoodId: 'food-0' },
					{ id: 'bug-1', x: 200, y: 200, state: 'seeking', targetFoodId: 'food-0' },
				],
				food: [{ id: 'food-0', x: 200, y: 200 }],
			});

			// First bug eats it
			const result1 = sim.defaultAgentTick(frame.agents[0], frame.agents, null as never, frame as never, () => 0.5);
			expect((result1 as typeof frame.agents[0]).state).toBe('eating');
			expect(frame.food).toHaveLength(0);
			expect(frame.totalFoodEaten).toBe(1);

			// Second bug: food is gone, should revert to wandering
			const result2 = sim.defaultAgentTick(frame.agents[1], frame.agents, null as never, frame as never, () => 0.5);
			expect((result2 as typeof frame.agents[0]).state).not.toBe('eating');
		});
	});

	describe('food spawning (framePreTick)', () => {
		it('spawns food when below maxCount and rnd < spawnRate', () => {
			const frame = makeFrame({
				food: [],
				simOptionsOverrides: { food: { ...DEFAULT_SIM_OPTIONS.food, spawnRate: 1.0, maxCount: 5 } },
			});
			sim.framePreTick(null as never, frame as never, () => 0.01);
			expect(frame.food).toHaveLength(1);
			expect(frame.food[0].emoji).toBe('🌸');
			expect(frame.food[0].age).toBe(0);
		});

		it('does not spawn food when at maxCount', () => {
			const food = Array(5).fill(null).map((_, i) => ({ id: `food-${i}` }));
			const frame = makeFrame({
				food,
				simOptionsOverrides: { food: { ...DEFAULT_SIM_OPTIONS.food, spawnRate: 1.0, maxCount: 5 } },
			});
			sim.framePreTick(null as never, frame as never, () => 0.0);
			expect(frame.food).toHaveLength(5);
		});

		it('does not spawn food when rnd >= spawnRate', () => {
			const frame = makeFrame({
				food: [],
				simOptionsOverrides: { food: { ...DEFAULT_SIM_OPTIONS.food, spawnRate: 0.1, maxCount: 15 } },
			});
			sim.framePreTick(null as never, frame as never, () => 0.5);
			expect(frame.food).toHaveLength(0);
		});
	});

	describe('food lifespan (framePostTick)', () => {
		it('increments food age each tick', () => {
			const frame = makeFrame({
				food: [{ age: 3 }],
			});
			sim.framePostTick(null as never, frame as never, () => 0);
			expect(frame.food[0].age).toBe(4);
		});

		it('removes food when age reaches lifespan', () => {
			const frame = makeFrame({
				food: [{ age: 9 }],
				simOptionsOverrides: { food: { ...DEFAULT_SIM_OPTIONS.food, lifespan: 10 } },
			});
			sim.framePostTick(null as never, frame as never, () => 0);
			// age incremented to 10, which >= lifespan 10
			expect(frame.food).toHaveLength(0);
		});

		it('keeps food when lifespan is 0 (never expires)', () => {
			const frame = makeFrame({
				food: [{ age: 1000 }],
				simOptionsOverrides: { food: { ...DEFAULT_SIM_OPTIONS.food, lifespan: 0 } },
			});
			sim.framePostTick(null as never, frame as never, () => 0);
			expect(frame.food).toHaveLength(1);
			expect(frame.food[0].age).toBe(1001);
		});

		it('keeps young food and removes old food with lifespan', () => {
			const frame = makeFrame({
				food: [{ id: 'food-0', age: 1 }, { id: 'food-1', age: 9 }],
				simOptionsOverrides: { food: { ...DEFAULT_SIM_OPTIONS.food, lifespan: 10 } },
			});
			sim.framePostTick(null as never, frame as never, () => 0);
			expect(frame.food).toHaveLength(1);
			expect(frame.food[0].id).toBe('food-0');
			expect(frame.food[0].age).toBe(2);
		});
	});

	describe('frameScorer', () => {
		it('returns correct scores', () => {
			const frame = makeFrame({
				food: [{}, {}, {}],
				totalFoodEaten: 7,
			});
			const scores = sim.frameScorer(frame as never);
			expect(scores[0]).toBe(-1);
			expect(scores[1]).toBe(3);
			expect(scores[2]).toBe(7);
		});

		it('returns zero food and eaten when empty', () => {
			const frame = makeFrame({
				food: [],
				totalFoodEaten: 0,
			});
			const scores = sim.frameScorer(frame as never);
			expect(scores[0]).toBe(-1);
			expect(scores[1]).toBe(0);
			expect(scores[2]).toBe(0);
		});
	});

	describe('generateFirstFrameExtra', () => {
		it('generates initial food items at half maxCount', () => {
			let i = 0;
			const rnd = () => {
				i++;
				return (i % 17) / 17;
			};
			const result = sim.generateFirstFrameExtra(
				{ ...DEFAULT_SIM_OPTIONS } as never,
				rnd,
				800,
				450
			);
			const extra = result as { food: { id: string; x: number; y: number; emoji: string; age: number }[]; totalFoodEaten: number };
			expect(extra.food).toHaveLength(7); // floor(15 / 2) = 7
			expect(extra.totalFoodEaten).toBe(0);
			for (const food of extra.food) {
				expect(food).toHaveProperty('id');
				expect(food.x).toBeGreaterThanOrEqual(0);
				expect(food.x).toBeLessThanOrEqual(800);
				expect(food.y).toBeGreaterThanOrEqual(0);
				expect(food.y).toBeLessThanOrEqual(450);
				expect(food.emoji).toBe('🌸');
				expect(food.age).toBe(0);
			}
		});
	});

	describe('scoreConfig', () => {
		it('returns three score config items', () => {
			const config = sim.scoreConfig();
			expect(config).toHaveLength(3);
			expect(config![1].id).toBe('food-on-map');
			expect(config![2].id).toBe('total-food-eaten');
		});
	});

	describe('optionsConfig', () => {
		it('defines food options', () => {
			const config = sim.optionsConfig;
			expect(config.food).toBeDefined();
			expect(config.agents).toBeDefined();
			expect(config.rounds).toBeDefined();
		});
	});

	describe('simulationComplete', () => {
		it('completes when index reaches rounds', () => {
			const frame = makeFrame({ simOptionsOverrides: { rounds: 10 } });
			(frame as { index: number }).index = 10;
			expect(sim.simulationComplete(frame as never)).toBe(true);
		});

		it('does not complete before rounds', () => {
			const frame = makeFrame({ simOptionsOverrides: { rounds: 10 } });
			(frame as { index: number }).index = 5;
			expect(sim.simulationComplete(frame as never)).toBe(false);
		});
	});
});
