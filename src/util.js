export class Urn {
	constructor(rnd) {
		this._rnd = rnd;
		this._sum = 0.0;
		this._items = new Map();
	}

	add(item, count = 1) {
		this._sum += count;
		this._items.set(item, count);
	}

	pick() {
		const val = Math.floor(this._rnd() * this._sum);
		let sum = 0.0;
		const entries = this._items.entries();
		for (let [item, count] of entries) {
			sum += count;
			if (sum > val) return item;
		}
		return entries[entries.length][0];
	}
}

export const deepFreeze = (obj) => {
	if (!obj) return;
	if (typeof obj != 'object') return;
	Object.freeze(obj);
	for (const val of Object.values(obj)) {
		deepFreeze(val);
	}
};

//Only works for POJOs
export const deepCopy = (obj) => {
	return JSON.parse(JSON.stringify(obj));
};

export const shuffleArrayInPlace = (array, rnd) => {
	//based on the answer at https://stackoverflow.com/a/12646864
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(rnd() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
};

const IS_STEP_EPSILON = 0.0000001;

export const isStep = (value, step) => {
	const remainder = value / step;
	const nonIntegerRemainder = Math.abs(remainder - (Math.round(remainder)));
	return nonIntegerRemainder < IS_STEP_EPSILON;
};

export const DELETE_SENTINEL = {DELETE:true};

//path is a dotted list of accessors in the object, returns a new object with
//the modifications. If value is DELETE_SENTINEL then it will delete the implied
//property.
export const setPropertyInObject = (obj, path, value) => {
	if (path == '') return value;
	const pathParts = path.split('.');
	let firstPart = pathParts[0];
	if (obj === undefined || obj === null) {
		if (path == '') return undefined;
		//Create an array or an object based on if they key is a number
		obj = isNaN(parseInt(firstPart)) ? {} : [];
	}

	const restParts = pathParts.slice(1);
	const innerResult = setPropertyInObject(obj[firstPart], restParts.join('.'), value);
	if (Array.isArray(obj)){
		firstPart = parseInt(firstPart);
		const result = [...obj];
		if (value === DELETE_SENTINEL && restParts == '') {
			result.splice(firstPart, 1);
		} else {
			result[firstPart] = innerResult;
		}
		return result;
	}
	if (value === DELETE_SENTINEL && restParts == '') {
		const result = {...obj};
		delete result[firstPart];
		return result;
	}
	return {...obj, [firstPart]: innerResult};
};

const memoizedRendererMaps = {};

export const memoizedRenderer = (simulation, frameVisualizer) => {
	if (!simulation) return null;
	const simulatorName = simulation.simulatorName;
	if (!memoizedRendererMaps[simulatorName]) {
		memoizedRendererMaps[simulatorName] = new WeakMap();
	}
	const map = memoizedRendererMaps[simulatorName];
	if (!map.has(frameVisualizer)) {
		map.set(frameVisualizer, simulation.simulator.renderer());
	}
	return map.get(frameVisualizer);
};