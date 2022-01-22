import {
	ForceLayoutGraph
} from './force-layout';

import {
	uniquePairs
} from '../util.js';

import {
	forceRadial
} from 'd3';

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
			randomLinkLikelihood: (default: 0.0) - How likely two random children in the parent are to have an extra connection amongst themselves. 0.0 is no connections, 1.0 is all connections.
	*/
	static make(availableWidth, availableHeight, rnd, options = {}) {
		const result = new BloomGraph();
		result.setBaseProperties(availableWidth, availableHeight, rnd, options);
		
		const levels = options.levels === undefined ? 3.0 : options.levels;
		const baseChildCount = options.childCount === undefined ? 5.0 : options.childCount;
		const childFactor = options.childFactor === undefined ? 1.0 : options.childFactor;
		const childLinkLikelihood = options.childLinkLikelihood === undefined ? 0.0 : options.childLinkLikelihood;
		const randomLinkLikelihood = options.randomLinkLikelihood === undefined ? 0.0 : options.randomLinkLikelihood;
		const nodeValues = options.nodeValues || {};
		const edgeValues = options.edgeValues || {};

		const keyNode = result.setNode(result.vendID(), {...nodeValues, level: 0});
		const nodesToProcess = [keyNode];
		while (nodesToProcess.length) {
			const node = nodesToProcess.shift();
			const newLevel = node.level + 1;
			const childCount = Math.round(baseChildCount * Math.pow(childFactor, node.level));
			const children = [];
			//TODO: allow children count to differ
			for (let i = 0; i < childCount; i++) {
				const childNode = result.setNode(result.vendID(), {...nodeValues, level: newLevel});
				result.setBidirectionalEdge(node, childNode, {...edgeValues, type: 'primary', level: newLevel});
				if (newLevel < levels) nodesToProcess.push(childNode);
				children.push(childNode);
			}
			if (childLinkLikelihood > 0.0) {
				const pairs = uniquePairs(children);
				for (const pair of pairs) {
					if (rnd() < childLinkLikelihood) {
						result.setBidirectionalEdge(pair[0], pair[1], {...edgeValues, type: 'peer', level: newLevel});
					}
				}
			}
		}

		if (randomLinkLikelihood > 0.0) {
			const pairs = uniquePairs([...Object.values(result.nodes())]);
			for (const pair of pairs) {
				if (rnd() < randomLinkLikelihood) {
					//If the pair already exists don't do it
					if (result.edge(pair[0], pair[1])) continue;
					result.setBidirectionalEdge(pair[0], pair[1], {...edgeValues, type: 'random', level: Math.min(pair[0].level, pair[1].level)});
				}
			}
		}

		//Place nodes radially around the circle in starting positions (instead
		//of them all being implicitly in the center) so the force layout
		//doesn't have weird crossings of edges.

		const cX = availableWidth / 2;
		const cY = availableHeight / 2;

		const minSize = Math.min(availableWidth, availableHeight);
		//Divide by 2 to go from diameter to radius
		const maxRadius = minSize / 2;
		const maxLevelNodeCount = Object.keys(result.nodes(node => node.level == levels)).length;

		for (let i = 0; i <= levels; i++) {
			const levelNodes = Object.values(result.nodes(node => node.level == i));
			const levelRadius = maxRadius * levelNodes.length / maxLevelNodeCount;
			for (const [i, node] of levelNodes.entries()) {
				const angle = i / levelNodes.length * 360;
				const radiansAngle = Math.PI * 2 * angle / 360;
				const x = levelRadius * Math.sin(radiansAngle) + cX;
				const y = levelRadius * Math.cos(radiansAngle) + cY;
				result.setNode(node, {...node, x, y, levelRadius: levelRadius});
			}
		}

		result.finishConstructor(rnd, options);

		return result;
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