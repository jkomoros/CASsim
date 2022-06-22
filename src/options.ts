export const SIM_PROPERTY = 'sim';
export const SIM_OPTIONS_PROPERTY = 'simOptions';
export const SIM_PROPERTY_SHORT_NAME = 'sm';

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
const BACKFILL_PROPERTY_NAME = 'backfill';
const DEFAULT_PROPERTY_NAME = 'default';
const HIDE_PROPERTY_NAME = 'hide';
//This is not a documented property, we use it to define where a root is for
//what values we pass to options.hide().
export const IS_ROOT_PROPERTY_NAME = '@@isRoot';

export const COLOR_BEHAVIOR_NAME = 'color';

export const DIFF_URL_KEY = 'd';
export const RUN_INDEX_URL_KEY = 'r';
export const CHART_SINGLE_RUN_URL_KEY = 'cSR';
export const CHART_CONFIG_IDS_URL_KEY = 'cI';
export const EXPANDED_URL_KEY = 'e';
export const CHART_EXPANDED_URL_KEY = 't';
export const CONFIGURATION_EXPANDED_URL_KEY = 'o';
export const DESCRIPTION_EXPANDED_URL_KEY = 'd';

const ALLOWED_BEHAVIOR_NAMES = {
	[COLOR_BEHAVIOR_NAME]: true,
};

import {
	OptionsConfig
} from './types.js';

import {
	DELETE_SENTINEL,
	DEFAULT_SENTINEL,
	isStep,
	setPropertyInObject,
	uniquePairs
} from './util.js';

//See README.md for more about the canonical shape of optionsLeaf objects.

export const configIsAdvanced = (config : OptionsConfig) : boolean => {
	return config && config.advanced;
};

//Returns a string describing the problem, or '' if no problem
export const optionsConfigValidator = (config : OptionsConfig) : string => {
	if (!config) return 'Config must be an object';
	//The top-level expectation is basically an object with examples.
	return optionsLeafValidator({
		example: config,
	});
};

const shortNameForOptionsLeaf = (leaf) => {
	if (!leaf || typeof leaf != 'object') return '';
	//Only read out shortName on objects that are actually leafs
	if (leaf[EXAMPLE_PROPERTY_NAME] == undefined) return '';
	return leaf[SHORT_NAME_PROPERTY_NAME] || '';
};

