import {
	ForceLayoutGraph,
	LayoutSimulation
} from './force-layout.js';

import {
	uniquePairs
} from '../util.js';

import {
	forceRadial, SimulationNodeDatum
} from 'd3';

import {
	BloomGraphOptions,
	GraphEdge,
	GraphNodeValues,
	OptionsConfigMap,
	RandomGenerator
} from '../types.js';

export const LEVELS_PROPERTY = 'levels';
export const NODE_VALUES_PROPERTY = 'nodeValues';
export const CHILD_COUNT_PROPERTY = 'childCount';
export const CHILD_FACTOR_PROPERTY = 'childFactor';
export const CHILD_LINK_LIKELIHOOD_PROPERTY = 'childLinkLikelihood';

const OPTIONS_CONFIG = {
	[LEVELS_PROPERTY]: {
		example: 3.0,
		min: 0.0,
		max: 100,
		step: 1.0,
		optional: true,
		default: true,
		backfill: true,
		description: 'how many layers from default node to go to',
	},
	[CHILD_COUNT_PROPERTY]: {
		example: 5.0,
		min: 0.0,
		max: 100,
		step: 1.0,
		optional: true,
		default: true,
		backfill: true,
		description: 'how many children each child should have',
	},
	[CHILD_FACTOR_PROPERTY]: {
		example: 1.0,
		min: 0.0,
		max: 3.0,
		step: 0.001,
		optional: true,
		default: true,
		backfill: true,
		description: 'at each level, the final childCount is childCount * Math.pow(childFactor, level)',
	},
	[CHILD_LINK_LIKELIHOOD_PROPERTY]: {
		example: 0.0,
		min: 0.0,
		max: 1.0,
		step: 0.001,
		optional: true,
		default: true,
		backfill: true,
		description: 'How likely the children of each parent node are to have connections amongst themselves. 1.0 is all connected, 0.0 is no connections.',
	},
};

type BloomGraphNodeValues = GraphNodeValues & {
	level : number;
	levelRadius : number;
}

type BloomGraphEdge = GraphEdge & {
	level : number;
	type : 'primary' | 'peer';
}

/*
	A BloomGraph is a ForceLayoutGraph where nodes "bloom" out from a center node.
*/
export class BloomGraph extends ForceLayoutGraph {
	/*
		Makes a graph that blooms out of a key node in the center.

		Nodes will have the properties you provided but also a level, which increments
		for how many primary links it will take to get back to the center.
		
		Edges will have the properties you provided but also a type: of 'primary' for
		direct bloom links.

		options: 
			All options described in ForceLayoutGraph options

			levels (default: 3.0) - how many layers from the first node to go to.
			nodeValues: (default: {}) - the values to start each node with
			edgeValues: (default: {}) - the starter values for an edge
			childCount: (default: 5.0) - how many children each node should have
			childFactor: (deafault: 1.0) - at each level, the final childCount is childCount * Math.pow(childFactor, level)
			childLinkLikelihood: (default: 0.0) - How likely the children of each parent node are to have connections amongst themselves. 1.0 is all connected, 0.0 is no connections.
	*/
	static override make(availableWidth : number, availableHeight : number, rnd : RandomGenerator, options : BloomGraphOptions = {}) : BloomGraph {
		const result = new BloomGraph();
		result._make(availableWidth, availableHeight, rnd, options);
		return result;
	}

	static override get description() : string {
		return 'A graph that blooms out of center node out into multiple layers';
	}

	static override get OPTIONS_CONFIG() : OptionsConfigMap {
		return {...OPTIONS_CONFIG, ...ForceLayoutGraph.OPTIONS_CONFIG};
	}

