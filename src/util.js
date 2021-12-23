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
export const DEFAULT_SENTINEL = {default: true};

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

export const packModificationsForURL = (modifications = [], simCollection, currentSimIndex = -1) => {
	//Allowed characters in URL based on this answer: https://stackoverflow.com/questions/26088849/url-fragment-allowed-characters
	//We avoid '=' and '&' in the hash, since those will be used for other parameters
	//URL looks like: 
	//1@34,simOptions.northStar:d,display.debug:t;3@12,simOptions.northStar:x,description:'a%20b',runs:5
	//Where:
	//1 and 3 are examples of the index of the simulationIndex we're referring to
	//@ is the delimiter for the concatenated, in order, list of modifications
	//34, 12 are examples of the version number of the simulator for that simIndex WITH ALL MODIFICATIONS APPLIED (sim=OTHER could be sent)
	//the dotted path is the modification.path
	//: is the delimiter to the value and , is the delimeter for values
	//'' delimits strings, which are URL-endcoded inside
	//Naked numbers are just numbers
	//t is true, f is false, n is null, u is undefined, x is delete sentinel, d is delete sentinel
	//Objects are encoded with an 'o' followed by a URL-encoded JSON blob
	//As a special case, the simIndex and '@' at the beginning of a simIndexes's list of modifications may be fully omitted if it equals currentSimIndex.
	//As a special case, if the simulatorVersion is 0, it may be omitted
	if (!simCollection) return '';
	let result = [];
	const simIndexes = Array.from(new Set(modifications.map(mod => mod.simulationIndex)));
	for (const simIndex of simIndexes) {
		let simPiece = '';
		if (simIndex != currentSimIndex) simPiece = '' + simIndex + '@';
		const simulation = simCollection.simulations[simIndex];
		if (!simulation) return '';
		const keyValuePairs = [];
		const version = simulation.simulator.version;
		if (version) keyValuePairs.push('' + version);

		//Only keep the last modification of path
		const mods = new Map();
		for (const mod of modifications) {
			if (mod.simulationIndex != simIndex) continue;
			mods.set(mod.path, mod.value);
			//Deletes 'shadow' all earlier sets or modifications of paths whose
			//have our path as a prefix so clear them out.
			if (mod.value == DELETE_SENTINEL) {
				for (const key of mods.keys()) {
					//Add a '.' to make sure that paths like 'a.f' don't match 'a.foo'
					if (!key.startsWith(mod.path + '.')) continue;
					mods.delete(key);
				}
			}
		}
		for (let [path, value] of mods.entries()) {
			if (typeof value == 'string') value = "'" + encodeURIComponent(value) + "'";
			if (value == DEFAULT_SENTINEL) value = 'd';
			if (value == DELETE_SENTINEL) value ='x';
			if (value === null) value = 'n';
			if (value === undefined) value = 'u';
			if (value === true) value = 't';
			if (value === false) value = 'f';
			if (typeof value == 'object') {
				//Objects should be very rare (the UI never allows adding them;
				//they're always added by default sentinel) but we should handle
				//them.
				value = 'o' + encodeURIComponent(JSON.stringify(value));
			}
			//numbers will be encoded to string value automatically via coercion.
			keyValuePairs.push(path + ':' + value);
		}
		simPiece += keyValuePairs.join(',');
		result.push(simPiece);
	}
	return result.join(';');
};

export const unpackModificationsFromURL = (url, currentSimIndex = -1) => {
	const modifications = [];
	const urlParts = url.split(';');
	//For now, we just completely ignore simulator version number
	for (const urlPart of urlParts) {
		const versionParts = urlPart.split('@');
		//the version number might be ommited.
		const keyValuesPart = versionParts[versionParts.length - 1];
		const simulationIndex = versionParts.length == 2 ? parseInt(versionParts[0]) : currentSimIndex;
		const keyValuesParts = keyValuesPart.split(',');
		for (const [index, part] of keyValuesParts.entries()) {
			if (index == 0) {
				//This is the version number, which we just ignore for now;
				//later we should show a warning message in the UI but try to
				//continue.
				if (!part.includes(':')) continue;
			}
			let [key, value] = part.split(':');
			if (value == 'd') value = DEFAULT_SENTINEL;
			if (value == 'x') value = DELETE_SENTINEL;
			if (value == 'n') value = null;
			if (value == 'u') value = undefined;
			if (value == 't') value = true;
			if (value == 'f') value = false;

			if (value && typeof value == 'string') {
				if (value.startsWith("'")) {
					//Value is a string.
					value = value.split("'").join('');
					value = decodeURIComponent(value);
				} else if (value.startsWith('o')) {
					//An object.
					value = value.substring(1);
					value = decodeURIComponent(value);
					value = JSON.parse(value);
				} else {
					const numValue = parseFloat(value);
					if (!isNaN(numValue)) value = numValue;
				}
			}
			modifications.push({simulationIndex, path:key, value});
		}
	}
	return modifications;
};