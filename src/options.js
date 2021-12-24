export const SIM_PROPERTY = 'sim';
export const SIM_OPTIONS_PROPERTY = 'simOptions';

const EXAMPLE_PROPERTY_NAME = 'example';
const DESCRIPTION_PROPERTY_NAME = 'description';
const ADVANCED_PROPERTY_NAME = 'advanced';
const OPTIONAL_PROPERTY_NAME = 'optional';
const MIN_PROPERTY_NAME = 'min';
const MAX_PROPERTY_NAME = 'max';
const STEP_PROPERTY_NAME = 'step';
const OPTIONS_PROPERTY_NAME = 'options';
const BEHAVIOR_PROPERTY_NAME = 'behavior';
const VALUE_PROPERTY_NAME = 'value';
const DISPLAY_PROPERTY_NAME = 'display';
const SHORT_NAME_PROPERTY_NAME = 'shortName';

export const COLOR_BEHAVIOR_NAME = 'color';

const ALLOWED_BEHAVIOR_NAMES = {
	[COLOR_BEHAVIOR_NAME]: true,
};

import {
	DELETE_SENTINEL,
	DEFAULT_SENTINEL,
	isStep,
	setPropertyInObject,
	shadowedModificationsForSimIndex
} from './util.js';

//See README.md for more about the canonical shape of optionsLeaf objects.

export const configIsAdvanced = (config) => {
	return config && config[ADVANCED_PROPERTY_NAME];
};

//Returns a string describing the problem, or '' if no problem
export const optionsConfigValidator = (config) => {
	if (!config) return 'Config must be an object';
	//The top-level expectation is basically an object with examples.
	return optionsLeafValidator({
		[EXAMPLE_PROPERTY_NAME]: config,
	});
};

const shortNameForOptionsLeaf = (leaf) => {
	if (!leaf || typeof leaf != 'object') return '';
	//Only read out shortName on objects that are actually leafs
	if (leaf[EXAMPLE_PROPERTY_NAME] == undefined) return '';
	return leaf[SHORT_NAME_PROPERTY_NAME] || '';
};

