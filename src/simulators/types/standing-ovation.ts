import {
	DistributionOptions
} from '../../types.js';

export type StandingOvationSimOptions = {
	filledSeatProportion : number;
	rows: number;
	cols: number;
	performanceQuality: DistributionOptions;
	ovationPropensity: DistributionOptions;
	standingThreshold: DistributionOptions;
	forwardStandingFalloff: DistributionOptions;
	fomoThreshold: DistributionOptions;
};