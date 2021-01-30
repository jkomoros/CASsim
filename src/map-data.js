
/*
expandedMapData has the following shape:
{
	rows: 5,
	cols: 5,
	cells: [//cellData]
}

where cell data looks like:

{
	row: 0,
	col: 1,
	value: 0.0,
	highlighted: true,
	selected: true,
	opacity: 0.5;
}

*/

export const EMPTY_EXPANDED_MAP_DATA = {
	rows:0,
	cols:0,
	cells: [],
};

/*
	cellValueCommands are arrays, where each element is of the shape [valueToSet, CellReference]

	where cellReference is one of:
	* [row, col] for a single cell
*/

//Expects an array of [rows, cols] for size of map.
export const SET_SIZE_COMMAND = "set_size";
//Expects a cellValueCommand (see above)
export const SET_SELECTED_COMMAND = "set_selected";

const defaultCellData = (row, col) => {
	return {
		row,
		col,
		value: 0.0,
		highlighted: false,
		selected: false,
		opacity: 1.0,
	};
};

export const defaultCellsForSize = (rows, cols) => {
	const result = [];
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			result.push(defaultCellData(r, c));
		}
	}
	return result;
};

export const defaultVisualizationMapExpandedForCells = (cells) => {
	let rows = 0;
	let cols = 0;
	if (cells.length) {
		rows = cells.map(cell => cell.row).reduce((prev, curr) => curr > prev ? curr : prev) + 1;
		cols = cells.map(cell => cell.col).reduce((prev, curr) => curr > prev ? curr : prev) + 1;
	}
	return {
		rows,
		cols,
		cells
	};
};

class visualizationMap {
	constructor(collection, index, rawData) {
		this._collection = collection;
		this._index = index;
		this._rawData = rawData;
		this._cachedData = null;
	}

	_computeData() {
		const previous = this._index > 0 ? this._collection.dataForIndex(this._index - 1).expandedData : defaultVisualizationMapExpandedForCells([]);
		const size = this._rawData[SET_SIZE_COMMAND];
		if (!size) throw new Error("First item did not have a set size");
		if (!Array.isArray(size)) throw new Error("size command not an array");
		if (size.length != 2) throw new Error("Size command expects array of lenght 2");

		const result = {
			...previous,
			cells: defaultCellsForSize(...size),
			rows: size[0],
			cols: size[1],
		};

		//TODO: compute the final data model here.
		this._cachedData = result;
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