import { createSelector } from "reselect";

import {
	SimulationCollection,
	extractSimulatorNamesFromRawConfig,
	extractSimulatorNamesFromModifications,
	setSimulationPropertyInConfig,
	configWithDefaultedSimOptions
} from "./simulation.js";

import {
	packModificationsForURL,
	unpackSimNamesFromURL,
	shadowedModificationsForSimIndex,
	DIFF_URL_KEY,
	RUN_INDEX_URL_KEY,
	CHART_SINGLE_RUN_URL_KEY,
	EXPANDED_URL_KEY,
	CHART_EXPANDED_URL_KEY,
	CONFIGURATION_EXPANDED_URL_KEY,
	DESCRIPTION_EXPANDED_URL_KEY,
	CHART_CONFIG_IDS_URL_KEY
} from './options.js';

import {
	parseHash
} from './util.js';

import {
	RootState
} from './types.js';

const selectRawConfigData = (state : RootState) => state.data ? state.data.data : [];
const selectModifications = (state : RootState) => state.data ? state.data.modifications : [];
export const selectHash = (state : RootState) => state.data ? state.data.hash : '';
export const selectWarning = (state : RootState) => state.data ? state.data.warning : '';
export const selectFilename = (state : RootState) => state.data ? state.data.filename : '';
export const selectSimulationIndex = (state : RootState) => state.data ? state.data.simulationIndex : 0;
export const selectFrameIndex = (state : RootState) => state.data ? state.data.frameIndex : 0;
export const selectRunIndex = (state : RootState) => state.data ? state.data.runIndex : 0;
export const selectScrenshotting = (state : RootState) => state.data ? state.data.screenshotting : false;
//TODO: actually have this be the real constant for PLAY_TYPE_FRAME;
export const selectPlayType = (state : RootState) => state.data ? state.data.playType : 'frame';
export const selectPlaying = (state : RootState) => state.data ? state.data.playing : false;
export const selectDelayCount = (state : RootState) => state.data ? state.data.delayCount : 0;
export const selectShowControls = (state : RootState) => state.data ? state.data.showControls : true;
const selectRawConfigurationExpanded = (state : RootState) => state.data ? state.data.configurationExpanded : false;
const selectRawDescriptionExpanded = (state : RootState) => state.data ? state.data.descriptionExpanded : false;
const selectRawChartExpanded = (state : RootState) => state.data ? state.data.chartExpanded : false;
const selectSimulationLastChanged = (state : RootState) => state.data ? state.data.simulationLastChanged : 0;
export const selectPathExpanded = (state : RootState) => state.data ? state.data.pathExpanded : {};
export const selectScale = (state : RootState) => state.data ? state.data.scale : 1.0;
export const selectLoadedSimulators = (state : RootState) => state.data ? state.data.loadedSimulators : {};
export const selectLoadingSimulators = (state : RootState) => state.data ? state.data.loadingSimulators : {};
export const selectKnownDatafiles = (state : RootState) => state.data ? state.data.knownDatafiles : [];
export const selectKnownSimulatorNames = (state : RootState) => state.data ? state.data.knownSimulatorNames : [];
export const selectResizeVisualization = (state : RootState) => state.data ? state.data.resizeVisualization : false;
export const selectChartSingleRun = (state : RootState) => state.data ? state.data.chartSingleRun : false;
export const selectChartConfigIDs = (state : RootState) => state.data ? state.data.chartConfigIDs : '';

export const selectDialogOpen = (state : RootState) => state.data ? state.data.dialogOpen : false;
export const selectDialogType = (state : RootState) => state.data ? state.data.dialogType : '';
export const selectDialogExtras = (state : RootState) => state.data ? state.data.dialogExtras : {};

export const selectPage = (state : RootState) => state.app ? state.app.page : '';
export const selectPageExtra = (state : RootState) => state.app ? state.app.pageExtra : '';

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

export const selectChartExpanded = createSelector(
	selectShowControls,
	selectRawChartExpanded,
	(showControls, rawExpanded) => showControls && rawExpanded
);

export const selectRequiredSimulatorNames = createSelector(
	//We do want to see if there are modifications to change sim on any config item, but don't need any default expansion (default expansion relies on this value)
	selectRawConfigData,
	selectModifications,
	selectHash,
	(data, modifications, hash) => {
		//Modifications and hash TYPICALLY have similar information. But
		//modifications might not yet be populated by hash, and hash might miss
		//some shadowed modifications.
		const rawConfigNames = extractSimulatorNamesFromRawConfig(data);
		const modificationNames = extractSimulatorNamesFromModifications(modifications);
		const hashNames = unpackSimNamesFromURL(parseHash(hash)[DIFF_URL_KEY]);
		return [...new Set([...rawConfigNames, ...modificationNames, ...hashNames])];
	}
);

