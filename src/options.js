const EXAMPLE_PROPERTY_NAME = 'example';
const DESCRIPTION_PROPERTY_NAME = 'description';
const ADVANCED_PROPERTY_NAME = 'advanced';
const NULLABLE_PROPERTY_NAME = 'nullable';
const MIN_PROPERTY_NAME = 'min';
const MAX_PROPERTY_NAME = 'max';
const STEP_PROPERTY_NAME = 'step';
const OPTIONS_PROPERTY_NAME = 'options';
const VALUE_PROPERTY_NAME = 'value';
const DISPLAY_PROPERTY_NAME = 'display';

/*

optionsConfig shape:
{
    "communication": {
		//This object is an example of an optionLeaf

        //An example of the type. Can be e.g.:
        // - a number
        // - a string
        // - a boolean
        // - an array with a single optionLeaf
		// - an object with 1 or more keyed optionLeafs for sub objects
        "example": 0.0,
		//Min is used for numbers. 0.0 is default and only needs to be included if overriden
		"min": 0.0,
		//Step is used for numbers. 1.0 is default and only needs to be included if overriden
		"step": 1.0,
        "description": "How many rounds of communication are allowed before picking. 0 means no communication"
    },
    "display": {
		"example": {
			"debug": {
				"example": false,
				"description": "Whether or not to render debug hints in drawing",
				//If advanced is true, a control will only be rendered if the user toggles an advanced toggle
				"advanced": true,
			},
			"individualBeliefs": {
				"example": false,
				"description": "Whether to render dots on each error bar for each individuals' beliefs"
			}
		},
		"description": "Boolean flags that control aspects of rendering",
    },
    "projects": {
		"example": {
			"count": {
				"example": 5.0,
				"min": 1.0,
				"description": "How many projects there should be",
			},
			"individuals": {
				//For array types, you need to provide at least one example type inside (if you use more than one,
				//the first one will be used). The inner object is an optionsLeaf.
				"example": [
					{
						//an optionLeaf option useful only for array leafs, which says individual items may be null.
						"nullable": true,
						"example": {
							"epsilon": {
								"example": 0.05,
								"step": 0.01,
								"description": "The individuals likelihood",
								"nullable": true,
							},
							"avgLikelihood": {
								"example": 1.0,
								"nullable": true,
								"description": "This individual's specific avg likelihood"
							}
							"description": "Options for a single individual"
						}
						"description": "A single individual. Leave nulls between if you want",
					}
				],
				"description": "An override point for individual projects"
			},
			"position": {
				"example": [
					{
						"example": 0.0,
					}
				],
				"description": "X and y coordinates"
				//For arrays, min and max are bounds on length of array.
				"min": 2.0,
				"max": 2.0,
			}
		}
		"description": "Information about projects"
    }
}

//The above is a worked example. Each is an optionsLeaf object. These all have the shape:
{
	//Example is the most important property and the only reserved word. If an object in the config has 
	//a "example" property then all of its other properties are treated like an optionsLeaf.
	//example may be:
	// - a number
	// - a boolean
	// - a string
	// - an array containing at least one optionsLeaf object (any others will be ignored)
	// - an object, where each of its keys points to an optionsLeaf
	// for numbers, booleans, and strings, this value will also be used as the default
	//If an object has 'example', that is what shows it's a optionsLeaf, not a nested example object
	// (so it's basically a reserved word)
	"example": 1.0,
	//A help string to show in the UI to explain what it does
	"description": "A string to show in the UI"
	//For numbers, the minimum amount. For arrays, the minimum length
	//Defaults to 0.0
	"min": 0.0,
	//For numbers, the maximum number. For arrays, the maximum length
	//Defaults to Number.MAX_SAFE_INTEGER
	"max": 10.0,
	//For numbers, the smallest allowable increment. Defaults to 1.0 (integer)
	"step": 1.0,
	//If options is provided, then a select will be rendered, allowing only those options.
	"options": [
		{
			"value": "a",
			//Defaults to value
			"display": "A"
			//Defaults to display
			"description": "This option is a"
		},
	],
	//For array and object types, whether a given item is allowed to be set explicitly to null.
	//Defaults to false
	"nullable": false,
	//Advanced options will only render UI if the user has enabled advanced mode.
	"advanced": false,
}
*/

