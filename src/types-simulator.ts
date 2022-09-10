//TODO: generate this file and don't have it in source-control.
import {
	RawSimulationConfigBase,
	RawSimulationConfigExtended
} from './types.js';

import {
	DiceRollDemoSimOptions
} from './simulators/types/dice-roll-demo.js';

import {
	LuckSurfaceAreaSimOptions
} from './simulators/types/luck-surface-area.js';

import {
	PastureDemoSimOptions
} from './simulators/types/pasture-demo.js';

import {
	SchellingOrgSimOptions
} from './simulators/types/schelling-org';

import {
	StandingOvationSimOptions
} from './simulators/types/standing-ovation.js';

interface DiceRollDemoSimulationConfigExtra {
	sim: 'dice-roll-demo';
	simOptions : DiceRollDemoSimOptions | null;
}

type DiceRollDemoRawSimulationConfig = (RawSimulationConfigBase & DiceRollDemoSimulationConfigExtra) | (RawSimulationConfigExtended & DiceRollDemoSimulationConfigExtra);

interface LuckSurfaceAreaSimulationConfigExtra  {
	sim: 'luck-surface-area';
	simOptions : LuckSurfaceAreaSimOptions | null;
}

type LuckSurfaceAreaRawSimulationConfig = (RawSimulationConfigBase & LuckSurfaceAreaSimulationConfigExtra) | (RawSimulationConfigExtended & LuckSurfaceAreaSimulationConfigExtra);

interface PastureDemoSimulationConfigExtra {
	sim: 'pasture-demo';
	simOptions : PastureDemoSimOptions | null;
}

type PastureDemoRawSimulationConfig = (RawSimulationConfigBase & PastureDemoSimulationConfigExtra) | (RawSimulationConfigExtended & PastureDemoSimulationConfigExtra);

interface SchellingOrgSimulationConfigExtra {
	sim: 'schelling-org';
	simOptions : SchellingOrgSimOptions | null;
}

type SchellingOrgRawSimulationConfig = (RawSimulationConfigBase & SchellingOrgSimulationConfigExtra) | (RawSimulationConfigExtended & SchellingOrgSimulationConfigExtra);

interface StandingOvationSimulationConfigExtra {
	sim: 'standing-ovation';
	simOptions : StandingOvationSimOptions | null;
}

type StandingOvationRawSimulationConfig = (RawSimulationConfigBase & StandingOvationSimulationConfigExtra) | (RawSimulationConfigExtended & StandingOvationSimulationConfigExtra);

export type RawSimulationConfig = DiceRollDemoRawSimulationConfig | LuckSurfaceAreaRawSimulationConfig | PastureDemoRawSimulationConfig | SchellingOrgRawSimulationConfig | StandingOvationRawSimulationConfig;