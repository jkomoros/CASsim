
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
		return this._data[identifier];
	}

	get data() {
		return this._data;
	}

	node(identifier) {
		const node = this._nodeObject(identifier);
		if (!node) return undefined;
		return node.values;
	}

	edges(identifier) {
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
		let node = this._nodeObject(identifier);
		if (!node) node = {edges:{}};
		if (node.values == values) return;
		if (!values) values = {};
		if (values.id != identifier) values.id = identifier;
		node.values = values;
		this._prepareForModifications();
		this._data[identifier] = node;
		return node;
	}

	deleteNode(identifier) {
		let node = this._nodeObject(identifier);
		if (!node) return;
		this._prepareForModifications();
		delete this._data[identifier];
	}

	setEdge(fromIdentifier, toIdentifier, values = {}) {
		let node = this._nodeObject(fromIdentifier);
		if (!node) {
			node = this.setNode(fromIdentifier);
		}
		this._prepareForModifications();
		this._data[fromIdentifier] = {...node, edges:{...node.edges, [toIdentifier]: values}};
	}

	deleteEdge(fromIdentifier, toIdentifier) {
		let node = this._nodeObject(fromIdentifier);
		if (!node) return;
		let edge = node.edges[toIdentifier];
		if (!edge) return;
		this._prepareForModifications();
		const newEdges = {...node.edges};
		delete newEdges[toIdentifier];
		this._data[fromIdentifier] = {...node, edges: newEdges};
	}


}