const optionsLeafValidator = (config) => {
	if (!config || typeof config != 'object') return 'Config must be an object';
	const example = config[EXAMPLE_PROPERTY_NAME];
	if (example === undefined) {
		//It's a multi-level nested object I guess
		if (Object.keys(config).length == 0) return 'example is a required property';
		//shortNames also may not conflict with any non-short name
		const shortNameMap = Object.fromEntries(Object.keys(config).map(key => [key, true]));
		for (const [key, value] of Object.entries(config)) {
			const problem = optionsLeafValidator(value);
			if (problem) {
				return "sub-object of " + key + " didn't validate: " + problem;
			}
			const shortName = shortNameForOptionsLeaf(value);
			if (shortName) {
				if (shortNameMap[shortName]) {
					return "found duplicate shortName peer: " + shortName;
				}
				shortNameMap[shortName] = true;
			}
		}
	}
	if (typeof example == 'object') {
		if (Array.isArray(example)) {
			if (!example.length) {
				return 'example is an array but needs at least one property';
			}
			const problem = optionsLeafValidator(example[0]);
			if (problem) {
				return "example's array first item didn't validate: " + problem;
			}
		}
		//shortNames also may not conflict with any non-short name
		const shortNameMap = Object.fromEntries(Object.keys(example).map(key => [key, true]));
		for (const [key, value] of Object.entries(example)) {
			const problem = optionsLeafValidator(value);
			if (problem) {
				return "example's sub-object of " + key + " didn't validate: " + problem;
			}
			const shortName = shortNameForOptionsLeaf(value);
			if (shortName) {
				if (shortNameMap[shortName]) {
					return "found duplicate shortName peer: " + shortName;
				}
				shortNameMap[shortName] = true;
			}
		}
	}

	if (config[DESCRIPTION_PROPERTY_NAME] !== undefined && typeof config[DESCRIPTION_PROPERTY_NAME] != 'string') return DESCRIPTION_PROPERTY_NAME + ' must be a string if provided';
	if (config[OPTIONAL_PROPERTY_NAME] !== undefined && typeof config[OPTIONAL_PROPERTY_NAME] != 'boolean') return OPTIONAL_PROPERTY_NAME + ' must be a boolean if provided';
	if (config[ADVANCED_PROPERTY_NAME] !== undefined && typeof config[ADVANCED_PROPERTY_NAME] != 'boolean') return ADVANCED_PROPERTY_NAME + ' must be a boolean if provided';

	if (config[MIN_PROPERTY_NAME] !== undefined && typeof config[MIN_PROPERTY_NAME] != 'number') return MIN_PROPERTY_NAME + ' must be a number if provided';
	if (config[MAX_PROPERTY_NAME] !== undefined && typeof config[MAX_PROPERTY_NAME] != 'number') return MAX_PROPERTY_NAME + ' must be a number if provided';
	if (config[STEP_PROPERTY_NAME] !== undefined && typeof config[STEP_PROPERTY_NAME] != 'number') return STEP_PROPERTY_NAME + ' must be a number if provided';

	if (config[BEHAVIOR_PROPERTY_NAME] !== undefined && (typeof config[BEHAVIOR_PROPERTY_NAME] != 'string' || !ALLOWED_BEHAVIOR_NAMES[config[BEHAVIOR_PROPERTY_NAME]])) return BEHAVIOR_PROPERTY_NAME + ' was provided ' + config[BEHAVIOR_PROPERTY_NAME] + ' but only allows ' + Object.keys(ALLOWED_BEHAVIOR_NAMES).join(', ');

	if (config[SHORT_NAME_PROPERTY_NAME] !== undefined && typeof config[SHORT_NAME_PROPERTY_NAME] != 'string') return SHORT_NAME_PROPERTY_NAME + ' was provided but was not a string';
	if (config[SHORT_NAME_PROPERTY_NAME] !== undefined && !config[SHORT_NAME_PROPERTY_NAME]) return SHORT_NAME_PROPERTY_NAME + ' may not be the empty string';

	if (config[MIN_PROPERTY_NAME] !== undefined && config[MAX_PROPERTY_NAME] !== undefined && config[MIN_PROPERTY_NAME] > config[MAX_PROPERTY_NAME]) return 'max is less than min';
	if (typeof config[EXAMPLE_PROPERTY_NAME] !== 'number' && typeof config[EXAMPLE_PROPERTY_NAME] !== 'object' && !Array.isArray(config[EXAMPLE_PROPERTY_NAME])) {
		if (config[MIN_PROPERTY_NAME] !== undefined) return MIN_PROPERTY_NAME + ' may only be provided for numbers or array examples';
		if (config[MAX_PROPERTY_NAME] !== undefined) return MAX_PROPERTY_NAME + ' may only be provided for numbers or array examples';
		if (config[STEP_PROPERTY_NAME] !== undefined) return STEP_PROPERTY_NAME + ' may only be provided for numbers examples';
	}
	if (typeof config[EXAMPLE_PROPERTY_NAME] !== 'number' && config[STEP_PROPERTY_NAME]) return STEP_PROPERTY_NAME + ' may only be provided for number examples';
	if (config[OPTIONS_PROPERTY_NAME] !== undefined) {
		if (typeof config[OPTIONS_PROPERTY_NAME] !== 'object' || !Array.isArray(config[OPTIONS_PROPERTY_NAME])) return OPTIONS_PROPERTY_NAME + ' must be an array if provided';
		if (!config[OPTIONS_PROPERTY_NAME].length) return OPTIONS_PROPERTY_NAME + ' was an array without any options';
		for (const [i, value] of config[OPTIONS_PROPERTY_NAME].entries()) {
			if (value[VALUE_PROPERTY_NAME] === undefined) return 'option ' + i + ' did not have ' + VALUE_PROPERTY_NAME + ' provided';
			if (value[DISPLAY_PROPERTY_NAME] !== undefined && typeof value[DISPLAY_PROPERTY_NAME] !== 'string') return 'option ' + i + ' had a non string ' + DISPLAY_PROPERTY_NAME + ' provided';
			if (value[DESCRIPTION_PROPERTY_NAME] !== undefined && typeof value[DESCRIPTION_PROPERTY_NAME] !== 'string') return 'option ' + i + ' had a non string ' + DESCRIPTION_PROPERTY_NAME + ' provided';
		}
	}

	return '';
};

