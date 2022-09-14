import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { configIsConfig } from "../src/options.js";
import {
	OptionsConfig,
	OptionsConfigMap,
	OptionsConfigTypeInfo,
	OptionsConfigTypeInfoImport
} from "../src/types.js";

const SIMULATORS_DIR = 'src/simulators';
const TYPES_DIR = path.join(SIMULATORS_DIR, 'types');

const TYPES_SIMULATOR_FILE = path.join('src', 'types-simulator.GENERATED.ts');

const GENERATED_COMMENT = '//This file was generated by `npm run generate:types`';

//import filename to typeName
type ImportsMap = {[name: string]: string[]};

type ExtractedTypeInfo = {
	definition: TypeDefinition[]
	exported: boolean;
}

type ExtractedTypesMap = {[name : string]: ExtractedTypeInfo}

type baseTypeDefintion = {
	description?: string;
	optional?: boolean;
};

type ExtractedTypeDefinition = baseTypeDefintion & {
	value: string;
	definition: TypeDefinition;
	exported: boolean;
	type: 'extracted';
}

type SimpleTypeDefinition = baseTypeDefintion & {
	value: string;
	type: 'simple';
}

type ImportTypeDefinition = baseTypeDefintion & {
	value: string;
	import: string;
	type: 'import';
}

type MapTypeDefinition = baseTypeDefintion & {
	value: {
		[name : string]: TypeDefinition;
	};
	type: 'map';
}

type ArrayTypeDefinition = baseTypeDefintion & {
	value: TypeDefinition;
	type: 'array';
}

type TypeDefinition = SimpleTypeDefinition | ImportTypeDefinition | MapTypeDefinition | ArrayTypeDefinition | ExtractedTypeDefinition;

const typeInfoIsImported = (typeInfo : OptionsConfigTypeInfo) : typeInfo is OptionsConfigTypeInfoImport => {
	return 'import' in typeInfo;
};

const ensureGeneratedStubsExist = () : void => {
	if (!fs.existsSync(TYPES_SIMULATOR_FILE)) {
		const stubContent = `//TEMP stub file
${GENERATED_COMMENT}

import {
	RawSimulationConfigBase,
	RawSimulationConfigExtended,
	SimulatorType,
	OptionValueMap
} from './types.js';

type RawSimulationConfigCommon = {
	sim: SimulatorType;
	simOptions: OptionValueMap;
}

export type RawSimulationConfig = (RawSimulationConfigBase & RawSimulationConfigCommon) | (RawSimulationConfigExtended & RawSimulationConfigCommon);
`;
		console.log('Generating stub content for ' + TYPES_SIMULATOR_FILE);
		fs.writeFileSync(TYPES_SIMULATOR_FILE, stubContent);
	}
	const files = fs.readdirSync(SIMULATORS_DIR);
	for (const file of files) {
		const stats = fs.lstatSync(path.join(SIMULATORS_DIR, file));
		if (stats.isDirectory()) continue;
		if (!file.endsWith('.ts')) continue;
		if (file.endsWith('.d.ts')) continue;
		const simulatorName = path.basename(file, '.ts');
		if (fs.existsSync(path.join(TYPES_DIR, simulatorName + '.ts'))) continue;
		if (fs.existsSync(path.join(TYPES_DIR, simulatorName + '.GENERATED.ts'))) continue;
		const stubContents = `//TEMP stub file
${GENERATED_COMMENT}
export type ${camelCaseSimulatorName(simulatorName)}SimOptions = any;
`;
		console.log('Generating stub content for ' + simulatorName);
		fs.writeFileSync(path.join(TYPES_DIR, simulatorName + '.GENERATED.ts'), stubContents);
	}
};

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
	generateTypesSimulator();
};

