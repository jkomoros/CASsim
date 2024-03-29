import { BaseSimulator } from "./simulator.js";

import { 
	dataIsGraph,
	Graph,
	inflateGraph,
}from './graph/graph.js';

import {
	RectangleGraph
} from './graph/rectangle.js';

import {
	CoordinatesMap
} from './coordinates-map.js';

import {
	shuffleInPlace,
	randomString,
	Urn
} from './util.js';

import {
	Angle,
	CoordinatesMapDataLeaf,
	Emoji,
	GraphData,
	GraphEdge,
	GraphExplorationEdgeScorer,
	GraphNodeID,
	GraphNodeValues,
	RandomGenerator,
	SimOptions,
	SimulationFrame
} from './types.js';

export type Agent = {
	id : string;
	node? : GraphNodeID;
	emoji? : Emoji;
	type? : string;
	x? : number;
	y? : number;
	height? : number;
	width? : number;
	angle? : Angle;
};

type AgentSimulationFrameExtra<A extends Agent, P extends (CoordinatesMap<A> | Graph)> = {
	agents : A[],
	positions: P extends Graph ? GraphData : CoordinatesMapDataLeaf,
}

export type AgentSimulationFrame<A extends Agent, P extends (CoordinatesMap<A> | Graph)> = SimulationFrame & AgentSimulationFrameExtra<A, P>;

export type NodeScorer = (neighbor : GraphNodeValues, length : number, path : GraphEdge[]) => number;

export type RowColOptionalSimOptions = SimOptions & {
	rows? : number;
	cols? : number;
}

type AnyNodeTicker<A extends Agent, F extends AgentSimulationFrame<A, P>, P extends (CoordinatesMap<A> | Graph)> = {
	[name : string] : (node : GraphNodeValues, positions : P, frame : F, rnd : RandomGenerator) => GraphNodeValues;
}

type AnyAgentTicker<A extends Agent, F extends AgentSimulationFrame<A, P>, P extends (CoordinatesMap<A> | Graph)> = {
	[name : string] : (agent : A, agents : A[], positions : P, frame : F, rnd : RandomGenerator) => A | A[];
}

export class AgentSimulator<A extends Agent, F extends AgentSimulationFrame<A, P>, P extends (CoordinatesMap<A> | Graph)> extends BaseSimulator {

	/*
		An override point for your generateFirstFrame. You should return the
		graph that agents will traverse. You might also want to override
		graphConstructor.

		baseFrame will have only SimulationFrame properties, no extras.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	generatePositions(baseFrame : SimulationFrame, _rnd : RandomGenerator) : P {
		const simOptions = baseFrame.simOptions as RowColOptionalSimOptions;
		const graph = RectangleGraph.make(simOptions.rows || 5, simOptions.cols || 5, baseFrame.width, baseFrame.height);
		//Returning as never allows us to keep the desired type signature, and
		//verify this base implemenation must be overriden by sub-classes. In
		//your subclass you could just say 'return graph';
		return graph as never;
	}

	//baseAgent returns an object with just a random, stable ID 
	baseAgent(rnd : RandomGenerator) : Agent {
		return {
			//By having a stable ID, animations in lit can happen correctly
			//because we can detect identity of an agent when stamping templates.
			id: randomString(6, rnd)
		};
	}

	/*
		An override point, the default generateAgents will call this when it's
		decided a location to generate an agent. parentAgent should be the
		parent that it's spawning from, but is likely null. otherAgents includes
		other agents that exist so far. An agent must be an object, not an
		array. Your return value should extend this.baseAgent(rnd);

		baseFrame is only guranteed to have literally SimulationFrame options,
		not anything else.
	*/
	generateAgent(_parentAgent : A, _otherAgents : A[], _positions : P, _baseFrame : SimulationFrame, rnd : RandomGenerator) : A {
		const result = {
			...this.baseAgent(rnd)
			//Your own properties would go here in your own generateAgent
		};
		//Returning as never allows us to keep the desired type signature, and
		//verify this base implemenation must be overriden by sub-classes. In
		//your subclass you could just say 'return result';
		return result as never;
	}

