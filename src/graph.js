import {
	shuffleInPlace
} from './util.js';
/*

Graph is a graph with nodes and edges, and values for each node/edge.

Canonical IDs are represented in strings. However, every method that takes an
identifer may take any of the packedID (the string), a node object that contains
an ID, or an 'unpackedID', which is an array of parts that will be joined by
Graph.ID_DELIMITER.

unpackID will reverse the packing of an ID, by splitting on Graph.ID_DELIMITER
and then converting any number-like parts to numbers.

Methods or arguiments have ID in the name will return or expect a packedID.
Methods or arguments that have 'Identifier' in the name will return or expect an
unpackedID

*/
export class Graph {

	//data is the starter data. We will never modify data passed to us, but
	//rather clone and set.
	constructor(data) {
		if (!data) data = {nodes:{}, properties:{}, graphType: this.constructor.name};
		this._data = data;
		this._nodeChangesMade = false;
		this._propertyChangesMade = false;
	}

	static get ID_DELIMITER() {
		return ':';
	}

	static packID(identifier) {
		if (typeof identifier == 'string') return identifier;
		if (Array.isArray(identifier)) {
			const strs = identifier.map(part => '' + part);
			if (strs.some(str => str.includes(Graph.ID_DELIMITER))) throw new Error('An unpacked ID part contained the ID_DELIMITER');
			return strs.join(Graph.ID_DELIMITER);
		}
		if (typeof identifier == 'object') {
			if (identifier.id) return identifier.id;
		}
		throw new Error('Identifier was not a known type to pack: ', identifier);
	}

	static unpackID(packedID) {
		return packedID.split(Graph.ID_DELIMITER).map(item => isNaN(parseFloat(item)) ? item : parseFloat(item));
	}

	static packEdgeID(fromIdentifier, toIdentifier) {
		const fromID = Graph.packID(fromIdentifier);
		const toID = Graph.packID(toIdentifier);
		return fromID + Graph.ID_DELIMITER + Graph.ID_DELIMITER + toID;
	}

	static unpackEdgeID(packedEdgeID) {
		return packedEdgeID.split(Graph.ID_DELIMITER + Graph.ID_DELIMITER).map(id => Graph.unpackID(id));
	}

	get graphType() {
		return this._data.graphType;
	}

	//Whether modifications have been made since the object was created or saved
	//was called.
	get changesMade() {
		return this._nodeChangesMade || this._propertyChangesMade;
	}

	//Should be called when the backing store has been saved.
	saved() {
		this._nodeChangesMade = false;
		this._propertyChangesMade = false;
	}

	//same checks for logical equality, since you can't rely on values objects
	//being strictly equaly if changesMade is false.
	same(left, right) {
		if (left == right) return true;
		if (!left || !right) return false;
		if (typeof left != 'object') return false;
		if (typeof right != 'object') return false;
		if (!left.id || !right.id) return false;
		return left.id == right.id;
	}

	_nodeObject(identifier) {
		const id = Graph.packID(identifier);
		return this._data.nodes[id];
	}

	get data() {
		return this._data;
	}

	//Get the values stored on the node, or undefined if it doesn't exist. Note
	//that you can only rely on value equality for nodes if changesMade is
	//false. Instead, use Graph.same()
	node(identifier) {
		//_nodeObject will pack identifier
		const node = this._nodeObject(identifier);
		if (!node) return undefined;
		return node.values;
	}

	//Get the values stored on the edge, or undefined if that edge doesnt'
	//exist. Note that you can only rely on value equality for edges if
	//changesMade is false. Instead use Graph.same()
	edge(fromIdentifier, toIdentifier) {
		const node = this._nodeObject(fromIdentifier);
		if (!node) return undefined;
		const toID = Graph.packID(toIdentifier);
		return node.edges[toID];
	}

	//Returns a map of toIdentifier, and the EDGE values.
	edges(identifier) {
		//_nodeObject will pack identifier
		const node = this._nodeObject(identifier);
		if (!node) return undefined;
		return node.edges;
	}

