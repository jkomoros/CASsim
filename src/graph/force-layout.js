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

import {
	uniquePairs
} from '../util.js';

/*
	A ForceLayoutGraph is a PositionedGraph whose x/y properteis are set by
	running a d3 force graph simulation.
*/
export class ForceLayoutGraph extends PositionedGraph {

	/*
		Makes an empty graph that is positioned.

		Options:
			edgeValues: (default: {}) - the starter values for an edge
			minNodeSize: (default: 10.0) - The smallest rendered nodeSize in pixels
			maxNodeSize: (default: 10.0) - The largest rendered nodeSize in pixels
			nodeSize: (default: () -> 1.0) - A method given nodeValues and rnd, that should return the value to set.
			noCollide: (default: false) - If true then there will be no collison forces
			randomLinkLikelihood: (default: 0.0) - How likely two random children in the parent are to have an extra connection amongst themselves. 0.0 is no connections, 1.0 is all connections.
	*/
	static make(availableWidth, availableHeight, rnd, options) {
		const result = new ForceLayoutGraph();
		result._make(availableWidth, availableHeight, rnd, options);
		return result;
	}

	//_make is the private method that subclasses's static make() functions
	//should call. It will do stuff that all ForceLayoutGraphs should do, but
	//also call this._makeInner(rnd, options) which is an override point for subclasses.
	_make(availableWidth, availableHeight, rnd, options) {
		this.availableWidth = availableWidth;
		this.availableHeight = availableHeight;
		if (options.minNodeSize != undefined) this.defaultMinNodeSize = options.minNodeSize;
		if (options.maxNodeSize != undefined) this.defaultMaxNodeSize = options.maxNodeSize;
		this.nodeRoundness = 1.0;
		//Only set the flag to true if provided, so we don't dirty up the properties dict if it wasn't used.
		if (options.noCollide) this.noCollide = true;

		//This is the point where subclasses will do the inside portion of their layout
		this._makeInner(rnd, options);

		const randomLinkLikelihood = options.randomLinkLikelihood === undefined ? 0.0 : options.randomLinkLikelihood;
		const edgeValues = options.edgeValues || {};

		if (randomLinkLikelihood > 0.0) {
			const pairs = uniquePairs([...Object.values(this.nodes())]);
			for (const pair of pairs) {
				if (rnd() < randomLinkLikelihood) {
					//If the pair already exists don't do it
					if (this.edge(pair[0], pair[1])) continue;
					const edge = this._makeRandomEdge(edgeValues, pair[0], pair[1]);
					this.setBidirectionalEdge(pair[0], pair[1], edge);
				}
			}
		}

		const nodeSize = options.nodeSize || (() => 1.0);
		for (const node of Object.values(this.nodes())) {
			this.setNodeProperty(node, 'size', nodeSize(node, rnd));
		}
		
		this._initialLayout(rnd, options);

		this.bakeLayout();

		return this;
	}

	//An override point, what randomLinkLikelihood will call when it has decided
	//to create and edge from fromNode to toNode.
	//eslint-disable-next-line no-unused-vars
	_makeRandomEdge(baseEdgeValues, fromNode, toNode) {
		return {
			...baseEdgeValues,
			type: 'random',
		};
	}

	//eslint-disable-next-line no-unused-vars
	_makeInner(rnd, options) {
		//Do nothing
	}

	/*
		An override point for sub classes. A chance to do an initial layout so
		that all nodes don't start at precisely the same spot in space.
	
		The default implementation just positions each node with a random x,y,
	*/
	//eslint-disable-next-line no-unused-vars
	_initialLayout(rnd, options) {
		const availableWidth = this.availableWidth;
		const availableHeight = this.availableHeight;
		for(const node of Object.values(this.nodes())) {
			this.setNodeProperties(node, {x: rnd() * availableWidth, y: rnd() * availableHeight});
		}
	}

	set noCollide(val) {
		this.setProperty('noCollide', val);
	}

	get noCollide() {
		return this.property('noCollide') || false;
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