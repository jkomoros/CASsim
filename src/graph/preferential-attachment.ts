import {
	ForceLayoutGraph
} from './force-layout.js';

import {
	Urn
} from '../util.js';

import {
	GraphEdgeID,
	GraphNodeValues,
	OptionsConfigMap,
	PreferentialAttachmentGraphOptions,
	RandomGenerator
} from '../types.js';

const EPSILON = 0.00001;
const PRINT_EDGE_COUNTS = false;

export const NODE_COUNT_PROPERTY = 'nodeCount';
export const ITERATIONS_PROPERTY = 'iterations';
export const NODE_BOOST_PROPERTY = 'nodeBoost';
export const DISTANT_NODE_BOOST_PROPERTY = 'distantNodeBoost';
export const EDGE_COUNT_PROPERTY = 'edgeCount';
export const NODE_VALUES_PROPERTY = 'nodeValues';

const OPTIONS_CONFIG = {
	[NODE_COUNT_PROPERTY]: {
		example: 100.0,
		min: 0.0,
		max: 10000,
		step: 1.0,
		optional: true,
		default: true,
		backfill: true,
		description: 'How many nodes to create',
	},
	[ITERATIONS_PROPERTY]: {
		example: 100.0,
		min: 0.0,
		max: 10000,
		step: 1.0,
		optional: true,
		default: true,
		backfill: true,
		description: 'How many iterations of adding edges we should do',
	},
	[NODE_BOOST_PROPERTY]: {
		example: 0.00001,
		min: 0.0,
		max: 1.0,
		step: 0.000001,
		optional: true,
		default: true,
		backfill: true,
		description: 'How much to boost every node when choosing which one to add. Higher numbers make the preferential attachment effect weaker.',
	},
	[DISTANT_NODE_BOOST_PROPERTY]: {
		example: 3.0,
		max: 100,
		min: 0.00001,
		step: 0.00001,
		optional: true,
		default: true,
		backfill: true,
		description: 'How much to boost every node when choosing which one to add. Higher numbers make the preferential attachment effect weaker.',
	},
	[EDGE_COUNT_PROPERTY]: {
		example: 3,
		min: 0.0,
		max: 10000,
		step: 1.0,
		optional: true,
		default: true,
		backfill: true,
		description: 'How many edges, on each iteration, we should add',
	},
};

/*
	A PreferentialAttachmentGraph is a ForceLayoutGraph that tries to mimic
	realistic network topologies with preferential attachment.
*/
export class PreferentialAttachmentGraph extends ForceLayoutGraph {
	/*
		Makes a graph with preferential attachment, showing power law
		distribution of node degree.

		options: 
			All options described in ForceLayoutGraph options, as well as:

			nodeCount: (default: 100) - How many nodes to create
			iterations: (default: 100) - How many iterations of adding edges we should do
			nodeBoost: (default: 0.00001) - How much to boost every node when choosing which one to add. Higher numbers make the preferential attachment effect weaker.
			distantNodeBoost: (default: 3) - How much to boost even nodes who are far away from (or not even connected to) the node that has been selected. Higher numbers make the preferential attachmetn effect weaker.
			edgeCount: (default: 3) - How many edges, on each iteartion, we should add.
			nodeValues: (deafult: {}) - The base values to set on nodes
	*/
	static override make(availableWidth : number, availableHeight : number, rnd : RandomGenerator, options : PreferentialAttachmentGraphOptions = {}) : PreferentialAttachmentGraph {
		const result = new PreferentialAttachmentGraph();
		result._make(availableWidth, availableHeight, rnd, options);
		return result;
	}

	static override get description() : string {
		return 'A graph that grows where nodes that are already well connected are more likely to grow new connections';
	}

	static override get OPTIONS_CONFIG() : OptionsConfigMap {
		return { ...OPTIONS_CONFIG, ...ForceLayoutGraph.OPTIONS_CONFIG};
	}

	override _makeInner(rnd : RandomGenerator, options : PreferentialAttachmentGraphOptions) : void {
		const nodeCount = options.nodeCount || 100;
		const iterations = options.iterations || 100;
		const edgeCount = options.edgeCount || 3;
		const nodeBoost = options.nodeBoost || EPSILON;
		const distantNodeBoost = options.distantNodeBoost || 3;
		const nodeValues = options.nodeValues || {};
		const edgeValues = options.edgeValues || {};

		for (let i = 0; i < nodeCount; i++) {
			this.setNode(this.vendID(), {...nodeValues});
		}

		for (let i = 0; i < iterations; i++) {
			const urn = new Urn<GraphNodeValues>(rnd);
			for (const node of Object.values(this.nodes())) {
				const edges = this.edges(node);
				const edgeCount = Object.keys(edges).length;
				urn.add(node, edgeCount + nodeBoost);
			}
			const node = urn.pick();
			const edgeUrn = new Urn<GraphEdgeID>(rnd);
			const distances = this.distanceToOtherNodes(node);
			const maxDistance = Math.max(0, ...Object.values(distances));
			const unconnectedDistance  = maxDistance + 1;
			for (const otherID of Object.keys(this.nodes())) {
				//Skip ourselves
				if (ForceLayoutGraph.packID(node) == otherID) continue;
				const distance = distances[otherID] || unconnectedDistance;
				const finalCount = (unconnectedDistance - distance) + distantNodeBoost;
				edgeUrn.add(otherID, finalCount);
			}
			for (let j = 0; j < edgeCount; j++) {
				const otherID = edgeUrn.pick();
				this.setBidirectionalEdge(node, otherID, {...edgeValues});
			}
		}

		if (PRINT_EDGE_COUNTS) {
			const edgeCounts : {[id : string] : number} = {};
			for (const node of Object.keys(this.nodes())) {
				const edges = this.edges(node);
				const count = Object.keys(edges).length;
				edgeCounts[count] = (edgeCounts[count] || 0) + 1;
			}
			console.log('Edge counts: ', edgeCounts);
		}
	}
}

PreferentialAttachmentGraph.registerGraphType(PreferentialAttachmentGraph);