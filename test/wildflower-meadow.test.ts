import { describe, it, expect } from 'vitest';

import WildflowerMeadowSimulator from '../src/simulators/wildflower-meadow.js';

import { RectangleGraph } from '../src/graph/rectangle.js';

import type {
	Interaction,
	InteractionDefinition,
} from '../src/types.js';

// -- helpers ------------------------------------------------------------------

const DEFAULT_SIM_OPTIONS = {
	rows: 10,
	cols: 15,
	weedSpawnRate: 0.02,
	weedSpreadRate: 0.15,
	basePollination: 0.05,
	bloomDuration: 6,
	seedGrowthTime: 2,
	growGrowthTime: 3,
	wiltDuration: 2,
};

type CellState = 'bare' | 'fertile' | 'seed' | 'growing' | 'blooming' | 'wilting' | 'weed';

const makeMeadowAgent = (overrides: Record<string, unknown> = {}) => ({
	id: 'agent-0',
	state: 'bare' as CellState,
	age: 0,
	flowerType: 0,
	node: 'node-0',
	...overrides,
});

const makeFrame = (agentOverrides: Record<string, unknown>[] = [], simOptionsOverrides: Record<string, unknown> = {}) => {
	const agents = agentOverrides.length > 0
		? agentOverrides.map((o, i) => makeMeadowAgent({ id: `agent-${i}`, node: `node-${i}`, ...o }))
		: [makeMeadowAgent()];
	const agentsByNode: Record<string, typeof agents[0]> = {};
	for (const agent of agents) {
		agentsByNode[agent.node as string] = agent;
	}
	return {
		index: 1,
		simOptions: { ...DEFAULT_SIM_OPTIONS, ...simOptionsOverrides },
		runIndex: 0,
		width: 800,
		height: 450,
		agents,
		positions: null,
		agentsByNode,
	};
};

// -- Tests --------------------------------------------------------------------

