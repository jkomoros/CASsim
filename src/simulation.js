
//A string or "" to request gif output include this frame. Only frames that explicitly include this will be outputed.
//Duplicated in screenshot.js
export const GIF_COMMAND = 'gif';

export const Simulation = class {
	constructor(config) {
		const arr = [];
		for (let i = 0; i < config.runs; i++) {
			arr.push({
				frames: [
					{},
				],
			});
		}
		this._runs = arr;
	}

	get runs() {
		return this._runs;
	}
};