//Returns a string describing problems, or '' if no problems
export const configObjectIsValid = (optionsConfig, value) => {
	//Note: this is tested implicitly via tests for maySetPropertyInConfigObject 
	if (!optionsConfig) return 'no optionsConfig provided';
	const example = optionsConfig[EXAMPLE_PROPERTY_NAME];
	if (typeof value == 'object' && !example) {
		//This happens if it's a naked object. Verify each sub-property matches
		const seenKeys = {};
		for (const [valueKey, valueValue] of Object.entries(value)) {
			seenKeys[valueKey] = true;
			if (typeof optionsConfig !== 'object') return valueKey + ' still remained in path but no object';
			//recurse into sub-objects or array
			//Basic value recursion
			const problem = configObjectIsValid(optionsConfig[valueKey], valueValue);
			if (problem) {
				return valueKey + ': ' + problem;
			}
		}
		//Verify that if there were more keys expected to be there they are valid (i.e. they might be optional)
		for (const configKey of Object.keys(optionsConfig)) {
			if (seenKeys[configKey]) continue;
			const problem = configObjectIsValid(optionsConfig[configKey], value[configKey]);
			if (problem) {
				return configKey + ': ' + problem;
			} 
		}
		return '';
	}

	if (example == undefined) return 'No example provided';
	if (value == null && !optionsConfig[OPTIONAL_PROPERTY_NAME]) return 'value was null but ' + OPTIONAL_PROPERTY_NAME + ' was not set';
	//Base case. optionsConfig should be an optionLeaf.
	if (value != null && typeof example != typeof value) return 'Example was of type ' + typeof optionsConfig[EXAMPLE_PROPERTY_NAME] + ' but value was of type ' + typeof value;
	if (value && Array.isArray(example) != Array.isArray(value)) return 'Example was an array but value was not or vice versa';

	if (typeof example == 'object' && value) {
		if (Array.isArray(example)) {
			for (const [valueKey, valueValue] of value.entries()) {
				const problem = configObjectIsValid(example[0], valueValue);
				if (problem) {
					return valueKey + ': ' + problem;
				}
			}
		} else {
			const seenKeys = {};
			for (const [exampleKey, exampleValue] of Object.entries(example)) {
				seenKeys[exampleKey] = true;
				const problem = configObjectIsValid(exampleValue, value[exampleKey]);
				if (problem) {
					return exampleKey + ': ' + problem;
				}	
			}
			//Make sure we also check for any illegal keys not expected
			for (const valueKey of Object.keys(value)) {
				if (seenKeys[valueKey]) continue;
				return valueKey + ' existed but was not expected to be there in example';
			}
		}
	}
	if (optionsConfig[OPTIONS_PROPERTY_NAME] && value) {
		if (!optionsConfig[OPTIONS_PROPERTY_NAME].some(item => item.value == value)) return OPTIONS_PROPERTY_NAME + ' was set but the value ' + value + ' was not one of the allowed options';
	}
	if (typeof value == 'number') {
		if (optionsConfig[MIN_PROPERTY_NAME] !== undefined && optionsConfig[MIN_PROPERTY_NAME] > value) return MIN_PROPERTY_NAME + ' was set and the value was less than it';
		if (optionsConfig[MAX_PROPERTY_NAME] !== undefined && optionsConfig[MAX_PROPERTY_NAME] < value) return MAX_PROPERTY_NAME + ' was set and the value was more than it';
		if (optionsConfig[STEP_PROPERTY_NAME] !== undefined && !isStep(value, optionsConfig[STEP_PROPERTY_NAME])) return STEP_PROPERTY_NAME + ' was set but the value was not a multiple of it';
	}
	//Skip null values, we already checked above if it was OK they were null.
	if (typeof value == 'object'  && value && Array.isArray(value)) {
		if (optionsConfig[MIN_PROPERTY_NAME] !== undefined && optionsConfig[MIN_PROPERTY_NAME] > value.length) return MIN_PROPERTY_NAME + ' was set and the array value had a length less than it';
		if (optionsConfig[MAX_PROPERTY_NAME] !== undefined && optionsConfig[MAX_PROPERTY_NAME] < value.length) return MAX_PROPERTY_NAME + ' was set and the array value had a length more than it';
	}
	return '';
};

//Returns a string describing the problem, or an empty string if no problem
export const maySetPropertyInConfigObject = (optionsConfig, obj, path, value) => {
	const updatedObj = setPropertyInObject(obj, path, value);
	return configObjectIsValid(optionsConfig, updatedObj);
};

