import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { OptionsConfig } from "../src/types.js";

const SIMULATORS_DIR = 'src/simulators';

const processTypes = () => {
	const files = fs.readdirSync(SIMULATORS_DIR);
	for (const file of files) {
		const stats = fs.lstatSync(path.join(SIMULATORS_DIR, file));
		if (stats.isDirectory()) continue;
		if (!file.endsWith('.ts')) continue;
		if (file.endsWith('.d.ts')) continue;
		const config = extractOptionsConfigForSimulator(file);

		console.log(file, config);
	}
};

const extractOptionsConfigForSimulator = (simulatorFile : string) : OptionsConfig => {
	const filePath = path.join(SIMULATORS_DIR, path.basename(simulatorFile, '.ts') + '.js');

	const baseFileContents = fs.readFileSync(filePath).toString();

	const lines = [];
	let simulatorName = '';
	for (const line of baseFileContents.split('\n')) {
		if (!line.includes('export default')) {
			lines.push(line);
			continue;
		}
		simulatorName = line.split('export default').join('').split(';').join('').trim();
		break;
	}

	lines.push('const simulator = new ' + simulatorName + '();');
	lines.push('console.log(JSON.stringify(simulator.optionsConfig, null, "\t"));');

	const fileContents = lines.join('\n');

	const command = 'node --input-type=module';

	let output : string;
	try{
		output = execSync(command, {input: fileContents, cwd: SIMULATORS_DIR}).toString();
	} catch (err) {
		throw new Error(simulatorFile + ' failed: ' + err);
	}

	//TODO: error handle

	return JSON.parse(output) as OptionsConfig;

};

(async() => {
	processTypes();
})();