const generateTypesSimulator = () : void =>  {
	const files = fs.readdirSync(TYPES_DIR);

	let filePrefix = `${GENERATED_COMMENT}

//All of these exports are also re-exported from src/types.ts, so you should import them from there.

import {
	RawSimulationConfigBase,
	RawSimulationConfigExtended
} from './types.js';

`;

	let fileMain ='';

	const simulatorNamesCamelCased : string[] = [];

	for (const file of files) {
		if (!file.endsWith('.ts')) continue;
		if (file.endsWith('.d.ts')) continue;
		const simulatorName = file.split('.')[0];
		const simulatorNameCamelCased = camelCaseSimulatorName(simulatorName);
		simulatorNamesCamelCased.push(simulatorNameCamelCased);
		const generated = file.includes('.GENERATED.');
		const importFile = './simulators/types/' + simulatorName + (generated ? '.GENERATED' : '') + '.js';
		filePrefix += `import {
	${simulatorNameCamelCased}SimOptions
} from '${importFile}';

`;
		fileMain += `interface ${simulatorNameCamelCased}SimulationConfigExtra {
	sim: '${simulatorName}';
	simOptions: ${simulatorNameCamelCased}SimOptions | null;
}

type ${simulatorNameCamelCased}RawSimulationConfig = (RawSimulationConfigBase & ${simulatorNameCamelCased}SimulationConfigExtra) | (RawSimulationConfigExtended & ${simulatorNameCamelCased}SimulationConfigExtra);
		
`;
	}

	const fileSuffix = 'export type RawSimulationConfig = ' + simulatorNamesCamelCased.map(name => name + 'RawSimulationConfig').join(' | ') + ';';

	fs.writeFileSync(TYPES_SIMULATOR_FILE, filePrefix + fileMain + fileSuffix);
};

const camelCaseSimulatorName = (simulatorName : string) : string => {
	return simulatorName.split('-').map(piece => piece[0].toUpperCase() + piece.slice(1)).join('');
};

const createSimulatorTypeFile = (simulatorName : string, config : OptionsConfig | OptionsConfigMap) => {
	const fileName = path.join(TYPES_DIR, simulatorName + '.GENERATED.ts');
	const nonGeneratedFileName = path.join(TYPES_DIR, simulatorName + '.ts');
	//Certain files are done by hand and should be skipped, e.g. schelling-org.
	if (fs.existsSync(nonGeneratedFileName)) return;

	const fileContents = simulatorTypeFileContents(simulatorName, config, fileName);

	fs.writeFileSync(fileName, fileContents);
};

const combineImportsMap = (one :ImportsMap, two : ImportsMap) : ImportsMap => {
	if (Object.keys(one).length == 0) return two;
	if (Object.keys(two).length == 0) return one;
	const result = {...one};
	for (const [key, values] of Object.entries(two)) {
		if (result[key]) {
			for (const value of values) {
				if (!result[key].some(val => val == value)) result[key].push(value);
			}
			continue;
		}
		result[key] = [...values];
	}
	return result;
};

const extractImportsMap = (definition : TypeDefinition) : ImportsMap => {
	if (definition.type == 'simple' || definition.type == 'extracted') return {};
	if (definition.type == 'array') return extractImportsMap(definition.value);
	if (definition.type == 'map') {
		let result : ImportsMap = {};
		for (const value of Object.values(definition.value)) {
			const newMap = extractImportsMap(value);
			result = combineImportsMap(result, newMap);
		}
		return result;
	}
	if (definition.type == 'import') {
		return  {
			[definition.import]: [definition.value]
		};
	}
	const _exhaustiveCheck : never = definition;
	return _exhaustiveCheck;
};

const combineExtractedTypeInfo = (a : ExtractedTypeInfo, b : ExtractedTypeInfo) : ExtractedTypeInfo => {
	if (!a) return b;
	if (!b) return a;
	return {
		definition: [...a.definition, ...b.definition],
		exported: a.exported || b.exported
	};
};

