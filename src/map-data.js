
class visualizationMap {
	constructor(collection, index, data) {
		this._collection = collection;
		this._index = index;
		this._data = data;
		this._cachedData = null;
	}

	_computeData() {
		//TODO: compute the final data model here.
		this._cachedData = {};
	}

	get expandedData() {
		if (!this._cachedData) {
			this._computeData();
		}
		return this._cachedData;
	}
}

export class VisualizationMapCollection {
	constructor(data) {
		this._data = data || [];
	}

	dataForIndex(index) {
		if (index < 0 || index >= this._data.length) return null;
		return new visualizationMap(this, index, this._data[index]);
	}
}