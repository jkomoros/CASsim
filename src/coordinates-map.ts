import {
	Coordinates,
	CoordinatesMapItem,
	Position,
	CoordinatesMapDataLeaf,
	Size,
	CoordinatesMapID,
	CoordinatesMapBounds,
	CoordinatesMapData,
	CoordinatesMapDataMeta
} from './types.js';
import { deepCopy } from './util.js';

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

type CoordinatesMapBucket<T extends CoordinatesMapItem> = CoordinatesMapBucketLeaf<T> | CoordinatesMapBucketMeta<T>;

function makeCoordinatesMapBucket<T extends CoordinatesMapItem>(map : CoordinatesMap<T>, parent: CoordinatesMapBucketMeta<T> | null, data : CoordinatesMapData, bounds : CoordinatesMapBounds) : CoordinatesMapBucket<T> {
	return dataIsLeaf(data) ? new CoordinatesMapBucketLeaf(map, parent, data, bounds) : new CoordinatesMapBucketMeta(map, parent, data, bounds);
}

const numLeafItems = (data : CoordinatesMapData) : number => {
	if (dataIsLeaf(data)) return Object.keys(data.items).length;
	let result = 0;
	result += numLeafItems(data.upperLeft);
	result += numLeafItems(data.upperRight);
	result += numLeafItems(data.lowerLeft);
	result += numLeafItems(data.lowerRight);
	return result;
};

class CoordinatesMapBucketMeta<T extends CoordinatesMapItem> {

	_map : CoordinatesMap<T>;
	_data : CoordinatesMapDataMeta;
	_bounds : CoordinatesMapBounds;
	_parentBucket : CoordinatesMapBucketMeta<T> | null;
	_subBuckets : {
		upperLeft: CoordinatesMapBucket<T>,
		upperRight: CoordinatesMapBucket<T>,
		lowerLeft: CoordinatesMapBucket<T>,
		lowerRight: CoordinatesMapBucket<T>
	} | undefined;

	/**
	 * Note that data is owned and shuld be modified in place 
	 */
	constructor (map : CoordinatesMap<T>, parent: CoordinatesMapBucketMeta<T> | null, data : CoordinatesMapDataMeta, bounds : CoordinatesMapBounds) {
		this._map = map;
		this._data = deepCopy(data);
		this._bounds = bounds;
		this._parentBucket = parent;
		this._createSubBuckets();
	}

	_createSubBuckets() {
		const bounds = this._bounds;
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
			upperLeft: makeCoordinatesMapBucket(this._map, this, this._data.upperLeft, upperLeftBounds),
			upperRight: makeCoordinatesMapBucket(this._map, this, this._data.upperRight, upperRightBounds),
			lowerLeft: makeCoordinatesMapBucket(this._map, this, this._data.lowerLeft, lowerLeftBounds),
			lowerRight: makeCoordinatesMapBucket(this._map, this, this._data.lowerRight, lowerRightBounds)
		};
	}

	get bounds() : CoordinatesMapBounds {
		return this._bounds;
	}

	get frameData() : CoordinatesMapDataMeta {
		//TODO: ideally we'd keep object identity of the direct objects so we
		//wouldn't need to recreate them every time like this; this will lead to
		//lots of new objects being created in the actual frame for example
		return {
			upperLeft: this._subBuckets.upperLeft.frameData,
			upperRight: this._subBuckets.upperRight.frameData,
			lowerLeft: this._subBuckets.lowerLeft.frameData,
			lowerRight: this._subBuckets.lowerRight.frameData
		};
	}

	get isLeaf() : boolean {
		return false;
	}

	get items() : {[id : CoordinatesMapID] : true} {
		return {
			...this._subBuckets.upperLeft.items,
			...this._subBuckets.upperRight.items,
			...this._subBuckets.lowerLeft.items,
			...this._subBuckets.lowerRight.items
		};
	}

	get count() : number {
		let result = 0;
		result += this._subBuckets.upperLeft.count;
		result += this._subBuckets.upperRight.count;
		result += this._subBuckets.lowerLeft.count;
		result += this._subBuckets.lowerRight.count;
		return result;
	}

	getLeafBucket(point : Coordinates) : CoordinatesMapBucketLeaf<T> {
		if (!pointWithinBounds(point, this.bounds)) throw new Error('Point is not within bounds');
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
	getLeafBuckets(point : Coordinates, radius : number): CoordinatesMapBucketLeaf<T>[] {
		if (!circleIntersectsBounds(point, radius, this.bounds)) return [];
		return [
			...this._subBuckets.upperLeft.getLeafBuckets(point, radius),
			...this._subBuckets.upperRight.getLeafBuckets(point, radius),
			...this._subBuckets.lowerLeft.getLeafBuckets(point, radius),
			...this._subBuckets.lowerRight.getLeafBuckets(point, radius)
		];
	}

	//TODO: do comprehensive tests for multi-layered objects.

	combineIfNecessary() {
		if (this.count >= this._map._minBucketSize) return;
		const data = {
			items: {
				...this._subBuckets.upperLeft.items,
				...this._subBuckets.upperRight.items,
				...this._subBuckets.lowerLeft.items,
				...this._subBuckets.lowerRight.items
			}
		};
		const newBucket = new CoordinatesMapBucketLeaf(this._map, this._parentBucket, data, this._bounds);
		if (this._parentBucket) {
			this._parentBucket.replaceSubBucket(this, newBucket);
		} else {
			this._map._rootBucket = newBucket;
		}
	}

	replaceSubBucket(previousBucket : CoordinatesMapBucket<T>, newBucket : CoordinatesMapBucket<T>) {
		if (this._subBuckets.upperLeft == previousBucket) {
			this._subBuckets.upperLeft = newBucket;
			return;
		}
		if (this._subBuckets.upperRight == previousBucket) {
			this._subBuckets.upperRight = newBucket;
			return;
		}
		if (this._subBuckets.lowerLeft == previousBucket) {
			this._subBuckets.lowerLeft = newBucket;
			return;
		}
		if (this._subBuckets.lowerRight == previousBucket) {
			this._subBuckets.lowerRight = newBucket;
			return;
		}
		throw new Error('replaceSubBucket called with an invalid previous');
	}

}

