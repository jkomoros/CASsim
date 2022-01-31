import {
	BloomGraph
} from './bloom.js';

import {
	PreferentialAttachmentGraph
} from './preferential-attachment.js';

const GRAPH_TYPE_PROPERTY = 'graphType';

const GRAPH_TYPE_BLOOM = 'bloom';
const GRAPH_TYPE_PREFERENTIAL_ATTACHMENT = 'preferential-attachment';

const GRAPH_TYPES = {
	[GRAPH_TYPE_BLOOM]: BloomGraph,
	[GRAPH_TYPE_PREFERENTIAL_ATTACHMENT]: PreferentialAttachmentGraph,
};

/*

	graphOptionsConfig and graphOptionsFromConfig are useful when you want the
	user of the simulation to be able to configure different graph types. It
	returns an optionsConfig that the user can use to change the graph type
	structure, and graphOptionsFromConfig can be used to generate the graph.

*/

export const graphOptionsConfig = (overrides = {}) =>{
	if (overrides[GRAPH_TYPE_PROPERTY] == '') throw new Error(GRAPH_TYPE_PROPERTY + ' may not be omitted');
	const graphTypeName = overrides[GRAPH_TYPE_PROPERTY] || GRAPH_TYPE_PROPERTY;
	let result = {
		[graphTypeName]: {
			example: GRAPH_TYPE_BLOOM,
			description: 'The type of graph to use',
			optional: true,
			default: true,
			backfill: true,
			options: Object.keys(GRAPH_TYPES).map(key => ({value: key})),
		}
	};
	const propNameByGraphType = {};
	for (const [name, typ] of Object.entries(GRAPH_TYPES)) {
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

