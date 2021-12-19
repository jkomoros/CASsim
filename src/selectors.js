import { createSelector } from "reselect";

import {
	SimulationCollection,
	extractSimulatorNamesFromRawConfig,
	Simulation
} from "./simulation.js";

import {
	setSimPropertyInConfig
} from './options.js';

import {
	DEFAULT_SENTINEL,
	packModificationsForURL
} from './util.js';

const selectRawConfigData = state => state.data ? state.data.data : [];
const selectModifications = state => state.data ? state.data.modifications : [];
export const selectHash = state => state.data ? state.data.hash : '';
export const selectFilename = state => state.data ? state.data.filename : '';
export const selectSimulationIndex = state => state.data ? state.data.simulationIndex : 0;
export const selectFrameIndex = state => state.data ? state.data.frameIndex : 0;
export const selectRunIndex = state => state.data ? state.data.runIndex : 0;
export const selectScrenshotting = state => state.data ? state.data.screenshotting : false;
//TODO: actually have this be the real constant for PLAY_TYPE_FRAME;
export const selectPlayType = state => state.data ? state.data.playType : 'frame';
export const selectPlaying = state => state.data ? state.data.playing : false;
export const selectDelayCount = state => state.data ? state.data.delayCount : 0;
export const selectShowControls = state => state.data ? state.data.showControls : true;
const selectRawConfigurationExpanded = state => state.data ? state.data.configurationExpanded : false;
const selectRawDescriptionExpanded = state => state.data ? state.data.descriptionExpanded : false;
const selectSimulationLastChanged = state => state.data ? state.data.simulationLastChanged : 0;
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

export const selectHasModifications = createSelector(
	selectModifications,
	(modifications) => modifications.length > 0
);

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

const modfifiedConfigData = (rawConfigData, modifications, simulatorsLoaded = true, simulatorNames = [], expandDefault = false) => {
	if (!simulatorsLoaded) return rawConfigData;
	let data = rawConfigData;
	for (const modification of modifications) {
		data = [...data];
		let value = modification.value;
		if (value == DEFAULT_SENTINEL) {
			if (!expandDefault) {
				continue;
			}
			try {
				const simulation = new Simulation(data[modification.simulationIndex], 0, simulatorNames);
				value = simulation.defaultValueForOptionsPath(modification.path);
			} catch(err) {
				console.warn('Couldn\'t fetch default value from simulator: ' + err);
				return data;
			}
		}
		data[modification.simulationIndex] = setSimPropertyInConfig(data[modification.simulationIndex], modification.path, value);
	}
	return data;
};

const selectModififedConfigDataNoDefaults = createSelector(
	selectRawConfigData,
	selectModifications,
	(rawConfigData, modifications) => modfifiedConfigData(rawConfigData, modifications)
);

const selectRequiredSimulatorsLoaded = createSelector(
	//We do want to see if there are modifications to change sim on any config item, but don't need any default expansion (default expansion relies on this value)
	selectModififedConfigDataNoDefaults,
	selectLoadedSimulators,
	(data, loadedSimulators) => {
		const requiredSimulatorNames = extractSimulatorNamesFromRawConfig(data);
		for (const name of requiredSimulatorNames) {
			if (!loadedSimulators[name]) return false;
		}
		return true;
	}
);

export const selectConfigData = createSelector(
	selectRawConfigData,
	selectModifications,
	selectRequiredSimulatorsLoaded, 
	selectKnownSimulatorNames,
	(rawConfigData, modifications, simulatorsLoaded, simulatorNames) => modfifiedConfigData(rawConfigData, modifications, simulatorsLoaded, simulatorNames, true)
);

export const selectDataIsFullyLoaded = createSelector(
	selectRawConfigData,
	selectRequiredSimulatorsLoaded,
	(data, simsLoaded) => data.length > 0 && simsLoaded
);

const selectSimulationCollection = createSelector(
	selectConfigData,
	selectRequiredSimulatorsLoaded,
	selectKnownSimulatorNames,
	(rawConfig, simulatorsLoaded, knownSimulatorNames) => simulatorsLoaded ? new SimulationCollection(rawConfig, knownSimulatorNames) : null
);

export const selectURLDiffHash = createSelector(
	selectModifications,
	selectSimulationCollection,
	selectSimulationIndex,
	(modifications, simulationCollection, simIndex) => packModificationsForURL(modifications, simulationCollection, simIndex)
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
	selectConfigData,
	(configData) => Math.max(configData.length - 1, 0)
);

export const selectCurrentSimulationMaxRunIndex = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? sim.maxRunIndex : Number.MAX_SAFE_INTEGER
);

export const selectCurrentSimulationRunStatuses = createSelector(
	selectCurrentSimulation,
	selectSimulationLastChanged,
	(sim) => sim ? sim.runs.map(run => run.finalStatus) : []
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