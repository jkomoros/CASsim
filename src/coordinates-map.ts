import {
	Coordinates,
	CoordinatesMapItem,
	Position,
	CoordinatesMapDataLeaf,
	Size,
	CoordinatesMapID
} from './types.js';

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

const itemWithinBounds = (item : CoordinatesMapItem, bounds : Position) : boolean => {
	if (item.x < bounds.x) return false;
	if (item.y < bounds.y) return false;
	if (item.x > bounds.x + bounds.width) return false;
	if (item.y > bounds.y + bounds.height) return false;
	return true;
};

const coordinatesMapItemRecord = (input : CoordinatesMapItem) : Required<CoordinatesMapItem> => {
	return {
		id: input.id,
		x: input.x || 0,
		y: input.y || 0,
		radius: input.radius || 0
	};
};

class CoordinatesMapDataController {

	_data : CoordinatesMapDataLeaf;

	constructor (data : CoordinatesMapDataLeaf) {
		this._data = data;
	}

	get bounds() : Position {
		return this._data.bounds;
	}

	get frameData() : CoordinatesMapDataLeaf {
		return this._data;
	}

	getPosition(obj : CoordinatesMapItem) : Position {
		if (!obj) return null;
		const mapObj = this._data.items[obj.id];
		if (!obj) return null;
		return {
			x: mapObj.x,
			y: mapObj.y,
			width: mapObj.radius * 2,
			height: mapObj.radius * 2
		};
	}

	updateObject(obj: CoordinatesMapItem) : boolean {
		const existingItem = this._data.items[obj.id];
		if (existingItem) {
			if (coordinatesMapItemExactlyEquivalent(existingItem, obj)) return false;
		}
		if (!itemWithinBounds(obj, this.bounds)) throw new Error('Item outside of bucket bounds');
		this._data.items[obj.id] = coordinatesMapItemRecord(obj);
		return true;
	}

	removeObject(obj : CoordinatesMapItem) : boolean {
		if (!this._data.items[obj.id]) return false;
		delete this._data.items[obj.id];
		return true;
	}

	getObjects(x : number, y : number, searchRadius: number, exclude? : CoordinatesMapID[]) : Map<CoordinatesMapID, number> {
		const coord = {
			x,
			y
		};
		if (!exclude) exclude = [];
		const result = new Map<string, number>();
		for (const item of Object.values(this._data.items)) {
			const dist = distance(coord, item);
			const radius = item.radius || 0.0;
			if (dist > (searchRadius + radius)) continue;
			if (exclude.some(excludeItem => excludeItem == item.id)) continue;
			result.set(item.id, dist);
		}
		return result;
	}
}

export class CoordinatesMap<T extends CoordinatesMapItem>{

	_controller : CoordinatesMapDataController;
	_fullItemsMap : {[id : string] : T};
	_changesMade : boolean;

	constructor(items : T[], bounds: Size, data? : CoordinatesMapDataLeaf, ) {
		if (!data) {
			data = {
				bounds: {...bounds, x : 0, y : 0},
				items: Object.fromEntries(items.map(item => [item.id, coordinatesMapItemRecord(item)]))
			};
		}
		this._controller = new CoordinatesMapDataController(data);
		this._fullItemsMap = Object.fromEntries(items.map(item => [item.id, item]));
	}

	//How to load up a PositionMap based on frameData. Should be memoized with a weakmap of FrameData.
	//fullItems may include items that were never in map, as long as it's a superset.
	static fromFrameData<F extends CoordinatesMapItem>(frameData : CoordinatesMapDataLeaf, fullItems : F[]) : CoordinatesMap<F> {
		//TODO: memoize based on a weak map
		const itemsMap = Object.fromEntries(fullItems.map(item => [item.id, item]));
		const expandedItems : F[] = Object.keys(frameData.items).map(id => itemsMap[id]);
		return new CoordinatesMap<F>(expandedItems, frameData.bounds, frameData);
	}

	//Suitable to be stored in a property of a frame
	get frameData() : CoordinatesMapDataLeaf {
		return this._controller.frameData;
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

	get bounds() : Position {
		return this._controller.bounds;
	}

	/**
	 * Returns the position affiliated with this object in the map or null
	 */
	getPosition(obj : T) : Position {
		return this._controller.getPosition(obj);
	}
  
	/**
	 * updateObject should be called to add items not yet in the map, or when
	 * any of their relevant properties (e.g. x,y, radius) might have changed.
	 * @param obj The object to add to the set.
	 */
	updateObject(obj: T) {
		if (!itemWithinBounds(obj, this.bounds)) throw new Error('Obj is outside of bounds');
		if (!this._controller.updateObject(obj)) return;
		this._fullItemsMap[obj.id] = obj;
		this._changesMade = true;
	}

	removeObject(obj : T) {
		if (!this._controller.removeObject(obj)) return;
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
		if (!exclude) exclude = [];
		const idMap = this._controller.getObjects(x, y, searchRadius, exclude.map(item => item.id));
		return new Map([...idMap.entries()].map(entry => [this._fullItemsMap[entry[0]], entry[1]]));
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