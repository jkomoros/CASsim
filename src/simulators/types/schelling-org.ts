import {
	SimOptions
} from '../../types.js';

export type CommunicationStrategy = 'random' | 'min' | 'max' | 'disagreement';

export type NorthStarOptions = {
	emoji? : string;
	offsetType? : 'manual' | 'random' | 'random-project';
	minOffset? : number;
	maxOffset? : number;		
	offset? : number;
	strength? : number;
	spread? : number;
	believability? : number;
}

type CollaboratorIndividualOptions = {
	beliefs?: number[]
	epsilon?: number;
	emoji?: string;
	avgConnectionLikelihood?:number;
	connectionLikelihoodSpread?: number;
	compelling?:number;
	broadcastLikelihood?:number;
	optimism?:number;
	believes?: boolean;
	communicationStrategy?: CommunicationStrategy;
}

type ProjectIndividualOptions = {
	marked? : boolean;
	maxExtraValue? : number;
	maxErrorValue? : number;
	twiddleValueAmount? : number;
	value? : number;
	error? : number;
}

export type DisplayValue = {
	debug?: boolean;
	disableSelection? : boolean;
	disableBeliefs? : boolean;
}

export interface SchellingOrgSimOptions extends SimOptions {
	display? : DisplayValue;
	communication? : number;
	collaborators? : {
		count: number;
		epsilon?: number;
		avgConnectionLikelihood? : number;
		connectionLikelihoodSpread? : number;
		compelling? : number;
		broadcastLikelihood? : number;
		optimism? : number;
		communicationStrategy? : CommunicationStrategy;
		randomIndividual?: CollaboratorIndividualOptions;
		individuals?: CollaboratorIndividualOptions[];
	};
	projects?: {
		count: number;
		maxExtraValue?: number;
		maxErrorValue?: number;
		twiddleValueAmount? : number;
		randomIndividual? : ProjectIndividualOptions;
		individuals? : ProjectIndividualOptions[];
	}
	northStar? : NorthStarOptions;
}