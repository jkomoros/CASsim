import {
	Coordinates,
	CoordinatesMapItem,
	CoordinatesMapFrameData
} from './types.js';

const coordinatesMapItemEquivalent = (one: CoordinatesMapItem, two: CoordinatesMapItem) : boolean => {
	if (one == two) return true;
	if (!one || !two) return false;
	return one.id == two.id;
};

const coordinatesMapItemExactlyEquivalent = (one : CoordinatesMapItem, two : CoordinatesMapItem) : boolean => {
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

const coordinatesMapItemRecord = (input : CoordinatesMapItem) : Required<CoordinatesMapItem> => {
	return {
		id: input.id,
		x: input.x || 0,
		y: input.y || 0,
		radius: input.radius || 0
	};
};

export class CoordinatesMap<T extends CoordinatesMapItem>{

	_itemsMap : {[id : string] : Required<CoordinatesMapItem>};
	_fullItemsMap : {[id : string] : T};
	_changesMade : boolean;

	constructor(items : T[]) {
		this._itemsMap = Object.fromEntries(items.map(item => [item.id, coordinatesMapItemRecord(item)]));
		this._fullItemsMap = Object.fromEntries(items.map(item => [item.id, item]));
	}

	//How to load up a PositionMap based on frameData. Should be memoized with a weakmap of FrameData.
	//fullItems may include items that were never in map, as long as it's a superset.
	static fromFrameData<F extends CoordinatesMapItem>(frameData : CoordinatesMapFrameData, fullItems : F[]) : CoordinatesMap<F> {
		//TODO: memoize based on a weak map
		if (frameData.format != 'flat') throw new Error('Unsupported FrameData format: ' + frameData.format);
		const itemsMap = Object.fromEntries(fullItems.map(item => [item.id, item]));
		const expandedItems : F[] = Object.keys(frameData.items).map(id => itemsMap[id]);
		return new CoordinatesMap<F>(expandedItems);
	}

	//Suitable to be stored in a property of a frame
	get frameData() : CoordinatesMapFrameData {
		return {
			format: 'flat',
			items:{...this._itemsMap}
		};
	}

	/**
	 * Called after you have saved the item
	 */
	saved() : void {
		this._changesMade = false;
	}

	/**
	 * Returns true if updateObject or removeObject has been called (and was not
	 * a no-op) since the last time toFrameData was called.
	 */
	get changesMade() : boolean {
		return this._changesMade;
	}
  
	/**
	 * updateObject should be called to add items not yet in the map, or when
	 * any of their relevant properties (e.g. x,y, radius) might have changed.
	 * @param obj The object to add to the set.
	 */
	updateObject(obj: T) {
		const existingItem = this._itemsMap[obj.id];
		if (existingItem) {
			if (coordinatesMapItemExactlyEquivalent(existingItem, obj)) return;
		}
		this._fullItemsMap[obj.id] = obj;
		this._itemsMap[obj.id] = coordinatesMapItemRecord(obj);
		this._changesMade = true;
	}

	removeObject(obj : T) {
		if (!this._itemsMap[obj.id] && !this._fullItemsMap[obj.id]) return;
		delete this._itemsMap[obj.id];
		delete this._fullItemsMap[obj.id];
		this._changesMade = true;
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
			if (exclude.some(excludeItem => coordinatesMapItemEquivalent(excludeItem, item))) continue;
			result.set(this._fullItemsMap[item.id], dist);
		}
		return result;
	}

	getAllObjects() : T[] {
		return Object.values(this._fullItemsMap);
	}

	/**
	 * updateAllObjects goes through and calls updateObject on each object in
	 * allObjects, and removes any items currently in the map that are not also
	 * in allObjects.
	 * @param allObjects the set of all objects to update
	 */
	updateAllObjects(allObjects : T[]) : void {
		const unseenItemsMap = {...this._fullItemsMap};
		for (const obj of allObjects) {
			delete unseenItemsMap[obj.id];
			this.updateObject(obj);
		}
		for (const deletedItem of Object.values(unseenItemsMap)) {
			this.removeObject(deletedItem);
		}
	}
}