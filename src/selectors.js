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

//TODO: rename this
export const selectCurrentDataIndex = createSelector(
	selectFrameIndex,
	selectSimulationCollection,
	(rawIndex, collection) => {
		if (rawIndex >= 0) return rawIndex;
		if (collection.simulations.length == 0) return 0;
		return collection.simulations.length - 1;
	}
);

export const selectExpandedCurrentMapData = createSelector(
	selectSimulationCollection,
	selectCurrentDataIndex,
	(collection, currentIndex) => {
		const sim = collection.simulations[0];
		if (!sim) return null;
		return sim.run(0).frame(currentIndex);
	}
);