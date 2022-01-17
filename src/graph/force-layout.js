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
	*/
	static makeBloomGraph(availableWidth, availableHeight, options = {}) {
		const result = new ForceLayoutGraph();
		result.availableWidth = availableWidth;
		result.availableHeight = availableHeight;
		result.nodeBorderRadius = 1.0;

		const levels = options.levels === undefined ? 3.0 : options.levels;
		const childCount = options.childCount === undefined ? 5.0 : options.childCount;
		const nodeValues = options.nodeValues || {};
		const edgeValues = options.edgeValues || {};

		const keyNode = result.setNode(result.vendID(), {...nodeValues, level: 0});
		const nodesToProcess = [keyNode];
		while (nodesToProcess.length) {
			const node = nodesToProcess.shift();
			const newLevel = node.level + 1;
			//TODO: allow children count to differ
			for (let i = 0; i < childCount; i++) {
				const childNode = result.setNode(result.vendID(), {...nodeValues, level: newLevel});
				result.setEdge(node, childNode, {...edgeValues, type: 'primary'});
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
		const levelRadiusMultiplier = minSize / levels / 2;

		for (let i = 0; i < levels; i++) {
			const levelNodes = Object.values(result.nodes(node => node.level == i));
			const levelRadius = i * levelRadiusMultiplier;
			for (const [i, node] of levelNodes.entries()) {
				const angle = i / levelNodes.length * 360;
				const radiansAngle = Math.PI * 2 * angle / 360;
				const x = levelRadius * Math.sin(radiansAngle) + cX;
				const y = levelRadius * Math.cos(radiansAngle) + cY;
				result.setNode(node, {...node, x, y});
			}
		}

		result.bakeLayout();

		return result;
	}

	calculateNodePosition(identifier) {
		const node = this.node(identifier);
		//layoutPositions will recalc layout if necessary
		return this._layoutPositions[node.id];
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
		const edges = Object.values(this.allEdges()).map(edge => ({source:edge.from, target: edge.to, value:baseSize}));

		const width = this.availableWidth;
		const height = this.availableHeight;

		const maxLevel = Math.max(...nodes.map(values => values.level));
		const minSize = Math.min(width, height);

		//Divide by 2 to go from diameter to radius
		const levelMultiplier = minSize / maxLevel / 2;

		const simulation = d3.forceSimulation(nodes)
			.force('link', d3.forceLink(edges).id(d => d.id).distance(d => d.value))
			.force('radial', d3.forceRadial().strength(() => 0.5).radius(d => d.level * levelMultiplier).x(width / 2).y(height / 2))
			.force('charge', d3.forceManyBody())
			.force('center', d3.forceCenter(width / 2, height / 2))
			.stop();

		simulation.tick(300);

		const result = {};
		for (const node of nodes) {
			result[node.id] = {x:node.x, y: node.y, width: baseSize, height: baseSize};
		}

		return result;
	}

}

ForceLayoutGraph.registerGraphType(ForceLayoutGraph);