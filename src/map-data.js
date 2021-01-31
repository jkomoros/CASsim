
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
	captured: true,
	//Manually set opacity. If not undefined, will be used, otherwise autoOpacity will be used.
	fillOpacity: 0.5,
	strokeOpacity: 0.5,
	autoOpacity: 1.0,
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
	* [startRow, startCol, endRow, endCol] to select a rectangle (INCLUSIVE)
	* [] to select all cells
*/

//Expects an array of [rows, cols] for size of map.
export const SET_SIZE_COMMAND = "setSize";
//Expects a cellValueCommand (see above)
export const SET_HIGHLIGHTED_COMMAND = "highlighted";
//Expects a cellValueCommand (see above)
export const SET_CAPTURED_COMMAND = "captured";
//Expects a cellValueCommand (see above)
export const SET_VALUE_COMMAND = "value";
//Expects a cellValueCommand (see above). This is semantically equivalent to setting fill_opacity and stroke_opacity at the same time.
export const SET_OPACITY_COMMAND = "opacity";
//Expects a name that was a PREVIOUS state, with a 'name' property, and uses
//that, instead of the previous state, to base its modifications off of.
export const RESET_TO_COMMAND = 'resetTo';
//The name to set for reset_to to refer to
export const NAME_COMMAND = 'name';

const SET_CELL_COMMANDS = {
	[SET_HIGHLIGHTED_COMMAND]: [SET_HIGHLIGHTED_COMMAND],
	[SET_CAPTURED_COMMAND]: [SET_CAPTURED_COMMAND],
	[SET_VALUE_COMMAND]: [SET_VALUE_COMMAND],
	[SET_OPACITY_COMMAND]: ['fillOpacity', 'strokeOpacity'],
};

const defaultCellData = (row, col) => {
	return {
		row,
		col,
		value: 0.0,
		highlighted: false,
		captured: false,
		//undefined says it should use autoOpacity instead
		opacity: undefined,
		autoOpacity: 1.0,
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

export const getCellFromMap = (map, row, col) => {
	return map.cells[row * map.cols + col];
};

const cellsFromReferences = (map, cellReferences) => {
	//Convert a reference of length 0 to the whole map
	if (cellReferences.length == 0) cellReferences = [0,0,map.rows -1, map.cols -1];
	//convert a single reference to a rectangualr of size one
	if (cellReferences.length == 2) cellReferences = [cellReferences[0], cellReferences[1], cellReferences[0], cellReferences[1]];
	if (cellReferences.length != 4) throw new Error("Unknown cell reference shape: " + cellReferences);
	const result = [];
	const [startRow, startCol, endRow, endCol] = cellReferences;
	if (startRow < 0 || startRow >= map.rows) throw new Error('Invalid cell reference: row ' + startRow + ' is out of bounds');
	if (endRow < 0 || endRow >= map.rows) throw new Error('Invalid cell reference: row ' + endRow + ' is out of bounds');
	if (startCol < 0 || startCol >= map.cols) throw new Error('Invalid cell reference: col ' + startCol + ' is out of bounds');
	if (endCol < 0 || endCol >= map.cols) throw new Error('Invalid cell reference: col ' + endCol + ' is out of bounds');
	if (endRow < startRow) throw new Error("Cell reference invalid: endRow must be larger: " + cellReferences);
	if (endCol < startCol) throw new Error("Cell reference invalid: endCol must be larger: " + cellReferences);
	for (let r = startRow; r <= endRow; r++) {
		for (let c = startCol; c <= endCol; c++) {
			result.push(getCellFromMap(map, r, c));
		}
	}
	return result;
};

const setPropertiesOnMap = (map, propertyName, valueToSet, cellReferences) => {
	const cells = cellsFromReferences(map, cellReferences);
	for (const cell of cells) {
		cell[propertyName] = valueToSet;
	}
};

class visualizationMap {
	constructor(collection, index, rawData) {
		this._collection = collection;
		this._index = index;
		this._rawData = rawData;
		this._cachedData = null;
	}

	get index() {
		return this._index;
	}

	_computeData() {
		let previous;
		if (this._rawData[RESET_TO_COMMAND]) {
			const previousMap = this._collection.dataForName(this._rawData[RESET_TO_COMMAND]);
			if (!previousMap) throw new Error("No such previous with that name");
			if (previousMap.index > this._index) throw new Error("The named map is after us but must be before");
			previous = previousMap.expandedData;
		} else if (this._index > 0) {
			previous = this._collection.dataForIndex(this._index - 1).expandedData;
		} else {
			previous = defaultVisualizationMapExpandedForCells([]);
		}
		const result = {...previous};
		const sizeCommand = this._rawData[SET_SIZE_COMMAND];
		if (this._index == 0 && !sizeCommand) throw new Error("First item did not have a set size");
		if (sizeCommand) {
			if (!Array.isArray(sizeCommand)) throw new Error("size command not an array");
			if (sizeCommand.length != 2) throw new Error("Size command expects array of lenght 2");
			result.cells = defaultCellsForSize(...sizeCommand);
			result.rows = sizeCommand[0];
			result.cols = sizeCommand[1];
		}

		//Copy cells so we can modify them
		result.cells = result.cells.map(cell => ({...cell}));

		for (const [commandName, propertyNames] of Object.entries(SET_CELL_COMMANDS)) {
			const commands = this._rawData[commandName];
			if (commands) {
				for (const command of commands) {
					const valueToSet = command[0];
					const cellReference = command[1];
					for (const propertyName of propertyNames) {
						setPropertiesOnMap(result, propertyName, valueToSet, cellReference);
					}
				}
			}	
		}

		//Catch bugs easier if we later try to modify this, which should be immutable
		Object.freeze(result);
		for (let cell of result.cells) {
			Object.freeze(cell);
		}

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
		this._memoizedMaps = {};
	}

	dataForName(name) {
		for (let i = 0; i < this._data.length; i++) {
			if (this._data[i].name == name) return this.dataForIndex(i);
		}
		return null;
	}

	dataForIndex(index) {
		if (index < 0 || index >= this._data.length) return null;
		if (!this._memoizedMaps[index]) {
			this._memoizedMaps[index] = new visualizationMap(this, index, this._data[index]);
		}
		return this._memoizedMaps[index];
	}
}