import {
	ForceLayoutGraph
} from './force-layout.js';

import {
	Urn
} from '../util.js';

const EPSILON = 0.00001;
const PRINT_EDGE_COUNTS = false;

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
			distantNodeBoost: (default: 1) - How much to boost even nodes who are far away from (or not even connected to) the node that has been selected. Higher numbers make the preferential attachmetn effect weaker.
			edgeCount: (default: 1) - How many edges, on each iteartion, we should add.
			nodeValues: (deafult: {}) - The base values to set on nodes
	*/
	static make(availableWidth, availableHeight, rnd, options = {}) {
		const result = new PreferentialAttachmentGraph();
		result._make(availableWidth, availableHeight, rnd, options);
		return result;
	}

	_makeInner(rnd, options) {
		const nodeCount = options.nodeCount || 100;
		const iterations = options.iterations || 100;
		const edgeCount = options.edgeCount || 1;
		const nodeBoost = options.nodeBoost || EPSILON; 
		const distantNodeBoost = options.distantNodeBoost || 1;
		const nodeValues = options.nodeValues || {};
		const edgeValues = options.edgeValues || {};

		for (let i = 0; i < nodeCount; i++) {
			this.setNode(this.vendID(), {...nodeValues});
		}

		for (let i = 0; i < iterations; i++) {
			const urn = new Urn(rnd);
			for (const node of Object.values(this.nodes())) {
				const edges = this.edges(node);
				const edgeCount = Object.keys(edges).length;
				urn.add(node, edgeCount + nodeBoost);
			}
			const node = urn.pick();
			const edgeUrn = new Urn(rnd);
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
			const edgeCounts = {};
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