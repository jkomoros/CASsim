const EXAMPLES_PROPERTY_NAME = 'examples';

//Returns an array of strings describing the problems in it or [] if no problems.
export const optionsConfigValidator = (config) => {
	if (!config) return ['Config must be an object'];
	//The top-level expectation is basically an object with examples.
	return innerOptionsConfigValidator({
		[EXAMPLES_PROPERTY_NAME]: config,
	});
};

const innerOptionsConfigValidator = (config) => {
	return [];
};