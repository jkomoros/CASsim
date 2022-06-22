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

export const EDGE_VALUES_PROPERTY = 'edgeValues';
export const NODE_SIZE_PROPERTY = 'nodeSize';
export const MIN_NODE_SIZE_PROPERTY = 'minNodeSize';
export const MAX_NODE_SIZE_PROPERTY = 'maxNodeSize';
export const NODE_MARGIN_PROPERTY = 'nodeMargin';
export const NO_COLLIDE_PROPERTY = 'noCollide';
export const RANDOM_LINK_LIKELIHOOD_PROPERTY = 'randomLinkLikelihood';

export const GRAPH_NAME = 'force';

import {
	DistributionConfig,
	FIXED
} from '../distribution.js';

import {
	ForceLayoutGraphOptions,
	GraphNodeValues,
	GraphType,
	OptionsConfig,
	OptionsConfigMap,
	OptionsOverridesMap,
	OptionsValues,
	RandomGenerator
} from '../types.js';

const nodePercentage = new DistributionConfig({
	average: 1.0,
	distribution: FIXED,
	default: true,
	description: 'The percentage size of nodes to start'
});

const OPTIONS_CONFIG = {
	[MIN_NODE_SIZE_PROPERTY]: {
		example: 10.0,
		min: 0.0,
		max: 1000.0,
		step: 0.05,
		optional: true,
		default: true,
		backfill: true,
		description: 'The smallest rendered nodeSize in pixels',
	},
	[MAX_NODE_SIZE_PROPERTY]: {
		example: 10.0,
		min: 0.0,
		max: 1000.0,
		step: 0.05,
		optional: true,
		default: true,
		backfill: true,
		description: 'The largest rendered nodeSize in pixels',
	},
	[NODE_SIZE_PROPERTY]: nodePercentage.optionsConfig,
	[NODE_MARGIN_PROPERTY]: {
		example: 0.1,
		min: 0.0,
		max: 1000.0,
		step: 0.05,
		optional: true,
		default: true,
		backfill: true,
		description: 'How much space should be left between this node and other nodes, in units of percentage of this node\'s size',
	},
	[NO_COLLIDE_PROPERTY]: {
		example: false,
		optional: true,
		backfill: true,
		description: ' If true then there will be no collison forces',
	},
	[RANDOM_LINK_LIKELIHOOD_PROPERTY]: {
		example: 0.0,
		min: 0.0,
		max: 1.0,
		step: 0.001,
		optional: true,
		default: true,
		backfill: true,
		description: 'How likely two random children in the parent are to have an extra connection amongst themselves. 0.0 is no connections, 1.0 is all connections.',
	}
};

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
			nodeMargin: (default: 0.1) - How much space should be left between this node and other nodes, in units of percentage of this node's size.
			nodeSize: (default: () -> 1.0) - A method given nodeValues and rnd, that should return the value to set.
			noCollide: (default: false) - If true then there will be no collison forces
			randomLinkLikelihood: (default: 0.0) - How likely two random children in the parent are to have an extra connection amongst themselves. 0.0 is no connections, 1.0 is all connections.
	*/
	static make(availableWidth : number, availableHeight : number, rnd : RandomGenerator, options : ForceLayoutGraphOptions) : ForceLayoutGraph {
		const result = new ForceLayoutGraph();
		result._make(availableWidth, availableHeight, rnd, options);
		return result;
	}

	static override get name() : GraphType {
		return GRAPH_NAME;
	}

	static override get description() : string {
		return 'A generic force directed graph layout';
	}

	/* subclasses should expose this */
	static get OPTIONS_CONFIG() : OptionsConfigMap {
		return OPTIONS_CONFIG;
	}

	/*
		Provides an optionsConfig. Overrides is a map of optionName --> newName. If newName is '' then that option will not be included.
	*/
	static optionsConfig(overrides : OptionsOverridesMap = {}) : OptionsConfig {
		const config = this.OPTIONS_CONFIG;
		return Object.fromEntries(Object.entries(config).map(entry => [overrides[entry[0]] == undefined ? entry[0] : overrides[entry[0]], entry[1]]).filter(entry => entry[0] != ''));
	}

	/*
		Given the values option based on optionsConfig, pass back to this to get the options values to pass to constructor.
	*/
	static optionsFromConfig(values : OptionsValues, overrides : OptionsOverridesMap = {}) : ForceLayoutGraphOptions {
		const config = this.OPTIONS_CONFIG;
		const reversed = {};
		for (const [key, value] of Object.entries(overrides)) {
			if (!value) continue;
			reversed[value] = key;
		}
		const result = Object.fromEntries(Object.entries(values).map(entry => [reversed[entry[0]] == undefined ? entry[0] : overrides[entry[0]], entry[1]]).filter(entry => config[entry[0] as string]));
		if (result[NODE_SIZE_PROPERTY]) {
			const distribution = nodePercentage.distribution(result[NODE_SIZE_PROPERTY]);
			result[NODE_SIZE_PROPERTY] = (_node : GraphNodeValues, rnd : RandomGenerator) => distribution.sample(rnd);
		}
		return result;
	}

	//_make is the private method that subclasses's static make() functions
	//should call. It will do stuff that all ForceLayoutGraphs should do, but
	//also call this._makeInner(rnd, options) which is an override point for subclasses.
	_make(availableWidth, availableHeight, rnd, options) {
		this.availableWidth = availableWidth;
		this.availableHeight = availableHeight;
		if (options[MIN_NODE_SIZE_PROPERTY] != undefined) this.defaultMinNodeSize = options[MIN_NODE_SIZE_PROPERTY];
		if (options[MAX_NODE_SIZE_PROPERTY] != undefined) this.defaultMaxNodeSize = options[MAX_NODE_SIZE_PROPERTY];
		this.defaultNodeMargin = options[NODE_MARGIN_PROPERTY] === undefined ? 0.1 : options[NODE_MARGIN_PROPERTY];
		this.nodeRoundness = 1.0;
		//Only set the flag to true if provided, so we don't dirty up the properties dict if it wasn't used.
		if (options[NO_COLLIDE_PROPERTY]) this.noCollide = true;

		//This is the point where subclasses will do the inside portion of their layout
		this._makeInner(rnd, options);

		const randomLinkLikelihood = options[RANDOM_LINK_LIKELIHOOD_PROPERTY] === undefined ? 0.0 : options[RANDOM_LINK_LIKELIHOOD_PROPERTY];
		const edgeValues = options[EDGE_VALUES_PROPERTY] || {};

		if (randomLinkLikelihood > 0.0) {
			const pairs = uniquePairs([...Object.values(this.nodes())]);
			for (const pair of pairs) {
				if (rnd() < randomLinkLikelihood) {
					//If the pair already exists don't do it
					if (this.edge(pair[0], pair[1])) continue;
					if (this.edge(pair[1], pair[0])) continue;
					const edge = this._makeRandomEdge(edgeValues, pair[0], pair[1]);
					this.setBidirectionalEdge(pair[0], pair[1], edge);
				}
			}
		}

		const nodeSize = options[NODE_SIZE_PROPERTY] || (() => 1.0);
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

	get defaultNodeMargin() {
		return this.property('defaultNodeMargin');
	}

	set defaultNodeMargin(val) {
		this.setProperty('defaultNodeMargin', val);
	}

	/*
		The margin to leave between this node and its neighbors, in units of
		percenatage of its nodeSize. By default returns defaultNodeMargin.
	*/
	//eslint-disable-next-line no-unused-vars
	nodeMargin(identifier) {
		return this.defaultNodeMargin;
	}

	/*
		A chance for a subclass to install more forces on the force layout simulation.
	*/
	//eslint-disable-next-line no-unused-vars
	installExtraForces(simulation) {
		//Do nothing by default
	}

	_recalcLayout() {

		const nodes = Object.values(this.nodes()).map(values => {
			const result = {...values};
			const edges = this.edges(values);
			//Fix unconnected items to wherever they are right now, so they don't go flying off the edge due to manyBody without a centering link force.
			if (Object.keys(edges).length == 0) {
				result.fx = result.x;
				result.fy = result.y;
			}
			return result;
		});
		//TODO: allow override value based on how strong it is
		const edges = Object.values(this.allEdges()).map(edge => ({source:edge.from, target: edge.to, value:this.distanceForEdge(edge)}));

		const width = this.availableWidth;
		const height = this.availableHeight;

		const simulation = forceSimulation(nodes);

		simulation.force('link', forceLink(edges).id(d => d.id).distance(d => d.value));
		//nodeSize is the diameter, we want the radius. But give a bit of buffer...
		if (!this.noCollide) simulation.force('collide', forceCollide().radius(n => {
			const nodeRadius = this.nodeSize(n) * 0.5;
			return nodeRadius + (nodeRadius * this.nodeMargin(n));
		}));
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