const optionsLeafValidator = (config : OptionsConfig) : string => {
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
	if (config[BACKFILL_PROPERTY_NAME] !== undefined && typeof config[BACKFILL_PROPERTY_NAME] != 'boolean') return BACKFILL_PROPERTY_NAME + ' must be a boolean if provided';
	if (config[DEFAULT_PROPERTY_NAME] !== undefined && typeof config[DEFAULT_PROPERTY_NAME] != 'boolean') return DEFAULT_PROPERTY_NAME + ' must be a boolean if provided';
	if (config[ADVANCED_PROPERTY_NAME] !== undefined && typeof config[ADVANCED_PROPERTY_NAME] != 'boolean') return ADVANCED_PROPERTY_NAME + ' must be a boolean if provided';
	if (config[IS_ROOT_PROPERTY_NAME] !== undefined && typeof config[IS_ROOT_PROPERTY_NAME] != 'boolean') return IS_ROOT_PROPERTY_NAME + ' must be a boolean if provided';

	if (config[BACKFILL_PROPERTY_NAME] && !config[OPTIONAL_PROPERTY_NAME]) return 'If ' + BACKFILL_PROPERTY_NAME + ' is true, then ' + OPTIONAL_PROPERTY_NAME + 'must also be true';
	if (config[DEFAULT_PROPERTY_NAME] && !config[OPTIONAL_PROPERTY_NAME]) return 'If ' + DEFAULT_PROPERTY_NAME + ' is true, then ' + OPTIONAL_PROPERTY_NAME + 'must also be true';

	if (config[MIN_PROPERTY_NAME] !== undefined && typeof config[MIN_PROPERTY_NAME] != 'number') return MIN_PROPERTY_NAME + ' must be a number if provided';
	if (config[MAX_PROPERTY_NAME] !== undefined && typeof config[MAX_PROPERTY_NAME] != 'number') return MAX_PROPERTY_NAME + ' must be a number if provided';
	if (config[STEP_PROPERTY_NAME] !== undefined && typeof config[STEP_PROPERTY_NAME] != 'number') return STEP_PROPERTY_NAME + ' must be a number if provided';

	if (config[BEHAVIOR_PROPERTY_NAME] !== undefined && (typeof config[BEHAVIOR_PROPERTY_NAME] != 'string' || !ALLOWED_BEHAVIOR_NAMES[config[BEHAVIOR_PROPERTY_NAME]])) return BEHAVIOR_PROPERTY_NAME + ' was provided ' + config[BEHAVIOR_PROPERTY_NAME] + ' but only allows ' + Object.keys(ALLOWED_BEHAVIOR_NAMES).join(', ');

	if (config[HIDE_PROPERTY_NAME] !== undefined && typeof config[HIDE_PROPERTY_NAME] != 'function') return HIDE_PROPERTY_NAME + ' must be a function';

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

//Will return an object like obj, but with any missing properties that are set
//to optional: true, backfill:true filled in with their defaults. It will copy in
//place any objects that must be modified, and might return obj if no
//modifications have to be made. It returns an array: the object, and a boolean
//for whether changes were made. Note that when setting defaults, it uses
//defaultValueForConfig and does NOT use simulator.defaultValueForPath.
export const ensureBackfill = (optionsConfig, obj) => {
	if (!optionsConfig) return [obj, false];
	const example = optionsConfig[EXAMPLE_PROPERTY_NAME];
	if (example == undefined) {
		if (!obj) {
			let defaulted = defaultValueForConfig(optionsConfig);
			[defaulted] = ensureBackfill(optionsConfig, defaulted);
			return [defaulted, true];
		}
		const result = {};
		let changesMade = false;
		for (const [key, value] of Object.entries(optionsConfig)) {
			const [newValue, changed] = ensureBackfill(value, obj[key]);
			result[key] = newValue;
			if (changed) changesMade = true;
		}
		return changesMade ? [result, true] : [obj, false];
	}
	if (typeof example == 'object') {
		if (!obj) {
			if (!optionsConfig[BACKFILL_PROPERTY_NAME]) return [obj, false];
			let defaulted = defaultValueForConfig(optionsConfig);
			[defaulted] = ensureBackfill(optionsConfig, defaulted);
			return [defaulted, true];
		}
		if (Array.isArray(example)) {
			//obj's shape hasn't yet been validated; this won't validate but let's just leave it for now, so it is noticed to be invalid later
			if (!Array.isArray(obj)) return [obj, false];
			const results = obj.map(item => ensureBackfill(example[0], item));
			const changesMade = results.some(arr => arr[1]);
			return changesMade ? [results.map(arr => arr[0]), true] : [obj, false];
		}
		const result = {};
		let changesMade = false;
		for (const [key, value] of Object.entries(example)) {
			const [newValue, changed] = ensureBackfill(value, obj[key]);
			result[key] = newValue;
			if (changed) changesMade = true;
		}
		return changesMade ? [result, true] : [obj, false];
	}
	//If the value is already provided, no need to do anything
	if (obj !== undefined) return [obj, false];
	//Base case
	if (!optionsConfig[BACKFILL_PROPERTY_NAME]) return [obj, false];
	let defaulted = defaultValueForConfig(optionsConfig);
	[defaulted] = ensureBackfill(optionsConfig, defaulted);
	return [defaulted, true];
};

//if skipOptional is true then optional items will be skipped. Things that
//recurse into subObjects will have skipOptional true. This leads to behavior
//where the top-level item requested will be returned even if optional (which is
//useful for e.g. getting an optional value to add)
export const defaultValueForConfig = (optionsConfig, skipOptional? : boolean) => {
	if (!optionsConfig) return undefined;
	const example = optionsConfig[EXAMPLE_PROPERTY_NAME];
	if (example == undefined) {
		return Object.fromEntries(Object.entries(optionsConfig).filter(entry => !(entry[1][OPTIONAL_PROPERTY_NAME] && !entry[1][DEFAULT_PROPERTY_NAME])).map(entry => [entry[0], defaultValueForConfig(entry[1], true)]).filter(entry => entry[1] !== undefined));
	}
	if (skipOptional && optionsConfig[OPTIONAL_PROPERTY_NAME] && !optionsConfig[DEFAULT_PROPERTY_NAME]) return undefined;
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
		return Object.fromEntries(Object.entries(example).filter(entry => !(entry[1][OPTIONAL_PROPERTY_NAME] && !entry[1][DEFAULT_PROPERTY_NAME])).map(entry => [entry[0], defaultValueForConfig(entry[1], true)]).filter(entry => entry[1] !== undefined));
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

//Given an optionsConfig, it returns an object that is like it, but with any
//missing shortNames in it or its children replaced.
export const optionsConfigWithDefaultedShortNames = (optionsConfig) => {
	if (!optionsConfig) return optionsConfig;
	if (typeof optionsConfig != 'object') return optionsConfig;
	if (Array.isArray(optionsConfig)) return optionsConfig.map(sub => optionsConfigWithDefaultedShortNames(sub));
	const example = optionsConfig.example;
	if (example !== undefined && (!example || typeof example !== 'object')) return optionsConfig;
	const isExampleObject = example !== undefined;

	let result = {...optionsConfig};
	if (isExampleObject) {
		result.example = optionsConfigWithDefaultedShortNames(result.example);
	} else {
		for (const [key, value] of Object.entries(optionsConfig)) {
			result[key] = optionsConfigWithDefaultedShortNames(value);
		}
	}

	const existing = {};
	const subItemsEntries = isExampleObject ? Object.entries(result.example) : Object.entries(result);
	for (const [key, val] of subItemsEntries) {
		let shortName = '';
		if (!val) continue;
		if (typeof val != 'object') continue;
		if (Array.isArray(val)) continue;
		if (val.example === undefined) continue;
		if (val.shortName) shortName = val.shortName;
		existing[key] = shortName;
	}
	const suggestions = suggestMissingShortNames(existing);
	if (Object.keys(suggestions).length) {
		if (isExampleObject) {
			result.example = {...result.example};
			Object.entries(suggestions).forEach(entry => result.example[entry[0]] = {...result.example[entry[0]], shortName: entry[1]});
		} else {
			result = {...result};
			Object.entries(suggestions).forEach(entry => result[entry[0]] = {...result[entry[0]], shortName: entry[1]});
		}
	}
	return result;
};

//existing should be longName -> shortName for every object at this level. Will
//return a map of longName->shortName for any ones that exist as longName but
//have no shortName. Not to be used directly ( use
//suggestMissingShrotNamesForOptionConfig); exported only for testing.
export const suggestMissingShortNames = (existing) => {
	//First, verify that existing is not ALREADY invalid before we start
	if (!shortNamesValid(existing)) return {};
	const suggestions = {};
	for (const [longName, shortName] of Object.entries(existing)) {
		//if there's already a shortName then we don't need to try one
		if (shortName) continue;
		const suggestion = suggestedShortName(longName, existing);
		if (suggestion) suggestions[longName] = suggestion;
	}
	//Check for any collisions in suggested names (we know they didn't conflict
	//with existing, because suggestedShortName already barfs for them)
	const shortNamesToLongNames = {};
	for (const [longName, shortName] of Object.entries(suggestions)) {
		if (!shortName) continue;
		if (!shortNamesToLongNames[shortName]) shortNamesToLongNames[shortName] = [];
		shortNamesToLongNames[shortName].push(longName);
	}
	for (const longNames of Object.values(shortNamesToLongNames)) {
		if (longNames.length < 2) continue;
		//ok, all longNames need to not conflict with one another.
		const minDifferentIndex = Math.min(...uniquePairs(longNames).map(pair => firstDifferentPieceIndex(pair[0], pair[1])));
		for (const longName of longNames) {
			const suggestion = suggestedShortNameExpandIndex(longName, existing, minDifferentIndex);
			if (suggestion) {
				suggestions[longName] = suggestion;
			} else {
				delete suggestions[longName];
			}
		}
	}
	//Final gutcheck before returning results
	if (!shortNamesValid({...existing, ...suggestions})) {
		console.warn('Was about to suggest shortNames: ', existing, suggestions);
		return {};
	}
	return suggestions;
};

//returns the longName of the thing this conflicts with, or '' if not conflict.
const shortNameConflict = (existing, shortName) => {
	if (existing[shortName]) return shortName;
	for (const [key,value] of Object.entries(existing)) {
		if (value == shortName) return key;
	}
	return '';
};

//returns the index of pieces into one/two where they first differ. Pieces can
//be the string longName or a pre-split pieces.
const firstDifferentPieceIndex = (one, two) => {
	if (typeof one == 'string') one = longNamePieces(one);
	if (typeof two == 'string') two = longNamePieces(two);
	let index = 0;
	const shortestLength = Math.min(one.length, two.length);
	const sameLength = one.length == two.length;
	while (index < shortestLength) {
		if (one[index] != two[index]) return index;
		index++;
	}
	return sameLength ? -1 : shortestLength;
};

//cuts a longName intp pieces where the first bit is a piece, and each upper case letter starts a new piece
const longNamePieces = (longName) => {
	const result = [];
	let currentPiece = '';
	for (const char of longName) {
		if (char == '_') {
			if (currentPiece) result.push(currentPiece);
			currentPiece = '';
			//Don't consume this piece
			continue;
		} 
		if (char == char.toUpperCase()) {
			if (currentPiece) result.push(currentPiece);
			currentPiece = '';
		}
		currentPiece += char;
	}
	if (currentPiece) result.push(currentPiece);
	return result;
};

const MIN_LONG_NAME_LENGTH = 3;

const suggestedShortName = (longName, existing) => {
	//The default shortName is the first character, and then every upperCase
	//letter after.
	//don't shorten words that are already quite short
	if (longName.length <= MIN_LONG_NAME_LENGTH) return '';
	const pieces = longNamePieces(longName);
	const candidate = pieces.map(piece => piece[0]).join('');
	const conflict = shortNameConflict(existing, candidate);
	if (conflict == '' && candidate != longName) return candidate;
	
	//The basic name conflicted, but what if we just don't expand the part where they first differ?
	const differentIndex = firstDifferentPieceIndex(conflict, longName);
	return suggestedShortNameExpandIndex(longName, existing, differentIndex);
};

const suggestedShortNameExpandIndex = (longName, existing, expandIndex) => {
	//Don't shorten words that are already quite short
	if (longName.length <= MIN_LONG_NAME_LENGTH) return '';
	const pieces = longNamePieces(longName);
	let candidate = pieces.map((piece, index) => index == expandIndex ? piece : piece[0]).join('');
	let conflict = shortNameConflict(existing, candidate);
	if (conflict == '' && candidate != longName) return candidate;
	return '';
};

const shortNamesValid = (shortNamesMap) => {
	const existingShortNames = {};
	for (const [key, val] of Object.entries(shortNamesMap)) {
		//A shortName conflicts with a long name, and it's not that the longName
		//and shortName for this item are the same.
		if (shortNamesMap[val] !== undefined && key != val) return false;
		//A shortName conflcits with another shortName
		if (existingShortNames[val]) return false;
		if (val) existingShortNames[val] = true;
	}
	return true;
};

//How many characters of the fingerprint for each sim to put in the URL.
//Balancing short while also making it likely to detect when the underlying
//thing changed. 3 balances that, while also giving a 1/4096 chance of colliding.
const FINGERPRINT_CHARACTER_LENGTH = 3;

export const packModificationsForURL = (modifications = [], simCollection, currentSimIndex = -1) => {
	//Allowed characters in URL based on this answer: https://stackoverflow.com/questions/26088849/url-fragment-allowed-characters
	//We avoid '=' and '&' in the hash, since those will be used for other parameters
	//URL looks like: 
	//1@a12:cde,simOptions.northStar:d,display.debug:t;3@b3a:def,simOptions.northStar:x,description:'a%20b',runs:5
	//Where:
	//1 and 3 are examples of the index of the simulationIndex we're referring to
	//@ is the delimiter for the concatenated, in order, list of modifications
	//cde, def are examples of the fingerprint of version, the first one
	//a12, b3a are examples of the first 3 digits of the hash of the underlying config. If the config changes, multiples should be saved
	//the dotted path is the modification.path
	//: is the delimiter to the value and , is the delimeter for values
	//'' delimits strings, which are URL-endcoded inside
	//Naked numbers are just numbers
	//t is true, f is false, n is null, u is undefined, x is delete sentinel, d is delete sentinel
	//Objects are encoded with an 'o' followed by a URL-encoded JSON blob
	//As a special case, the simIndex and '@' at the beginning of a simIndexes's list of modifications may be fully omitted if it equals currentSimIndex.
	if (!simCollection) return '';
	let result = [];
	const simIndexes = Array.from(new Set(modifications.map(mod => mod.simulationIndex)));
	for (const simIndex of simIndexes) {
		let simPiece = '';
		if (simIndex != currentSimIndex) simPiece = '' + simIndex + '@';
		const simulation = simCollection.simulations[simIndex];
		if (!simulation) return '';
		//The simulator could change partway through, which would make the shortNames change.
		let diffedSimulation = simulation.cloneWithConfig(simulation.unmodifiedConfig);
		const keyValuePairs = [];
		const fingerprintPieces = [];
		fingerprintPieces.push(diffedSimulation.baseFingerprint.substring(0,FINGERPRINT_CHARACTER_LENGTH));
		fingerprintPieces.push(diffedSimulation.simulator.fingerprint.substring(0, FINGERPRINT_CHARACTER_LENGTH));
		const mods = shadowedModificationsForSimIndex(modifications, simIndex);
		//Only keep the last modification of path
		for (let [path, value] of Object.entries(mods)) {
			if (path == SIM_PROPERTY) {
				diffedSimulation = diffedSimulation.cloneWithModification(path, value);
				fingerprintPieces.push(diffedSimulation.simulator.fingerprint.substring(0, FINGERPRINT_CHARACTER_LENGTH));
			}
			//Shorten short names
			path = shortenPathWithConfig(diffedSimulation.optionsConfig, path);
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
		simPiece += [fingerprintPieces.join(':'), ...keyValuePairs].join(',');
		result.push(simPiece);
	}
	return result.join(';');
};

export const unpackSimNamesFromURL = (url) => {
	if (!url) return [];
	//Can unpack a URL modifications packed with packModificationsFromURL and
	//detect items that include a packed or unpacked modification of the sim
	//name. Returns an array of any it finds.
	const simNames = [];
	const urlParts = url.split(';');
	//For now, we just completely ignore simulator version number
	for (const urlPart of urlParts) {
		const versionParts = urlPart.split('@');
		//the version number might be ommited.
		const keyValuesPart = versionParts[versionParts.length - 1];
		const keyValuesParts = keyValuesPart.split(',');
		for (const [index, part] of keyValuesParts.entries()) {
			if (index == 0) {
				continue;
			}
			let [key, value] = part.split(':');
			if (key == SIM_PROPERTY || key == SIM_PROPERTY_SHORT_NAME) {
				//Values is a string, which means it is wrapped in a ''
				value = value.split("'").join('');
				value = decodeURIComponent(value);
				simNames.push(value);
			}
		}
	}
	return simNames;
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
		//The simulator might change in the middle, so we'l lhave to clone copies...
		let diffedSimulation = simulation.cloneWithConfig(simulation.unmodifiedConfig);
		const keyValuesParts = keyValuesPart.split(',');
		let simulatorFingerprints = [];
		let simulatorIndex = 0;
		for (const [index, part] of keyValuesParts.entries()) {
			if (index == 0) {
				const [fingerprint, ...unpackedSimulatorFingerprints] = part.split(':');
				simulatorFingerprints = unpackedSimulatorFingerprints;
				if (fingerprint != diffedSimulation.baseFingerprint.slice(0, fingerprint.length)) warning = 'The diff was generated on a config that has now changed, so the diff might not work.';
				//This is the version number. For now we'll try to continue but raise it in warning.
				if (simulatorFingerprints[simulatorIndex] != diffedSimulation.simulator.fingerprint.slice(0, simulatorFingerprints[simulatorIndex].length)) warning = 'The simulator #' + simulatorIndex + ' has been updated since the diff was saved. The behavior of the diff might not work.';
				//The first pair is always the version section, don't process it
				continue;
			}
			let [key, value] = part.split(':');
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

			if (key == SIM_PROPERTY_SHORT_NAME) {
				diffedSimulation = diffedSimulation.cloneWithModification(SIM_PROPERTY, value);
				simulatorIndex++;
				if (simulatorFingerprints[simulatorIndex] != diffedSimulation.simulator.fingerprint.slice(0, simulatorFingerprints[simulatorIndex].length)) warning = 'The simulator #' + simulatorIndex + ' has been updated since the diff was saved. The behavior of the diff might not work.';
			}
			//expand short names
			key = expandPathWithConfig(diffedSimulation.optionsConfig, key);

			modifications.push({simulationIndex, path:key, value});
		}
	}
	return [modifications, warning];
};

export const shadowedModificationsForSimIndex = (modifications, simIndex) => {
	const mods = {};
	for (const mod of modifications) {
		if (mod.simulationIndex != simIndex) continue;
		mods[mod.path] = mod.value;
		//Deletes 'shadow' all earlier sets or modifications of paths whose
		//have our path as a prefix so clear them out.
		if (mod.value == DELETE_SENTINEL) {
			for (const key of Object.keys(mods)) {
				//Add a '.' to make sure that paths like 'a.f' don't match 'a.foo'
				if (!key.startsWith(mod.path + '.')) continue;
				delete mods[key];
			}
		}
		//If the sim property is changed, any mods on simOptions from before
		//this are removed. This effectively mirrors the behavior of setSimulationPropertyInConfig. 
		if (mod.path == SIM_PROPERTY) {
			for (const key of Object.keys(mods)) {
				//Add a '.' to make sure that paths like 'a.f' don't match 'a.foo'
				if (!key.startsWith(SIM_OPTIONS_PROPERTY + '.')) continue;
				delete mods[key];
			}
		}
	}
	return mods;
};
