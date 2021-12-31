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
		if (!data) data = {nodes:{}, properties:{}};
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
		this._prepareForPropertyModifications();
		this._data.properties[name] = value;
	}

	setProperties(data) {
		for (const [key, value] of Object.entries(data)) {
			this.setProperty(key, value);
		}
	}

	//Returns the values objects for all neighbors 
	neighbors(identifier, ply = 1) {
		const result = {};
		const id = Graph.packID(identifier);
		const nodesToProcess = Object.fromEntries(Object.entries(this.edges(identifier)).map(entry => [entry[0], 1]));
		while (Object.keys(nodesToProcess).length) {
			const [otherID, distance] = Object.entries(nodesToProcess)[0];
			delete nodesToProcess[otherID];
			const values = this.node(otherID);
			result[otherID] = values;
			//Only add more items to the queue if we haven't already hit the ply limit
			if (distance >= ply) continue;
			for (const newID of Object.keys(this.edges(otherID))) {
				//Don't revisit the one we started from
				if (newID == id) continue;
				//Don't revisit ones we've already processed
				if (result[newID]) continue;
				//Don't add another entry for one we're already planning to process
				if (nodesToProcess[newID]) continue;
				nodesToProcess[newID] = distance + 1;
			}
		}
		return result;
	}

	//shortestPath returns [length, path] where length is the shortest path
	//lengh, and path is an array of edges to go from fromNode to
	//toNode. The length of each edge is given by edgeScorer, which typically
	//returns a value like edge.distance. The default simply counts each edge as
	//length 1. If there is no path from from to to, will return [-1 * MAX_SAFE_INTEGER, null];
	shortestPath(fromNodeIdentifier, toNodeIdentifer, edgeScorer = () => 1, rnd = Math.random) {
		//TODO: memoize
		const fromID = Graph.packID(fromNodeIdentifier);
		const toID = Graph.packID(toNodeIdentifer);
		const visitedNodes = {
			fromID: true,
		};
		//Each one should be {path: [...previousNodes, node], length: 1, node: node}
		const itemsToVisit = [{path: [], length: 0, node: fromID}];
		while (itemsToVisit.length) {
			const item = itemsToVisit.shift();
			if (visitedNodes[item.node]) continue;
			visitedNodes[item.node] = true;
			const edges = this.edges(item.node);
			//Since we only return one path, we should visit equivalent items in a random order.
			const edgeKeys = shuffleInPlace(Object.keys(edges), rnd);
			for (const edgeToID of edgeKeys) {
				const edge = edges[edgeToID];
				const path = [...item.path, edgeToID];
				const length = item.length + edgeScorer(edge);
				if (edgeToID == toID) return [length, path];
				if (visitedNodes[edgeToID]) continue;
				itemsToVisit.push({path, length, node: edgeToID});
			}
			itemsToVisit.sort((a, b) => a.length - b.length);
		}
		return [-1 * Math.MAX_SAFE_INTEGER, null];
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
		this.setProperty('avaialableHeight', val);
	}

	get availableHeight(){
		return this.property('availableHeight');
	}

	/*
		This is an override point to calculate the position
	*/
	//eslint-disable-next-line no-unused-vars
	calculateNodePosition(identifier) {
		return {x:0, y:0, width: 0, height: 0};
	}

	//Returns an object with x,y,width,height of the node. x,y are at the center of the node.
	nodePosition(identifier) {
		const values = this.node(identifier);
		if (!values || values.x === undefined || values.y === undefined || values.width === undefined || values.height === undefined) {
			return this.calculateNodePosition(identifier);
		}
		return {x: values.x, y: values.y, width: values.width, height: values.height};
	}

	//Goes through and sets the x,y,width,height on all nodes so that future
	//nodePosition calls don't require calculations.
	bakeLayout() {
		for (const node of Object.values(this.nodes())) {
			const position = this.calculateNodePosition(node);
			this.setNodeProperties(node, position);
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
		nodeMargin is the margin to have between nodes. It is in units of
		percentage of nodeWidth.

		options is a dict that may have the following keys set to true:
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
	static make(rows, cols, availableWidth, availableHeight, nodeMargin = 0, starterValues = {}, options = {}) {
		if (typeof rows != 'number' || rows < 1.0) throw new Error('Rows must be a positive integer');
		if (typeof cols != 'number' || cols < 1.0) throw new Error('Cols must be a positive integer');

		const result = new RectangleGraph();
		result.availableHeight = availableHeight;
		result.availableWidth = availableWidth;
		result.nodeMargin = nodeMargin;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const values = {...starterValues, row: r, col: c};
				const identifier = RectangleGraph.identifier(r, c);
				result.setNode(identifier, values);
				if (!options.noUp && !options.noVertical && !options.noRightAngle) {
					if (r > 0) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c), {distance: 1.0});
				}
				if (!options.noLeft && !options.noHorizontal && !options.noRightAngle) {
					if (c > 0) result.setEdge(identifier, RectangleGraph.identifier(r, c - 1), {distance: 1.0});
				}
				if (!options.noDown && !options.noVertical && !options.noRightAngle) {
					if (r < rows - 1) result.setEdge(identifier, RectangleGraph.identifier(r + 1, c), {distance: 1.0});
				}
				if (!options.noRight && !options.noHorizontal && !options.noRightAngle) {
					if (c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r, c + 1), {distance: 1.0});
				}
				if (options.diagonalUpLeft || options.diagonalUp || options.diagonalLeft || options.diagonal) {
					if (r > 0 && c > 0) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c - 1), {distance: Math.sqrt(2)});
				}
				if (options.diagonalDownLeft || options.diagonalDown || options.diagonalLeft || options.diagonal) {
					if (r > 0 && c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c + 1), {distance: Math.sqrt(2)});
				}
				if (options.diagonalUpRight || options.diagonalUp || options.diagonalRight || options.diagonal) {
					if (r > 0 && c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r - 1, c + 1), {distance: Math.sqrt(2)});
				}
				if (options.diagonalDownRight || options.diagonalDown || options.diagonalRight || options.diagonal) {
					if (r < rows - 1 && c < cols - 1) result.setEdge(identifier, RectangleGraph.identifier(r + 1, c + 1), {distance: Math.sqrt(2)});
				}
				//TODO set wraps too if desired
			}
		}
		return result;
	}

	get nodeMargin() {
		return this.property('nodeMargin');
	}

	set nodeMargin(val) {
		this.setProperty('nodeMargin', val);
	}

	get rows() {
		return this.lastNodeIdentifier()[0] + 1;
	}

	get cols() {
		return this.lastNodeIdentifier()[1] + 1;
	}

}