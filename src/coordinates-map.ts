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

const circleIntersectsBounds = (center : Coordinates, radius : number, bounds : CoordinatesMapBounds) : boolean => {
	//From https://yal.cc/rectangle-circle-intersection-test/
	const deltaX = center.x - Math.max(bounds.x, Math.min(center.x, bounds.x + bounds.width));
	const deltaY = center.y - Math.max(bounds.y, Math.min(center.y, bounds.y + bounds.height));
	return (deltaX * deltaX + deltaY + deltaY) < (radius * radius);
};

const dataIsLeaf = (data : CoordinatesMapData) : data is CoordinatesMapDataLeaf => {
	return 'items' in data;
};

class CoordinatesMapBucket<T extends CoordinatesMapItem> {

	_map : CoordinatesMap<T>;
	_data : CoordinatesMapData;
	_bounds : CoordinatesMapBounds;
	_subBuckets : {
		upperLeft: CoordinatesMapBucket<T>,
		upperRight: CoordinatesMapBucket<T>,
		lowerLeft: CoordinatesMapBucket<T>,
		lowerRight: CoordinatesMapBucket<T>
	} | undefined;

	/**
	 * Note that data is owned and shuld be modified in place 
	 */
	constructor (map : CoordinatesMap<T>, data : CoordinatesMapData, bounds : CoordinatesMapBounds) {
		this._map = map;
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
				upperLeft: new CoordinatesMapBucket(this._map, this._data.upperLeft, upperLeftBounds),
				upperRight: new CoordinatesMapBucket(this._map, this._data.upperRight, upperRightBounds),
				lowerLeft: new CoordinatesMapBucket(this._map, this._data.lowerLeft, lowerLeftBounds),
				lowerRight: new CoordinatesMapBucket(this._map, this._data.lowerRight, lowerRightBounds)
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

	get items() : {[id : CoordinatesMapID] : true} {
		if (dataIsLeaf(this._data)) return this._data.items;
		return {
			...this._subBuckets.upperLeft.items,
			...this._subBuckets.upperRight.items,
			...this._subBuckets.lowerLeft.items,
			...this._subBuckets.lowerRight.items
		};
	}

	getLeafBucket(point : Coordinates) : CoordinatesMapBucket<T> {
		if (!pointWithinBounds(point, this.bounds)) throw new Error('Point is not within bounds');
		if (dataIsLeaf(this._data)) {
			return this;
		}
		const midPointX = this._subBuckets.lowerRight.bounds.x;
		const midPointY = this._subBuckets.lowerRight.bounds.y;
		if (point.x < midPointX) {
			if (point.y < midPointY) {
				return this._subBuckets.upperLeft.getLeafBucket(point);
			} else {
				return this._subBuckets.lowerLeft.getLeafBucket(point);
			}
		} else {
			if (point.y < midPointY) {
				return this._subBuckets.upperRight.getLeafBucket(point);
			} else {
				return this._subBuckets.lowerRight.getLeafBucket(point);
			}
		}
	}

	/**
	 * Gets all leaf buckets rooted through this bucket that intersction with
	 * the given circle at all. Returns an empty list if the point and radius
	 * don't intersect this bucket or sub-buckets.
	 *
	 * TODO: fix the bug where items in the map who have their own radius do not
	 * get returned here unless their centers are inside the circle. This will
	 * require potentially storing items in multiple buckets.
	 *
	 * @param point The center of the point
	 * @param radius The radius of the circle
	 */
	getLeafBuckets(point : Coordinates, radius : number): CoordinatesMapBucket<T>[] {
		if (!circleIntersectsBounds(point, radius, this.bounds)) return [];
		if (dataIsLeaf(this._data)) {
			return [this];
		}
		return [
			...this._subBuckets.upperLeft.getLeafBuckets(point, radius),
			...this._subBuckets.upperRight.getLeafBuckets(point, radius),
			...this._subBuckets.lowerLeft.getLeafBuckets(point, radius),
			...this._subBuckets.lowerRight.getLeafBuckets(point, radius)
		];
	}

	insertObject(obj : CoordinatesMapItem) {
		if (!dataIsLeaf(this._data)) throw new Error('insertObject is not supported on non-leaf');
		if (this._data.items[obj.id]) throw new Error('Object already existed in bucket');
		this._data.items[obj.id] = true;
	}

	updateObject(obj: CoordinatesMapItem) : boolean {
		if (!dataIsLeaf(this._data)) throw new Error('updateObject is not supported on non-leaf');
		const existingItem = this._map.items[obj.id];
		if (existingItem) {
			if (coordinatesMapItemExactlyEquivalent(existingItem, obj)) return false;
		}
		if (!pointWithinBounds(obj, this.bounds)) throw new Error('Item outside of bucket bounds');
		this._data.items[obj.id] = true;
		return true;
	}

	removeObject(obj : CoordinatesMapItem) : boolean {
		if (!dataIsLeaf(this._data)) throw new Error('removeObject is not supported on non-leaf');
		if (!this._data.items[obj.id]) return false;
		delete this._data.items[obj.id];
		return true;
	}
}

export class CoordinatesMap<T extends CoordinatesMapItem>{

