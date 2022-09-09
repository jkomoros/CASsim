import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { OptionsConfig } from "../src/types.js";

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
		const config = extractOptionsConfigForSimulator(file);
		//TODO: store this.
		console.log(file, config);
	}
};

const extractOptionsConfigForSimulator = (simulatorFile : string) : OptionsConfig => {
	const filePath = path.join(SIMULATORS_DIR, simulatorFile.split('.ts').join('.js'));
	const fileContents = `import Simulator from './${filePath}';

const sim = new Simulator();
console.log(sim.optionsConfig);`;

	const command = 'node --input-type=module';

	let output : string;
	try{
		output = execSync(command, {input: fileContents}).toString();
	} catch (err) {
		throw new Error(simulatorFile + ' failed: ' + err);
	}

	console.log(output);

	return null;
};

(async() => {
	clearTypesCacheDir();
	makeOptionsConfigCache();
})();
