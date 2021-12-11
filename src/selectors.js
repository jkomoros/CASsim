import { createSelector } from "reselect";

import {
	SimulationCollection,
	extractSimulatorNamesFromRawConfig
} from "./simulation.js";

export const selectRawConfigData = state => state.data ? state.data.data : [];
export const selectFilename = state => state.data ? state.data.filename : '';
export const selectSimulationIndex = state => state.data ? state.data.simulationIndex : 0;
export const selectFrameIndex = state => state.data ? state.data.frameIndex : 0;
export const selectRunIndex = state => state.data ? state.data.runIndex : 0;
//TODO: actually have this be the real constant for PLAY_TYPE_FRAME;
export const selectPlayType = state => state.data ? state.data.playType : 'frame';
export const selectPlaying = state => state.data ? state.data.playing : false;
export const selectDelayCount = state => state.data ? state.data.delayCount : 0;
export const selectShowControls = state => state.data ? state.data.showControls : true;
const selectRawConfigurationExpanded = state => state.data ? state.data.configurationExpanded : false;
const selectRawDescriptionExpanded = state => state.data ? state.data.descriptionExpanded : false;
export const selectPathExpanded = state => state.data ? state.data.pathExpanded : {};
export const selectScale = state => state.data ? state.data.scale : 1.0;
export const selectLoadedSimulators = state => state.data ? state.data.loadedSimulators : {};
export const selectKnownDatafiles = state => state.data ? state.data.knownDatafiles : [];
export const selectKnownSimulatorNames = state => state.data ? state.data.knownSimulatorNames : [];
export const selectResizeVisualization = state => state.data ? state.data.resizeVisualization : false;

export const selectDialogOpen = state => state.data ? state.data.dialogOpen : false;
export const selectDialogType = state => state.data ? state.data.dialogType : '';
export const selectDialogExtras = state => state.data ? state.data.dialogExtras : {};

export const selectPage = state => state.app ? state.app.page : '';
export const selectPageExtra = state => state.app ? state.app.pageExtra : '';

export const selectConfigurationExpanded = createSelector(
	selectShowControls,
	selectRawConfigurationExpanded,
	(showControls, rawExpanded) => showControls && rawExpanded
);

export const selectDescriptionExpanded = createSelector(
	selectShowControls,
	selectRawDescriptionExpanded,
	(showControls, rawExpanded) => showControls && rawExpanded
);

const selectRequiredSimulatorsLoaded = createSelector(
	selectRawConfigData,
	selectLoadedSimulators,
	(data, loadedSimulators) => {
		const requiredSimulatorNames = extractSimulatorNamesFromRawConfig(data);
		for (const name of requiredSimulatorNames) {
			if (!loadedSimulators[name]) return false;
		}
		return true;
	}
);

export const selectDataIsFullyLoaded = createSelector(
	selectRawConfigData,
	selectRequiredSimulatorsLoaded,
	(data, simsLoaded) => data.length > 0 && simsLoaded
);

const selectSimulationCollection = createSelector(
	selectRawConfigData,
	selectRequiredSimulatorsLoaded,
	selectKnownSimulatorNames,
	(rawConfig, simulatorsLoaded, knownSimulatorNames) => simulatorsLoaded ? new SimulationCollection(rawConfig, knownSimulatorNames) : null
);

export const selectSimulationsMap = createSelector(
	selectSimulationCollection,
	(collection) => collection ? collection.simulationsMap : null
);

export const selectCurrentSimulation = createSelector(
	selectSimulationCollection,
	selectSimulationIndex,
	(collection, simulationIndex) => collection ? collection.simulation(simulationIndex) : null
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

export const selectFrameDelay = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? sim.frameDelay : 0
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
	(configData) => Math.max(configData.length - 1, 0)
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