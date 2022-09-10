import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { OptionsConfig, OptionsConfigMap } from "../src/types.js";

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
	//TODO: for every file in simulators/types (including hte non-generated ones!) go through and generate types-simulator.GENERATED.ts
};

const camelCaseSimulatorName = (simulatorName : string) : string => {
	return simulatorName.split('-').map(piece => piece[0].toUpperCase() + piece.slice(1)).join('');
};

const EXAMPLE_PROPERTY_NAME = 'example';

//reimplemented from src/options.ts
export const configIsConfig = (config : OptionsConfig | OptionsConfigMap) : config is OptionsConfig => {
	return typeof config == 'object' && !Array.isArray(config) && config[EXAMPLE_PROPERTY_NAME] != undefined;
};

const createSimulatorTypeFile = (simulatorName : string, config : OptionsConfig | OptionsConfigMap) => {
	const fileName = path.join(TYPES_DIR, simulatorName + '.GENERATED.ts');
	const nonGeneratedFileName = path.join(TYPES_DIR, simulatorName + '.ts');
	//Certain files are done by hand and should be skipped, e.g. schelling-org.
	if (fs.existsSync(nonGeneratedFileName)) return;

	const prettySimulatorName = camelCaseSimulatorName(simulatorName);
	const simOptionsName = prettySimulatorName + 'SimOptions';

	const fileContents = 'export type ' + simOptionsName + ' = ' + typescriptTypeForOptionsConfig(config);

	fs.writeFileSync(fileName, fileContents);
};

const indentInnerPiece = (input : string) : string => {
	const pieces = input.split('\n');
	if (pieces.length == 1) return input;
	for (let i = 0; i < pieces.length - 1; i++) {
		pieces[i] = '\t' + pieces[i];
	}
	return pieces.join('\n');
};

const typeScriptTypeForMap = (configMap : OptionsConfigMap) : string => {
	const outputPieces = ['{'];
	for (const [key, subConfig] of Object.entries(configMap)) {
		const piece = '\t' + key + (subConfig.optional ? '?' : '') + ': ' + indentInnerPiece(typescriptTypeForOptionsConfig(subConfig));
		outputPieces.push(piece);
	}
	outputPieces.push('};');
	return outputPieces.join('\n');
};

const typescriptTypeForOptionsConfig = (config : OptionsConfig | OptionsConfigMap) : string => {
	if (!configIsConfig(config)) {
		//Is a config map
		return typeScriptTypeForMap(config);
	}
	const example = config.example;
	if (typeof example != 'object') {
		//A simple case
		return typeof example + ';';
	}
	//TODO: handle spacing problems in subObjects output.
	//TODO: handle options and enumerate them
	if (Array.isArray(example)) {
		const subConfig = example[0];
		let subDefinition = typescriptTypeForOptionsConfig(subConfig);
		subDefinition = subDefinition.split('\n').join('');
		//Replace all whitespace, including \t, to a single space;
		subDefinition = subDefinition.replace(/\s+/g, ' ');
		subDefinition = subDefinition.trim();
		//Cut off the last ';'
		subDefinition = subDefinition.slice(0,subDefinition.length - 1);
		if (subConfig.optional) return '(' + subDefinition + ' | null)[];';
		return subDefinition + '[];';
	}
	return typeScriptTypeForMap(example);
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

	return JSON.parse(output) as (OptionsConfig | OptionsConfigMap);

};

(async() => {
	processTypes();
})();