//Returns an array of strings describing the problems in it or [] if no problems.
export const optionsConfigValidator = (config) => {
	if (!config) return ['Config must be an object'];
	//The top-level expectation is basically an object with examples.
	return optionsLeafValidator({
		[EXAMPLE_PROPERTY_NAME]: config,
	});
};

const optionsLeafValidator = (config) => {
	if (!config || typeof config != 'object') return ['Config must be an object'];
	const example = config[EXAMPLE_PROPERTY_NAME];
	if (example === undefined) {
		//It's a multi-level nested object I guess
		if (Object.keys(config).length == 0) return ['example is a required property'];
		for (const [key, value] of Object.entries(config)) {
			const problems = optionsLeafValidator(value);
			if (problems.length) {
				return ["sub-object of " + key + " didn't validate: " + problems.join(', ')];
			}
		}
	}
	if (typeof example == 'object') {
		if (Array.isArray(example)) {
			if (!example.length) {
				return ['example is an array but needs at least one property'];
			}
			const problems = optionsLeafValidator(example[0]);
			if (problems.length) {
				return ["example's array first item didn't validate: " + problems.join(', ')];
			}
		}
		for (const [key, value] of Object.entries(example)) {
			const problems = optionsLeafValidator(value);
			if (problems.length) {
				return ["example's sub-object of " + key + " didn't validate: " + problems.join(', ')];
			}
		}
	}

	if (config[DESCRIPTION_PROPERTY_NAME] !== undefined && typeof config[DESCRIPTION_PROPERTY_NAME] != 'string') return [DESCRIPTION_PROPERTY_NAME + ' must be a string if provided'];
	if (config[NULLABLE_PROPERTY_NAME] !== undefined && typeof config[NULLABLE_PROPERTY_NAME] != 'boolean') return [NULLABLE_PROPERTY_NAME + ' must be a boolean if provided'];
	if (config[ADVANCED_PROPERTY_NAME] !== undefined && typeof config[ADVANCED_PROPERTY_NAME] != 'boolean') return [ADVANCED_PROPERTY_NAME + ' must be a boolean if provided'];

	if (config[MIN_PROPERTY_NAME] !== undefined && typeof config[MIN_PROPERTY_NAME] != 'number') return [MIN_PROPERTY_NAME + ' must be a number if provided'];
	if (config[MAX_PROPERTY_NAME] !== undefined && typeof config[MAX_PROPERTY_NAME] != 'number') return [MAX_PROPERTY_NAME + ' must be a number if provided'];
	if (config[STEP_PROPERTY_NAME] !== undefined && typeof config[STEP_PROPERTY_NAME] != 'number') return [STEP_PROPERTY_NAME + ' must be a number if provided'];

	if (config[MIN_PROPERTY_NAME] !== undefined && config[MAX_PROPERTY_NAME] !== undefined && config[MIN_PROPERTY_NAME] > config[MAX_PROPERTY_NAME]) return ['max is less than min'];
	if (typeof config[EXAMPLE_PROPERTY_NAME] !== 'number' && typeof config[EXAMPLE_PROPERTY_NAME] !== 'object' && !Array.isArray(config[EXAMPLE_PROPERTY_NAME])) {
		if (config[MIN_PROPERTY_NAME] !== undefined) return [MIN_PROPERTY_NAME + ' may only be provided for numbers or array examples'];
		if (config[MAX_PROPERTY_NAME] !== undefined) return [MAX_PROPERTY_NAME + ' may only be provided for numbers or array examples'];
		if (config[STEP_PROPERTY_NAME] !== undefined) return [STEP_PROPERTY_NAME + ' may only be provided for numbers examples'];
	}
	if (typeof config[EXAMPLE_PROPERTY_NAME] !== 'number' && config[STEP_PROPERTY_NAME]) return [STEP_PROPERTY_NAME + ' may only be provided for number examples'];
	if (config[OPTIONS_PROPERTY_NAME] !== undefined) {
		if (typeof config[OPTIONS_PROPERTY_NAME] !== 'object' || !Array.isArray(config[OPTIONS_PROPERTY_NAME])) return [OPTIONS_PROPERTY_NAME + ' must be an array if provided'];
		if (!config[OPTIONS_PROPERTY_NAME].length) return [OPTIONS_PROPERTY_NAME + ' was an array without any options'];
		for (const [i, value] of config[OPTIONS_PROPERTY_NAME].entries()) {
			if (value[VALUE_PROPERTY_NAME] === undefined) return ['option ' + i + ' did not have ' + VALUE_PROPERTY_NAME + ' provided'];
			if (value[DISPLAY_PROPERTY_NAME] !== undefined && typeof value[DISPLAY_PROPERTY_NAME] !== 'string') return ['option ' + i + ' had a non string ' + DISPLAY_PROPERTY_NAME + ' provided'];
			if (value[DESCRIPTION_PROPERTY_NAME] !== undefined && typeof value[DESCRIPTION_PROPERTY_NAME] !== 'string') return ['option ' + i + ' had a non string ' + DESCRIPTION_PROPERTY_NAME + ' provided'];
		}
	}

	return [];
};

