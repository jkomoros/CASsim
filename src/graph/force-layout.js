import {
	PositionedGraph
} from './positioned.js';

import {
	forceSimulation,
	forceLink,
	forceCollide,
	forceManyBody,
	forceCenter
} from 'd3';

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

	/*
		A chance for a subclass to install more forces on the force layout simulation.
	*/
	//eslint-disable-next-line no-unused-vars
	installExtraForces(simulation) {
		//Do nothing by default
	}

	_recalcLayout() {

		const nodes = Object.values(this.nodes()).map(values => ({...values}));
		//TODO: allow override value based on how strong it is
		const edges = Object.values(this.allEdges()).map(edge => ({source:edge.from, target: edge.to, value:this.distanceForEdge(edge)}));

		const width = this.availableWidth;
		const height = this.availableHeight;

		const simulation = forceSimulation(nodes);

		simulation.force('link', forceLink(edges).id(d => d.id).distance(d => d.value));
		//nodeSize is the diameter, we want the radius. But give a bit of buffer...
		simulation.force('collide', forceCollide().radius(n => this.nodeSize(n) * 0.55));
		simulation.force('charge', forceManyBody());
		simulation.force('center', forceCenter(width / 2, height / 2));
		this.installExtraForces(simulation);
		simulation.stop();

		simulation.tick(300);

		const result = {};
		for (const node of nodes) {
			result[node.id] = {x:node.x, y: node.y};
		}

		return result;
	}

}

ForceLayoutGraph.registerGraphType(ForceLayoutGraph);