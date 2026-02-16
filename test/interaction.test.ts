import { describe, it, expect } from 'vitest';

import { BaseSimulator } from '../src/simulator.js';

import StandingOvationSimulator from '../src/simulators/standing-ovation.js';

import { makeSeededRandom } from '../src/random.js';

import type {
	Interaction,
	InteractionDefinition,
	RandomGenerator,
	NormalizedSimOptions,
	SimulationFrame
} from '../src/types.js';

// -- helpers ------------------------------------------------------------------

const makeMinimalStandingOvationAgent = (overrides: Record<string, unknown> = {}) => ({
	id: 'agent-1',
	standing: false,
	ovationPropensity: 0.5,
	performanceQuality: 0.5,
	standingThreshold: 1.0,
	forwardStandingFalloff: 0.95,
	fomoThreshold: 0.95,
	...overrides,
});

const makeMinimalFrame = (agentOverrides: Record<string, unknown>[] = []) => {
	const defaultAgents = agentOverrides.length > 0
		? agentOverrides.map((o, i) => makeMinimalStandingOvationAgent({ id: `agent-${i}`, ...o }))
		: [makeMinimalStandingOvationAgent()];
	return {
		index: 0,
		simOptions: {},
		runIndex: 0,
		width: 800,
		height: 450,
		agents: defaultAgents,
		positions: null,
		changesMade: false,
	};
};

// -- StandingOvationSimulator interaction tests --------------------------------

