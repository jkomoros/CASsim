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
		if (!data) data = {};
		this._data = data;
		this._changesMade = false;
	}

	static get ID_DELIMITER() {
		return ':';
	}

	static packID(identifier) {
		if (typeof identifier == 'string') return identifier;
		if (Array.isArray(identifier)) {
			const strs = identifier.map(part => '' + part);
			if (strs.some(str => str.contains(Graph.ID_DELIMITER))) throw new Error('An unpacked ID part contained the ID_DELIMITER');
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
		return this._changesMade;
	}

	//Should be called when the backing store has been saved.
	saved() {
		this._changesMade = false;
	}

	_nodeObject(identifier) {
		const id = Graph.packID(identifier);
		return this._data[id];
	}

	get data() {
		return this._data;
	}

	//Get the values stored on the node, or undefined if it doesn't exist. Note
	//that you can only rely on value equality for nodes if changesMade is false.
	node(identifier) {
		//_nodeObject will pack identifier
		const node = this._nodeObject(identifier);
		if (!node) return undefined;
		return node.values;
	}

	//Get the values stored on the edge, or undefined if that edge doesnt'
	//exist. Note that you can only rely on value equality for edges if
	//changesMade is false.
	edge(fromIdentifier, toIdentifier) {
		const node = this._nodeObject(fromIdentifier);
		if (!node) return undefined;
		const toID = Graph.packID(toIdentifier);
		return node.edges[toID];
	}

	edges(identifier) {
		//_nodeObject will pack identifier
		const node = this._nodeObject(identifier);
		if (!node) return undefined;
		return node.edges;
	}

	_prepareForModifications() {
		if (!this.changesMade) {
			this._data = {...this._data};
		}
		this._changesMade = true;
	}

	setNode(identifier, values) {
		const id = Graph.packID(identifier);
		let node = this._nodeObject(id);
		if (!node) node = {edges:{}};
		if (node.values == values) return;
		if (!values) values = {};
		if (values.id != id) values.id = id;
		node.values = values;
		this._prepareForModifications();
		this._data[id] = node;
		return node;
	}

	setNodeProperty(identifier, property, value) {
		let values = this.node(identifier);
		values = values ? {...values} : {};
		values[property] = value;
		return this.setNode(identifier, values);
	}

	deleteNode(identifier) {
		const id = Graph.packID(identifier);
		let node = this._nodeObject(id);
		if (!node) return;
		this._prepareForModifications();
		delete this._data[id];
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
		this._prepareForModifications();
		this._data[fromID] = {...node, edges:{...node.edges, [toID]: values}};
	}

	setEdgeProperty(fromIdentifier, toIdentifier, property, value) {
		let values = this.edge(fromIdentifier, toIdentifier);
		values = values ? {...values} : {};
		values[property] = value;
		this.setEdge(fromIdentifier, toIdentifier, values);
	}

	deleteEdge(fromIdentifier, toIdentifier) {
		const fromID = Graph.packID(fromIdentifier);
		const toID = Graph.packID(toIdentifier);
		let node = this._nodeObject(fromID);
		if (!node) return;
		let edge = node.edges[toID];
		if (!edge) return;
		this._prepareForModifications();
		const newEdges = {...node.edges};
		delete newEdges[toID];
		this._data[fromID] = {...node, edges: newEdges};
	}

	lastNodeID() {
		const keys = Object.keys(this._data);
		return keys[keys.length - 1];
	}

	lastNodeIdentifier() {
		return Graph.unpackID(this.lastNodeID());
	}
}