describe('WildflowerMeadowSimulator', () => {
	const sim = new WildflowerMeadowSimulator();

	describe('interactionsConfig', () => {
		it('returns the expected interaction definition', () => {
			const config = sim.interactionsConfig();
			expect(config).toHaveLength(1);
			const def: InteractionDefinition = config[0];
			expect(def.type).toBe('tend');
			expect(def.label).toBe('Tend');
			expect(def.shortcut).toBe('t');
		});
	});

	describe('applyAgentInteraction', () => {
		it('is a no-op for unknown interaction type', () => {
			const frame = makeFrame([{ state: 'bare' }]);
			const originalAgents = frame.agents;

			sim.applyAgentInteraction(
				{ type: 'unknown', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents).toBe(originalAgents);
			expect(frame.agents[0].state).toBe('bare');
		});

		it('is a no-op for unknown agent ID', () => {
			const frame = makeFrame([{ state: 'bare' }]);
			const originalAgents = frame.agents;

			sim.applyAgentInteraction(
				{ type: 'tend', agentID: 'nonexistent' } as Interaction,
				frame as never
			);

			expect(frame.agents).toBe(originalAgents);
		});

		it('tend on bare cell becomes seed', () => {
			const frame = makeFrame([{ state: 'bare' }]);

			sim.applyAgentInteraction(
				{ type: 'tend', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents[0].state).toBe('seed');
			expect(frame.agents[0].age).toBe(0);
		});

		it('tend on fertile cell becomes seed', () => {
			const frame = makeFrame([{ state: 'fertile' }]);

			sim.applyAgentInteraction(
				{ type: 'tend', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents[0].state).toBe('seed');
			expect(frame.agents[0].age).toBe(0);
		});

		it('tend on weed becomes bare', () => {
			const frame = makeFrame([{ state: 'weed' }]);

			sim.applyAgentInteraction(
				{ type: 'tend', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents[0].state).toBe('bare');
			expect(frame.agents[0].age).toBe(0);
		});

		it('tend on seed is a no-op', () => {
			const frame = makeFrame([{ state: 'seed', age: 1 }]);
			const originalAgents = frame.agents;

			sim.applyAgentInteraction(
				{ type: 'tend', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents).toBe(originalAgents);
			expect(frame.agents[0].state).toBe('seed');
		});

		it('tend on growing is a no-op', () => {
			const frame = makeFrame([{ state: 'growing' }]);
			const originalAgents = frame.agents;

			sim.applyAgentInteraction(
				{ type: 'tend', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents).toBe(originalAgents);
			expect(frame.agents[0].state).toBe('growing');
		});

		it('tend on blooming is a no-op', () => {
			const frame = makeFrame([{ state: 'blooming' }]);
			const originalAgents = frame.agents;

			sim.applyAgentInteraction(
				{ type: 'tend', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents).toBe(originalAgents);
			expect(frame.agents[0].state).toBe('blooming');
		});

		it('tend on wilting is a no-op', () => {
			const frame = makeFrame([{ state: 'wilting' }]);
			const originalAgents = frame.agents;

			sim.applyAgentInteraction(
				{ type: 'tend', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents).toBe(originalAgents);
			expect(frame.agents[0].state).toBe('wilting');
		});

		it('clones the agents array when making a change', () => {
			const frame = makeFrame([{ state: 'bare' }]);
			const originalAgentsRef = frame.agents;

			sim.applyAgentInteraction(
				{ type: 'tend', agentID: 'agent-0' } as Interaction,
				frame as never
			);

			expect(frame.agents).not.toBe(originalAgentsRef);
			expect(originalAgentsRef[0].state).toBe('bare');
		});
	});

	describe('state transitions via defaultAgentTick', () => {
		// We need a small graph to test neighbor-dependent behavior
		const makeGraphAndFrame = (
			agents: Record<string, unknown>[],
			simOptionsOverrides: Record<string, unknown> = {}
		) => {
			// Create a 3x3 grid for predictable neighbor lookups
			const graph = RectangleGraph.make(3, 3, 300, 300, { diagonal: true });
			const nodeIds = Object.keys(graph.nodes());
			const frameAgents = agents.map((o, i) => makeMeadowAgent({
				id: `agent-${i}`,
				node: nodeIds[i],
				...o,
			}));
			const agentsByNode: Record<string, typeof frameAgents[0]> = {};
			for (const agent of frameAgents) {
				agentsByNode[agent.node as string] = agent;
			}
			const frame = {
				index: 1,
				simOptions: { ...DEFAULT_SIM_OPTIONS, rows: 3, cols: 3, ...simOptionsOverrides },
				runIndex: 0,
				width: 300,
				height: 300,
				agents: frameAgents,
				positions: graph.frameData,
				agentsByNode,
			};
			return { graph, frame, nodeIds };
		};

		it('seed transitions to growing after seedGrowthTime', () => {
			const { graph, frame } = makeGraphAndFrame([
				{ state: 'seed', age: 1 },
				// fill remaining 8 cells as bare
				...Array(8).fill({ state: 'bare' }),
			], { seedGrowthTime: 2 });

			// rnd not needed for deterministic transition
			const rnd = () => 0.99; // high value to avoid any random transitions
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'growing', age: 0 }));
		});

		it('seed increments age when not yet ready', () => {
			const { graph, frame } = makeGraphAndFrame([
				{ state: 'seed', age: 0 },
				...Array(8).fill({ state: 'bare' }),
			], { seedGrowthTime: 2 });

			const rnd = () => 0.99;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'seed', age: 1 }));
		});

		it('growing transitions to blooming after growGrowthTime', () => {
			const { graph, frame } = makeGraphAndFrame([
				{ state: 'growing', age: 2 },
				...Array(8).fill({ state: 'bare' }),
			], { growGrowthTime: 3 });

			const rnd = () => 0.99;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'blooming', age: 0 }));
		});

		it('blooming transitions to wilting after bloomDuration', () => {
			const { graph, frame } = makeGraphAndFrame([
				{ state: 'blooming', age: 5 },
				...Array(8).fill({ state: 'bare' }),
			], { bloomDuration: 6 });

			const rnd = () => 0.99;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'wilting', age: 0 }));
		});

		it('wilting transitions to fertile after wiltDuration', () => {
			const { graph, frame } = makeGraphAndFrame([
				{ state: 'wilting', age: 1 },
				...Array(8).fill({ state: 'bare' }),
			], { wiltDuration: 2 });

			const rnd = () => 0.99; // high to avoid weed conversion
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'fertile', age: 0 }));
		});

		it('weed is persistent (no self-transition)', () => {
			const { graph, frame } = makeGraphAndFrame([
				{ state: 'weed', age: 100 },
				...Array(8).fill({ state: 'bare' }),
			]);

			const rnd = () => 0.5;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'weed' }));
		});

		it('full lifecycle: seed -> growing -> blooming -> wilting -> fertile', () => {
			// Use a 1x1 grid (no neighbors) to test pure state transitions
			const graph = RectangleGraph.make(1, 1, 100, 100);
			const nodeIds = Object.keys(graph.nodes());
			const rnd = () => 0.99;
			const simOptions = { ...DEFAULT_SIM_OPTIONS, rows: 1, cols: 1, seedGrowthTime: 1, growGrowthTime: 1, bloomDuration: 1, wiltDuration: 1 };

			let agent = makeMeadowAgent({ node: nodeIds[0], state: 'seed' as CellState, age: 0 });
			const makeFrameForAgent = (a: typeof agent) => ({
				index: 1, simOptions, runIndex: 0, width: 100, height: 100,
				agents: [a], positions: graph.frameData,
				agentsByNode: { [a.node as string]: a },
			});

			// seed (age 0) -> should transition to growing
			let frame = makeFrameForAgent(agent);
			agent = sim.defaultAgentTick(agent, [agent], graph, frame as never, rnd) as typeof agent;
			expect(agent.state).toBe('growing');

			// growing (age 0) -> should transition to blooming
			frame = makeFrameForAgent(agent);
			agent = sim.defaultAgentTick(agent, [agent], graph, frame as never, rnd) as typeof agent;
			expect(agent.state).toBe('blooming');

			// blooming (age 0) -> should transition to wilting
			frame = makeFrameForAgent(agent);
			agent = sim.defaultAgentTick(agent, [agent], graph, frame as never, rnd) as typeof agent;
			expect(agent.state).toBe('wilting');

			// wilting (age 0) -> should transition to fertile
			frame = makeFrameForAgent(agent);
			agent = sim.defaultAgentTick(agent, [agent], graph, frame as never, rnd) as typeof agent;
			expect(agent.state).toBe('fertile');
		});
	});

	describe('weed spread mechanics', () => {
		const makeGraphAndFrame = (
			agents: Record<string, unknown>[],
			simOptionsOverrides: Record<string, unknown> = {}
		) => {
			const graph = RectangleGraph.make(3, 3, 300, 300, { diagonal: true });
			const nodeIds = Object.keys(graph.nodes());
			const frameAgents = agents.map((o, i) => makeMeadowAgent({
				id: `agent-${i}`,
				node: nodeIds[i],
				...o,
			}));
			const agentsByNode: Record<string, typeof frameAgents[0]> = {};
			for (const agent of frameAgents) {
				agentsByNode[agent.node as string] = agent;
			}
			const frame = {
				index: 1,
				simOptions: { ...DEFAULT_SIM_OPTIONS, rows: 3, cols: 3, ...simOptionsOverrides },
				runIndex: 0,
				width: 300,
				height: 300,
				agents: frameAgents,
				positions: graph.frameData,
				agentsByNode,
			};
			return { graph, frame, nodeIds };
		};

		it('weed spreads to bare neighbor with certainty when weedSpreadRate is 1.0', () => {
			// Center cell (index 4) is bare, surrounded by weeds
			const agents = Array(9).fill(null).map((_, i) =>
				i === 4 ? { state: 'bare' } : { state: 'weed' }
			);
			const { graph, frame } = makeGraphAndFrame(agents, {
				weedSpreadRate: 1.0,
				weedSpawnRate: 0,
			});

			const rnd = () => 0.0; // guarantees spread
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'weed' }));
		});

		it('weed does not spread when rnd is high enough', () => {
			// Center cell bare, one weed neighbor
			const agents = Array(9).fill(null).map((_, i) => {
				if (i === 4) return { state: 'bare' };
				if (i === 3) return { state: 'weed' };
				return { state: 'bare' };
			});
			const { graph, frame } = makeGraphAndFrame(agents, {
				weedSpreadRate: 0.15,
				weedSpawnRate: 0,
			});

			// rnd() > 0.15 means no spread
			const rnd = () => 0.99;
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'bare' }));
		});

		it('weed spreads to wilting cells', () => {
			// Center cell wilting, all neighbors weeds
			const agents = Array(9).fill(null).map((_, i) =>
				i === 4 ? { state: 'wilting', age: 0 } : { state: 'weed' }
			);
			const { graph, frame } = makeGraphAndFrame(agents, {
				weedSpreadRate: 1.0,
			});

			const rnd = () => 0.0;
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'weed' }));
		});

		it('weed spreads to fertile cells', () => {
			// Center cell fertile, all neighbors weeds
			const agents = Array(9).fill(null).map((_, i) =>
				i === 4 ? { state: 'fertile' } : { state: 'weed' }
			);
			const { graph, frame } = makeGraphAndFrame(agents, {
				weedSpreadRate: 1.0,
				weedSpawnRate: 0,
			});

			const rnd = () => 0.0;
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'weed' }));
		});
	});

	describe('edge weed spawning', () => {
		it('edge bare cell can spontaneously spawn weed', () => {
			// Use 3x3 grid; index 0 is at row=0, col=0 (edge)
			const graph = RectangleGraph.make(3, 3, 300, 300, { diagonal: true });
			const nodeIds = Object.keys(graph.nodes());
			const agents = Array(9).fill(null).map((_, i) => makeMeadowAgent({
				id: `agent-${i}`,
				node: nodeIds[i],
				state: 'bare' as CellState,
			}));
			const agentsByNode: Record<string, typeof agents[0]> = {};
			for (const agent of agents) {
				agentsByNode[agent.node as string] = agent;
			}
			const frame = {
				index: 1,
				simOptions: { ...DEFAULT_SIM_OPTIONS, rows: 3, cols: 3, weedSpawnRate: 1.0, weedSpreadRate: 0 },
				runIndex: 0,
				width: 300,
				height: 300,
				agents,
				positions: graph.frameData,
				agentsByNode,
			};

			// Edge cell (index 0) with weedSpawnRate=1.0 should always spawn
			const rnd = () => 0.0;
			const result = sim.defaultAgentTick(frame.agents[0], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'weed' }));
		});

		it('center cell does not spontaneously spawn weed', () => {
			const graph = RectangleGraph.make(3, 3, 300, 300, { diagonal: true });
			const nodeIds = Object.keys(graph.nodes());
			const agents = Array(9).fill(null).map((_, i) => makeMeadowAgent({
				id: `agent-${i}`,
				node: nodeIds[i],
				state: 'bare' as CellState,
			}));
			const agentsByNode: Record<string, typeof agents[0]> = {};
			for (const agent of agents) {
				agentsByNode[agent.node as string] = agent;
			}
			const frame = {
				index: 1,
				simOptions: { ...DEFAULT_SIM_OPTIONS, rows: 3, cols: 3, weedSpawnRate: 1.0, weedSpreadRate: 0 },
				runIndex: 0,
				width: 300,
				height: 300,
				agents,
				positions: graph.frameData,
				agentsByNode,
			};

			// Center cell (index 4) is not an edge cell, should not spawn weed
			const rnd = () => 0.0;
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'bare' }));
		});
	});

	describe('pollination mechanics', () => {
		const makeGraphAndFrame = (
			agents: Record<string, unknown>[],
			simOptionsOverrides: Record<string, unknown> = {}
		) => {
			const graph = RectangleGraph.make(3, 3, 300, 300, { diagonal: true });
			const nodeIds = Object.keys(graph.nodes());
			const frameAgents = agents.map((o, i) => makeMeadowAgent({
				id: `agent-${i}`,
				node: nodeIds[i],
				...o,
			}));
			const agentsByNode: Record<string, typeof frameAgents[0]> = {};
			for (const agent of frameAgents) {
				agentsByNode[agent.node as string] = agent;
			}
			const frame = {
				index: 1,
				simOptions: { ...DEFAULT_SIM_OPTIONS, rows: 3, cols: 3, ...simOptionsOverrides },
				runIndex: 0,
				width: 300,
				height: 300,
				agents: frameAgents,
				positions: graph.frameData,
				agentsByNode,
			};
			return { graph, frame, nodeIds };
		};

		it('blooming neighbor pollinates bare cell with certainty at basePollination=1.0', () => {
			// Center bare, one blooming neighbor, no weeds
			const agents = Array(9).fill(null).map((_, i) => {
				if (i === 4) return { state: 'bare' };
				if (i === 3) return { state: 'blooming' };
				return { state: 'bare' };
			});
			const { graph, frame } = makeGraphAndFrame(agents, {
				basePollination: 1.0,
				weedSpreadRate: 0,
				weedSpawnRate: 0,
			});

			const rnd = () => 0.0;
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'seed' }));
		});

		it('no pollination without blooming neighbors', () => {
			const agents = Array(9).fill(null).map(() => ({ state: 'bare' }));
			const { graph, frame } = makeGraphAndFrame(agents, {
				basePollination: 1.0,
				weedSpreadRate: 0,
				weedSpawnRate: 0,
			});

			const rnd = () => 0.0;
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'bare' }));
		});

		it('fertile soil gets 2x pollination bonus', () => {
			// Center fertile, one blooming neighbor
			// With basePollination=0.3 and 1 blooming neighbor:
			// bare probability = 0.3 * 1 = 0.3
			// fertile probability = 0.3 * 1 * 2 = 0.6
			const agents = Array(9).fill(null).map((_, i) => {
				if (i === 4) return { state: 'fertile' };
				if (i === 3) return { state: 'blooming' };
				return { state: 'bare' };
			});
			const { graph, frame } = makeGraphAndFrame(agents, {
				basePollination: 0.3,
				weedSpreadRate: 0,
				weedSpawnRate: 0,
			});

			// rnd() = 0.5 is > 0.3 (bare would fail) but < 0.6 (fertile succeeds)
			const rnd = () => 0.5;
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'seed' }));
		});

		it('bare soil does not get fertile bonus', () => {
			// Same setup but bare center
			const agents = Array(9).fill(null).map((_, i) => {
				if (i === 4) return { state: 'bare' };
				if (i === 3) return { state: 'blooming' };
				return { state: 'bare' };
			});
			const { graph, frame } = makeGraphAndFrame(agents, {
				basePollination: 0.3,
				weedSpreadRate: 0,
				weedSpawnRate: 0,
			});

			// rnd() = 0.5 > 0.3, so pollination fails for bare
			const rnd = () => 0.5;
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'bare' }));
		});

		it('multiple blooming neighbors increase pollination chance (synergy)', () => {
			// Center bare, 3 blooming neighbors
			// Probability = 0.1 * 3 = 0.3
			const agents = Array(9).fill(null).map((_, i) => {
				if (i === 4) return { state: 'bare' };
				if (i <= 2) return { state: 'blooming' }; // 3 blooming neighbors (indices 0,1,2 are row 0)
				return { state: 'bare' };
			});
			const { graph, frame } = makeGraphAndFrame(agents, {
				basePollination: 0.1,
				weedSpreadRate: 0,
				weedSpawnRate: 0,
			});

			// rnd() = 0.2 < 0.3, should succeed
			const rnd = () => 0.2;
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			expect(result).toEqual(expect.objectContaining({ state: 'seed' }));
		});
	});

	describe('priority: weed spread > weed spawn > pollination', () => {
		it('weed spread takes priority over pollination', () => {
			// Center bare, one weed neighbor AND one blooming neighbor
			const graph = RectangleGraph.make(3, 3, 300, 300, { diagonal: true });
			const nodeIds = Object.keys(graph.nodes());
			const agents = Array(9).fill(null).map((_, i) => {
				if (i === 4) return { state: 'bare' };
				if (i === 3) return { state: 'weed' };
				if (i === 5) return { state: 'blooming' };
				return { state: 'bare' };
			});
			const frameAgents = agents.map((o, i) => makeMeadowAgent({
				id: `agent-${i}`,
				node: nodeIds[i],
				...o,
			}));
			const agentsByNode: Record<string, typeof frameAgents[0]> = {};
			for (const agent of frameAgents) {
				agentsByNode[agent.node as string] = agent;
			}
			const frame = {
				index: 1,
				simOptions: { ...DEFAULT_SIM_OPTIONS, rows: 3, cols: 3, weedSpreadRate: 1.0, basePollination: 1.0, weedSpawnRate: 0 },
				runIndex: 0,
				width: 300,
				height: 300,
				agents: frameAgents,
				positions: graph.frameData,
				agentsByNode,
			};

			const rnd = () => 0.0;
			const result = sim.defaultAgentTick(frame.agents[4], frame.agents, graph, frame as never, rnd);
			// Weed spread should win
			expect(result).toEqual(expect.objectContaining({ state: 'weed' }));
		});
	});

	describe('simulationComplete', () => {
		it('never completes (interactive sandbox)', () => {
			const frame = makeFrame();
			expect(sim.simulationComplete(frame as never)).toBe(false);
		});
	});

	describe('frameScorer', () => {
		it('returns proportion of blooming cells', () => {
			const frame = makeFrame([
				{ state: 'blooming' },
				{ state: 'blooming' },
				{ state: 'bare' },
				{ state: 'weed' },
			]);
			const scores = sim.frameScorer(frame as never);
			expect(scores[0]).toBe(-1); // never complete
			expect(scores[1]).toBeCloseTo(0.5); // 2 of 4 blooming
		});

		it('returns 0 when no cells are blooming', () => {
			const frame = makeFrame([
				{ state: 'bare' },
				{ state: 'weed' },
			]);
			const scores = sim.frameScorer(frame as never);
			expect(scores[1]).toBe(0);
		});
	});

	describe('optionsConfig', () => {
		it('defines all expected options', () => {
			const config = sim.optionsConfig;
			expect(config.rows).toBeDefined();
			expect(config.cols).toBeDefined();
			expect(config.weedSpawnRate).toBeDefined();
			expect(config.weedSpreadRate).toBeDefined();
			expect(config.basePollination).toBeDefined();
			expect(config.bloomDuration).toBeDefined();
			expect(config.seedGrowthTime).toBeDefined();
			expect(config.growGrowthTime).toBeDefined();
			expect(config.wiltDuration).toBeDefined();
		});
	});
});