	allEdges() {
		return Object.fromEntries(Object.keys(this.nodes()).map(nodeID => Object.values(this.edges(nodeID))).flat().map(edge => [edge.id, edge]));
	}

	nodes() {
		return Object.fromEntries(Object.entries(this._data.nodes).map(entry => [entry[0], entry[1].values]));
	}

	properties() {
		return {...this._data.properties};
	}

	property(name) {
		return this._data.properties[name];
	}

	_prepareForPropertyModifications() {
		if (!this._propertyChangesMade) {
			this._data = {...this._data, properties: {...this._data.properties}};
		}
		this._propertyChangesMade = true;
	}

	setProperty(name, value) {
		if (this.property(name) == value) return;
		this._prepareForPropertyModifications();
		this._data.properties[name] = value;
	}

	setProperties(data) {
		for (const [key, value] of Object.entries(data)) {
			this.setProperty(key, value);
		}
	}

	//Returns the values objects for all neighbors up to ply hops away from
	//identifier.
	neighbors(identifier, ply = 1) {
		const includeNode = (nodevalues, path, length) => length <= ply;
		const result = this._nodeSearcher(identifier, includeNode, () => 1);
		return Object.fromEntries(Object.entries(result).map(entry => [entry[0], entry[1].node]));
	}

	/*
		workhorse node searcher. Is either in target seeking mode (where it will
		look for a single target and then return its distance, path), or
		accumulation mode where it will return an object of nodeID to
		{node:nodeValues, path:[], length: 1.0} for every node that is not
		filtered out. Its in the former if targetFound is provided.

		fromNodeIdentifier - node to start search from 

		includeNode = (nodeValues, path, length) => true - if true, then the
		node will be included in the search, either for the accumulation set in
		the end or in the search set. If not provided, then it will return all
		nodes in the graph that are not fromIdentifier.

		edgeScorer = (edge) => length - the function to extract the length from
		an edge. By default it's () => 1, which allows you to treat length as
		'number of edge hops away from fromNode'.

		targetFound = (nodeValues, path, length) => true - if provided, then
		_nodeSearcher is in target seeking mode, and will return the distance,
		path when it finds this node, or -1 * MAX_SAFE_INTEGER, null if not
		found. If targetFound is not provided, then _nodeSearcher is in
		collection mode.

		rnd = () => 0.0..1.0 - the random function to use to scramble the order
		we visit edges of a node. If not provided, we'll visit nodes in the
		order they're represented in the graph.
	*/
	_nodeSearcher(fromNodeIdentifier, includeNode = () => true, edgeScorer = () => 1, targetFound = undefined, rnd = undefined) {
		const fromID = Graph.packID(fromNodeIdentifier);
		const visitedNodes = {};
		const collection = {};
		//Each one should be {path: [...previousNodes, node], length: 1, node: node}
		const itemsToVisit = [{path: [], length: 0, node: this.node(fromID)}];
		while (itemsToVisit.length) {
			const item = itemsToVisit.shift();
			if (visitedNodes[item.node]) continue;
			visitedNodes[item.node] = true;
			const edges = this.edges(item.node);
			//Since we only return one path, we should visit equivalent items in a random order.
			const edgeKeys = rnd ? Object.keys(edges) : shuffleInPlace(Object.keys(edges), rnd);
			for (const edgeToID of edgeKeys) {
				if (visitedNodes[edgeToID]) continue;
				const toNode = this.node(edgeToID);
				const edge = edges[edgeToID];
				const path = [...item.path, edgeToID];
				const length = item.length + edgeScorer(edge);
				if (!includeNode(toNode, path, length)) continue;
				const newItem = {path, length, node: edgeToID};
				if (targetFound) {
					//target seeking mode
					if(targetFound(toNode, path, length)) return [length, path];
				} else {
					//accumulation mode
					collection[edgeToID] = newItem;
				}
				itemsToVisit.push(newItem);
			}
			itemsToVisit.sort((a, b) => a.length - b.length);
		}
		return targetFound ? [-1 * Math.MAX_SAFE_INTEGER, null] : collection;
	}

