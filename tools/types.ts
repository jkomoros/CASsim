import * as fs from "fs";
import * as path from "path";

const TYPES_CACHE_DIR = 'src/simulators/types/cache';

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

(async() => {
	clearTypesCacheDir();
})();
