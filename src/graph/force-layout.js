import {
	PositionedGraph
} from './positioned.js';

import * as d3 from 'd3';

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
			childFactor: (deafault: 1.0) - at each level, the final childCount is childCount * Math.pow(childFactor, level)
			minNodeSize: (default: 10.0) - The smallest rendered nodeSize in pixels
			maxNodeSize: (default: 10.0) - The largest rendered nodeSize in pixels
	*/
	static makeBloomGraph(availableWidth, availableHeight, options = {}) {
		const result = new ForceLayoutGraph();
		result.availableWidth = availableWidth;
		result.availableHeight = availableHeight;
		if (options.minNodeSize != undefined) result.defaultMinNodeSize = options.minNodeSize;
		if (options.maxNodeSize != undefined) result.defaultMaxNodeSize = options.maxNodeSize;
		result.nodeRoundness = 1.0;

		const levels = options.levels === undefined ? 3.0 : options.levels;
		const baseChildCount = options.childCount === undefined ? 5.0 : options.childCount;
		const childFactor = options.childFactor === undefined ? 1.0 : options.childFactor;
		const nodeValues = options.nodeValues || {};
		const edgeValues = options.edgeValues || {};

		const keyNode = result.setNode(result.vendID(), {...nodeValues, level: 0});
		const nodesToProcess = [keyNode];
		while (nodesToProcess.length) {
			const node = nodesToProcess.shift();
			const newLevel = node.level + 1;
			const childCount = Math.round(baseChildCount * Math.pow(childFactor, node.level));
			//TODO: allow children count to differ
			for (let i = 0; i < childCount; i++) {
				const childNode = result.setNode(result.vendID(), {...nodeValues, level: newLevel});
				result.setEdge(node, childNode, {...edgeValues, type: 'primary', level: newLevel});
				if (newLevel < levels) nodesToProcess.push(childNode);
			}
			//TODO: connect peer children to some degree
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

		result.bakeLayout();

		return result;
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

	_recalcLayout() {

		const baseSize = 10;

		const nodes = Object.values(this.nodes()).map(values => ({...values}));
		//TODO: allow override value based on how strong it is
		const edges = Object.values(this.allEdges()).map(edge => ({source:edge.from, target: edge.to, value:baseSize * 2 * (edge.level + 1)}));

		const width = this.availableWidth;
		const height = this.availableHeight;

		const simulation = d3.forceSimulation(nodes)
			.force('link', d3.forceLink(edges).id(d => d.id).distance(d => d.value))
			.force('radial', d3.forceRadial().strength(() => 0.5).radius(d => d.levelRadius).x(width / 2).y(height / 2))
			.force('charge', d3.forceManyBody())
			.force('center', d3.forceCenter(width / 2, height / 2))
			.stop();

		simulation.tick(300);

		const result = {};
		for (const node of nodes) {
			result[node.id] = {x:node.x, y: node.y};
		}

		return result;
	}

}

ForceLayoutGraph.registerGraphType(ForceLayoutGraph);