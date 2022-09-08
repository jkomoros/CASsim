import {
	DistributionOptions,
	OptionValueMap
} from '../../types.js';

export type LuckSurfaceAreaSimOptions = {
	agents : {
		count : number;
		cost : DistributionOptions;
		starterStrength : DistributionOptions;
		starterValue : DistributionOptions;
	},
	rounds : number;
	opportunities : {
		value : {
			likelihood : DistributionOptions;
			falloff : DistributionOptions;
		};
		//TODO: be more precise in this type
		structure : OptionValueMap;
	}
};