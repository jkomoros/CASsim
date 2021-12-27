import { BaseSimulator } from "./simulator.js";

import { RectangleGraph }from './graph.js';

export class AgentSimulator extends BaseSimulator {

	graphConstructor() {
		return RectangleGraph;
	}

	//eslint-disable-next-line
	generateGraph(simOptions, rnd) {
		return RectangleGraph.make(simOptions.rows, simOptions.cols);
	}

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

	generateFirstFrame(simOptions, rnd) {
		//The default generator will expand this with index and simOptions.
		const graph = this.generateGraph(simOptions, rnd);
		const agents = this.generateAgents(graph, simOptions, rnd);
		return {
			agents,
			graph: graph.data
		};
	}

	//eslint-disable-next-line
	agentTick(agent, graph, frame, rnd) {
		return agent;
	}

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