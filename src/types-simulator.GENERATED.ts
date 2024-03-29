//This file was generated by `npm run generate:types`

//All of these exports are also re-exported from src/types.ts, so you should import them from there.

import {
	RawSimulationConfigBase,
	RawSimulationConfigExtended
} from './types.js';

import {
	DiceRollDemoSimOptions
} from './simulators/types/dice-roll-demo.GENERATED.js';

import {
	FreeMovingAgentsSimOptions
} from './simulators/types/free-moving-agents.GENERATED.js';

import {
	LuckSurfaceAreaSimOptions
} from './simulators/types/luck-surface-area.GENERATED.js';

import {
	PastureDemoSimOptions
} from './simulators/types/pasture-demo.GENERATED.js';

import {
	SchellingOrgSimOptions
} from './simulators/types/schelling-org.GENERATED.js';

import {
	StandingOvationSimOptions
} from './simulators/types/standing-ovation.GENERATED.js';

import {
	StubSimOptions
} from './simulators/types/stub.GENERATED.js';

interface DiceRollDemoSimulationConfigExtra {
	sim: 'dice-roll-demo';
	simOptions: DiceRollDemoSimOptions | null;
}

type DiceRollDemoRawSimulationConfig = (RawSimulationConfigBase & DiceRollDemoSimulationConfigExtra) | (RawSimulationConfigExtended & DiceRollDemoSimulationConfigExtra);
		
interface FreeMovingAgentsSimulationConfigExtra {
	sim: 'free-moving-agents';
	simOptions: FreeMovingAgentsSimOptions | null;
}

type FreeMovingAgentsRawSimulationConfig = (RawSimulationConfigBase & FreeMovingAgentsSimulationConfigExtra) | (RawSimulationConfigExtended & FreeMovingAgentsSimulationConfigExtra);
		
interface LuckSurfaceAreaSimulationConfigExtra {
	sim: 'luck-surface-area';
	simOptions: LuckSurfaceAreaSimOptions | null;
}

type LuckSurfaceAreaRawSimulationConfig = (RawSimulationConfigBase & LuckSurfaceAreaSimulationConfigExtra) | (RawSimulationConfigExtended & LuckSurfaceAreaSimulationConfigExtra);
		
interface PastureDemoSimulationConfigExtra {
	sim: 'pasture-demo';
	simOptions: PastureDemoSimOptions | null;
}

type PastureDemoRawSimulationConfig = (RawSimulationConfigBase & PastureDemoSimulationConfigExtra) | (RawSimulationConfigExtended & PastureDemoSimulationConfigExtra);
		
interface SchellingOrgSimulationConfigExtra {
	sim: 'schelling-org';
	simOptions: SchellingOrgSimOptions | null;
}

type SchellingOrgRawSimulationConfig = (RawSimulationConfigBase & SchellingOrgSimulationConfigExtra) | (RawSimulationConfigExtended & SchellingOrgSimulationConfigExtra);
		
interface StandingOvationSimulationConfigExtra {
	sim: 'standing-ovation';
	simOptions: StandingOvationSimOptions | null;
}

type StandingOvationRawSimulationConfig = (RawSimulationConfigBase & StandingOvationSimulationConfigExtra) | (RawSimulationConfigExtended & StandingOvationSimulationConfigExtra);
		
interface StubSimulationConfigExtra {
	sim: 'stub';
	simOptions: StubSimOptions | null;
}

type StubRawSimulationConfig = (RawSimulationConfigBase & StubSimulationConfigExtra) | (RawSimulationConfigExtended & StubSimulationConfigExtra);
		
export type RawSimulationConfig = DiceRollDemoRawSimulationConfig | FreeMovingAgentsRawSimulationConfig | LuckSurfaceAreaRawSimulationConfig | PastureDemoRawSimulationConfig | SchellingOrgRawSimulationConfig | StandingOvationRawSimulationConfig | StubRawSimulationConfig;