	_rootBucket : CoordinatesMapBucket<T>;
	_fullItemsMap : {[id : CoordinatesMapID] : T};
	_bounds : CoordinatesMapBounds;
	_changesMade : boolean;

	constructor(items : T[], size: Size, data? : CoordinatesMapDataLeaf, ) {
		let insertItems = false;
		if (!data) {
			data = {
				items: {}
			};
			insertItems = true;
		}
		this._bounds = {
			width: size.width,
			height: size.height,
			x: 0,
			y: 0,
			includeRight: true,
			includeBottom: true
		};
		const fullItemsMap = Object.fromEntries(items.map(item => [item.id, {...item}]));
		this._fullItemsMap = fullItemsMap;
		this._rootBucket = new CoordinatesMapBucket(this, data, this.bounds);
		if (!insertItems && Object.keys(data.items).length != Object.keys(items).length) throw new Error('Items did not have same number of items as data passed in');
		for (const item of items) {
			if (!pointWithinBounds(item, this.bounds)) throw new Error('Item not within bounds');
			if (insertItems) {
				this.insertObject(item);
			}
		}
		
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

	get items() : {[id : CoordinatesMapID] : T} {
		return this._fullItemsMap;
	}

	/**
	 * Returns the position affiliated with this object in the map or null
	 */
	getPosition(obj : T) : Position {
		const radius = obj.radius || 0;
		return {
			x: obj.x || 0,
			y: obj.y || 0,
			width: radius * 2,
			height: radius * 2
		};
	}

	/**
	 * Inserts the given object into the map. Throws an error if it already exists.
	 * @param obj The object to insert
	 */
	insertObject(obj: T) {
		const coords = {
			x: obj.x || 0,
			y: obj.y || 0
		};
		const bucket = this._rootBucket.getLeafBucket(coords);
		bucket.insertObject(obj);
		this._fullItemsMap[obj.id] = obj;
		this._changesMade = true;
	}
  
	/**
	 * updateObject should be called to add items not yet in the map, or when
	 * any of their relevant properties (e.g. x,y, radius) might have changed.
	 * @param obj The object to add to the set.
	 */
	updateObject(obj: T) {
		//We use the fullItem to check which bucket it WAS in when we last saw it.
		const oldItem = this._fullItemsMap[obj.id];
		const oldCoords = {
			x: oldItem.x || 0,
			y : oldItem.y || 0
		};
		const newCoords = {
			x : obj.x || 0,
			y : obj.y || 0
		};
		const oldBucket = this._rootBucket.getLeafBucket(oldCoords);
		const newBucket = this._rootBucket.getLeafBucket(newCoords);
		if (oldBucket == newBucket) {
			// no change
			if (!newBucket.updateObject(obj)) return;
		} else {
			oldBucket.removeObject(obj);
			//Note: since oldBucket was a LeafBucket already, removeItem could
			//not have possibly made newBucket no longer valid. And in any case
			//newBucket could not have been contained in oldBucket.
			newBucket.insertObject(obj);
		}

		this._fullItemsMap[obj.id] = {...obj};
		this._changesMade = true;
	}

	removeObject(obj : T) {
		const coords = {
			x: obj.x || 0,
			y : obj.y || 0
		};
		const bucket = this._rootBucket.getLeafBucket(coords);
		if (!bucket.removeObject(obj)) {
			const id = obj.id;
			if (this._fullItemsMap[obj.id]) throw new Error(`Object ${id} was not in the expected bucket but did exist`);
			return;
		}
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
		const coord = {x, y};
		if (!exclude) exclude = [];
		const excludeIDs = exclude.map(item => item.id);
		const result : Map<T, number> = new Map();
		//TODO: there is a serious bug with this; if there is an item just
		//beyond the searchRadius so in another physical bucket, it won't be
		//selected even if its own raidus might intersect with the search radius.
		for (const bucket of this._rootBucket.getLeafBuckets(coord, searchRadius)) {
			for (const id of Object.keys(bucket.items)) {
				const item = this._fullItemsMap[id];
				const itemCoords = {
					x: item.x || 0,
					y : item.y || 0
				};
				const dist = distance(coord, itemCoords);
				const radius = item.radius || 0.0;
				if (dist > (searchRadius + radius)) continue;
				if (excludeIDs.some(excludeItem => excludeItem == id)) continue;
				result.set(item, dist);
			}
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

export const _TESTING = {
	circleIntersectsBounds
} as const;