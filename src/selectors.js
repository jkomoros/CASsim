import { createSelector } from "reselect";

import {
	Simulation
} from "./simulation.js";

const selectRawConfigData = state => state.data ? state.data.data : [];
export const selectRawCurrentDataIndex = state => state.data ? state.data.index : 0;

export const selectPage = state => state.app ? state.app.page : '';
export const selectPageExtra = state => state.app ? state.app.pageExtra : '';

const selectSimulation = createSelector(
	selectRawConfigData,
	(rawConfig) => new Simulation(rawConfig)
);

export const selectCurrentDataIndex = createSelector(
	selectRawCurrentDataIndex,
	selectSimulation,
	(rawIndex, simulation) => {
		if (rawIndex >= 0) return rawIndex;
		if (simulation.runs.length == 0) return 0;
		return simulation.runs.length - 1;
	}
);

export const selectMaxLegalIndex = createSelector(
	selectSimulation,
	(simulation) => simulation.runs.length - 1
);

export const selectExpandedCurrentMapData = createSelector(
	selectSimulation,
	selectCurrentDataIndex,
	(simulation, currentIndex) => {
		const data = simulation.runs[currentIndex];
		return data ? data.frames[0] : null;
	}
);