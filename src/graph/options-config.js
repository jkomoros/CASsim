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

export const graphOptionsConfig = (overrides) =>{
	//TODO: allow overrides specifying to not change graphType or to rename it
	let result = {
		[GRAPH_TYPE_PROPERTY]: {
			example: GRAPH_TYPE_BLOOM,
			description: 'The type of graph to use',
			optional: true,
			default: true,
			backfill: true,
			options: Object.keys(GRAPH_TYPES).map(key => ({value: key})),
		}
	};
	for (const typ of Object.values(GRAPH_TYPES)) {
		result = {...result, ...typ.optionsConfig(overrides)};
	}
	return result;
};

//Pass it the values object and overrides, and it returns a tuple of GraphType( call .make()) and options to pass to it.
export const graphOptionsFromConfig = (values, overrides) => {
	//BloomGraph's static optionsFromConfig is just forcelayoutgraph's
	const options = BloomGraph.optionsFromConfig(values, overrides);
	const constructor = GRAPH_TYPES[options[GRAPH_TYPE_PROPERTY]];
	return [constructor, options];
};

