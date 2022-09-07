import { FrameVisualization } from './components/frame-visualization.js';
import { BaseRenderer } from './renderer.js';
import { Simulation } from './simulation.js';
import {
	OptionsPath,
	OptionValue,
	OptionValueMap,
	RandomGenerator, SimulationConfig, SimulatorType
} from './types.js';

/*
	Urn is a class that selects a random item out of a distribution, where each
	item can have a different likelihood of being drawn. The "count" for each
	item is how likely it is to be selected. The likeilhood of a given item
	being drawn is its count divided by the sum of all "count" of all items.
*/
export class Urn<T> {

	_rnd : RandomGenerator;
	_sum : number;
	_items : Map<T,number>;

	constructor(rnd = Math.random) {
		this._rnd = rnd;
		this._sum = 0.0;
		this._items = new Map();
	}

	add(item : T, count = 1) : void{
		count = Math.max(count, 0.0);
		this._sum += count;
		this._items.set(item, count);
	}

	pick() : T | undefined {
		if (this._sum == 0.0) {
			if (this._items.size == 0) return undefined;
			//All of them are zero. Return a random one.
			const items = [...this._items.keys()];
			return items[Math.floor(this._rnd() * items.length)];
		}
		const val = this._rnd() * this._sum;
		let sum = 0.0;
		const entries = [...this._items.entries()];
		for (const [item, count] of entries) {
			sum += count;
			if (sum > val) return item;
		}
		return entries[entries.length][0];
	}
}

export const uniquePairs = <T>(arr : T[]) => arr.flatMap((item1 : T, index1 : number) => arr.flatMap((item2 : T, index2 : number) => (index1 > index2) ? [[item1,item2]] : []));

const randomCharSetNumbers = '0123456789';
const randomCharSetLetters = 'abcdef';
const randomCharSet = randomCharSetNumbers + randomCharSetLetters;

export const randomString = (length : number, rnd : RandomGenerator = Math.random, charSet : string = randomCharSet) : string => {
	let text = '';
	for (let i = 0; i < length; i++) {
		text += charSet.charAt(Math.floor(rnd() * charSet.length));
	}
	return text;
};

export function shuffleInPlace<T>(array : T[], rnd : RandomGenerator = Math.random) : T[] {
	let currentIndex = array.length;
	let randomIndex;

	while (currentIndex != 0) {
		randomIndex = Math.floor(rnd() * currentIndex);
		currentIndex--;
  
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
  
	return array;
}

export const idToTitle = (id = '') : string => {
	return id.split('_').join('-').split('-').map(w => (w[0] || '').toUpperCase() + w.substr(1).toLowerCase()).join(' ');
};

export const deepFreeze = (obj : object) : void => {
	if (!obj) return;
	if (typeof obj != 'object') return;
	Object.freeze(obj);
	for (const val of Object.values(obj)) {
		deepFreeze(val);
	}
};

//Only works for POJOs
export function deepCopy<T extends object>(obj : T) : T {
	return JSON.parse(JSON.stringify(obj));
}

const IS_STEP_EPSILON = 0.0000001;

export const isStep = (value : number, step : number) : boolean => {
	const remainder = value / step;
	const nonIntegerRemainder = Math.abs(remainder - (Math.round(remainder)));
	return nonIntegerRemainder < IS_STEP_EPSILON;
};

export const DELETE_SENTINEL = {DELETE:true};
export const DEFAULT_SENTINEL = {default: true};

//path is a dotted list of accessors in the object, returns a new object with
//the modifications. If value is DELETE_SENTINEL then it will delete the implied
//property.
export const setPropertyInObject = <T extends OptionValueMap | SimulationConfig>(obj : T, path : OptionsPath, value : OptionValue) : T => {
	const result = setPropertyInObjectInner(obj, path, value) as T;
	return result;
};

const setPropertyInObjectInner = <T extends OptionValueMap | SimulationConfig>(objIn : T, path : OptionsPath, value : OptionValue) : OptionValue | SimulationConfig => {
	if (path == '') return value;
	const pathParts = path.split('.');
	let firstPart : number | string = pathParts[0];
	let obj : OptionValue | SimulationConfig = objIn;
	if (obj === undefined || obj === null) {
		if (path == '') return undefined;
		//Create an array or an object based on if they key is a number
		obj = isNaN(parseInt(firstPart)) ? {} : [];
	}

	const restParts = pathParts.slice(1);
	const innerResult = setPropertyInObjectInner(obj[firstPart], restParts.join('.'), value) as OptionValue;
	if (Array.isArray(obj)){
		firstPart = parseInt(firstPart);
		const result = [...obj];
		if (value === DELETE_SENTINEL && restParts.length == 0) {
			result.splice(firstPart, 1);
		} else {
			result[firstPart] = innerResult;
		}
		return result;
	}
	if (value === DELETE_SENTINEL && restParts.length == 0) {
		const result = {...obj};
		delete result[firstPart];
		return result;
	}
	return {...obj, [firstPart]: innerResult};
};

export const parseHash = (hash : string) : {[arg : string] : string} => {
	if (hash.startsWith('#')) hash = hash.substring(1);
	const args : {[arg : string] : string} = {};
	if (!hash) return args;
	for (const part of hash.split('&')) {
		const [key, val] = part.split('=');
		args[key] = val;
	}
	return args;
};

const memoizedRendererMaps : {[name : SimulatorType] : WeakMap<FrameVisualization, BaseRenderer>} = {};

export const memoizedRenderer = (simulation : Simulation, frameVisualizer : FrameVisualization) : BaseRenderer => {
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
export const hash = (s : string) : number => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);

export const stringHash = (s : string) : string => Math.abs(hash(s)).toString(16);