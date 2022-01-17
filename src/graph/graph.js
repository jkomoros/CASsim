import {
	shuffleInPlace
} from '../util.js';
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

	/*
		When a graph type is laoded, it should call this with their constructor
		so that inflateGraph knows how to find it.
	*/
	static registerGraphType(constructor) {
		graphConstructors[constructor.name] = constructor;
	}

	static get ID_DELIMITER() {
		return ':';
	}

	static packID(identifier) {
		if (typeof identifier == 'string') return identifier;
		if (typeof identifier == 'number') return identifier.toString();
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

	//Returns all nodes. if filterFunc is provided, it will filter any node whose values, when passed to the filterFunc, do not return true.
	nodes(filterFunc) {
		if (filterFunc) return Object.fromEntries(Object.entries(this._data.nodes).filter(entry => filterFunc(entry[1].values)).map(entry => [entry[0], entry[1].values]));
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
		const result = this.exploreGraph(identifier, includeNode, () => 1);
		return Object.fromEntries(Object.entries(result).map(entry => [entry[0], entry[1].node]));
	}

	/*
		exploreGraph is a workhorse node searcher. Is either in target seeking
		mode (where it will look for a single target and then return its
		distance, path), or accumulation mode where it will return an object of
		nodeID to {node:nodeValues, path:[...edgeValues], length: 1.0} for every
		node that is not filtered out. Any place that path shows up, it's an
		array of edgeValues to go from fromNode to node. Its in the former if
		targetFound is provided.

		fromNodeIdentifier - node to start search from 

		includeNode = (nodeValues, path, length) => true - if true, then the
		node will be included in the search, either for the accumulation set in
		the end or in the search set. You can get the edgeValues for the most
		recent edge from path[path.length -1]. If not provided, then it will
		return all nodes in the graph that are not fromIdentifier.

		edgeScorer = (edgeValues) => length - the function to extract the length
		from an edge. By default it's () => 1, which allows you to treat length
		as 'number of edge hops away from fromNode'.

		targetFound = (nodeValues, path, length) => true - if provided, then
		_nodeSearcher is in target seeking mode, and will return the distance,
		path when it finds this node, or -1 * MAX_SAFE_INTEGER, null if not
		found. If targetFound is not provided, then _nodeSearcher is in
		collection mode.

		rnd = () => 0.0..1.0 - the random function to use to scramble the order
		we visit edges of a node. If not provided, we'll visit nodes in the
		order they're represented in the graph.
	*/
	exploreGraph(fromNodeIdentifier, includeNode = () => true, edgeScorer = () => 1, targetFound = undefined, rnd = undefined) {
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
				const path = [...item.path, edge];
				const length = item.length + edgeScorer(edge);
				if (!includeNode(toNode, path, length)) continue;
				const newItem = {path, length, node: toNode};
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
		const toNodeID = Graph.packID(toNodeIdentifer);
		const targetFound = (nodeValues) => nodeValues.id == toNodeID;
		return this.exploreGraph(fromNodeIdentifier, undefined, edgeScorer, targetFound, rnd);
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
		return node.values;
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

	setBidirectionalEdge(fromIdentifier, toIdentifier, values) {
		this.setEdge(fromIdentifier, toIdentifier, values);
		this.setEdge(toIdentifier, fromIdentifier, values);
	}

	setEdge(fromIdentifier, toIdentifier, values = {}) {
		const fromID = Graph.packID(fromIdentifier);
		const toID = Graph.packID(toIdentifier);
		let node = this._nodeObject(fromID);
		if (!node) {
			this.setNode(fromID);
			node = this._nodeObject(fromID);
		}
		const edgeID = Graph.packEdgeID(fromIdentifier, toIdentifier);
		if (values.id != edgeID) values.id = edgeID;
		if (values.from != fromID) values.from = fromID;
		if (values.to != toID) values.to = toID;
		this._prepareForNodeModifications();
		this._data.nodes[fromID] = {...node, edges:{...node.edges, [toID]: values}};
	}

	setBidirectionalEdgeProperty(fromIdentifier, toIdentifier, property, value) {
		this.setEdgeProperty(fromIdentifier, toIdentifier, property, value);
		this.setEdgeProperty(toIdentifier, fromIdentifier, property, value);
	}

	setEdgeProperty(fromIdentifier, toIdentifier, property, value) {
		let values = this.edge(fromIdentifier, toIdentifier);
		values = values ? {...values} : {};
		if (values[property] === value) return;
		values[property] = value;
		this.setEdge(fromIdentifier, toIdentifier, values);
	}

	setBidirectionalEdgeProperties(fromIdentifier, toIdentifier, values) {
		this.setEdgeProperties(fromIdentifier, toIdentifier, values);
		this.setEdgeProperties(toIdentifier, fromIdentifier, values);
	}

	setEdgeProperties(fromIdentifier, toIdentifier, values) {
		for (const [key, value] of Object.entries(values)) {
			this.setEdgeProperty(fromIdentifier, toIdentifier, key, value);
		}
	}

	deleteBidirectionalEdge(fromIdentifier, toIdentifier) {
		this.deleteEdge(fromIdentifier, toIdentifier);
		this.deleteEdge(toIdentifier, fromIdentifier);
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

	//Returns a stream of unique ids, by maintaining a counter.
	vendID() {
		let lastID = this.property('lastVendedID');
		if (lastID == undefined) lastID = -1;
		lastID++;
		while(this.node(lastID)) {
			lastID++;
		}
		this.setProperty('lastVendedID', lastID);
		return '' + lastID;
	}
}

//all graph constructors we know of will be accumulated here via Graph.registerGraphType();
const graphConstructors = {
	[Graph.name]: Graph,
};

export const inflateGraph = (graphData) => {
	if (!graphData || typeof graphData != 'object') throw new Error('graphData is not an object');
	const typ = graphData.graphType;
	if (typ === undefined) throw new Error('No graphType in graph data');
	const constructor = graphConstructors[typ];
	if (!constructor) throw new Error('Unknown graphType: ' + typ);
	return new constructor(graphData);
};