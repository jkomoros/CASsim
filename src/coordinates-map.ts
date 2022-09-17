import {
	Coordinates
} from './types.js';

//CoordinatesID are considered equal if they have the same id
type CoordinatesID = {id: string, radius? : number} & Coordinates;

type FrameData<T extends Coordinates> = {
	format: 'flat';
	items : T[];
};

const coordinatesIDEquivalent = (one: CoordinatesID, two: CoordinatesID) : boolean => {
	if (one == two) return true;
	if (!one || !two) return false;
	return one.id == two.id;
};

const distance = (one : Coordinates, two : Coordinates) : number => {
	if (!one || !two) return 0.0;
	return Math.sqrt(Math.pow(two.x - one.x, 2) + Math.pow(two.y - one.y, 2));
};

export class CoordinatesMap<T extends CoordinatesID>{

	_items : T[]

	constructor(items : T[]) {
		this._items = items;
	}

	//How to load up a PositionMap based on frameData. Should be memoized with a weakmap of FrameData.
	static fromFrameData<F extends CoordinatesID>(frameData : FrameData<F>) : CoordinatesMap<F> {
		//TODO: memoize based on a weak map
		if (frameData.format != 'flat') throw new Error('Unsupported FrameData format: ' + frameData.format);
		return new CoordinatesMap(frameData.items);
	}

	//Suitable to be stored in a property of a frame
	toFrameData() : FrameData<T> {
		return {
			format: 'flat',
			items: [...this._items]
		};
	}
  
	//radius of more than 0 will occupy more space
	//TODO: add a radius? and also use radius of obj if provided.
	updateObject(obj: T) {
		if (this._items.some(item => coordinatesIDEquivalent(item, obj))) {
			this.removeObject(obj);
		}
		this._items.push(obj);
	}

	removeObject(obj : T) {
		this._items = this._items.filter(item => !coordinatesIDEquivalent(item, obj));
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
		for (const item of this._items) {
			const dist = distance(coord, item);
			if (dist > searchRadius) continue;
			if (exclude.some(excludeItem => coordinatesIDEquivalent(excludeItem, item))) continue;
			result.set(item, dist);
		}
		return result;
	}

	getAllObjects() : T[] {
		return [...this._items];
	}
}