export const selectRequiredSimulatorsLoaded = createSelector(
	selectRequiredSimulatorNames,
	selectLoadedSimulators,
	(requiredSimulatorNames, loadedSimulators) => {
		for (const name of requiredSimulatorNames) {
			if (!loadedSimulators[name]) return false;
		}
		return true;
	}
);

export const selectCurrentSimulatorShadowedModifications = createSelector(
	selectSimulationIndex,
	selectModifications,
	(index, modifications) => shadowedModificationsForSimIndex(modifications, index)
);

const modfifiedConfigData = (rawConfigData, modifications, simulatorsLoaded = true) => {
	if (!simulatorsLoaded) return rawConfigData;
	//If any of them are missing simOptions, set them to the default
	let data = rawConfigData.map(config => configWithDefaultedSimOptions(config));
	for (const modification of modifications) {
		if (data[modification.simulationIndex] === undefined) continue;
		data = [...data];
		data[modification.simulationIndex] = setSimulationPropertyInConfig(data[modification.simulationIndex], modification.path, modification.value);
	}
	return data;
};

export const selectConfigData = createSelector(
	selectRawConfigData,
	selectModifications,
	selectRequiredSimulatorsLoaded, 
	selectKnownSimulatorNames,
	//We don't actually pass knownSimulatorNames, we just need to retickle this when they change
	(rawConfigData, modifications, simulatorsLoaded) => modfifiedConfigData(rawConfigData, modifications, simulatorsLoaded)
);

export const selectDataIsFullyLoaded = createSelector(
	selectRawConfigData,
	selectRequiredSimulatorsLoaded,
	(data, simsLoaded) => data.length > 0 && simsLoaded
);

export const selectSimulationCollection = createSelector(
	selectConfigData,
	selectRequiredSimulatorsLoaded,
	selectRawConfigData,
	selectKnownSimulatorNames,
	//We don't actually pass knownSimulatorNames, we just need to retickle this when they change
	(rawConfig, simulatorsLoaded, unmodifiedConfigData) => simulatorsLoaded ? new SimulationCollection(rawConfig, unmodifiedConfigData) : null
);

export const selectURLDiffHash = createSelector(
	selectModifications,
	selectSimulationCollection,
	selectSimulationIndex,
	(modifications, simulationCollection, simIndex) => packModificationsForURL(modifications, simulationCollection, simIndex)
);

export const selectSimulationsMap = createSelector(
	selectSimulationCollection,
	(collection) => collection ? collection.simulationsMap : {}
);

export const selectCurrentSimulation = createSelector(
	selectSimulationCollection,
	selectSimulationIndex,
	(collection, simulationIndex) => collection ? collection.simulation(simulationIndex) : null
);

export const selectCurrentSimulationName = createSelector(
	selectCurrentSimulation,
	selectSimulationIndex,
	(sim, index) => sim ? sim.name : String(index)
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

export const selectCurrentSimulationHasChartableData = createSelector(
	selectCurrentSimulation,
	(sim) => sim ? (sim.scoreConfig || []).some(obj => obj) : false
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

export const selectCurrentSimulationChartData = createSelector(
	selectChartSingleRun,
	selectCurrentSimulationRun,
	selectCurrentSimulation,
	//Detect when the downstream layer has more data that has changed and
	//recalc, even though we don't need the lastchanged value
	selectSimulationLastChanged,
	(singleRun, run, simulation) => singleRun ? (run ? run.scoreData : {}) : (simulation ? simulation.scoreData : {})
);

export const selectCurrentFrame = createSelector(
	selectCurrentSimulationRun,
	selectFrameIndex,
	(run, frameIndex) => {
		if (!run) return null;
		return run.frame(frameIndex);
	}
);

export const selectHashForCurrentState = createSelector(
	selectURLDiffHash,
	selectRunIndex,
	selectChartSingleRun,
	selectChartExpanded,
	selectConfigurationExpanded,
	selectDescriptionExpanded,
	selectChartConfigIDs,
	(urlDiff, runIndex, singleRun, chartExpanded, configurationExpanded, descriptionExpanded, configIDs) => {
		const pieces = {};
		if (urlDiff) pieces[DIFF_URL_KEY] = urlDiff;
		if (runIndex) pieces[RUN_INDEX_URL_KEY] = runIndex;
		if (singleRun) pieces[CHART_SINGLE_RUN_URL_KEY] = '1';
		if (configIDs && Object.keys(configIDs).length) pieces[CHART_CONFIG_IDS_URL_KEY] = Object.keys(configIDs).join(',');

		const expanded = [];
		if (chartExpanded) expanded.push(CHART_EXPANDED_URL_KEY);
		if (configurationExpanded) expanded.push(CONFIGURATION_EXPANDED_URL_KEY);
		//description is on by default, so store if it's DIFFERENT
		if (!descriptionExpanded) expanded.push(DESCRIPTION_EXPANDED_URL_KEY);
		if (expanded.length) pieces[EXPANDED_URL_KEY] = expanded.join(',');
		
		return Object.entries(pieces).map(entry => entry[0] + '=' + entry[1]).join('&');
	}
);