	override _makeInner(rnd : RandomGenerator, options : BloomGraphOptions) : void {
		const levels = options.levels === undefined ? 3.0 : options.levels;
		const baseChildCount = options.childCount === undefined ? 5.0 : options.childCount;
		const childFactor = options.childFactor === undefined ? 1.0 : options.childFactor;
		const childLinkLikelihood = options.childLinkLikelihood === undefined ? 0.0 : options.childLinkLikelihood;
		const nodeValues = options.nodeValues || {};
		const edgeValues = options.edgeValues || {};

		const keyNode = this.setNode(this.vendID(), {...nodeValues, level: 0}) as BloomGraphNodeValues;
		const nodesToProcess : BloomGraphNodeValues[] = [keyNode];
		while (nodesToProcess.length) {
			const node = nodesToProcess.shift();
			const newLevel = node.level + 1;
			const childCount = Math.round(baseChildCount * Math.pow(childFactor, node.level));
			const children = [];
			//TODO: allow children count to differ
			for (let i = 0; i < childCount; i++) {
				const childNode = this.setNode(this.vendID(), {...nodeValues, level: newLevel}) as BloomGraphNodeValues;
				this.setBidirectionalEdge(node, childNode, {...edgeValues, type: 'primary', level: newLevel});
				if (newLevel < levels) nodesToProcess.push(childNode);
				children.push(childNode);
			}
			if (childLinkLikelihood > 0.0) {
				const pairs = uniquePairs(children);
				for (const pair of pairs) {
					if (rnd() < childLinkLikelihood) {
						this.setBidirectionalEdge(pair[0], pair[1], {...edgeValues, type: 'peer', level: newLevel});
					}
				}
			}
		}
	}

	override _initialLayout(_rnd : RandomGenerator, options : BloomGraphOptions) : void {
		const levels = options.levels === undefined ? 3.0 : options.levels;

		//Place nodes radially around the circle in starting positions (instead
		//of them all being implicitly in the center) so the force layout
		//doesn't have weird crossings of edges.

		const availableWidth = this.availableWidth;
		const availableHeight = this.availableHeight;

		const cX = availableWidth / 2;
		const cY = availableHeight / 2;

		const minSize = Math.min(availableWidth, availableHeight);
		//Divide by 2 to go from diameter to radius
		const maxRadius = minSize / 2;
		const maxLevelNodeCount = Object.keys(this.nodes(node => node.level == levels)).length;

		for (let i = 0; i <= levels; i++) {
			const levelNodes = Object.values(this.nodes(node => node.level == i));
			const levelRadius = maxRadius * levelNodes.length / maxLevelNodeCount;
			for (const [i, node] of levelNodes.entries()) {
				const angle = i / levelNodes.length * 360;
				const radiansAngle = Math.PI * 2 * angle / 360;
				const x = levelRadius * Math.sin(radiansAngle) + cX;
				const y = levelRadius * Math.cos(radiansAngle) + cY;
				this.setNode(node, {...node, x, y, levelRadius: levelRadius});
			}
		}
	}

	override _makeRandomEdge(baseEdgeValues: Partial<GraphEdge>, fromNode : GraphNodeValues, toNode : GraphNodeValues) : Partial<GraphEdge> {
		const fromNodeBloom = fromNode as BloomGraphNodeValues;
		const toNodeBloom = toNode as BloomGraphNodeValues;
		return {
			...super._makeRandomEdge(baseEdgeValues, fromNode, toNode),
			level: Math.min(fromNodeBloom.level, toNodeBloom.level)
		};
	}

	override distanceForEdge(edge : GraphEdge) : number {
		//TODO: shouldn't this be a property or something?
		const baseSize = 10;
		const edgeBloom = edge as BloomGraphEdge;
		return baseSize * 2 * (edgeBloom.level + 1);
	}

	override installExtraForces(simulation : LayoutSimulation) {
		const width = this.availableWidth;
		const height = this.availableHeight;
		simulation.force('radial', forceRadial().strength(() => 0.5).radius((d : SimulationNodeDatum) => (d as BloomGraphNodeValues).levelRadius).x(width / 2).y(height / 2));
	}
}

BloomGraph.registerGraphType(BloomGraph);