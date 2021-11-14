import { createSelector } from "reselect";

import {
	SimulationCollection
} from "./simulation.js";

const selectRawConfigData = state => state.data ? state.data.data : [];
export const selectRawCurrentDataIndex = state => state.data ? state.data.index : 0;

export const selectPage = state => state.app ? state.app.page : '';
export const selectPageExtra = state => state.app ? state.app.pageExtra : '';

const selectSimulationCollection = createSelector(
	selectRawConfigData,
	(rawConfig) => new SimulationCollection(rawConfig)
);

export const selectCurrentDataIndex = createSelector(
	selectRawCurrentDataIndex,
	selectSimulationCollection,
	(rawIndex, collection) => {
		if (rawIndex >= 0) return rawIndex;
		if (collection.simulations.length == 0) return 0;
		return collection.simulations.length - 1;
	}
);

export const selectMaxLegalIndex = createSelector(
	selectSimulationCollection,
	(collection) => collection.simulations.length - 1
);

export const selectExpandedCurrentMapData = createSelector(
	selectSimulationCollection,
	selectCurrentDataIndex,
	(collection, currentIndex) => {
		const sim = collection.simulations[currentIndex];
		if (!sim) return null;
		return sim.run(0).frame(0);
	}
);