import { createSelector } from "reselect";

import {
	SimulationCollection
} from "./simulation.js";

const selectRawConfigData = state => state.data ? state.data.data : [];
export const selectFrameIndex = state => state.data ? state.data.frameIndex : 0;

export const selectPage = state => state.app ? state.app.page : '';
export const selectPageExtra = state => state.app ? state.app.pageExtra : '';

const selectSimulationCollection = createSelector(
	selectRawConfigData,
	(rawConfig) => new SimulationCollection(rawConfig)
);

const selectCurrentSimulation = createSelector(
	selectSimulationCollection,
	(collection) => collection.simulations[0]
);

export const selectCurrentSimulationWidth = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? sim.width : 0
);

export const selectCurrentSimulationHeight = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? sim.height : 0
);

//TODO: rename this
export const selectExpandedCurrentMapData = createSelector(
	selectCurrentSimulation,
	selectFrameIndex,
	(sim, currentIndex) => {
		if (!sim) return null;
		return sim.run(0).frame(currentIndex);
	}
);