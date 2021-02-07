export const color = (arg) => {
	let r = 0;
	let g = 0;
	let b = 0;
	let a = 1.0;
	if (typeof arg == 'string') {
		if (arg.startsWith('#')) {
			arg = arg.slice(1);
			if (arg.length == 3) {
				arg = arg[0] + arg[0] + arg[1] + arg[1] + arg[2] + arg[2];
			}
			if (arg.length == 4) {
				arg = arg[0] + arg[0] + arg[1] + arg[1] + arg[2] + arg[2] + arg[3] + arg[3];
			}
			if (arg.length == 6) {
				arg = arg + 'FF';
			}
			r = parseInt(arg.slice(0,2), 16);
			g = parseInt(arg.slice(2,4), 16);
			b = parseInt(arg.slice(4,6), 16);
			a = parseInt(arg.slice(6), 16) / 255;
		} else {
			throw new Error("Unknown color type of string: " + arg);
		}
	} else if (Array.isArray(arg)) {
		if (arg.length == 3) {
			arg.push(1.0);
		}
		if (arg.length != 4) {
			throw new Error("Unknown array argument: " + arg);
		}
		[r,g,b,a] = arg;
	}
	const rgb = [r, g, b];
	const rgba = [r, g, b, a];
	const hexInner = [r.toString(16), g.toString(16), b.toString(16), Math.floor(a * 255).toString(16)].map(str => str.length == 1 ? '0' + str : str);
	const hex = ('#' + hexInner.join('')).toUpperCase();
	const rgbStr = 'rgb(' + r  + ',' + g + ',' + b + ')';
	const rgbaStr = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
	return {
		r,
		g,
		b,
		a,
		hex,
		rgb,
		rgba,
		rgbStr,
		rgbaStr,
	};
};