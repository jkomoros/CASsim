export class Urn {
	constructor(rnd) {
		this._rnd = rnd;
		this._sum = 0.0;
		this._items = new Map();
	}

	add(item, count = 1) {
		count = Math.max(count, 0.0);
		this._sum += count;
		this._items.set(item, count);
	}

	pick() {
		if (this._sum == 0.0) {
			return this._items.size ? this._items.keys()[0] : undefined;
		}
		const val = this._rnd() * this._sum;
		let sum = 0.0;
		const entries = [...this._items.entries()];
		for (let [item, count] of entries) {
			sum += count;
			if (sum > val) return item;
		}
		return entries[entries.length][0];
	}
}

export const uniquePairs = (arr) => arr.flatMap((item1, index1) => arr.flatMap((item2, index2) => (index1 > index2) ? [[item1,item2]] : []));

const randomCharSetNumbers = '0123456789';
const randomCharSetLetters = 'abcdef';
const randomCharSet = randomCharSetNumbers + randomCharSetLetters;

export const randomString = (length, rnd = Math.random, charSet = randomCharSet) => {
	let text = '';
	for (let i = 0; i < length; i++) {
		text += charSet.charAt(Math.floor(rnd() * charSet.length));
	}
	return text;
};

export const shuffleInPlace = (array, rnd = Math.random) => {
	let currentIndex = array.length;
	let randomIndex;

	while (currentIndex != 0) {
		randomIndex = Math.floor(rnd() * currentIndex);
		currentIndex--;
  
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
  
	return array;
};

export const idToTitle = (id = '') => {
	return id.split('_').join('-').split('-').map(w => (w[0] || '').toUpperCase() + w.substr(1).toLowerCase()).join(' ');
};

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

export const parseHash = (hash) => {
	if (hash.startsWith('#')) hash = hash.substring(1);
	const args = {};
	if (!hash) return args;
	for (const part of hash.split('&')) {
		const [key, val] = part.split('=');
		args[key] = val;
	}
	return args;
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

//From https://blog.trannhat.xyz/generate-a-hash-from-string-in-javascript/
export const hash = (s) => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);

export const stringHash = (s) => Math.abs(hash(s)).toString(16);