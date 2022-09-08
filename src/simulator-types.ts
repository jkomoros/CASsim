//TODO: generate this file and don't have it in source-control.
import {
	RawSimulationConfigPartial
} from './types.js';

import {
	DiceRollSimulationOptions
} from './simulators/types/dice-roll-demo.js';

import {
	LuckSurfaceAreaSimOptions
} from './simulators/types/luck-surface-area.js';

import {
	PastureSimOptions
} from './simulators/types/pasture-demo.js';

import {
	SchellingOrgSimOptions
} from './simulators/types/schelling-org';

import {
	StandingOvationSimOptions
} from './simulators/types/standing-ovation.js';

export interface DiceRollDemoRawSimulationConfig extends RawSimulationConfigPartial {
	sim: 'dice-roll-demo';
	simOptions : DiceRollSimulationOptions | null;
}

export interface LuckSurfaceAreaRawSimulationConfig extends RawSimulationConfigPartial  {
	sim: 'luck-surface-area';
	simOptions : LuckSurfaceAreaSimOptions | null;
}

export interface PastureDemoRawSimulationConfig extends RawSimulationConfigPartial  {
	sim: 'pasture-demo';
	simOptions : PastureSimOptions | null;
}

export interface SchellingOrgRawSimulationConfig extends RawSimulationConfigPartial {
	sim: 'schelling-org';
	simOptions : SchellingOrgSimOptions | null;
}

export interface StandingOvationRawSimulationConfig extends RawSimulationConfigPartial {
	sim: 'standing-ovation';
	simOptions : StandingOvationSimOptions | null;
}

export type RawSimulationConfig = DiceRollDemoRawSimulationConfig | LuckSurfaceAreaRawSimulationConfig | PastureDemoRawSimulationConfig | SchellingOrgRawSimulationConfig | StandingOvationRawSimulationConfig;