import {
	Coordinates,
	CoordinatesMapItem,
	Position,
	CoordinatesMapDataLeaf,
	Size,
	CoordinatesMapID,
	CoordinatesMapBounds,
	CoordinatesMapData
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

const pointWithinBounds = (pointOrItem : Coordinates | CoordinatesMapItem, bounds : CoordinatesMapBounds) : boolean => {
	const point = {
		x : pointOrItem.x || 0,
		y : pointOrItem.y || 0
	};

	if (point.x < bounds.x) return false;
	if (point.y < bounds.y) return false;

	const rightX = bounds.x + bounds.width;
	if (point.x > rightX) return false;
	if (!bounds.includeRight && point.x == rightX) return false;

	const bottomY = bounds.y + bounds.height;
	if (point.y > bottomY) return false;
	if (!bounds.includeBottom && point.y == bottomY) return false;

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

const dataIsLeaf = (data : CoordinatesMapData) : data is CoordinatesMapDataLeaf => {
	return 'items' in data;
};

class CoordinatesMapBucket {

	_data : CoordinatesMapData;
	_bounds : CoordinatesMapBounds;
	_subBuckets : {
		upperLeft: CoordinatesMapBucket,
		upperRight: CoordinatesMapBucket,
		lowerLeft: CoordinatesMapBucket,
		lowerRight: CoordinatesMapBucket
	} | undefined;

	/**
	 * Note that data is owned and shuld be modified in place 
	 */
	constructor (data : CoordinatesMapData, bounds : CoordinatesMapBounds) {
		this._data = data;
		this._bounds = bounds;
		if (!dataIsLeaf(this._data)) {
			const halfWidth = bounds.width / 2;
			const halfHeight = bounds.height / 2;
			const upperLeftBounds : CoordinatesMapBounds = {
				x : bounds.x,
				y : bounds.y,
				width : halfWidth,
				height: halfHeight,
				includeBottom: false,
				includeRight: false
			};
			const upperRightBounds : CoordinatesMapBounds = {
				x : bounds.x + halfWidth,
				y : bounds.y,
				width : halfWidth,
				height: halfHeight,
				includeBottom: false,
				includeRight: bounds.includeRight
			};
			const lowerLeftBounds : CoordinatesMapBounds = {
				x: bounds.x,
				y: bounds.y + halfHeight,
				width: halfWidth,
				height: halfHeight,
				includeBottom: bounds.includeBottom,
				includeRight: false
			};
			const lowerRightBounds : CoordinatesMapBounds = {
				x: bounds.x + halfWidth,
				y: bounds.y + halfHeight,
				width: halfWidth,
				height: halfHeight,
				includeBottom: bounds.includeBottom,
				includeRight: bounds.includeRight
			};
			this._subBuckets = {
				upperLeft: new CoordinatesMapBucket(this._data.upperLeft, upperLeftBounds),
				upperRight: new CoordinatesMapBucket(this._data.upperRight, upperRightBounds),
				lowerLeft: new CoordinatesMapBucket(this._data.lowerLeft, lowerLeftBounds),
				lowerRight: new CoordinatesMapBucket(this._data.lowerRight, lowerRightBounds)
			};
		}
	}

	get bounds() : CoordinatesMapBounds {
		return this._bounds;
	}

	get frameData() : CoordinatesMapData {
		return this._data;
	}

	get isLeaf() : boolean {
		return dataIsLeaf(this._data);
	}

	getPosition(obj : CoordinatesMapItem) : Position {
		if (!obj) return null;
		if (!dataIsLeaf(this._data)) throw new Error('Meta bucket support not yet implemented');
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
		if (!dataIsLeaf(this._data)) throw new Error('Meta bucket support not yet implemented');
		const existingItem = this._data.items[obj.id];
		if (existingItem) {
			if (coordinatesMapItemExactlyEquivalent(existingItem, obj)) return false;
		}
		if (!pointWithinBounds(obj, this.bounds)) throw new Error('Item outside of bucket bounds');
		this._data.items[obj.id] = coordinatesMapItemRecord(obj);
		return true;
	}

	removeObject(obj : CoordinatesMapItem) : boolean {
		if (!dataIsLeaf(this._data)) throw new Error('Meta bucket support not yet implemented');
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
		if (!dataIsLeaf(this._data)) throw new Error('Meta bucket support not yet implemented');
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

	_rootBucket : CoordinatesMapBucket;
	_fullItemsMap : {[id : string] : T};
	_bounds : CoordinatesMapBounds;
	_changesMade : boolean;

	constructor(items : T[], size: Size, data? : CoordinatesMapDataLeaf, ) {
		if (!data) {
			data = {
				items: Object.fromEntries(items.map(item => [item.id, coordinatesMapItemRecord(item)]))
			};
		}
		this._bounds = {
			width: size.width,
			height: size.height,
			x: 0,
			y: 0,
			includeRight: true,
			includeBottom: true
		};
		const fullItemsMap = Object.fromEntries(items.map(item => [item.id, item]));
		if (Object.keys(data.items).length != Object.keys(items).length) throw new Error('Items did not have same number of items as data passed in');
		for (const item of Object.values(data.items)) {
			if (!pointWithinBounds(item, this.bounds)) throw new Error('Item not within bounds');
			const fullItem = fullItemsMap[item.id];
			if (fullItem.x !== item.x) throw new Error('Saved item differed in x');
			if (fullItem.y !== item.y) throw new Error('Saved item differed in y');
			if (fullItem.radius !== undefined && fullItem.radius !== item.radius) throw new Error('Saved item differed in radius');
		}
		this._rootBucket = new CoordinatesMapBucket(data, this.bounds);
		this._fullItemsMap = fullItemsMap;
	}

	//How to load up a PositionMap based on frameData. Should be memoized with a weakmap of FrameData.
	//fullItems may include items that were never in map, as long as it's a superset.
	static fromFrameData<F extends CoordinatesMapItem>(frameData : CoordinatesMapDataLeaf, size : Size, fullItems : F[]) : CoordinatesMap<F> {
		//TODO: memoize based on a weak map
		const itemsMap = Object.fromEntries(fullItems.map(item => [item.id, item]));
		const expandedItems : F[] = Object.keys(frameData.items).map(id => itemsMap[id]);
		return new CoordinatesMap<F>(expandedItems, size, frameData);
	}

	//Suitable to be stored in a property of a frame
	get frameData() : CoordinatesMapData {
		return this._rootBucket.frameData;
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

	get bounds() : CoordinatesMapBounds {
		return this._bounds;
	}

	/**
	 * Returns the position affiliated with this object in the map or null
	 */
	getPosition(obj : T) : Position {
		return this._rootBucket.getPosition(obj);
	}
  
	/**
	 * updateObject should be called to add items not yet in the map, or when
	 * any of their relevant properties (e.g. x,y, radius) might have changed.
	 * @param obj The object to add to the set.
	 */
	updateObject(obj: T) {
		if (!pointWithinBounds(obj, this.bounds)) throw new Error('Obj is outside of bounds');
		if (!this._rootBucket.updateObject(obj)) return;
		this._fullItemsMap[obj.id] = obj;
		this._changesMade = true;
	}

	removeObject(obj : T) {
		if (!this._rootBucket.removeObject(obj)) return;
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
		const idMap = this._rootBucket.getObjects(x, y, searchRadius, exclude.map(item => item.id));
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