const extractExtractedTypesMap = (definition : TypeDefinition) : ExtractedTypesMap => {
	if (definition.type == 'simple' || definition.type == 'import') return {};
	if (definition.type == 'array') return extractExtractedTypesMap(definition.value);
	if (definition.type == 'map') {
		const result : ExtractedTypesMap = {};
		for (const value of Object.values(definition.value)) {
			const newMap = extractExtractedTypesMap(value);
			for (const [name, typeInfo] of Object.entries(newMap)) {
				result[name] = combineExtractedTypeInfo(result[name], typeInfo);
			}
		}
		return result;
	}
	if (definition.type == 'extracted') {
		const subResults = extractExtractedTypesMap(definition.definition);
		const newExtracedTypeInfo = combineExtractedTypeInfo(subResults[definition.value], {definition: [definition.definition], exported: definition.exported});
		return {...subResults, [definition.value]: newExtracedTypeInfo};
	}
	const _exhaustiveCheck : never = definition;
	return _exhaustiveCheck;
};

export const simulatorTypeFileContents = (simulatorName : string, config : OptionsConfig | OptionsConfigMap, fileName : string) => {
	const prettySimulatorName = camelCaseSimulatorName(simulatorName);
	const simOptionsName = prettySimulatorName + 'SimOptions';

	const mainType = typescriptTypeForOptionsConfig(config);
	const renderedType = renderTypeDefinition(mainType);
	const imports = extractImportsMap(mainType);
	const importsContent = Object.entries(imports).map((entry : [string, string[]]) : string => {
		const names = entry[1];
		const importString = entry[0];
		//Not sure why path.relative has an extra '..' at the front... but remove it :shrug:
		const relativeImportString = path.relative(fileName, importString).split('/').slice(1).join('/');
		return `import {
	${names.join(',\n\t')}
} from '${relativeImportString}';`;
	}).join('\n\n');

	const extractedTypesMap = extractExtractedTypesMap(mainType);
	const extractedTypesContent = Object.entries(extractedTypesMap).map((entry) : string => {
		const name = entry[0];
		const typeInfo = entry[1];
		const renderedSubType = renderMultipleTypeDefinitions(typeInfo.definition);
		return (typeInfo.exported ? 'export ' : '' ) + `type ${name} = ${renderedSubType}`;
	}).join('\n\n');

	//NOTE: if this fileContents is not legal, then `npm run start` will barf... which will mean that
	//future runs of `npm run generate:types` will be using old versions of the exported files.
	return GENERATED_COMMENT + (importsContent ? '\n\n' + importsContent : '') + (extractedTypesContent ? '\n\n' + extractedTypesContent : '') + '\n\nexport type ' + simOptionsName + ' = ' + renderedType;
};

//Returns a TypeDefinition like definition, but where any descriptions are removed and optional is marked true
//everywhere. This gives a canonical base type for purpose to comparing in renderMultipleTypeDefinitions.
const makeTypeDefinitionOptionalNoTypeDefinition = (definition : TypeDefinition) : TypeDefinition => {
	if (definition.type ==  'simple' || definition.type == 'import') {
		if (definition.description || !definition.optional) {
			return {
				...definition, 
				description : undefined, 
				optional: true
			};
		}
		return definition;
	}
	if (definition.type == 'array') {
		const newValue = makeTypeDefinitionOptionalNoTypeDefinition(definition.value);
		if (newValue != definition.value || definition.description || !definition.optional) {
			return {
				...definition, 
				description: undefined, 
				optional: true, 
				value: newValue
			};
		}
		return definition;
	}
	if (definition.type == 'map') {
		const newValue : {[name : string] : TypeDefinition} = {};
		let changesMade = false;
		for (const [name, subDefinition] of Object.entries(definition.value)) {
			const newSubDefinition = makeTypeDefinitionOptionalNoTypeDefinition(subDefinition);
			if (newSubDefinition != subDefinition) changesMade = true;
			newValue[name] = newSubDefinition;
		}
		if (changesMade || definition.description || !definition.optional) {
			return {
				...definition,
				description: undefined,
				optional: true,
				value: newValue
			};
		}
		return definition;
	}
	if (definition.type == 'extracted') {
		const newDefinition = makeTypeDefinitionOptionalNoTypeDefinition(definition.definition);
		if (newDefinition != definition.definition || definition.description || !definition.optional) {
			return {
				...definition, 
				description: undefined, 
				optional: true, 
				definition: newDefinition
			};
		}
		return definition;
	}
	const _exhaustiveCheck : never = definition;
	return _exhaustiveCheck;
};

