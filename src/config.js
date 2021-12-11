
//This is the current version of the expected data payload. We should increment
//this when large, breaking changes in how the data is packed are created.
export const FORMAT_VERSION = 1;
const VERSION_PROPERTY_NAME = 'version';
const CONFIGS_PROPERTY_NAME = 'configs';

//Given a raw JSON blob, unpacks and returns the array of different configs.
export const unpackConfigJSON = (rawData) => {
	if (!rawData || typeof rawData != 'object') throw new Error('Payload is not an object');
	const version = rawData[VERSION_PROPERTY_NAME] || 1;
	if (version > FORMAT_VERSION) throw new Error('Unknown version for data payload: ' + version);
	return rawData[CONFIGS_PROPERTY_NAME] || [];
};

//Given configs, outputs a POJO that can be serialized and stored. Primarily
//just stores a version.
export const packConfigJSON = (configs) => {
	if (!Array.isArray(configs)) throw new Error('Configs must me an array');
	return {
		[VERSION_PROPERTY_NAME]: FORMAT_VERSION,
		[CONFIGS_PROPERTY_NAME]: configs,
	};
};