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

	get width() {
		return this.availableWidth;
	}

	get height() {
		return this.availableHeight;
	}

	get nodesSameSize() {
		const positions = [...Object.values(this.nodes())];
		if (positions.length == 0) return true;
		const height = positions[0].height;
		const width = positions[0].width;
		return positions.every(position => position.height === height && position.width === width);
	}

	//returns this.defaultNodeSize by default. Override if you want a different behavior
	get defaultNodeWidth() {
		return this.defaultNodeSize;
	}

	//returns this.defaultNodeSize by default. Override if you want a different behavior
	get defaultNodeHeight() {
		return this.defaultNodeSize;
	}

	get defaultNodeSize() {
		return this.property('defaultNodeSize') || 10;
	}

	set defaultNodeSize(val) {
		this.setProperty('defaultNodeSize', val);
	}

	/*
		This is an override point to calculate the position. You must return
		x,y, width, and height.
	*/
	//eslint-disable-next-line no-unused-vars
	calculateNodePosition(identifier) {
		return {x:this.availableWidth / 2, y: this.availableHeight /2, width: this.defaultNodeWidth, height: this.defaultNodeHeight};
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
