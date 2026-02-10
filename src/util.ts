import { FrameVisualization } from './components/frame-visualization.js';
import { BaseRenderer } from './renderer.js';
import { Simulation } from './simulation.js';
import {
	Angle,
	ChartData,
	MovingObject,
	OptionsPath,
	OptionValue,
	OptionValueMap,
	RandomGenerator,
	SimulationConfig,
	SimulatorType,
	Size
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

export const ANGLE_MIN : Angle = 0.0;
export const ANGLE_MAX : Angle = Math.PI * 2;

export const normalizeAngle = (angle : Angle) : Angle => {
	while (angle >= ANGLE_MAX) angle -= ANGLE_MAX;
	while (angle < ANGLE_MIN) angle += ANGLE_MAX;
	return angle;
};

export const randomAngle = (rnd : RandomGenerator = Math.random) : Angle => {
	return (ANGLE_MAX - ANGLE_MIN) * rnd() + ANGLE_MIN;
};

export const flipAngleHorizontally = (angle : Angle) : Angle => {
	angle = normalizeAngle(angle);
	return (ANGLE_MAX / 2) - angle;
};

export const flipAngleVertically = (angle : Angle) : Angle => {
	angle = normalizeAngle(angle);
	return ANGLE_MAX - angle;
};

/**
 * angleDiff returns the shortest angular distance from fromAngle to toAngle,
 * accounting for wraparound. The result is in the range [-π, π], where:
 * - Positive values indicate counter-clockwise rotation
 * - Negative values indicate clockwise rotation
 *
 * Example:
 * - angleDiff(0, π/2) = π/2 (90° counter-clockwise)
 * - angleDiff(0, 3π/2) = -π/2 (90° clockwise, the shorter path)
 * - angleDiff(π/4, 7π/4) = -π/2 (not 3π/2)
 */
export const angleDiff = (fromAngle : Angle, toAngle : Angle) : Angle => {
	fromAngle = normalizeAngle(fromAngle);
	toAngle = normalizeAngle(toAngle);
	let diff = toAngle - fromAngle;
	// Normalize to [-π, π] to get the shortest path
	// When exactly at ±π, we prefer the positive (counter-clockwise) direction
	const epsilon = 1e-10;
	if (diff > Math.PI) {
		diff -= ANGLE_MAX;
	} else if (diff < -Math.PI + epsilon) {
		diff += ANGLE_MAX;
	}
	return diff;
};

/**
 *
 * newPosition takes a previous x,y, angle and speed, and possibly a Size
 * denoting the bounds of the stage, and returns a new x,y. If the simOptions is
 * provided then implicitly movements outside of the space will be reflected.
 *
 * angle will only possibly be different from the passed in angle if a Size is
 * provided
 *
 */
export function newPosition(previousX: number, previousY : number, angle : Angle, speed : number, size? : Size) : [x : number, y: number, angle : Angle];
export function newPosition(movingObject : MovingObject, size? : Size) : [x : number, y : number, angle : Angle];
export function newPosition(previousXOrMovingObject: number | MovingObject, previousYOrSize? : number | Size, angle? : Angle, speed? : number, size? : Size) : [x : number, y: number, angle : Angle] {
	let previousX : number;
	let previousY : number;
	if (typeof previousXOrMovingObject == 'number') {
		previousX = previousXOrMovingObject;
		if (typeof previousYOrSize != 'number') throw new Error('unexpected overload');
		previousY = previousYOrSize;
	} else {
		const movingObject = previousXOrMovingObject;
		previousX = movingObject.x;
		previousY = movingObject.y;
		angle = movingObject.angle;
		speed = movingObject.speed;
		if (typeof previousYOrSize == 'number') throw new Error('unexpected overload');
		size = previousYOrSize;
	}
	angle = normalizeAngle(angle);
	let x = previousX + (Math.cos(angle) * speed);
	let y = previousY + (Math.sin(angle) * speed);
	if (size) {
		if (x < 0) {
			//left
			x = Math.abs(x);
			angle = flipAngleHorizontally(angle);
		} else if(x > size.width) {
			//right
			x = size.width - (x - size.width);
			angle = flipAngleHorizontally(angle);
		}
		if (y < 0) {
			//up
			y = Math.abs(y);
			angle = flipAngleVertically(angle);
		} else if (y > size.height) {
			//down
			y = size.height - (y - size.height);
			angle = flipAngleVertically(angle);
		}
	}
	return [x, y, angle];
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

const setPropertyInObjectInner = <T extends OptionValueMap | OptionValue[] | SimulationConfig>(objIn : T, path : OptionsPath, value : OptionValue) : OptionValue | SimulationConfig => {
	if (path == '') return value;
	const pathParts = path.split('.');
	let firstPart : number | string = pathParts[0];
	let obj : OptionValue[] | OptionValueMap | SimulationConfig = objIn;
	if (obj === undefined || obj === null) {
		if (path == '') return undefined;
		//Create an array or an object based on if they key is a number
		obj = isNaN(parseInt(firstPart)) ? {} : [];
	}

	const restParts = pathParts.slice(1);
	const objMap = obj as OptionValueMap;
	const innerResult = setPropertyInObjectInner(objMap[firstPart] as OptionValueMap, restParts.join('.'), value) as OptionValueMap;
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
		const result = {...obj} as OptionValueMap;
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

const memoizedRendererMaps : {[name in SimulatorType] +? : WeakMap<FrameVisualization, BaseRenderer>} = {};

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

/**
 * Converts ChartData to CSV format
 * Returns a string with headers and data rows
 */
export const chartDataToCSV = (chartData : ChartData) : string => {
	if (!chartData || Object.keys(chartData).length === 0) {
		return '';
	}

	// Get all score config IDs (columns)
	const scoreIDs = Object.keys(chartData);

	// Determine the maximum frame count across all runs
	let maxFrames = 0;
	for (const items of Object.values(chartData)) {
		for (const item of items) {
			maxFrames = Math.max(maxFrames, item.data.length);
		}
	}

	// Build CSV header
	const headers = ['Frame'];
	for (const scoreID of scoreIDs) {
		const items = chartData[scoreID];
		if (items.length === 1) {
			// Single run: just use the title or ID
			headers.push(items[0].config.title || items[0].config.id);
		} else {
			// Multiple runs: append run number
			for (let runIdx = 0; runIdx < items.length; runIdx++) {
				headers.push(`${items[runIdx].config.title || items[runIdx].config.id} - Run ${runIdx}`);
			}
		}
	}

	// Build CSV rows
	const rows = [headers.join(',')];
	for (let frameIdx = 0; frameIdx < maxFrames; frameIdx++) {
		const row = [frameIdx.toString()];
		for (const scoreID of scoreIDs) {
			const items = chartData[scoreID];
			for (const item of items) {
				const value = frameIdx < item.data.length ? item.data[frameIdx] : '';
				row.push(value.toString());
			}
		}
		rows.push(row.join(','));
	}

	return rows.join('\n');
};

/**
 * Triggers a download of CSV data
 */
export const downloadCSV = (csvContent : string, filename : string) : void => {
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};