	/*
		An override point for how many agents to generate by default.

		baseFrame is only guaranteed to have literally SimulationFrame options,
		nothing else.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	numStarterAgents(_positions : P, _baseFrame : SimulationFrame, _rnd : RandomGenerator) : number {
		return 0;
	}

	/*
		An override point to allow multiple agents to exist in a given cell at a
		time. It is called for each pair of agents that might overlap. For
		example, you could return true unless the type property of each was the
		same.

		baseFrame is only guaranteed to have exactly SimulationFrame properties.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	allowOverlappingAgents(_primaryAgent : A, _secondaryAgent : A, _positions : P, _baseFrame : SimulationFrame, _rnd : RandomGenerator) : boolean {
		return false;
	}

	allowAgentToOverlapWith(primaryAgent : A, secondaryAgent : A, positions : P, baseFrame : SimulationFrame, rnd : RandomGenerator) : boolean {
		if (!primaryAgent || !secondaryAgent) return true;
		return this.allowOverlappingAgents(primaryAgent, secondaryAgent, positions, baseFrame, rnd);
	}

	/*
		An override point for skipping placing agents at the beginning.

		baseFrame can only be relied on to literally have SimulationFrame, not
		necesarily any other properties.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	skipPlacingAgents(positions : P, _baseFrame : SimulationFrame, _rnd : RandomGenerator) : boolean {
		return !positions;
	}

	/*
		Emit your starter set of agents. This will generate
		this.numStarterAgents() number of agents by calling this.generateAgent()
		and randomly place them in the graph (unless skipPlacingAgents()) with no
		overlap.

		baseFrame is only guranteed to literlaly have SimulationFrame properties, not others.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	generateAgents(positions : P, baseFrame : SimulationFrame, rnd : RandomGenerator) : A[] {
		const agents = [];
		const skipPlacingAgents = this.skipPlacingAgents(positions, baseFrame, rnd) || !(positions instanceof Graph);
		const baseAvailableNodes = skipPlacingAgents ? {} : {...positions.nodes()};
		const agentCount = this.numStarterAgents(positions, baseFrame, rnd);
		for (let i = 0; i < agentCount; i++) {
			const agent = this.generateAgent(null, agents, positions, baseFrame, rnd);
			if (!skipPlacingAgents) {
				const availableNodes = {...baseAvailableNodes};
				for (const existingAgent of agents) {
					if (this.allowAgentToOverlapWith(existingAgent, agent, positions, baseFrame, rnd)) continue;
					delete availableNodes[existingAgent.node];
				}
				const nodeList = Object.keys(availableNodes);
				if (nodeList.length <= 0) throw new Error('There are no new unocuppied nodes for new agents to occupy');
				const node = nodeList[Math.floor(rnd() * nodeList.length)];
				agent.node = node;
			}
			agents.push(agent);
		}
		return agents;
	}

	/*
		A place to emit extra properties in the first frame.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	generateFirstFrameExtra(_simOptions : SimOptions, _rnd : RandomGenerator, _simWidth : number, _simHeight : number) : {[name : string] : unknown} {
		return {};
	}

	/* 
		Create the graph and the agents
	*/
	override generateFirstFrame(baseFrame : SimulationFrame, rnd : RandomGenerator) : F {
		//The default generator will expand this with index and simOptions.
		const positions = this.generatePositions(baseFrame, rnd);
		const agents = this.generateAgents(positions, baseFrame, rnd);
		if (positions instanceof CoordinatesMap) {
			positions.updateAllObjects(agents);
		}
		const result = {
			...baseFrame,
			...(this.generateFirstFrameExtra(baseFrame.simOptions, rnd, baseFrame.width, baseFrame.height) || {}),
			agents,
			positions: positions ? positions.frameData : null
		};
		return result as F;
	}

	/*
		Called on every frame for every agent. It dispatches to the right ticker
		based on the agent.type, calling <agent.type>AgentTick(). (So agent.type
		= 'ant' would call 'antAgentTick()'). For agents who don't have a type,
		or whose type doesn't have a ticker for it, it calls defaultAgentTick().

		agent is the agent that is being ticked. agents is a list of all agents,
		including this one, with the intermediate state of the unticked agents
		being in their states from last frame and the ticked agents being in
		their new state. Note that other agents that have already ticked and are
		dead might be null.

		Your method should return the agent data to store for agent. If no
		changes, just return agent. If your agent has changed, return a copy of
		agent with modifications. If the agent should die, return null. If you
		want to spawn agents, return an array where the first item is the
		original agent (or null) and the remaining items are new agents that
		should be spawned. The newly spawned agents won't be ticked this frame.
	*/
	agentTick(agent : A, agents : A[], positions : P, frame : F, rnd : RandomGenerator) : A | A[] {
		const typ = agent.type || '';
		const typeMethod = typ + 'AgentTick';
		const thisTicker = (this as unknown) as AnyAgentTicker<A,F,P>;
		if (thisTicker[typeMethod]) return thisTicker[typeMethod](agent, agents, positions, frame, rnd);
		return this.defaultAgentTick(agent, agents, positions, frame, rnd);
	}

	/*
		Called on each agent that doesn't have their own [type]AgentTick method.
		This will get called for every other agent. Return the new agent to store in
		frame. If no modifications you can return the agent as is. IF
		modifications, make a modified copy of agent and return that.

		see agentTick for more about behavior of arguments and return values.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	defaultAgentTick(agent : A, _agents : A[], _positions : P, _frame : F, _rnd : RandomGenerator) : A | A[] {
		return agent;
	}

	/*
		Called on each node on each frame. By default it dispatches to methods
		called typNodeTick() if node has a type:typ. If no type is set, or no
		method matches the type, it dispatches to defaultNodeTick instead.
		Typically you leave this as is and change defaultNodeTick's behavior.
	*/
	nodeTick(node : GraphNodeValues, positions : P, frame : F, rnd : RandomGenerator) : GraphNodeValues {
		const typ = node.type || '';
		const typeMethod = typ + 'NodeTick';
		const thisTicker = (this as unknown) as AnyNodeTicker<A,F,P>;
		if (thisTicker[typeMethod]) return thisTicker[typeMethod](node, positions, frame, rnd);
		return this.defaultNodeTick(node, positions, frame, rnd);
	}

