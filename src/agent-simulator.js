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
		Emit your starter set of agents.
	*/
	generateAgents(graph, simOptions, rnd) {
		const agents = [];
		const nodes = Object.keys(graph.nodes());
		for (let i = 0; i < simOptions.agents; i++) {
			const node = nodes[Math.floor(rnd() * nodes.length)];
			agents.push({
				node
			});
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
		Called on every frame for every agent. Return the new agent to store in
		frame. If no modifications you can return the agent as is. IF
		modifications, make a modified copy of agent and return that.
	*/
	//eslint-disable-next-line
	agentTick(agent, graph, frame, rnd) {
		return agent;
	}

	/*
		Ticks all agents 
	*/
	generateFrame(frame, rnd) {
		const graph = new (this.graphConstructor())(frame.graph);
		const newAgents = [];
		//TODO: go through agents in random order
		for (const [index, agent] of frame.agents.entries()) {
			newAgents[index] = this.agentTick(agent, graph, frame, rnd);
		}
		frame.agents = newAgents;
	}
}