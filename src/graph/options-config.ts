import {
	BloomGraph
} from './bloom.js';

import {
	PreferentialAttachmentGraph
} from './preferential-attachment.js';

const GRAPH_TYPE_PROPERTY = 'graphType';

//When adding new graph types, make sure they have a .name and .description
//static getter.
export const GRAPH_TYPES = {
	[BloomGraph.name]: BloomGraph,
	[PreferentialAttachmentGraph.name]: PreferentialAttachmentGraph,
};

const ALL_GRAPH_TYPES = [...Object.keys(GRAPH_TYPES)];

/*

	graphOptionsConfig and graphOptionsFromConfig are useful when you want the
	user of the simulation to be able to configure different graph types. It
	returns an optionsConfig that the user can use to change the graph type
	structure, and graphOptionsFromConfig can be used to generate the graph.

*/

//graphTypes is the list of graphTypes to include. May be an array of keys that
//are in GRAPH_TYPES.
export const graphOptionsConfig = (overrides = {}, graphTypes = ALL_GRAPH_TYPES) =>{
	if (overrides[GRAPH_TYPE_PROPERTY] == '') throw new Error(GRAPH_TYPE_PROPERTY + ' may not be omitted');
	const graphTypeName = overrides[GRAPH_TYPE_PROPERTY] || GRAPH_TYPE_PROPERTY;
	let result = {
		[graphTypeName]: {
			example: BloomGraph.name,
			description: 'The type of graph to use',
			optional: true,
			default: true,
			backfill: true,
			options: Object.keys(GRAPH_TYPES).map(key => ({value: key, description: GRAPH_TYPES[key].description})),
		}
	};
	const propNameByGraphType = {};
	for (const name of graphTypes) {
		const typ = GRAPH_TYPES[name];
		if (!typ) throw new Error("Unknown graphtype: " + name);
		const options = typ.optionsConfig(overrides);
		for (const key of Object.keys(options)) {
			if (!propNameByGraphType[key]) propNameByGraphType[key] = [];
			propNameByGraphType[key].push(name);
		}
		result = {...result, ...options};
	}
	//Generate hide methods to hide properties that are not used in this graphType.
	for (const [key, value] of Object.entries(result)) {
		const graphTypes = propNameByGraphType[key];
		//Skip things like GRAPH_TYPE_PROPERTY
		if (!graphTypes) continue;
		if (graphTypes.length == Object.keys(GRAPH_TYPES).length) continue;
		value.hide = (parentValues) => graphTypes.every(typ => typ != parentValues[graphTypeName]);
	}
	return result;
};

//Pass it the values object and overrides, and it returns a tuple of GraphType( call .make()) and options to pass to it.
export const graphOptionsFromConfig = (values, overrides = {}) => {
	//BloomGraph's static optionsFromConfig is just forcelayoutgraph's
	const options = BloomGraph.optionsFromConfig(values, overrides);
	const graphTypeName = overrides[GRAPH_TYPE_PROPERTY] || GRAPH_TYPE_PROPERTY;
	const graphType = values[graphTypeName];
	const constructor = GRAPH_TYPES[graphType];
	return [constructor, options];
};