describe('StandingOvationSimulator interactions', () => {
	const sim = new StandingOvationSimulator();

	describe('interactionsConfig', () => {
		it('returns the expected interaction definition', () => {
			const config = sim.interactionsConfig();
			expect(config).toHaveLength(1);
			const def: InteractionDefinition = config[0];
			expect(def.type).toBe('toggle-standing');
			expect(def.label).toBe('Toggle standing');
			expect(def.shortcut).toBe('t');
		});
	});

	describe('applyAgentInteraction', () => {
		it('is a no-op for unknown interaction type', () => {
			const frame = makeMinimalFrame();
			const originalAgents = frame.agents;
			const originalStanding = frame.agents[0].standing;

			sim.applyAgentInteraction(
				{ type: 'unknown-type', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents).toBe(originalAgents);
			expect(frame.agents[0].standing).toBe(originalStanding);
		});

		it('is a no-op for unknown agent ID', () => {
			const frame = makeMinimalFrame();
			const originalAgents = frame.agents;
			const originalStanding = frame.agents[0].standing;

			sim.applyAgentInteraction(
				{ type: 'toggle-standing', agentID: 'nonexistent' } as Interaction,
				frame as never
			);

			expect(frame.agents).toBe(originalAgents);
			expect(frame.agents[0].standing).toBe(originalStanding);
		});

		it('toggles a sitting agent to standing', () => {
			const frame = makeMinimalFrame([{ standing: false }]);

			sim.applyAgentInteraction(
				{ type: 'toggle-standing', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents[0].standing).toBe(true);
		});

		it('toggles a standing agent to sitting', () => {
			const frame = makeMinimalFrame([{ standing: true }]);

			sim.applyAgentInteraction(
				{ type: 'toggle-standing', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents[0].standing).toBe(false);
		});

		it('clones the agents array (does not mutate the original reference)', () => {
			const frame = makeMinimalFrame([{ standing: false }]);
			const originalAgentsRef = frame.agents;

			sim.applyAgentInteraction(
				{ type: 'toggle-standing', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents).not.toBe(originalAgentsRef);
			expect(originalAgentsRef[0].standing).toBe(false);
		});

		it('only modifies the targeted agent (others unchanged)', () => {
			const frame = makeMinimalFrame([
				{ standing: false },
				{ standing: true },
				{ standing: false },
			]);
			const agent1Before = frame.agents[1];
			const agent2Before = frame.agents[2];

			sim.applyAgentInteraction(
				{ type: 'toggle-standing', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents[0].standing).toBe(true);
			expect(frame.agents[1]).toBe(agent1Before);
			expect(frame.agents[2]).toBe(agent2Before);
			expect(frame.agents[1].standing).toBe(true);
			expect(frame.agents[2].standing).toBe(false);
		});
	});
});

// -- BaseSimulator.applyInteractions tests ------------------------------------

describe('BaseSimulator.applyInteractions', () => {

	class TrackingSimulator extends BaseSimulator {
		calls: Interaction[] = [];

		override applyInteraction(interaction: Interaction, _frame: SimulationFrame): void {
			this.calls.push(interaction);
		}

		public callApplyInteractions(interactions: readonly Interaction[] | undefined, frame: SimulationFrame): void {
			this.applyInteractions(interactions, frame);
		}
	}

	const frame = { index: 0, simOptions: {}, runIndex: 0, width: 800, height: 450 } as SimulationFrame;

	it('is a no-op when interactions is undefined', () => {
		const sim = new TrackingSimulator();
		sim.callApplyInteractions(undefined, frame);
		expect(sim.calls).toHaveLength(0);
	});

	it('is a no-op when interactions is an empty array', () => {
		const sim = new TrackingSimulator();
		sim.callApplyInteractions([], frame);
		expect(sim.calls).toHaveLength(0);
	});

	it('calls applyInteraction for each interaction', () => {
		const sim = new TrackingSimulator();
		const interactions: Interaction[] = [
			{ type: 'action-a', agentID: 'a1' },
			{ type: 'action-b', agentID: 'a2' },
			{ type: 'action-c', agentID: 'a3' },
		];
		sim.callApplyInteractions(interactions, frame);
		expect(sim.calls).toHaveLength(3);
		expect(sim.calls[0]).toBe(interactions[0]);
		expect(sim.calls[1]).toBe(interactions[1]);
		expect(sim.calls[2]).toBe(interactions[2]);
	});
});

// -- Generator interaction timing tests ----------------------------------------

describe('Generator interaction timing', () => {

	type TimingEntry = { method: string; frameIndex: number };

	class TimingSimulator extends BaseSimulator {
		log: TimingEntry[] = [];

		override generateFirstFrame(baseFrame: SimulationFrame, _rnd: RandomGenerator): SimulationFrame {
			this.log.push({ method: 'generateFirstFrame', frameIndex: baseFrame.index });
			return { ...baseFrame };
		}

		override generateFrame(frame: SimulationFrame, _rnd: RandomGenerator): void {
			this.log.push({ method: 'generateFrame', frameIndex: frame.index });
		}

		override simulationComplete(_frame: SimulationFrame): boolean {
			return false;
		}

		override applyInteraction(interaction: Interaction, frame: SimulationFrame): void {
			this.log.push({ method: 'applyInteraction', frameIndex: frame.index });
		}
	}

	const rnd = makeSeededRandom('test-seed');
	const simOptions: NormalizedSimOptions = {};

	it('for first frame, interactions are applied AFTER generateFirstFrame', () => {
		const sim = new TimingSimulator();
		const interactions: Interaction[] = [
			{ type: 'test', agentID: 'a1' },
		];

		sim.generator(0, null, simOptions, rnd, 0, 800, 450, interactions);

		expect(sim.log).toHaveLength(2);
		expect(sim.log[0].method).toBe('generateFirstFrame');
		expect(sim.log[1].method).toBe('applyInteraction');
	});

	it('for non-first frames, interactions are applied BEFORE generateFrame', () => {
		const sim = new TimingSimulator();
		const previousFrame: SimulationFrame = {
			index: 0,
			simOptions,
			runIndex: 0,
			width: 800,
			height: 450,
		};
		const interactions: Interaction[] = [
			{ type: 'test', agentID: 'a1' },
		];

		sim.generator(1, previousFrame, simOptions, rnd, 0, 800, 450, interactions);

		const applyIdx = sim.log.findIndex(e => e.method === 'applyInteraction');
		const generateIdx = sim.log.findIndex(e => e.method === 'generateFrame');
		expect(applyIdx).toBeGreaterThanOrEqual(0);
		expect(generateIdx).toBeGreaterThanOrEqual(0);
		expect(applyIdx).toBeLessThan(generateIdx);
	});

	it('without interactions, no applyInteraction calls are made', () => {
		const sim = new TimingSimulator();
		const previousFrame: SimulationFrame = {
			index: 0,
			simOptions,
			runIndex: 0,
			width: 800,
			height: 450,
		};

		sim.generator(1, previousFrame, simOptions, rnd, 0, 800, 450);

		expect(sim.log.some(e => e.method === 'generateFrame')).toBe(true);
		expect(sim.log.some(e => e.method === 'applyInteraction')).toBe(false);
	});

	it('multiple interactions are all applied before generateFrame', () => {
		const sim = new TimingSimulator();
		const previousFrame: SimulationFrame = {
			index: 0,
			simOptions,
			runIndex: 0,
			width: 800,
			height: 450,
		};
		const interactions: Interaction[] = [
			{ type: 'test1', agentID: 'a1' },
			{ type: 'test2', agentID: 'a2' },
		];

		sim.generator(1, previousFrame, simOptions, rnd, 0, 800, 450, interactions);

		const applyEntries = sim.log.filter(e => e.method === 'applyInteraction');
		const generateIdx = sim.log.findIndex(e => e.method === 'generateFrame');
		expect(applyEntries).toHaveLength(2);
		const lastApplyIdx = sim.log.lastIndexOf(applyEntries[applyEntries.length - 1]);
		expect(lastApplyIdx).toBeLessThan(generateIdx);
	});
});
