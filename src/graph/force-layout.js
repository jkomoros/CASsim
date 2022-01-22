import {
	PositionedGraph
} from './positioned.js';

import * as d3 from 'd3';

export class ForceLayoutGraph extends PositionedGraph {

	nodeSizeMultiplier(identifier) {
		const node = this.node(identifier);
		return node.size;
	}

	nodeX(identifier) {
		const id = ForceLayoutGraph.packID(identifier);
		//layoutPositions will recalc layout if necessary
		return this._layoutPositions[id].x;
	}

	nodeY(identifier) {
		const id = ForceLayoutGraph.packID(identifier);
		//layoutPositions will recalc layout if necessary
		return this._layoutPositions[id].y;
	}

	get _layoutPositions() {
		//TODO: we should throw out the cachedLayoutPositions if there are any
		//new nodes or edges created
		if (!this._cachedLayoutPositions) this._cachedLayoutPositions = this._recalcLayout();
		return this._cachedLayoutPositions;
	}

	/*
		distanceForEdge should return the distance value to use for the edge. Override point for subclases.
	*/
	//eslint-disable-next-line no-unused-vars
	distanceForEdge(edge) {
		return 1.0;
	}

	_recalcLayout() {

		const nodes = Object.values(this.nodes()).map(values => ({...values}));
		//TODO: allow override value based on how strong it is
		const edges = Object.values(this.allEdges()).map(edge => ({source:edge.from, target: edge.to, value:this.distanceForEdge(edge)}));

		const width = this.availableWidth;
		const height = this.availableHeight;

		const simulation = d3.forceSimulation(nodes)
			.force('link', d3.forceLink(edges).id(d => d.id).distance(d => d.value))
			//nodeSize is the diameter, we want the radius. But give a bit of buffer...
			.force('collide', d3.forceCollide().radius(n => this.nodeSize(n) * 0.55))
			.force('radial', d3.forceRadial().strength(() => 0.5).radius(d => d.levelRadius).x(width / 2).y(height / 2))
			.force('charge', d3.forceManyBody())
			.force('center', d3.forceCenter(width / 2, height / 2))
			.stop();

		simulation.tick(300);

		const result = {};
		for (const node of nodes) {
			result[node.id] = {x:node.x, y: node.y};
		}

		return result;
	}

}

ForceLayoutGraph.registerGraphType(ForceLayoutGraph);