import {
	Coordinates
} from './types.js';

//CoordinatesID are considered equal if they have the same id
type CoordinatesID = {id: string, radius? : number} & Coordinates;

type CoordinatesMapFrameData = {
	format: 'flat';
	items : {[id : string]: Required<CoordinatesID>};
};

const coordinatesIDEquivalent = (one: CoordinatesID, two: CoordinatesID) : boolean => {
	if (one == two) return true;
	if (!one || !two) return false;
	return one.id == two.id;
};

const coordinatesIDExactlyEquivalent = (one : CoordinatesID, two : CoordinatesID) : boolean => {
	if (one == two) return true;
	if (!one || !two) return false;
	if (one.id != two.id) return false;
	if (one.x != two.x) return false;
	if (one.y != two.y) return false;
	if (one.radius != two.radius) return false;
	return true;
};

const distance = (one : Coordinates, two : Coordinates) : number => {
	if (!one || !two) return 0.0;
	return Math.sqrt(Math.pow(two.x - one.x, 2) + Math.pow(two.y - one.y, 2));
};

const coordinatesIDRecord = (input : CoordinatesID) : Required<CoordinatesID> => {
	return {
		id: input.id,
		x: input.x,
		y: input.y,
		radius: input.radius || 0
	};
};

export class CoordinatesMap<T extends CoordinatesID>{

	_itemsMap : {[id : string] : Required<CoordinatesID>};
	_fullItemsMap : {[id : string] : T};

	constructor(items : T[]) {
		this._itemsMap = Object.fromEntries(items.map(item => [item.id, coordinatesIDRecord(item)]));
		this._fullItemsMap = Object.fromEntries(items.map(item => [item.id, item]));
	}

	//How to load up a PositionMap based on frameData. Should be memoized with a weakmap of FrameData.
	//fullItems may include items that were never in map, as long as it's a superset.
	static fromFrameData<F extends CoordinatesID>(frameData : CoordinatesMapFrameData, fullItems : F[]) : CoordinatesMap<F> {
		//TODO: memoize based on a weak map
		if (frameData.format != 'flat') throw new Error('Unsupported FrameData format: ' + frameData.format);
		const itemsMap = Object.fromEntries(fullItems.map(item => [item.id, item]));
		const expandedItems : F[] = Object.keys(frameData.items).map(id => itemsMap[id]);
		return new CoordinatesMap<F>(expandedItems);
	}

	//Suitable to be stored in a property of a frame
	toFrameData() : CoordinatesMapFrameData {
		return {
			format: 'flat',
			items:{...this._itemsMap}
		};
	}
  
	/**
	 * updateObject should be called to add items not yet in the map, or when
	 * any of their relevant properties (e.g. x,y, radius) might have changed.
	 * @param obj The object to add to the set.
	 */
	updateObject(obj: T) {
		const existingItem = this._itemsMap[obj.id];
		if (existingItem) {
			if (coordinatesIDExactlyEquivalent(existingItem, obj)) return;
		}
		this._fullItemsMap[obj.id] = obj;
		this._itemsMap[obj.id] = coordinatesIDRecord(obj);
	}

	removeObject(obj : T) {
		delete this._itemsMap[obj.id];
		delete this._fullItemsMap[obj.id];
	}
  
	//Will automatically exclude itself in results for the first varient
	//the map is the object to distance from the start of search.
	getObjects(obj : T, searchRadius : number) : Map<T, number>
	getObjects(x : number, y : number, searchRadius: number, exclude? : T[]) : Map<T, number>
	getObjects(xOrObj : number | T, yOrSearchRadius: number, searchRadius?: number, exclude? : T[]) : Map<T, number> {
		if (typeof xOrObj != 'number') {
			return this.getObjects(xOrObj.x, xOrObj.y, searchRadius, [xOrObj]);
		}
		const x = xOrObj;
		const y = yOrSearchRadius;
		const coord = {
			x,
			y
		};
		if (!exclude) exclude = [];
		const result = new Map<T, number>();
		for (const item of Object.values(this._itemsMap)) {
			const dist = distance(coord, item);
			const radius = item.radius || 0.0;
			if (dist > (searchRadius - radius)) continue;
			if (exclude.some(excludeItem => coordinatesIDEquivalent(excludeItem, item))) continue;
			result.set(this._fullItemsMap[item.id], dist);
		}
		return result;
	}

	getAllObjects() : T[] {
		return Object.values(this._fullItemsMap);
	}
}