import {
	Graph
} from './graph.js';

/*
	A PositionedGraph is a Graph where each node also has a notion of its x/y
	position in space, and sometimes also its width/height. You should override
	calculateNodePosition to include your logic that decides where to place a
	given node. For example, if you just wanted your nodes to all be able to be
	placed at specific x,y coordinates manually, you might return {x:
	node.values.x, y: node.values.y}. Other subclasses will override that logic
	with specific layout logic.
*/
export class PositionedGraph extends Graph {

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
		const result = new PositionedGraph();
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

	set availableWidth(val) {
		this.setProperty('availableWidth', val);
	}

	get availableWidth() {
		return this.property('availableWidth');
	}

	set availableHeight(val) {
		this.setProperty('availableHeight', val);
	}

	get availableHeight(){
		return this.property('availableHeight');
	}

	get nodeBorderRadius() {
		return this.property('nodeBorderRadius') || 0.0;
	}

	set nodeBorderRadius(val) {
		this.setProperty('nodeBorderRadius', val);
	}

	get nodesSameSize() {
		const positions = [...Object.values(this.nodes())];
		if (positions.length == 0) return true;
		const height = positions[0].height;
		const width = positions[0].width;
		return positions.every(position => position.height === height && position.width === width);
	}

	/*
		This is an override point to calculate the position. You must return
		x,y, but can also return width/height.
	*/
	//eslint-disable-next-line no-unused-vars
	calculateNodePosition(identifier) {
		return {x:this.availableWidth / 2, y: this.availableHeight /2};
	}

	//Returns an object with x,y of the node, and sometimes a width/height. x,y are at the center of the node.
	nodePosition(identifier) {
		const values = this.node(identifier);
		if (!values || !values.position) {
			return this.calculateNodePosition(identifier);
		}
		return values.position;
	}

	//Goes through and sets the x,y,width,height on all nodes so that future
	//nodePosition calls don't require calculations.
	bakeLayout() {
		for (const node of Object.values(this.nodes())) {
			const position = this.calculateNodePosition(node);
			this.setNodeProperty(node, 'position', position);
		}
	}

}

PositionedGraph.registerGraphType(PositionedGraph);