//Combines any typeDefinitions that are basically equivalent. Not to be confused
//with the confusingly named mergeNearDuplicateTypeDefinitions, which takes a
//subset known to be roughly equivalent.
const combineNearDuplicateTypeDefinitions = (definitions : TypeDefinition[]) : TypeDefinition[] => {
	const map : {[content : string] : TypeDefinition[]} = {};
	for (const definition of definitions) {
		const normalizedDefinition = makeTypeDefinitionOptionalNoTypeDefinition(definition);
		const renderedType = renderTypeDefinition(normalizedDefinition);
		if (map[renderedType]) {
			map[renderedType].push(definition);
		} else {
			map[renderedType] = [definition];
		}
	}
	return Object.values(map).map(definitions => mergeNearDuplicateTypeDefinitions(definitions));
};

const mergeNearDuplicateTypeDefinitions = (nearDuplicateDefinitions : TypeDefinition[]) : TypeDefinition => {
	//nearDuplicateDefinitions should be ones that canonicalize to the same normalizedDefinition, as 
	//idenfitied by combineNearDuplicateTypeDefinitions

	//Handle the base cases
	if (nearDuplicateDefinitions.length == 0) return null;
	if (nearDuplicateDefinitions.length == 1) return nearDuplicateDefinitions[0];

	//The type definitions are known to have effectively the same shape, modulo optional / description
	const demoDefinition = nearDuplicateDefinitions[0];

	//Even if there is no description for any and it gets set to 'undefined' that is fine
	const description = nearDuplicateDefinitions.map(definition => definition.description || '').filter(description => description)[0];
	const optional = nearDuplicateDefinitions.map(definition => definition.optional).some(optional => optional);

	if (demoDefinition.type == 'simple' || demoDefinition.type == 'import') {
		return {
			...demoDefinition,
			description,
			optional
		};
	}

	if (demoDefinition.type == 'array') {
		return {
			...demoDefinition,
			value: mergeNearDuplicateTypeDefinitions(nearDuplicateDefinitions.map((definition : ArrayTypeDefinition) => definition.value)),
			description,
			optional
		};
	}

	if (demoDefinition.type == 'map') {
		const merged : {[name : string] : TypeDefinition} = {};
		for (const name of Object.keys(demoDefinition.value)) {
			merged[name] = mergeNearDuplicateTypeDefinitions(nearDuplicateDefinitions.map((definition : MapTypeDefinition) => definition.value[name]));
		}
		return {
			...demoDefinition,
			value: merged,
			description,
			optional
		};
	}

	if (demoDefinition.type == 'extracted') {
		return {
			...demoDefinition,
			definition: mergeNearDuplicateTypeDefinitions(nearDuplicateDefinitions.map((definition : ExtractedTypeDefinition) => definition.definition)),
			description,
			optional
		};
	}

	const _exhaustiveCheck : never = demoDefinition;
	return _exhaustiveCheck;
};

//Renders out multiple type definitions as a union, skipping any duplicate keys;
const renderMultipleTypeDefinitions = (definitions : TypeDefinition[]) : string => {
	const result : {[content : string] : true} = {};
	for (const definition of combineNearDuplicateTypeDefinitions(definitions)) {
		//Remember that renderedSubType will end in a ';'
		const renderedSubType = renderTypeDefinition(definition);
		if (result[renderedSubType]) continue;
		result[renderedSubType] = true;
	}
	return Object.keys(result).map(content => content.slice(0, content.length - 1)).join(' | ') + ';';
};

