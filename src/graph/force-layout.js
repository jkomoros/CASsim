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

/*
	A ForceLayoutGraph is a PositionedGraph whose x/y properteis are set by
	running a d3 force graph simulation.
*/
export class ForceLayoutGraph extends PositionedGraph {

	/*
		Makes an empty graph that is positioned.

		Options:
			minNodeSize: (default: 10.0) - The smallest rendered nodeSize in pixels
			maxNodeSize: (default: 10.0) - The largest rendered nodeSize in pixels
			nodeSize: (default: () -> 1.0) - A method given nodeValues and rnd, that should return the value to set.
			noCollide: (default: false) - If true then there will be no collison forces
	*/
	make(availableWidth, availableHeight, rnd, options) {
		const result = new ForceLayoutGraph();
		result.setBaseProperties(availableWidth, availableHeight, rnd, options);
		result.finishConstructor(rnd, options);
		return result;
	}

	setBaseProperties(availableWidth, availableHeight,rnd, options) {
		this.availableWidth = availableWidth;
		this.availableHeight = availableHeight;
		if (options.minNodeSize != undefined) this.defaultMinNodeSize = options.minNodeSize;
		if (options.maxNodeSize != undefined) this.defaultMaxNodeSize = options.maxNodeSize;
		this.nodeRoundness = 1.0;
		//Only set the flag to true if provided, so we don't dirty up the properties dict if it wasn't used.
		if (options.noCollide) this.noCollide = true;
	}

	set noCollide(val) {
		this.setProperty('noCollide', val);
	}

	get noCollide() {
		return this.property('noCollide') || false;
	}

	//Should be called by subclasses in their constructor
	finishConstructor(rnd, options) {
		const nodeSize = options.nodeSize || (() => 1.0);
		for (const node of Object.values(this.nodes())) {
			this.setNodeProperty(node, 'size', nodeSize(node, rnd));
		}
		this.bakeLayout();
	}

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
		if (!this.noCollide) simulation.force('collide', forceCollide().radius(n => this.nodeSize(n) * 0.55));
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