class CoordinatesMapBucketLeaf<T extends CoordinatesMapItem> {

	_map : CoordinatesMap<T>;
	_data : CoordinatesMapDataLeaf;
	_bounds : CoordinatesMapBounds;
	_parentBucket : CoordinatesMapBucketMeta<T> | null;

	/**
	 * Note that data is owned and shuld be modified in place 
	 */
	constructor (map : CoordinatesMap<T>, parent: CoordinatesMapBucketMeta<T> | null, data : CoordinatesMapDataLeaf, bounds : CoordinatesMapBounds) {
		this._map = map;
		this._data = deepCopy(data);
		this._bounds = bounds;
		this._parentBucket = parent;
	}

	get bounds() : CoordinatesMapBounds {
		return this._bounds;
	}

	get frameData() : CoordinatesMapData {
		//TODO: ideally we'd keep object identity of the direct objects so we
		//wouldn't need to recreate them every time like this; this will lead to
		//lots of new objects being created in the actual frame for example
		return {
			items: this.items
		};
	}

	get isLeaf() : boolean {
		return true;
	}

	get items() : {[id : CoordinatesMapID] : true} {
		return this._data.items;
	}

	get count() : number {
		return Object.keys(this._data.items).length;
	}

	getLeafBucket(point : Coordinates) : CoordinatesMapBucketLeaf<T> {
		if (!pointWithinBounds(point, this.bounds)) throw new Error('Point is not within bounds');
		return this;
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
	getLeafBuckets(point : Coordinates, radius : number): CoordinatesMapBucketLeaf<T>[] {
		if (!circleIntersectsBounds(point, radius, this.bounds)) return [];
		return [this];
	}

	//TODO: do comprehensive tests for multi-layered objects.

	splitIfNecessary(lastInsertedObject : CoordinatesMapItem) {
		const itemCount = Object.keys(this._data.items).length;
		if (itemCount <= this._map._maxBucketSize) return;
		const items = this._data.items;
		const data = {
			upperLeft: {items: {}},
			upperRight: {items: {}},
			lowerLeft: {items: {}},
			lowerRight: {items: {}}
		};
		const newBucket = new CoordinatesMapBucketMeta(this._map, this._parentBucket, data, this._bounds);
		for (const id of Object.keys(items)) {
			let item : CoordinatesMapItem= this._map._fullItemsMap[id];
			//In the case where an item was just inserted and not yet in full
			//items map, item might be empty.
			if (!item && lastInsertedObject.id == id) item = lastInsertedObject;
			const coords = {
				x: item.x || 0,
				y: item.y || 0
			};
			const bucket = newBucket.getLeafBucket(coords);
			bucket.insertObject(item);
		}
		if (this._parentBucket) {
			this._parentBucket.replaceSubBucket(this, newBucket);
		} else {
			this._map._rootBucket = newBucket;
		}

	}

	insertObject(obj : CoordinatesMapItem) {
		if (this._data.items[obj.id]) throw new Error('Object already existed in bucket');
		this._data.items[obj.id] = true;
		this.splitIfNecessary(obj);
	}

	updateObject(obj: CoordinatesMapItem) : boolean {
		const existingItem = this._map.items[obj.id];
		if (existingItem) {
			if (coordinatesMapItemExactlyEquivalent(existingItem, obj)) return false;
		}
		if (!pointWithinBounds(obj, this.bounds)) throw new Error('Item outside of bucket bounds');
		this._data.items[obj.id] = true;
		if (!existingItem) {
			//This is effectively an insert
			this.splitIfNecessary(obj);
		}
		return true;
	}

	removeObject(obj : CoordinatesMapItem) : boolean {
		if (!this._data.items[obj.id]) return false;
		delete this._data.items[obj.id];
		if (this._parentBucket) this._parentBucket.combineIfNecessary();
		return true;
	}

	//TODO: allow a debug rendering of leaf boundaries
}

//The defulat size at which buckets go from a meta to a leaf, and vice versa.
//Note that these should typically be at least 1 different so that we minimize
//the chance of a update that is a remove/insert object thrashing (combining a
//bucket and then immediately splitting it)
//TODO: tune these based on real-world performance tests.
const DEFAULT_MIN_BUCKET_SIZE = 10;
const DEFAULT_MAX_BUCKET_SIZE = 16;

export class CoordinatesMap<T extends CoordinatesMapItem>{

	_rootBucket : CoordinatesMapBucket<T>;
	_fullItemsMap : {[id : CoordinatesMapID] : T};
	_bounds : CoordinatesMapBounds;
	_changesMade : boolean;
	_minBucketSize : number;
	_maxBucketSize : number;

	constructor(items : T[], size: Size, data? : CoordinatesMapDataLeaf, ) {
		//TODO: allow setting these, which might require a resize.
		this._minBucketSize = DEFAULT_MIN_BUCKET_SIZE;
		this._maxBucketSize = DEFAULT_MAX_BUCKET_SIZE;
		let insertItems = false;
		if (!items) items = [];
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
		this._rootBucket = makeCoordinatesMapBucket(this, null, data, this.bounds);
		if (!insertItems && numLeafItems(data) != Object.keys(items).length) throw new Error('Items did not have same number of items as data passed in');
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
		if (!oldItem) {
			this.insertObject(obj);
			return;
		}
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