const renderTypeDefinition = (definition : TypeDefinition, indent = '') : string => {
	if (definition.type == 'simple' || definition.type == 'import' || definition.type == 'extracted') {
		return definition.value + ';';
	}
	if (definition.type == 'array') {
		let subDefinition = renderTypeDefinition(definition.value, indent);
		//Remove the ';' at end
		subDefinition = subDefinition.slice(0,subDefinition.length - 1);
		if (definition.value.optional) return '(' + subDefinition + ' | null)[];';
		return subDefinition + '[];';
	}
	if (definition.type == 'map') {
		const outputPieces = ['{'];
		for (const [key, subConfig] of Object.entries(definition.value)) {
			const extraIndent = indent + '\t';
			if (subConfig.description) outputPieces.push(extraIndent + '//' + subConfig.description);
			const piece = extraIndent + key + (subConfig.optional ? '?' : '') + ': ' + renderTypeDefinition(subConfig, extraIndent);
			outputPieces.push(piece);
		}
		outputPieces.push(indent + '};');
		return outputPieces.join('\n');
	}
	const _exhaustiveCheck : never = definition;
	return _exhaustiveCheck;
};

const typeScriptTypeForMap = (configMap : OptionsConfigMap, optional = false, description : string = undefined ) : TypeDefinition => {

	const result : MapTypeDefinition = {
		type: 'map',
		value: {},
		optional,
		description
	};

	for (const [key, subConfig] of Object.entries(configMap)) {
		result.value[key] = typescriptTypeForOptionsConfig(subConfig, subConfig.optional, subConfig.description);
	}
	return result;
};

const simpleTypeDefinition = (value : string, optional = false, description : string = undefined) : SimpleTypeDefinition => {
	return {
		type: 'simple',
		value,
		optional,
		description
	};
};

const typescriptTypeForOptionsConfig = (config : OptionsConfig | OptionsConfigMap, optional = false, description : string = undefined ) : TypeDefinition => {
	if (!configIsConfig(config)) {
		//Is a config map
		return typeScriptTypeForMap(config, optional, description);
	}
	if (config.typeInfo) {
		if (typeInfoIsImported(config.typeInfo)) {
			return {
				type: 'import',
				value: config.typeInfo.typeName,
				import: config.typeInfo.import,
				optional,
				description
			};
		}
		//An extracted case
		//Basically pretend like this config itself is re-run through as a new root but without typeInfo
		const modifiedConfig = Object.fromEntries(Object.entries(config).filter(entry => entry[0] != 'typeInfo'));
		return {
			type: 'extracted',
			value: config.typeInfo.typeName,
			definition: typescriptTypeForOptionsConfig(modifiedConfig),
			exported: config.typeInfo.exported ? true : false,
			optional,
			description
		};
	}
	const example = config.example;
	if (config.options) {
		const value = config.options.map(item => typeof item.value == 'string' ? '\'' + item.value + '\'' : item.value).join(' | ');
		return simpleTypeDefinition(value, optional, description);
	}
	if (typeof example != 'object') {
		//A simple case
		return simpleTypeDefinition(typeof example, optional, description);
	}
	if (Array.isArray(example)) {
		return {
			type: 'array',
			value: typescriptTypeForOptionsConfig(example[0], example[0].optional, example[0].description),
			optional,
			description
		};
	}
	return typeScriptTypeForMap(example, optional, description);
};

const extractOptionsConfigForSimulator = (simulatorName : string) : OptionsConfig => {
	const filePath = path.join(SIMULATORS_DIR, simulatorName + '.js');

	if (!fs.existsSync(filePath)) {
		console.warn(filePath + ' didn\'t exist as expected, because tsc has not been run. Run `npm run build` or `npm run start` and try again.\n\n');
		throw new Error('Typescript build output not run');
	}

	const baseFileContents = fs.readFileSync(filePath).toString();

	const lines : string[] = [];
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

const COMMAND_STUBS = 'stubs';
const COMMAND_FULL = 'full';

(async() => {

	const args = Object.fromEntries(process.argv.slice(2).map(item => [item, true]));

	//This is kind of a hack, but this will help us note if we're running in a
	//test context if these don't exist.
	if (!args[COMMAND_STUBS] && !args[COMMAND_FULL]) return;

	//If there are no .GENERATED. files, even stubs, then
	//extractOptionsConfigForSimulator might fail because it will have invalid
	//imports.
	ensureGeneratedStubsExist();

	if (!args[COMMAND_STUBS]) {
		processTypes();
	}

})();
