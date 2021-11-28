import { createSelector } from "reselect";

import {
	SimulationCollection
} from "./simulation.js";

export const selectRawConfigData = state => state.data ? state.data.data : [];
export const selectFilename = state => state.data ? state.data.filename : '';
export const selectSimulationIndex = state => state.data ? state.data.simulationIndex : 0;
export const selectFrameIndex = state => state.data ? state.data.frameIndex : 0;
export const selectRunIndex = state => state.data ? state.data.runIndex : 0;
//TODO: actually have this be the real constant for PLAY_TYPE_FRAME;
export const selectPlayType = state => state.data ? state.data.playType : 'frame';
export const selectPlaying = state => state.data ? state.data.playing : false;
export const selectFrameDelay = state => state.data ? state.data.frameDelay : 100;

export const selectDialogOpen = state => state.data ? state.data.dialogOpen : false;
export const selectDialogType = state => state.data ? state.data.dialogType : '';
export const selectDialogExtras = state => state.data ? state.data.dialogExtras : {};

export const selectPage = state => state.app ? state.app.page : '';
export const selectPageExtra = state => state.app ? state.app.pageExtra : '';

const selectSimulationCollection = createSelector(
	selectRawConfigData,
	(rawConfig) => new SimulationCollection(rawConfig)
);

export const selectSimulationsMap = createSelector(
	selectSimulationCollection,
	(collection) => collection.simulationsMap
);

export const selectCurrentSimulation = createSelector(
	selectSimulationCollection,
	selectSimulationIndex,
	(collection, simulationIndex) => collection.simulation(simulationIndex)
);

export const selectCurrentSimulationName = createSelector(
	selectCurrentSimulation,
	selectSimulationIndex,
	(sim, index) => sim ? sim.name : index
);

export const selectCurrentSimulationSimulatorName = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? sim.simulatorName : ''
);

export const selectCurrentSimulationWidth = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? sim.width : 0
);

export const selectCurrentSimulationHeight = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? sim.height : 0
);

export const selectMaxSimulationIndex = createSelector(
	selectRawConfigData,
	(configData) => (configData || [' ']).length - 1
);

export const selectCurrentSimulationMaxRunIndex = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? sim.maxRunIndex : Number.MAX_SAFE_INTEGER
);

export const selectCurrentSimulationRun = createSelector(
	selectCurrentSimulation,
	selectRunIndex,
	(sim, runIndex) => {
		if (!sim) return null;
		const run = sim.runs[runIndex];
		if (!run) return null;
		return run;
	}
);

export const selectCurrentFrame = createSelector(
	selectCurrentSimulationRun,
	selectFrameIndex,
	(run, frameIndex) => {
		if (!run) return null;
		return run.frame(frameIndex);
	}
);