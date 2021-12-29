import { BaseSimulator } from "./simulator.js";

import { RectangleGraph }from './graph.js';

export class AgentSimulator extends BaseSimulator {

	/*
		An override point if you use change the kind of graph in use.
	*/
	graphConstructor() {
		return RectangleGraph;
	}

	/*
		An override point for your generateFirstFrame. You should return the
		graph that agents will traverse. You might also want to override
		graphConstructor.
	*/
	//eslint-disable-next-line
	generateGraph(simOptions, rnd) {
		return RectangleGraph.make(simOptions.rows, simOptions.cols);
	}

	/*
		An override point, the default generateAgents will call this when it's
		decided a location to generate an agent.
	*/
	//eslint-disable-next-line
	generateAgent(index, graph, simOptions, rnd) {
		return {};
	}

	/*
		An override point for how many agents to generate by default.
	*/
	//eslint-disable-next-line no-unused-vars
	numStarterAgents(graph, simOptions, rnd) {
		return 0;
	}

	/*
		An override point to allow multiple agents to exist in a given cell at a
		time. It is called for each pair of agents that might overlap. For
		example, you could return true unless the type property of each was the
		same.
	*/
	//eslint-disable-next-line no-unused-vars
	allowOverlappingAgents(primaryAgent, secondaryAgent, graph, simOptions, rnd) {
		return false;
	}

	/*
		Emit your starter set of agents. This will generate
		this.numStarterAgents() number of agents by calling this.generateAgent()
		and randomly place them in the graph with no overlap.
	*/
	generateAgents(graph, simOptions, rnd) {
		const agents = [];
		const baseAvailableNodes = {...graph.nodes()};
		const agentCount = this.numStarterAgents(graph, simOptions, rnd);
		for (let i = 0; i < agentCount; i++) {
			const agent = this.generateAgent(i, graph, simOptions, rnd) || {};
			const availableNodes = {...baseAvailableNodes};
			for (const existingAgent of agents) {
				if (this.allowOverlappingAgents(existingAgent, agent, graph, simOptions, rnd)) continue;
				delete availableNodes[existingAgent.node];
			}
			const nodeList = Object.keys(availableNodes);
			if (nodeList.length <= 0) throw new Error('There are no new unocuppied nodes for new agents to occupy');
			const node = nodeList[Math.floor(rnd() * nodeList.length)];
			agent.node = node;
			agents.push(agent);
		}
		return agents;
	}

	/* 
		Create the graph and the agents
	*/
	generateFirstFrame(simOptions, rnd) {
		//The default generator will expand this with index and simOptions.
		const graph = this.generateGraph(simOptions, rnd);
		const agents = this.generateAgents(graph, simOptions, rnd);
		return {
			agents,
			graph: graph.data
		};
	}

	/*
		Called on every frame for every agent. It dispatches to the right ticker
		based on the agent.type, calling <agent.type>AgentTick(). (So agent.type
		= 'ant' would call 'antAgentTick()'). For agents who don't have a type,
		or whose type doesn't have a ticker for it, it calls defaultAgentTick().
	*/
	agentTick(agent, graph, frame, rnd) {
		const typ = agent.type || '';
		const typeMethod = typ + 'AgentTick';
		if (this[typeMethod]) return this[typeMethod](agent, graph, frame, rnd);
		return this.defaultAgentTick(agent, graph, frame, rnd);
	}

	/*
		Called on each agent that doesn't have their own [type]AgentTick method.
		This will get called for every other agent. Return the new agent to store in
		frame. If no modifications you can return the agent as is. IF
		modifications, make a modified copy of agent and return that.
	*/
	//eslint-disable-next-line
	defaultAgentTick(agent, graph, frame, rnd) {
		return agent;
	}

	/*
		Called on each node on each frame. By default it dispatches to methods
		called typNodeTick() if node has a type:typ. If no type is set, or no
		method matches the type, it dispatches to defaultNodeTick instead.
		Typically you leave this as is and change defaultNodeTick's behavior.
	*/
	nodeTick(node, graph, frame, rnd) {
		const typ = node.type || '';
		const typeMethod = typ + 'NodeTick';
		if (this[typeMethod]) return this[typeMethod](node, graph, frame, rnd);
		return this.defaultNodeTick(node, graph, frame, rnd);
	}

	/*
		defaultNodeTick is the node ticker that is called each frame if there
		isn't an override ticker for this node type. Return the new node to
		store in the frame. If no modifications you can return node as is. If
		modifications, make a copy to modify and return that.
	*/
	//eslint-disable-next-line no-unused-vars
	defaultNodeTick(node, graph, frame, rnd) {
		return node;
	}

	/*
		Ticks all agents, and all nodes.
	*/
	generateFrame(frame, rnd) {
		const graph = new (this.graphConstructor())(frame.graph);
		const newAgents = [];
		//TODO: go through agents in random order
		for (const [index, agent] of frame.agents.entries()) {
			newAgents[index] = this.agentTick(agent, graph, frame, rnd);
		}
		frame.agents = newAgents;
		for (const [id, node] of Object.entries(graph.nodes())) {
			const newNode = this.nodeTick(node, graph, frame, rnd);
			//If we set the node to the same values as it was, then the graph
			//will detect no changes were made.
			graph.setNode(id, newNode);
		}
		if (graph.changesMade) {
			frame.graph = graph.data;
			graph.saved();
		}
	}
}