	//shortestPath returns [length, path] where length is the shortest path
	//lengh, and path is an array of edges to go from fromNode to
	//toNode. The length of each edge is given by edgeScorer, which typically
	//returns a value like edge.distance. The default simply counts each edge as
	//length 1. If there is no path from from to to, will return [-1 * MAX_SAFE_INTEGER, null];
	shortestPath(fromNodeIdentifier, toNodeIdentifer, edgeScorer = () => 1, rnd = Math.random) {
		//TODO: memoize
		const targetFound = (nodeValues) => nodeValues.id == toNodeIdentifer;
		return this._nodeSearcher(fromNodeIdentifier, undefined, edgeScorer, targetFound, rnd);
	}

	_prepareForNodeModifications() {
		if (!this.nodeChangesMade) {
			this._data = {...this._data, nodes: {...this._data.nodes}};
		}
		this._nodeChangesMade = true;
	}

	setNode(identifier, values) {
		const id = Graph.packID(identifier);
		let node = this._nodeObject(id);
		if (!node) node = {edges:{}};
		if (node.values == values) return;
		if (!values) values = {};
		if (values.id != id) values.id = id;
		node = {...node};
		node.values = values;
		this._prepareForNodeModifications();
		this._data.nodes[id] = node;
		return node;
	}

	setNodeProperty(identifier, property, value) {
		let values = this.node(identifier);
		values = values ? {...values} : {};
		if (values[property] === value) return;
		values[property] = value;
		return this.setNode(identifier, values);
	}

	setNodeProperties(identifier, values) {
		for (const [key, value] of Object.entries(values)) {
			this.setNodeProperty(identifier, key, value);
		}
	}

	deleteNode(identifier) {
		const id = Graph.packID(identifier);
		let node = this._nodeObject(id);
		if (!node) return;
		this._prepareForNodeModifications();
		delete this._data.nodes[id];
	}

	setEdge(fromIdentifier, toIdentifier, values = {}) {
		const fromID = Graph.packID(fromIdentifier);
		const toID = Graph.packID(toIdentifier);
		let node = this._nodeObject(fromID);
		if (!node) {
			node = this.setNode(fromID);
		}
		const edgeID = Graph.packEdgeID(fromIdentifier, toIdentifier);
		if (values.id != edgeID) values.id = edgeID;
		if (values.from != fromID) values.from = fromID;
		if (values.to != toID) values.to = toID;
		this._prepareForNodeModifications();
		this._data.nodes[fromID] = {...node, edges:{...node.edges, [toID]: values}};
	}

	setEdgeProperty(fromIdentifier, toIdentifier, property, value) {
		let values = this.edge(fromIdentifier, toIdentifier);
		values = values ? {...values} : {};
		if (values[property] === value) return;
		values[property] = value;
		this.setEdge(fromIdentifier, toIdentifier, values);
	}

	setEdgeProperties(identifier, values) {
		for (const [key, value] of Object.entries(values)) {
			this.setEdgeProperty(identifier, key, value);
		}
	}

	deleteEdge(fromIdentifier, toIdentifier) {
		const fromID = Graph.packID(fromIdentifier);
		const toID = Graph.packID(toIdentifier);
		let node = this._nodeObject(fromID);
		if (!node) return;
		let edge = node.edges[toID];
		if (!edge) return;
		this._prepareForNodeModifications();
		const newEdges = {...node.edges};
		delete newEdges[toID];
		this._data.nodes[fromID] = {...node, edges: newEdges};
	}

	lastNodeID() {
		const keys = Object.keys(this._data.nodes);
		return keys[keys.length - 1];
	}

	lastNodeIdentifier() {
		return Graph.unpackID(this.lastNodeID());
	}
}

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
		return {x:0, y:0};
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

export class RectangleGraph extends PositionedGraph {

	static identifier(row, col) {
		return [row, col];
	}

	static rowColFromIdentifier(identifier) {
		return identifier;
	}

