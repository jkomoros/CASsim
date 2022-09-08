import {
	deepCopy
} from './util.js';

import {
	PackedRawSimulationConfig,
	PackedRawSimulationConfigItem,
	RawSimulationConfigBase,
	RawSimulationConfigExtended
} from './types.js';

import {
	RawSimulationConfig
} from './types-simulator.js';

import {
	TypedObject
} from './typed-object.js';

//This is the current version of the expected data payload. We should increment
//this when large, breaking changes in how the data is packed are created.
export const FORMAT_VERSION = 1;
const VERSION_PROPERTY_NAME = 'version';
//Recreated in screenshot.js
const CONFIGS_PROPERTY_NAME = 'configs';

export const NAME_PROPERTY = 'name';
const BASE_PROPERTY = 'base';
const EXTEND_PROPERTY = 'extend';

//Given a raw JSON blob, unpacks and returns the array of different configs.
export const unpackConfigJSON = (rawData : PackedRawSimulationConfig) : RawSimulationConfig[] => {
	if (!rawData || typeof rawData != 'object') throw new Error('Payload is not an object');
	const version = rawData[VERSION_PROPERTY_NAME] || 1;
	if (version > FORMAT_VERSION) throw new Error('Unknown version for data payload: ' + version);
	return expandDependencies(rawData.configs || []);
};

//Given configs, outputs a POJO that can be serialized and stored. Primarily
//just stores a version.
export const packConfigJSON = (configs : RawSimulationConfig[]) : PackedRawSimulationConfig => {
	if (!Array.isArray(configs)) throw new Error('Configs must me an array');
	return {
		[VERSION_PROPERTY_NAME]: FORMAT_VERSION,
		[CONFIGS_PROPERTY_NAME]: configs,
	};
};

type RawSimulationConfigWithBaseOrExtended = RawSimulationConfig & {
	extend? : string;
	base? : boolean;
}

const extendConfig = (config : PackedRawSimulationConfigItem, configsByName: {[name : string]: PackedRawSimulationConfigItem}, pathNames : {[name : string] : boolean} = {}) : RawSimulationConfig => {
	const configAsExtend = config as RawSimulationConfigExtended;
	const extend = configAsExtend[EXTEND_PROPERTY];
	if (!extend) return config as RawSimulationConfig;
	if (pathNames[extend]) throw new Error('Cycle detected in extend pointers in raw config');
	if (!configsByName[extend]) throw new Error(EXTEND_PROPERTY + ' poitns to unknown config name: ' + extend);
	const base = extendConfig(configsByName[extend], configsByName, {...pathNames, [extend]: true}) as RawSimulationConfigWithBaseOrExtended;
	//The base should drop the extend property and also hidden (base configs often set base=true, but we should ignore that)
	const filteredBase : RawSimulationConfig = Object.fromEntries([...TypedObject.entries(base)].filter(entry => entry[0] != BASE_PROPERTY && entry[0] != EXTEND_PROPERTY));
	//Also drop our own values's extend property, because the extension has
	//already been done and downstream things don't know to expect the extend
	//property.
	const filteredConfig = Object.fromEntries(Object.entries(config).filter(entry => entry[0] != EXTEND_PROPERTY));
	return {...filteredBase, ...filteredConfig};
};

//We expand depencencies before even storing in state, pretending the underylying config included each config in order fully specified.
const expandDependencies = (rawConfigs : PackedRawSimulationConfigItem[]) : RawSimulationConfig[] => {
	rawConfigs = deepCopy(rawConfigs);
	const configByName : {[name : string] : PackedRawSimulationConfigItem} = {};
	for (const config of rawConfigs) {
		configByName[config[NAME_PROPERTY]] = config;
	}
	return rawConfigs.map(config => extendConfig(config, configByName)).filter(config => config && !(config as RawSimulationConfigBase)[BASE_PROPERTY]);
};