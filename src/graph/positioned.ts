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

	set availableWidth(val : number) {
		this.setProperty('availableWidth', val);
	}

	get availableWidth() : number {
		return this.property('availableWidth') as number;
	}

	set availableHeight(val : number) {
		this.setProperty('availableHeight', val);
	}

	get availableHeight() : number {
		return this.property('availableHeight') as number;
	}

	get nodeRoundness() : number {
		return this.property('nodeRoundness') as number || 0.0;
	}

	set nodeRoundness(val : number) {
		this.setProperty('nodeRoundness', val);
	}

	get width() : number {
		return this.availableWidth;
	}

	get height() : number {
		return this.availableHeight;
	}

	//Override point. Returns node.x or if it doesn't eixst, this.availableWidth
	/// 2 by default
	nodeX(identifier) {
		const node = this.node(identifier);
		return node.x === undefined ? this.availableWidth / 2 : node.x;
	}

	//Override point. Returns node.y or if it doesn't exist,
	//this.availableHeight / 2 by default
	nodeY(identifier) {
		const node = this.node(identifier);
		return node.y === undefined ? this.availableHeight / 2 : node.y;
	}

	//Override point. returns node.height or this.nodeSize() by default
	nodeHeight(identifier) {
		const node = this.node(identifier);
		return node.height === undefined ? this.nodeSize(identifier) : node.height;
	}

	//Override point. returns node.width or this.nodeSize() by default
	nodeWidth(identifier) {
		const node = this.node(identifier);
		return node.width === undefined ? this.nodeSize(identifier) : node.width;
	}

	/*
		Override point. Returns 1.0 by default. You might for example override
		to return nodeValues.value.
	*/
	//eslint-disable-next-line no-unused-vars
	nodeSizeMultiplier(identifier) {
		return 1.0;
	}

	/*
		Override point. Returns (this.nodeSizeMultiplier * (defaultMaxNodeSize -
		defaultMinNodeSize)) + defaultMinNodeSize.
	*/
	nodeSize(identifier) {
		return (this.defaultMaxNodeSize - this.defaultMinNodeSize) * this.nodeSizeMultiplier(identifier) + this.defaultMinNodeSize;
	}

	get defaultMaxNodeSize() {
		return this.property('defaultMaxNodeSize') || 10;
	}

	set defaultMaxNodeSize(val) {
		this.setProperty('defaultMaxNodeSize', val);
	}

	get defaultMinNodeSize() {
		return this.property('defaultMinNodeSize') || 10;
	}

	set defaultMinNodeSize(val) {
		this.setProperty('defaultMinNodeSize', val);
	}

	/*
		This is an override point to calculate the position. You must return
		x,y, width, and height. Uses this.nodeX, this.nodeY, this.nodeHeight,
		this.nodeWidth by default.
	*/
	calculateNodePosition(identifier) {
		return {x:this.nodeX(identifier), y: this.nodeY(identifier), width: this.nodeWidth(identifier), height: this.nodeHeight(identifier)};
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