	/*
		options is a dict that may have the following keys
		starterValue - the values to clone and set for each cell
		nodeMargin - the margin to have between nodes. It is in units of
		percentage of nodeWidth. If you want a different value for x and y,
		you can set an array with [xMargin, yMargin]
		nodeBorderRadius - a value from 0.0 to 1.0 for size of radius

		The follow keys are boolean and may be set to true on options:
		rectangular - Allow nodes to have a width and height that differs
		noLeft - Don't connect directly to the left
		noRight - Don't connect directly to the right
		noUp - Don't connect directly up
		noDown - Don't connect directly down
		noHorizontal - Equivalent to noLeft, noRight
		noVertical - Equivalent to noUp, noDown
		noRightAngle - Equivalent to noHorizontal, noVertical
		diagonalUpLeft - Also connect diagonal up and left
		diagonalDownLeft - Also connect diagonals down and left
		diagonalUpRight - Also connect diagonals up and right
		diagonalDownRight - Also connect diagonals down and right
		diagonalRight - equivalent to diagonalUpRight, diagonalDownRight
		diagonalLeft - equilvalent to diagonalUpLeft, diagonalDownLeft
		diagonalUp - equivalent to diagonalUpLeft, diagonalUpRight
		diagonalDown - equivalent to diagonalDownLeft, diagonalDownRight
		diagonal - equivalent to diagonalUp, diagonalDown
	*/
	static make(rows, cols, availableWidth, availableHeight, options = {}) {
		if (typeof rows != 'number' || rows < 1.0) throw new Error('Rows must be a positive integer');
		if (typeof cols != 'number' || cols < 1.0) throw new Error('Cols must be a positive integer');

		const nodeMargin = options.nodeMargin || 0;
		const starterValues = options.starterValues || {};
		const nodeBorderRadius = options.nodeBorderRadius || 0;

		if (typeof nodeBorderRadius != 'number') throw new Error('nodeRadius must be a number');
		if (nodeBorderRadius > 1.0 || nodeBorderRadius < 0.0) throw new Error('nodeRadius must be between 0.0 and 1.0');

		if (Array.isArray(nodeMargin)) {
			if (nodeMargin.length != 2) throw new Error('If nodeMargin is an array it must be two items long');
		}

		(Array.isArray(nodeMargin) ? nodeMargin : [nodeMargin]).forEach(margin => {
			if (typeof margin != 'number') throw new Error('nodeMargin must be a number');
			if (margin < 0.0) throw new Error('nodeMargin must be positive');
		});

		const result = new RectangleGraph();
		result.availableHeight = availableHeight;
		result.availableWidth = availableWidth;
		result.nodeMargin = nodeMargin;
		result.nodeBorderRadius = nodeBorderRadius;
		if (options.rectangular) result.rectangular = true;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const values = {...starterValues, row: r, col: c};
				const identifier = RectangleGraph.identifier(r, c);
				result.setNode(identifier, values);
				if (!options.noUp && !options.noVertical && !options.noRightAngle) {
					if (r > 0) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c), {distance: 1.0, type: 'up'});
				}
				if (!options.noLeft && !options.noHorizontal && !options.noRightAngle) {
					if (c > 0) result.setEdge(identifier, RectangleGraph.identifier(r, c - 1), {distance: 1.0, type: 'left'});
				}
				if (!options.noDown && !options.noVertical && !options.noRightAngle) {
					if (r < rows - 1) result.setEdge(identifier, RectangleGraph.identifier(r + 1, c), {distance: 1.0, type: 'down'});
				}
				if (!options.noRight && !options.noHorizontal && !options.noRightAngle) {
					if (c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r, c + 1), {distance: 1.0, type: 'cols'});
				}
				if (options.diagonalUpLeft || options.diagonalUp || options.diagonalLeft || options.diagonal) {
					if (r > 0 && c > 0) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c - 1), {distance: Math.sqrt(2), type: 'diagonalUpLeft'});
				}
				if (options.diagonalDownLeft || options.diagonalDown || options.diagonalLeft || options.diagonal) {
					if (r > 0 && c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c + 1), {distance: Math.sqrt(2), type: 'diagonalDownLeft'});
				}
				if (options.diagonalUpRight || options.diagonalUp || options.diagonalRight || options.diagonal) {
					if (r > 0 && c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c + 1), {distance: Math.sqrt(2), type: 'diagonalUpRight'});
				}
				if (options.diagonalDownRight || options.diagonalDown || options.diagonalRight || options.diagonal) {
					if (r < rows - 1 && c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r + 1, c + 1), {distance: Math.sqrt(2), type: 'diagonalDownRight'});
				}
				//TODO set wraps too if desired
			}
		}
		result.bakeLayout();
		return result;
	}

	get nodeMargin() {
		return this.property('nodeMargin');
	}

	set nodeMargin(val) {
		this.setProperty('nodeMargin', val);
	}

	//By default, the nodes are square, but if this is true they will be rectangular.
	get rectangular() {
		return this.property('rectangular');
	}

	set rectangular(val) {
		this.setProperty('rectangular', val);
	}

	get xNodeMargin() {
		const margin = this.nodeMargin;
		if (Array.isArray(margin)) return margin[0];
		return margin;
	}

	get yNodeMargin() {
		const margin = this.nodeMargin;
		if (Array.isArray(margin)) return margin[1];
		return margin;
	}

	get rows() {
		return this.lastNodeIdentifier()[0] + 1;
	}

	get cols() {
		return this.lastNodeIdentifier()[1] + 1;
	}

	get width() {
		return ((this.nodeWidth * (1.0 + this.xNodeMargin) * this.cols) - this.xNodeMargin);
	}

	get height() {
		return ((this.nodeHeight * (1.0 + this.yNodeMargin) * this.rows) - this.yNodeMargin);
	}

	get _nodeHeight() {
		if(this._cachedNodeHeight === undefined) {
			this._cachedNodeHeight = this.availableHeight / (this.rows * (1.0 + this.yNodeMargin) - this.yNodeMargin);
		}
		return this._cachedNodeHeight;
	}

	get nodeHeight() {
		return this.rectangular ? this._nodeHeight : this._nodeSize;
	}

	get _nodeWidth() {
		if(this._cachedNodeWidth === undefined) {
			this._cachedNodeWidth = this.availableWidth / (this.cols * (1.0 + this.xNodeMargin) - this.xNodeMargin);
		}
		return this._cachedNodeWidth;
	}

	get nodeWidth() {
		return this.rectangular ? this._nodeWidth : this._nodeSize;
	}

	get _nodeSize() {
		if(this._cachedNodeSize === undefined) {
			this._cachedNodeSize = Math.min(this._nodeHeight, this._nodeWidth);
		}
		return this._cachedNodeSize;
	}

	//We return width and height directly.
	calculateNodePosition(identifier) {
		const node = this.node(identifier);
		const nodeWidth = this.nodeWidth;
		const nodeHeight = this.nodeHeight;
		return {
			x: (node.col * (nodeWidth * (1.0 + this.xNodeMargin))) + (nodeWidth / 2),
			y: (node.row * (nodeHeight * (1.0 + this.yNodeMargin))) + (nodeHeight / 2),
			width: nodeWidth,
			height: nodeHeight,
		};
	}

}

//all graph constructors we know of should be here.
const graphConstructors = [
	Graph,
	PositionedGraph,
	RectangleGraph,
];

const graphConstructorsByType = Object.fromEntries(graphConstructors.map(constructor => [constructor.name, constructor]));

export const inflateGraph = (graphData) => {
	if (!graphData || typeof graphData != 'object') throw new Error('graphData is not an object');
	const typ = graphData.graphType;
	if (typ === undefined) throw new Error('No graphType in graph data');
	const constructor = graphConstructorsByType[typ];
	if (!constructor) throw new Error('Unknown graphType: ' + typ);
	return new constructor(graphData);
};