import {
	ForceLayoutGraph
} from './force-layout.js';

import {
	Urn
} from '../util.js';

const EPSILON = 0.00001;

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
			edgeCount: (default: 1) - How many edges, on each iteartion, we should add.
			nodeValues: (deafult: {}) - The base values to set on nodes
	*/
	static make(availableWidth, availableHeight, rnd, options = {}) {
		const result = new PreferentialAttachmentGraph();
		result._make(availableWidth, availableHeight, rnd, options);
		return result;
	}

	_makeInner(rnd, options) {
		//TODO: allow setting a baseCount and baseDistanceCount (better names) that flatten the preferential count effect;
		const nodeCount = options.nodeCount || 100;
		const iterations = options.iterations || 100;
		const edgeCount = options.edgeCount || 1;
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
				//Make sure edgeCount isn't 0, or then if they all have zero then it will never pick any
				urn.add(node, edgeCount + EPSILON);
			}
			const node = urn.pick();
			const edgeUrn = new Urn(rnd);
			const distances = this.distanceToOtherNodes(node);
			const maxDistance = Math.max(0, ...Object.values(distances));
			const unconnectedDistance  = maxDistance + 1;
			for (const otherID of Object.values(this.nodes())) {
				//Skip ourselves
				if (ForceLayoutGraph.packID(node) == otherID) continue;
				const distance = distances[otherID] || unconnectedDistance;
				//Ensure the edge distance is never zero or it will never be selected
				edgeUrn.add(otherID, (unconnectedDistance - distance) + EPSILON);
			}
			for (let j = 0; j < edgeCount; j++) {
				const otherID = edgeUrn.pick();
				this.setBidirectionalEdge(node, otherID, {...edgeValues});
			}
		}
	}
}

PreferentialAttachmentGraph.registerGraphType(PreferentialAttachmentGraph);