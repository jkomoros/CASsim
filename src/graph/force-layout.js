import {
	PositionedGraph
} from './positioned.js';

import * as d3 from 'd3';

export class ForceLayoutGraph extends PositionedGraph {

	/*
		Makes a graph that blooms out of a key node in the center.

		Nodes will have the properties you provided but also a level, which increments
		for how many primary links it will take to get back to the center.
		
		Edges will have the properties you provided but also a type: of 'primary' for
		direct bloom links.

		options: 
			levels (default: 3.0) - how many layers from the first node to go to.
			nodeValues: (default: {}) - the values to start each node with
			edgeValues: (default: {}) - the starter values for an edge
			childCount: (default: 5.0) - how many children each node should have
	*/
	static makeBloomGraph(availableWidth, availableHeight, options = {}) {
		const result = new ForceLayoutGraph();
		result.availableWidth = availableWidth;
		result.availableHeight = availableHeight;

		const levels = options.levels === undefined ? 3.0 : options.levels;
		const childCount = options.childCount === undefined ? 5.0 : options.childCount;
		const nodeValues = options.nodeValues || {};
		const edgeValues = options.edgeValues || {};
		let nodeCounter = 0;

		const keyNode = result.setNode(nodeCounter, {...nodeValues, level: 0});
		const nodesToProcess = [keyNode];
		while (nodesToProcess.length) {
			const node = nodesToProcess.shift();
			const newLevel = node.level + 1;
			//TODO: allow children count to differ
			for (let i = 0; i < childCount; i++) {
				const childNode = result.setNode(nodeCounter++, {...nodeValues, level: newLevel});
				result.setEdge(node, childNode, {...edgeValues, type: 'primary'});
				if (newLevel < levels) nodesToProcess.push(childNode);
			}
			//TODO: connect peer children to some degree
		}

		result.bakeLayout();

		return result;
	}

	calculateNodePosition(identifier) {
		const node = this.node(identifier);
		//layoutPositions will recalc layout if necessary
		return this._layoutPositions[node.id];
	}

	get _layoutPositions() {
		//TODO: we should throw out the cachedLayoutPositions if there are any
		//new nodes or edges created
		if (!this._cachedLayoutPositions) this._cachedLayoutPositions = this._recalcLayout();
		return this._cachedLayoutPositions;
	}

	_recalcLayout() {
		const nodes = Object.keys(this.nodes()).map(id => ({id}));
		//TODO: allow override value based on how strong it is
		const edges = Object.values(this.allEdges()).map(edge => ({source:edge.from, target: edge.to, value:1}));

		//It's gnarly to have this layout-dependent thing in here
		const width = this.availableWidth;
		const height = this.availableHeight;

		const simulation = d3.forceSimulation(nodes)
			.force('link', d3.forceLink().id(d => d.id))
			.force('charge', d3.forceManyBody())
			.force('center', d3.forceCenter(width / 2, height / 2))
			.stop();
		
		simulation.force('link')
			.links(edges);
		
		for (var i = 0; i < 300; ++i) simulation.tick();

		const result = {};
		for (const node of nodes) {
			result[node.id] = {x:node.x, y: node.y, width: 10, height: 10};
		}

		return result;
	}

}

ForceLayoutGraph.registerGraphType(ForceLayoutGraph);