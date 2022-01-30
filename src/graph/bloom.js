import {
	ForceLayoutGraph,
	EDGE_VALUES_PROPERTY
} from './force-layout.js';

import {
	uniquePairs
} from '../util.js';

import {
	forceRadial
} from 'd3';

export const LEVELS_PROPERTY = 'levels';
export const NODE_VALUES_PROPERTY = 'nodeValues';
export const CHILD_COUNT_PROPERTY = 'childCount';
export const CHILD_FACTOR_PROPERTY = 'childFactor';
export const CHILD_LINK_LIKELIHOOD_PROPERTY = 'childLinkLikelihood';

const OPTIONS_CONFIG = {
	[LEVELS_PROPERTY]: {
		example: 3.0,
		min: 0.0,
		max: 100.,
		step: 1.0,
		optional: true,
		default: true,
		backfill: true,
		description: 'how many layers from default node to go to',
	},
	[CHILD_COUNT_PROPERTY]: {
		example: 5.0,
		min: 0.0,
		max: 100.,
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
	static make(availableWidth, availableHeight, rnd, options = {}) {
		const result = new BloomGraph();
		result._make(availableWidth, availableHeight, rnd, options);
		return result;
	}

	get OPTIONS_CONFIG() {
		return {...super.OPTIONS_CONFIG, ...OPTIONS_CONFIG};
	}

	_makeInner(rnd, options) {
		const levels = options[LEVELS_PROPERTY] === undefined ? 3.0 : options[LEVELS_PROPERTY];
		const baseChildCount = options[CHILD_COUNT_PROPERTY] === undefined ? 5.0 : options[CHILD_COUNT_PROPERTY];
		const childFactor = options[CHILD_FACTOR_PROPERTY] === undefined ? 1.0 : options[CHILD_FACTOR_PROPERTY];
		const childLinkLikelihood = options[CHILD_LINK_LIKELIHOOD_PROPERTY] === undefined ? 0.0 : options[CHILD_LINK_LIKELIHOOD_PROPERTY];
		const nodeValues = options[NODE_VALUES_PROPERTY] || {};
		const edgeValues = options[EDGE_VALUES_PROPERTY] || {};

		const keyNode = this.setNode(this.vendID(), {...nodeValues, level: 0});
		const nodesToProcess = [keyNode];
		while (nodesToProcess.length) {
			const node = nodesToProcess.shift();
			const newLevel = node.level + 1;
			const childCount = Math.round(baseChildCount * Math.pow(childFactor, node.level));
			const children = [];
			//TODO: allow children count to differ
			for (let i = 0; i < childCount; i++) {
				const childNode = this.setNode(this.vendID(), {...nodeValues, level: newLevel});
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

	_initialLayout(rnd, options) {
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

	_makeRandomEdge(baseEdgeValues, fromNode, toNode) {
		return {
			...super._makeRandomEdge(baseEdgeValues, fromNode, toNode),
			level: Math.min(fromNode.level, toNode.level)
		};
	}

	distanceForEdge(edge) {
		//TODO: shouldn't this be a property or something?
		const baseSize = 10;
		return baseSize * 2 * (edge.level + 1);
	}

	installExtraForces(simulation) {
		const width = this.availableWidth;
		const height = this.availableHeight;
		simulation.force('radial', forceRadial().strength(() => 0.5).radius(d => d.levelRadius).x(width / 2).y(height / 2));
	}
}

BloomGraph.registerGraphType(BloomGraph);