//Returns [] if OK, or a list of problems if not
export const maySetPropertyInConfigObject = (optionsConfig, path, value) => {
	if (!optionsConfig) return ['no optionsConfig provided'];
	const pathParts = path.split('.');
	const firstPart = pathParts[0];
	const restPath = pathParts.slice(1).join('.');
	const example = optionsConfig[EXAMPLE_PROPERTY_NAME];
	if (firstPart != '') {
		if (typeof optionsConfig !== 'object') return [firstPart + ' still remained in path but no object'];
		//recurse into sub-objects or array
		if (!example) {
			//Basic value recursion
			const problems = maySetPropertyInConfigObject(optionsConfig[firstPart], restPath, value);
			if (problems.length) {
				return [firstPart + ' property returned error: ' + problems.join(', ')];
			}
			return [];
		}
		//examples recursion

		//array
		if (Array.isArray(example)) {
			const problems = maySetPropertyInConfigObject(example[0], restPath, value);
			if (problems.length) {
				return [firstPart + ' property returned error: ' + problems.join(', ')];
			}
			return [];
		}
		//object
		const problems = maySetPropertyInConfigObject(example[firstPart], restPath, value);
		if (problems.length) {
			return [firstPart + ' property within example returned error: ' + problems.join(', ')];
		}
		return [];
		
	}
	if (example == undefined) return ['No example provided'];
	//Base case. optionsConfig should be an optionLeaf.
	if (typeof example != typeof value) return ['Example was of type ' + typeof optionsConfig[EXAMPLE_PROPERTY_NAME] + ' but value was of type ' + typeof value];
	if (Array.isArray(example) != Array.isArray(value)) return ['Example was an array but value was not or vice versa'];
	if (optionsConfig[OPTIONS_PROPERTY_NAME]) {
		if (!optionsConfig[OPTIONS_PROPERTY_NAME].some(item => item.value == value)) return [OPTIONS_PROPERTY_NAME + ' was set but the value ' + value + ' was not one of the allowed options'];
	}
	if (typeof value == 'number') {
		if (optionsConfig[MIN_PROPERTY_NAME] !== undefined && optionsConfig[MIN_PROPERTY_NAME] > value) return [MIN_PROPERTY_NAME + ' was set and the value was less than it'];
		if (optionsConfig[MAX_PROPERTY_NAME] !== undefined && optionsConfig[MAX_PROPERTY_NAME] < value) return [MAX_PROPERTY_NAME + ' was set and the value was more than it'];
		if (optionsConfig[STEP_PROPERTY_NAME] !== undefined && optionsConfig[STEP_PROPERTY_NAME] % value !== 0) return [STEP_PROPERTY_NAME + ' was set but the value was not a multiple of it'];
	}
	if (typeof value == 'object' && Array.isArray(value)) {
		if (optionsConfig[MIN_PROPERTY_NAME] !== undefined && optionsConfig[MIN_PROPERTY_NAME] > value.length) return [MIN_PROPERTY_NAME + ' was set and the array value had a length less than it'];
		if (optionsConfig[MAX_PROPERTY_NAME] !== undefined && optionsConfig[MAX_PROPERTY_NAME] < value.length) return [MAX_PROPERTY_NAME + ' was set and the array value had a length more than it'];
	}
	//TODO: if an object or array, validate the sub sets on all objects
	//TODO: nullable
	//TODO: deleting
	//TODO: test very hard objects like the individuals array
	return [];
};