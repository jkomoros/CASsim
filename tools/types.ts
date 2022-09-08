import * as fs from "fs";
import * as path from "path";

const SIMULATORS_DIR = 'src/simulators';
const TYPES_DIR = path.join(SIMULATORS_DIR, 'types');
const TYPES_CACHE_DIR = path.join(TYPES_DIR, 'cache');

const clearTypesCacheDir = () => {
	if (fs.existsSync(TYPES_CACHE_DIR)) {
		const files = fs.readdirSync(TYPES_CACHE_DIR);
		for (const file of files) {
			fs.unlinkSync(path.join(TYPES_CACHE_DIR, file));
		}
	} else {
		fs.mkdirSync(TYPES_CACHE_DIR);
	}
};

const makeOptionsConfigCache = () => {
	const files = fs.readdirSync(SIMULATORS_DIR);
	for (const file of files) {
		const stats = fs.lstatSync(path.join(SIMULATORS_DIR, file));
		if (stats.isDirectory()) continue;
		if (!file.endsWith('.ts')) continue;
		if (file.endsWith('.d.ts')) continue;
		console.log('Found ' + file);
	}
};

(async() => {
	clearTypesCacheDir();
	makeOptionsConfigCache();
})();