	//ply is how far afield to explore. nodeScorer(neighborNode, length, path)
	//should return a float. edgeScorer is passed to graph.shortestPath and may
	//be undefined. All candidates will be put in an urn with their floats as
	//their probability of being picked.
	selectNodeToMoveTo(agent : A, agents : A[], positions : P, frame : F, rnd : RandomGenerator, ply = 1, nodeScorer : NodeScorer = () => 1.0, edgeScorer? : GraphExplorationEdgeScorer) : GraphNodeValues {
		if (!(positions instanceof Graph)) return null;
		const neighborsMap = positions.neighbors(agent.node, ply);
		//Agents might have nulls for agents who have already died this tick.
		const agentsByNode = Object.fromEntries(agents.filter(agent => agent).map(agent => [agent.node, agent]));
		for (const neighbor of Object.keys(neighborsMap)) {
			if (this.allowAgentToOverlapWith(agent, agentsByNode[neighbor], positions, frame, rnd)) continue;
			delete neighborsMap[neighbor];
		}
		const urn = new Urn<GraphNodeValues>(rnd);
		for (const neighbor of Object.values(neighborsMap)) {
			const [length, shortestPath] = positions.shortestPath(agent.node, neighbor, edgeScorer);
			const score = nodeScorer(neighbor, length, shortestPath);
			urn.add(neighbor, score);
		}
		return urn.pick();
	}

	/*
		defaultNodeTick is the node ticker that is called each frame if there
		isn't an override ticker for this node type. Return the new node to
		store in the frame. If no modifications you can return node as is. If
		modifications, make a copy to modify and return that.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	defaultNodeTick(node : GraphNodeValues, _positions : P, _frame : F, _rnd : RandomGenerator) : GraphNodeValues {
		return node;
	}

	/*
		If true, agents will be ticked in a random order each frame.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	randomizeAgentTickOrder(_simOptions : SimOptions) : boolean {
		return true;
	}

	/*
		An opportunity to spawn new agents in this frame. Return an array of
		agents to spawn.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	spawnAgents(_agents : A[], _positions : P, _frame : F, _rnd : RandomGenerator) : A[] {
		return [];
	}

	/*
		An opportunity to do things in the frame before any agents or nodes are
		ticked. You can modify frame directly, but if you modify any sub-objects
		you should copy them.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
	framePreTick(_positions : P, _frame : F, _rnd : RandomGenerator) : void {

	}

	/*
		An opportunity to do things to the frame after any agents and nodes have
		been ticked. You can modify frame directly, but if you modify any
		sub-objects you should copy them.
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
	framePostTick(_positions : P, _frame : F, _rnd : RandomGenerator) : void {

	}

	/*
		Ticks all agents, and all nodes.
	*/
	override generateFrame(frame : F, rnd : RandomGenerator) : void {
		const positions = frame.positions ? (dataIsGraph(frame.positions) ? inflateGraph(frame.positions) as P : CoordinatesMap.fromFrameData(frame.positions, frame, frame.agents) as P): null;
		const newAgents = [...frame.agents];
		const agentIterationOrder = [...frame.agents.keys()];
		this.framePreTick(positions, frame, rnd);
		if (this.randomizeAgentTickOrder(frame.simOptions)) {
			shuffleInPlace(agentIterationOrder, rnd);
		}
		for (const index of agentIterationOrder) {
			const agent = frame.agents[index];
			const result = this.agentTick(agent, newAgents, positions, frame, rnd);
			const newAgent = Array.isArray(result) ? result[0] : result;
			newAgents[index] = newAgent;
			if (Array.isArray(result)) {
				//We push any newly spawned agents onto the end of newAgents.
				//They won't be ticked this frame, because we already selected
				//the indexes to visit in which order, and they don't include these new agents.
				newAgents.push(...result.slice(1));
			}
		}
		//Filter out agents who died this tick (returned null)
		const filteredNewAgents = newAgents.filter(agent => agent);
		frame.agents = [...filteredNewAgents, ...this.spawnAgents(filteredNewAgents, positions, frame, rnd).filter(agent => agent)];
		if (positions) {
			if (positions instanceof Graph) {
				for (const [id, node] of Object.entries(positions.nodes())) {
					const newNode = this.nodeTick(node, positions, frame, rnd);
					//If we set the node to the same values as it was, then the graph
					//will detect no changes were made.
					positions.setNode(id, newNode);
				}
			} else if (positions instanceof CoordinatesMap) {
				positions.updateAllObjects(frame.agents);
			}
		}
		this.framePostTick(positions, frame, rnd);
		if (positions && positions.changesMade) {
			frame.positions = positions.frameData as (P extends Graph ? GraphData : CoordinatesMapDataLeaf);
			positions.saved();
		}
	}
}