//if skipOptional is true then optional items will be skipped. Things that
//recurse into subObjects will have skipOptional true. This leads to behavior
//where the top-level item requested will be returned even if optional (which is
//useful for e.g. getting an optional value to add)
export const defaultValueForConfig = (optionsConfig, skipOptional) => {
	if (!optionsConfig) return undefined;
	const example = optionsConfig[EXAMPLE_PROPERTY_NAME];
	if (example == undefined) {
		return Object.fromEntries(Object.entries(optionsConfig).filter(entry => !entry[1][OPTIONAL_PROPERTY_NAME]).map(entry => [entry[0], defaultValueForConfig(entry[1], true)]).filter(entry => entry[1] !== undefined));
	}
	if (skipOptional && optionsConfig[OPTIONAL_PROPERTY_NAME]) return undefined;
	if (typeof example == 'object') {
		if (Array.isArray(example)) {
			if (optionsConfig[MIN_PROPERTY_NAME] == undefined) return [defaultValueForConfig(example[0], true)].filter(item => item !== undefined);
			const arr = [];
			const count = optionsConfig[MIN_PROPERTY_NAME] || 1;
			for (let i = 0; i < count; i++) {
				arr.push(defaultValueForConfig(example[0], true));
			}
			return arr;
		}
		return Object.fromEntries(Object.entries(example).filter(entry => !entry[1][OPTIONAL_PROPERTY_NAME]).map(entry => [entry[0], defaultValueForConfig(entry[1], true)]).filter(entry => entry[1] !== undefined));
	}
	return example;
};

//Returns a path like path, but with and valid shortNames replacing long names
export const shortenPathWithConfig = (optionsConfig, path) => {
	const parts = path.split('.');
	const firstPart = parts[0];
	const restParts = parts.slice(1).join('.');
	if (!firstPart) return '';
	const config = configForPath(optionsConfig, firstPart);
	const shortName = shortNameForOptionsLeaf(config);
	const firstPartResult = shortName || firstPart;
	if (!restParts) return firstPartResult;
	return firstPartResult + '.' + shortenPathWithConfig(config, restParts);
};

//returns a path like shortPath, but with all shortNames expanded to long names
export const expandPathWithConfig = (optionsConfig, shortPath) => {
	const parts = shortPath.split('.');
	const firstPart = parts[0];
	const restParts = parts.slice(1).join('.');
	if (!firstPart) return '';
	let config = configForPath(optionsConfig, firstPart);
	let firstPartResult = firstPart;
	if (!config) {
		//Try looking it up as a short path
		if (!optionsConfig) return firstPart;
		if (typeof optionsConfig != 'object') return firstPart;
		const obj = optionsConfig[EXAMPLE_PROPERTY_NAME] ? optionsConfig[EXAMPLE_PROPERTY_NAME] : optionsConfig;
		for (const [key, value] of Object.entries(obj)) {
			const shortName = shortNameForOptionsLeaf(value);
			if (!shortName) continue;
			if (shortName != firstPart) continue;
			//Found it!
			firstPartResult = key;
			config = value;
			break;
		}
	}
	if (!restParts) return firstPartResult;
	return firstPartResult + '.' + expandPathWithConfig(config, restParts);
};

export const configForPath = (optionsConfig, path) => {
	const parts = path.split('.');
	const firstPart = parts[0];
	const restParts = parts.slice(1).join('.');
	if (!firstPart) return optionsConfig;
	if (!optionsConfig) return undefined;
	if (optionsConfig[firstPart]) return configForPath(optionsConfig[firstPart], restParts);
	const example = optionsConfig[EXAMPLE_PROPERTY_NAME];
	if (!example) return undefined;
	if (Array.isArray(example)) return configForPath(example[0], restParts);
	return configForPath(example[firstPart], restParts);
};

export const setSimPropertyInConfig = (obj, path, value) => {
	//When we switch sim name, we should wipe away all of simOptions, allowing
	//it to be set to the default based on the simOptionsConfig, because the
	//simOptions for the old one definitely won't be valid for the new one.
	if (path == SIM_PROPERTY) obj = setPropertyInObject(obj, SIM_OPTIONS_PROPERTY, DELETE_SENTINEL);
	return setPropertyInObject(obj, path, value);
};

//How many characters of the fingerprint for each sim to put in the URL.
//Balancing short while also making it likely to detect when the underlying
//thing changed. 3 balances that, while also giving a 1/4096 chance of colliding.
const FINGERPRINT_CHARACTER_LENGTH = 3;

