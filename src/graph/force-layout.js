import {
	PositionedGraph
} from './positioned.js';

export class ForceLayoutGraph extends PositionedGraph {

	/*
		Makes a graph that blooms out of a key node in the center.

		Nodes will have the properties you provided but also a level, which increments
		for how many primary links it will take to get back to the center.
		
		Edges will have the properties you provided but also a type: of 'primary' for
		direct bloom links.

		options: 
			levels (default: 3.0) - how many layers from the first node to go to.
			nodeValues: (default: {}) - the values to start each node with
			edgeValues: (default: {}) - the starter values for an edge
			childCount: (default: 5.0) - how many children each node should have
	*/
	static makeBloomGraph(availableWidth, availableHeight, options = {}) {
		const result = new ForceLayoutGraph();
		result.availableWidth = availableWidth;
		result.availableHeight = availableHeight;

		const levels = options.levels === undefined ? 3.0 : options.levels;
		const childCount = options.childCount === undefined ? 5.0 : options.childCount;
		const nodeValues = options.nodeValues || {};
		const edgeValues = options.edgeValues || {};
		let nodeCounter = 0;

		const keyNode = result.setNode(nodeCounter, {...nodeValues, level: 0});
		const nodesToProcess = [keyNode];
		while (nodesToProcess.length) {
			const node = nodesToProcess.shift();
			const newLevel = node.level + 1;
			//TODO: allow children count to differ
			for (let i = 0; i < childCount; i++) {
				const childNode = result.setNode(nodeCounter++, {...nodeValues, level: newLevel});
				result.setEdge(node, childNode, {...edgeValues, type: 'primary'});
				if (newLevel < levels) nodesToProcess.push(childNode);
			}
			//TODO: connect peer children to some degree
		}

		return result;
	}

}

ForceLayoutGraph.registerGraphType(ForceLayoutGraph);