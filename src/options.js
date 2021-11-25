const EXAMPLE_PROPERTY_NAME = 'example';
const DESCRIPTION_PROPERTY_NAME = 'description';
const ADVANCED_PROPERTY_NAME = 'advanced';
const NULLABLE_PROPERTY_NAME = 'nullable';

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
		//If value == display == description, you can just have a raw value. This is equivalent to 
		//{value:"b"}
		"b"
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
	if (example === undefined) return ['example is a required property'];
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

	//TODO: validate min/max/step are legal numbers
	//TODO: validate that min/max/step are only provided when it's a number or array
	//TODO: validate 'options'

	return [];
};