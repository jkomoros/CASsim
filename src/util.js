export class Urn {
	constructor(rnd) {
		this._rnd = rnd;
		this._sum = 0.0;
		this._items = new Map();
	}

	add(item, count = 1) {
		this._sum += count;
		this._items.set(item, count);
	}

	pick() {
		const val = Math.floor(this._rnd.quick() * this._sum);
		let sum = 0.0;
		const entries = this._items.entries();
		for (let [item, count] of entries) {
			sum += count;
			if (sum > val) return item;
		}
		return entries[entries.length][0];
	}
}

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

export const shuffleArrayInPlace = (array, rnd) => {
	//based on the answer at https://stackoverflow.com/a/12646864
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(rnd.quick() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
};

//path is a dotted list of accessors in the object
export const setPropertyInObject = (obj, path, value) => {
	if (!obj) return undefined;
	return obj;
};