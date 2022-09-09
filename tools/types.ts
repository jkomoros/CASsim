import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { OptionsConfig } from "../src/types.js";

const SIMULATORS_DIR = 'src/simulators';
const TYPES_DIR = path.join(SIMULATORS_DIR, 'types');

const processTypes = () => {
	const files = fs.readdirSync(SIMULATORS_DIR);
	for (const file of files) {
		const stats = fs.lstatSync(path.join(SIMULATORS_DIR, file));
		if (stats.isDirectory()) continue;
		if (!file.endsWith('.ts')) continue;
		if (file.endsWith('.d.ts')) continue;
		const simulatorName = path.basename(file, '.ts');
		const config = extractOptionsConfigForSimulator(simulatorName);
		createSimulatorTypeFile(simulatorName, config);
	}
};

const camelCaseSimulatorName = (simulatorName : string) : string => {
	return simulatorName.split('-').map(piece => piece[0].toUpperCase() + piece.slice(1)).join('');
};

const createSimulatorTypeFile = (simulatorName : string, config : OptionsConfig) => {
	const fileName = path.join(TYPES_DIR, simulatorName + '.GENERATED.ts');
	const nonGeneratedFileName = path.join(TYPES_DIR, simulatorName + '.ts');
	//Certain files are done by hand and should be skipped, e.g. schelling-org.
	if (fs.existsSync(nonGeneratedFileName)) return;

	const prettySimulatorName = camelCaseSimulatorName(simulatorName);
	const simOptionsName = prettySimulatorName + 'SimOptions';

	//TODO: export real content
	const fileContents = 'export type ' + simOptionsName + ' = ' + JSON.stringify(config, null, '\t');

	fs.writeFileSync(fileName, fileContents);
};

const extractOptionsConfigForSimulator = (simulatorName : string) : OptionsConfig => {
	const filePath = path.join(SIMULATORS_DIR, simulatorName + '.js');

	const baseFileContents = fs.readFileSync(filePath).toString();

	const lines = [];
	let simulatorTypeName = '';
	for (const line of baseFileContents.split('\n')) {
		if (!line.includes('export default')) {
			lines.push(line);
			continue;
		}
		simulatorTypeName = line.split('export default').join('').split(';').join('').trim();
		break;
	}

	lines.push('const simulator = new ' + simulatorTypeName + '();');
	lines.push('console.log(JSON.stringify(simulator.optionsConfig, null, "\t"));');

	const fileContents = lines.join('\n');

	const command = 'node --input-type=module';

	let output : string;
	try{
		output = execSync(command, {input: fileContents, cwd: SIMULATORS_DIR}).toString();
	} catch (err) {
		throw new Error(simulatorName + ' failed: ' + err);
	}

	//TODO: error handle

	return JSON.parse(output) as OptionsConfig;

};

(async() => {
	processTypes();
})();