export const packModificationsForURL = (modifications = [], simCollection, currentSimIndex = -1) => {
	//Allowed characters in URL based on this answer: https://stackoverflow.com/questions/26088849/url-fragment-allowed-characters
	//We avoid '=' and '&' in the hash, since those will be used for other parameters
	//URL looks like: 
	//1@a12:34,simOptions.northStar:d,display.debug:t;3@b3a:12,simOptions.northStar:x,description:'a%20b',runs:5
	//Where:
	//1 and 3 are examples of the index of the simulationIndex we're referring to
	//@ is the delimiter for the concatenated, in order, list of modifications
	//34, 12 are examples of the version number of the simulator for that simIndex WITH ALL MODIFICATIONS APPLIED (sim=OTHER could be sent)
	//a12, b3a are examples of the first 3 digits of the hash of the underlying config
	//the dotted path is the modification.path
	//: is the delimiter to the value and , is the delimeter for values
	//'' delimits strings, which are URL-endcoded inside
	//Naked numbers are just numbers
	//t is true, f is false, n is null, u is undefined, x is delete sentinel, d is delete sentinel
	//Objects are encoded with an 'o' followed by a URL-encoded JSON blob
	//As a special case, the simIndex and '@' at the beginning of a simIndexes's list of modifications may be fully omitted if it equals currentSimIndex.
	//As a special case, if the simulatorVersion is 0, it may be omitted (as well as the ':')
	if (!simCollection) return '';
	let result = [];
	const simIndexes = Array.from(new Set(modifications.map(mod => mod.simulationIndex)));
	for (const simIndex of simIndexes) {
		let simPiece = '';
		if (simIndex != currentSimIndex) simPiece = '' + simIndex + '@';
		const simulation = simCollection.simulations[simIndex];
		if (!simulation) return '';
		const keyValuePairs = [];
		const version = simulation.simulator.version;
		let firstPiece = simulation.baseFingerprint.substring(0,FINGERPRINT_CHARACTER_LENGTH);
		if (version) firstPiece += ':' + version;
		keyValuePairs.push(firstPiece);
		const mods = shadowedModificationsForSimIndex(modifications, simIndex);
		//Only keep the last modification of path
		for (let [path, value] of Object.entries(mods)) {
			//Shorten short names
			path = shortenPathWithConfig(simulation.optionsConfig, path);
			if (typeof value == 'string') value = "'" + encodeURIComponent(value) + "'";
			if (value == DEFAULT_SENTINEL) value = 'd';
			if (value == DELETE_SENTINEL) value ='x';
			if (value === null) value = 'n';
			if (value === undefined) value = 'u';
			if (value === true) value = 't';
			if (value === false) value = 'f';
			if (typeof value == 'object') {
				//Objects should be very rare (the UI never allows adding them;
				//they're always added by default sentinel) but we should handle
				//them.
				value = 'o' + encodeURIComponent(JSON.stringify(value));
			}
			//numbers will be encoded to string value automatically via coercion.
			keyValuePairs.push(path + ':' + value);
		}
		simPiece += keyValuePairs.join(',');
		result.push(simPiece);
	}
	return result.join(';');
};

export const unpackModificationsFromURL = (url, simCollection, currentSimIndex = -1) => {
	const modifications = [];
	const urlParts = url.split(';');
	let warning = '';
	//For now, we just completely ignore simulator version number
	for (const urlPart of urlParts) {
		const versionParts = urlPart.split('@');
		//the version number might be ommited.
		const keyValuesPart = versionParts[versionParts.length - 1];
		const simulationIndex = versionParts.length == 2 ? parseInt(versionParts[0]) : currentSimIndex;
		const simulation = simCollection ? simCollection.simulations[simulationIndex] : null;
		const keyValuesParts = keyValuesPart.split(',');
		for (const [index, part] of keyValuesParts.entries()) {
			if (index == 0) {
				const [fingerprint, versionString] = part.split(':');
				const simulatorVersion = versionString ? parseInt(versionString) : 0;
				if (fingerprint != simulation.baseFingerprint.slice(0, fingerprint.length)) warning = 'The diff was generated on a config that has now changed, so the diff might not work.';
				//This is the version number. For now we'll try to continue but raise it in warning.
				if (simulatorVersion != simulation.simulator.version) warning = 'The version differed from when the URL was saved. The behavior of the diff might not work.';
				//The first pair is always the version section, don't process it
				continue;
			}
			let [key, value] = part.split(':');
			//expand short names
			if (simulation) key = expandPathWithConfig(simulation.optionsConfig, key);
			if (value == 'd') value = DEFAULT_SENTINEL;
			if (value == 'x') value = DELETE_SENTINEL;
			if (value == 'n') value = null;
			if (value == 'u') value = undefined;
			if (value == 't') value = true;
			if (value == 'f') value = false;

			if (value && typeof value == 'string') {
				if (value.startsWith("'")) {
					//Value is a string.
					value = value.split("'").join('');
					value = decodeURIComponent(value);
				} else if (value.startsWith('o')) {
					//An object.
					value = value.substring(1);
					value = decodeURIComponent(value);
					value = JSON.parse(value);
				} else {
					const numValue = parseFloat(value);
					if (!isNaN(numValue)) value = numValue;
				}
			}
			modifications.push({simulationIndex, path:key, value});
		}
	}
	return [modifications, warning];
};