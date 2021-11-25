//Returns an array of strings describing the problems in it or [] if no problems.
export const optionsConfigValidator = (config) => {
	if (!config) return ['Config must be an object'];
	return [];
};