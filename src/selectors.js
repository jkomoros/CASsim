import { createSelector } from "reselect";

import {
	SimulationCollection
} from "./simulation.js";

const selectRawConfigData = state => state.data ? state.data.data : [];
export const selectSimulationIndex = state => state.data ? state.data.simulationIndex : 0;
export const selectFrameIndex = state => state.data ? state.data.frameIndex : 0;
export const selectRunIndex = state => state.data ? state.data.runIndex : 0;

export const selectPage = state => state.app ? state.app.page : '';
export const selectPageExtra = state => state.app ? state.app.pageExtra : '';

const selectSimulationCollection = createSelector(
	selectRawConfigData,
	(rawConfig) => new SimulationCollection(rawConfig)
);

const selectCurrentSimulation = createSelector(
	selectSimulationCollection,
	selectSimulationIndex,
	(collection, simulationIndex) => collection.simulation(simulationIndex)
);

export const selectCurrentSimulationWidth = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? sim.width : 0
);

export const selectCurrentSimulationHeight = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? sim.height : 0
);

export const selectCurrentFrame = createSelector(
	selectCurrentSimulation,
	selectRunIndex,
	selectFrameIndex,
	(sim, runIndex, frameIndex) => {
		if (!sim) return null;
		const run = sim.run(runIndex);
		if (!run) return null;
		return run.frame(frameIndex);
	}
);