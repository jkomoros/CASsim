export const LOAD_DATA = "LOAD_DATA";
export const UPDATE_CURRENT_SIMULATION_CONFIG = "UPDATE_CURRENT_SIMULATION_CONFIG";
export const REMOVE_MODIFICATIONS_FOR_PATH = 'REMOVE_MODIFICATIONS_FOR_PATH';
export const UPDATE_FILENAME = 'UPDATE_FILENAME';
export const UPDATE_SIMULATION_INDEX = 'UPDATE_SIMULATION_INDEX';
export const UPDATE_RUN_INDEX = 'UPDATE_RUN_INDEX';
export const UPDATE_FRAME_INDEX = 'UPDATE_FRAME_INDEX';
export const UPDATE_DIALOG_OPEN = 'UPDATE_DIALOG_OPEN';
export const UPDATE_PLAY_TYPE = 'UPDATE_PLAY_TYPE';
export const UPDATE_PLAYING = 'UPDATE_PLAYING';
export const UPDATE_DELAY_COUNT = 'UPDATE_DELAY_COUNT';
export const UPDATE_SHOW_CONTROLS = 'UPDATE_SHOW_CONTROLS';
export const UPDATE_CONFIGURATION_EXPANDED = 'UPDATE_CONFIGURATION_EXPANDED';
export const UPDATE_DESCRIPTION_EXPANDED = 'UPDATE_DESCRIPTION_EXPANDED';
export const UPDATE_CHART_EXPANDED = 'UPDATE_CHART_EXPANDED';
export const UPDATE_PATH_EXPANDED = 'UPDATE_PATH_EXPANDED';
export const UPDATE_SCALE = 'UPDATE_SCALE';
export const SIMULATOR_LOADING = 'SIMULATOR_LOADING';
export const SIMULATOR_LOADED = 'SIMULATOR_LOADED';
export const UPDATE_KNOWN_SIMULATOR_NAMES = 'UPDATE_KNOWN_SIMULATOR_NAMES';
export const UPDATE_KNOWN_DATAFILES = 'UPDATE_KNOWN_DATAFILES';
export const UPDATE_RESIZE_VISUALIZATION = 'UPDATE_RESIZE_VISUALIZATION';
export const REPLACE_MODIFICATIONS = 'REPLACE_MODIFICATIONS';
export const CLEAR_MODIFICATIONS = 'CLEAR_MODIFICATIONS';
export const SIMULATION_CHANGED = 'SIMULATION_CHANGED';
export const UPDATE_SCREENSHOTTING = 'UPDATE_SCREENSHOTTING';
export const UPDATE_HASH = 'UPDATE_HASH';
export const UPDATE_WARNING = 'UPDATE_WARNING';
export const UPDATE_CHART_SINGLE_RUN = 'UPDATE_CHART_SINGLE_RUN';
export const UPDATE_CHART_CONFIG_IDS = 'UPDATE_CHART_CONFIG_IDS';

export const DIALOG_TYPE_JSON = 'json';
export const DIALOG_TYPE_ADD_FIELD = 'add-field';

//Also in gulpfile.js
export const DATA_DIRECTORY = 'data';
export const LISTINGS_JSON_PATH = 'src/listings.json';

export const DEFAULT_FILE_NAME = 'default';

//When playing forward into the next frame, where do we stop?
//Frame == stop at the end of a round
export const PLAY_TYPE_FRAME = 'frame';
//Round == stop at the end of a simulation
export const PLAY_TYPE_ROUND = 'round';
//Play all frames across all simulations
export const PLAY_TYPE_SIMULATION = 'simulation';

export const LEGAL_PLAY_TYPES = {
	[PLAY_TYPE_FRAME]: true,
	[PLAY_TYPE_ROUND]: true,
	[PLAY_TYPE_SIMULATION]: true,
};

import {
	canonicalizePath
} from './app.js';

import {
	selectSimulationIndex,
	selectFrameIndex,
	selectRunIndex,
	selectCurrentSimulationMaxRunIndex,
	selectCurrentSimulationRun,
	selectCurrentSimulation,
	selectFilename,
	selectSimulationsMap,
	selectMaxSimulationIndex,
	selectPlayType,
	selectPlaying,
	selectFrameDelay,
	selectDelayCount,
	selectLoadedSimulators,
	selectRequiredSimulatorNames,
	selectScale,
	selectDataIsFullyLoaded,
	selectHasModifications,
	selectHash,
	selectSimulationCollection,
	selectLoadingSimulators,
	selectHashForCurrentState
} from '../selectors.js';

import {
	configForPath,
	configIsAdvanced,
	maySetPropertyInConfigObject,
	unpackModificationsFromURL,
	DIFF_URL_KEY,
	RUN_INDEX_URL_KEY,
	CHART_SINGLE_RUN_URL_KEY
} from '../options.js';

import { store } from '../store.js';

import {
	KNOWN_SIMULATOR_NAMES,
	SIMULATORS,
} from '../simulation.js';

import {
	unpackConfigJSON
} from '../config.js';

import {
	DEFAULT_SENTINEL,
	parseHash,
} from '../util.js';

const SIMULATORS_DIRECTORY = 'simulators';

export const loadData = (blob) => (dispatch) => {
	let data;
	try {
		data = unpackConfigJSON(blob);
	} catch(err) {
		console.warn('Couldn\'t load data:' + err);
		return;
	}
	dispatch({
		type: LOAD_DATA,
		data,
	});
	//We don't dispatch fetchNeededSimulators; sim-view will notice and call it for us.
	dispatch(verifyValidIndexes());
	dispatch(simulationActivated());
};

export const fetchNeededSimulators = () => (dispatch, getState) => {
	const state = getState();
	const loadedSimulators = selectLoadedSimulators(state);
	const loadingSimulators = selectLoadingSimulators(state);
	const neededSimulatorNames =  selectRequiredSimulatorNames(state);
	for (const name of neededSimulatorNames) {
		if (loadedSimulators[name]) continue;
		if (loadingSimulators[name]) continue;
		dispatch({
			type: SIMULATOR_LOADING,
			name,
		});
		(async () => {
			try {
				const mod = await import('../' + SIMULATORS_DIRECTORY + '/' + name + '.js');
				//The module might be a proper, uncompiled module, or might be a
				//mangled, built module. Extract the default export in either
				//case.
				let simulator = null;
				for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(mod))) {
					if (key == 'default' || (key.endsWith('Default') && key.startsWith('$'))) {
						simulator = descriptor.value;
						break;
					}
				}
				dispatch(simulatorLoaded(simulator));
			} catch(err) {
				console.warn('Couldn\'t load simulator: ' + name + ': ' + err);
			}
		})();
	}
};

const updateScreenshotting = (on) => {
	return {
		type: UPDATE_SCREENSHOTTING,
		on
	};
};

export const enableScreenshotting = () => (dispatch) => {
	dispatch(updateScreenshotting(true));
	dispatch(updateShowControls(false));
	dispatch(updateResizeVisualization(false));
	dispatch(updatePlayType(PLAY_TYPE_SIMULATION));
	dispatch(advanceToLastFrameInConfig());
};

export const verifyValidIndexes = () => (dispatch, getState) => {
	const simulationIndex = selectSimulationIndex(getState());
	//All of these dispatches will be either noops or cut it to a valid index
	dispatch(updateSimulationIndex(simulationIndex));
	//Fetch state again because it might have changed just above
	const runIndex = selectRunIndex(getState());
	dispatch(updateRunIndex(runIndex));
	
	const frameIndex = selectFrameIndex(getState());
	dispatch(updateFrameIndex(frameIndex));
};

export const updateWithSimPageExtra = (pageExtra) => (dispatch, getState) => {
	const parts = pageExtra.split('/');
	//The last piece is the trailing slash
	//TODO: handle malformed URLs better
	if (parts.length != 3) return;
	const filename = parts[0];
	const simulationName = parts[1];

	const simulationsMap = selectSimulationsMap(getState());
	const fallbackIndex = parseInt(simulationName);
	const simulation = simulationsMap[simulationName];
	const simulationIndex = simulation ? simulation.index : (isNaN(fallbackIndex) ? 0 : fallbackIndex);

	//Each of these will return if a no op
	dispatch(updateFilename(filename, true));
	if (selectDataIsFullyLoaded(getState())) dispatch(updateSimulationIndex(simulationIndex, true));
};

export const resetSimulation = () => (dispatch) => {
	dispatch(updateRunIndex(0));
	dispatch(updateFrameIndex(0));
};

const simulationActivated = () => (dispatch, getState) => {
	//This might be called multiple times per simulation activation
	const state = getState();
	const simulation = selectCurrentSimulation(state);
	if (!simulation) return;
	if (simulation.autoPlay && !selectPlaying(state)) {
		dispatch(resetSimulation());
		dispatch(updatePlaying(true));
	}
};

export const togglePlaying = () => (dispatch, getState) => {
	const playing = selectPlaying(getState());
	dispatch(updatePlaying(!playing));
};

let playingInterval = -1;

export const updatePlaying = (enabled) => (dispatch, getState) => {
	const state = getState();
	const playing = selectPlaying(state);
	if (playing == enabled) return;
	if (enabled) {
		playingInterval = setInterval(advanceFrame, selectFrameDelay(state));
	} else {
		clearInterval(playingInterval);
		playingInterval = -1;
	}
	dispatch({
		type: UPDATE_PLAYING,
		playing: enabled,
	});
};

export const advanceToLastFrameInConfig =() => (dispatch) => {
	//All of these will be set to the highest number they can be before being set.
	dispatch(updateSimulationIndex(Number.MAX_SAFE_INTEGER));
	dispatch(updateRunIndex(Number.MAX_SAFE_INTEGER));
	dispatch(updateFrameIndex(Number.MAX_SAFE_INTEGER));
};

export const advanceToLastFrameInRun = () => (dispatch) => {
	//Just try to jump too far in the future and updateFramIndex will cut us back.
	dispatch(updateFrameIndex(Number.MAX_SAFE_INTEGER));
};

const advanceFrame = () => {
	store.dispatch(nextFrameIndex(true));
};

export const nextFrameIndex = (fromInterval) => (dispatch, getState) => {
	const state = getState();
	//Don't allow anything but the interval to advance (so a user can't hit the arrow key and advance when playing)
	if (!fromInterval && selectPlaying(state)) return;
	let delayCount = selectDelayCount(state);
	let delayed = false;
	if (fromInterval && delayCount) {
		delayCount--;
		dispatch(updateDelayCount(delayCount));
		//Fall through on the last time through
		if (delayCount) return;
		delayed = true;
	}
	const playType = selectPlayType(state);
	let frameIndex = selectFrameIndex(state);
	let runIndex = selectRunIndex(state);
	let simulationIndex = selectSimulationIndex(state);
	frameIndex++;
	const run = selectCurrentSimulationRun(state);
	//run won't exist yet in the case that the URL is being parsed before the data exists
	if (run) {
		//Probe directly for whether this index will be legal BEFORE we set it.
		if (run.frameIndexLegal(frameIndex)) {
			dispatch(updateFrameIndex(frameIndex));
			return;
		}
		frameIndex = run.maxFrameIndex;
		//Only go into delay counting if we didn't just finish a delay count loop
		if (fromInterval && !delayed) {
			const delayCount = run.simulation.extraFinalFrameCount;
			if (delayCount) {
				dispatch(updateDelayCount(delayCount));
				return;
			}
		}
	}
	if (playType != PLAY_TYPE_ROUND && playType != PLAY_TYPE_SIMULATION) return;

	runIndex++;
	const maxRunIndex = selectCurrentSimulationMaxRunIndex(state);
	if (runIndex <= maxRunIndex) {
		frameIndex = 0;
		dispatch(updateRunIndex(runIndex));
		dispatch(updateFrameIndex(frameIndex));
		return;
	}

	if (run && run.simulation.repeat) {
		dispatch(resetSimulation());
	}

	if (playType != PLAY_TYPE_SIMULATION) return;

	simulationIndex++;
	const maxSimulationIndex = selectMaxSimulationIndex(state);
	if (simulationIndex <= maxSimulationIndex) {
		runIndex = 0;
		frameIndex = 0;
		dispatch(updateSimulationIndex(simulationIndex));
		dispatch(updateRunIndex(runIndex));
		dispatch(updateFrameIndex(frameIndex));
		return;
	}

	//If we get to here then we can't advance any more. Ensure we aren't playing!
	dispatch(updatePlaying(false));
};

export const prevFrameIndex = (fromInterval) => (dispatch, getState) => {
	const state = getState();
	//Don't allow anything but the interval to advance (so a user can't hit the arrow key and advance when playing)
	if (!fromInterval && selectPlaying(state)) return;
	const playType = selectPlayType(state);
	let frameIndex = selectFrameIndex(state);
	let runIndex = selectRunIndex(state);
	let simulationIndex = selectSimulationIndex(state);
	frameIndex--;
	if (frameIndex >= 0) {
		dispatch(updateFrameIndex(frameIndex));
		return;
	}

	if (playType != PLAY_TYPE_ROUND && playType != PLAY_TYPE_SIMULATION) return;

	runIndex--;
	if (runIndex >= 0) {
		dispatch(updateRunIndex(runIndex));
		const run = selectCurrentSimulationRun(getState());
		if (run) {
			frameIndex = run.maxFrameIndex;
		} else {
			frameIndex = 0;
		}
		dispatch(updateFrameIndex(frameIndex));
		return;
	}

	if (playType != PLAY_TYPE_SIMULATION) return;

	simulationIndex--;
	if (simulationIndex >= 0) {
		dispatch(updateSimulationIndex(simulationIndex));
		runIndex = selectCurrentSimulationMaxRunIndex(getState());
		dispatch(updateRunIndex(runIndex));
		const run = selectCurrentSimulationRun(getState());
		if (run) {
			frameIndex = run.maxFrameIndex;
		} else {
			frameIndex = 0;
		}
		dispatch(updateFrameIndex(frameIndex));
		return;
	}

	//If we get to here then we can't advance any more. Ensure we aren't playing!
	dispatch(updatePlaying(false));
};

export const updateFilename = (filename, skipCanonicalize) => (dispatch, getState) => {
	const state = getState();
	const currentFilename = selectFilename(state);
	if (currentFilename == filename) return;
	if (selectHasModifications(state)) {
		if (!confirm('You have made modifications. Switching files will delete them and cannot be undone. Is that OK?')) return;
	}
	dispatch({
		type: UPDATE_FILENAME,
		filename,
	});
	if (!skipCanonicalize) dispatch(canonicalizePath());
};

export const updateSimulationIndex = (index, skipCanonicalize) => (dispatch, getState) => {
	index = parseInt(index);
	const currentIndex = selectSimulationIndex(getState());
	if (index < 0) index = 0;
	const maxIndex = selectMaxSimulationIndex(getState());
	if (index > maxIndex) index = maxIndex;
	if (currentIndex == index) return;
	dispatch({
		type: UPDATE_SIMULATION_INDEX,
		index,
	});
	dispatch(verifyValidIndexes());
	dispatch(simulationActivated());
	if (!skipCanonicalize) dispatch(canonicalizePath());
};

export const updateFrameIndex = (index) => (dispatch, getState) => {
	if (typeof index == 'string') index = parseInt(index);
	const state = getState();
	const run = selectCurrentSimulationRun(state);
	if (index < 0) index = 0;
	//run won't exist yet in the case that the URL is being parsed before the data exists
	if (run) {
		//Probe directly for whether this index will be legal BEFORE we set it.
		if (!run.frameIndexLegal(index)) {
			index = run.maxFrameIndex;
		}
	}
	//no op
	if (index == selectFrameIndex(state)) return;
	dispatch({
		type: UPDATE_FRAME_INDEX,
		index,
	});
};

export const updateRunIndex = (index) => (dispatch, getState) => {
	if (typeof index == 'string') index = parseInt(index);
	const state = getState();
	if (index < 0) {
		index = 0;
	}
	if (index > selectCurrentSimulationMaxRunIndex(state)) {
		index = selectCurrentSimulationMaxRunIndex(state);
	}
	//No op
	if (index == selectRunIndex(state)) return;
	dispatch({
		type: UPDATE_RUN_INDEX,
		index,
	});
	dispatch(verifyValidIndexes());
};

export const updateCurrentSimulationOptions = (path, value) => (dispatch, getState) => {
	const state = getState();
	const simulation = selectCurrentSimulation(state);
	const valueOrDefault = value == DEFAULT_SENTINEL ? simulation.defaultValueForOptionsPath(path) : value;
	//If it's default, we want the state to store that it was the default
	//value... but we still need to test that the default value is legal (it
	//almost without question should be).
	const problem = maySetPropertyInConfigObject(simulation.optionsConfig, simulation.config, path, valueOrDefault);
	if (problem) {
		alert('Invalid modification proposed: ' + path + ': ' + value + ': ' + problem);
		return;
	}
	dispatch({
		type: UPDATE_CURRENT_SIMULATION_CONFIG,
		path,
		value
	});
	//If the thing we just modified was advanced, then make sure hte advanced zippy in the PARENT is expanded.
	const config = configForPath(simulation.optionsConfig, path);
	if (configIsAdvanced(config)) {
		const parts = path.split('.');
		parts.pop();
		dispatch(updatePathExpanded(parts.join('.'), true));
	}
	//We don't dispatch fetchNeededSimulators; sim-view will notice and call it for us.
	dispatch(verifyValidIndexes());
};

export const removeModificationsForPath = (path) => {
	return {
		type: REMOVE_MODIFICATIONS_FOR_PATH,
		path
	};
};

export const openDialog = (typ, optExtras) => {
	return {
		type: UPDATE_DIALOG_OPEN,
		open: true,
		dialogType: typ,
		extras: optExtras
	};
};

export const closeDialog = () => {
	return {
		type: UPDATE_DIALOG_OPEN,
		open: false,
	};
};

export const updatePlayType = (typ) => {
	if (!LEGAL_PLAY_TYPES[typ]) {
		console.warn(typ + ' is not a legal playType');
		return;
	}
	return {
		type: UPDATE_PLAY_TYPE,
		playType: typ,
	};
};

export const updateDelayCount = (count) => {
	return {
		type: UPDATE_DELAY_COUNT,
		count
	};
};

export const updateShowControls = (show) => {
	return {
		type: UPDATE_SHOW_CONTROLS,
		show
	};
};

export const updateConfigurationExpanded = (expanded) => {
	return {
		type: UPDATE_CONFIGURATION_EXPANDED,
		expanded
	};
};

export const updateDescriptionExpanded = (expanded) => {
	return {
		type: UPDATE_DESCRIPTION_EXPANDED,
		expanded
	};
};

export const updateChartExpanded = (expanded) => {
	return {
		type: UPDATE_CHART_EXPANDED,
		expanded
	};
};

export const updatePathExpanded = (path, expanded) => {
	return {
		type: UPDATE_PATH_EXPANDED,
		path,
		expanded
	};
};

export const updateScale = (scale) => (dispatch, getState) => {
	if (scale == selectScale(getState())) return;
	dispatch({
		type: UPDATE_SCALE,
		scale,
	});
};

export const simulatorLoaded = (simulatorConstructor) => (dispatch) => {
	if (!simulatorConstructor) {
		console.warn('No simulator provided');
		return;
	}
	const simulator = new simulatorConstructor();
	const name = simulator.name;
	SIMULATORS[name] = simulator;
	dispatch({
		type: SIMULATOR_LOADED,
		name,
	});
};

export const updateKnownDatafiles = (datafiles) => (dispatch) => {
	if (!Array.isArray(datafiles)) {
		console.warn('datafiles is not an array');
		return;
	}
	dispatch({
		type: UPDATE_KNOWN_DATAFILES,
		datafiles,
	});
};

export const updateKnownSimulatorNames = (simulatorNames) => (dispatch) => {
	if (!Array.isArray(simulatorNames)) {
		console.warn('simulatorsNames is not an array');
		return;
	}
	//Yes, this is bad, bad, bad. I don't want to pass around
	//knownSimulatorNames from state into Simulation all of the time (we have to
	//clone them a bunch in random places) for no good reason, so we'll store
	//them on the side for the drop down. We already re-generate them when this
	//changes by having the selectors invalidate when knownSimulatorNames
	//changes, even though we don't pass it to the SimulationCollection/Simulation constructors.
	for (const name of simulatorNames) {
		KNOWN_SIMULATOR_NAMES[name] = true;
	}
	dispatch({
		type: UPDATE_KNOWN_SIMULATOR_NAMES,
		simulatorNames,
	});
};

export const updateResizeVisualization = (resize) => {
	return {
		type: UPDATE_RESIZE_VISUALIZATION,
		resize,
	};
};

export const updateLayout = (wide) => (dispatch) => {
	dispatch(updateConfigurationExpanded(wide));
};

export const clearModifications = () => (dispatch, getState) => {
	if (!selectHasModifications(getState())) return;
	if (!confirm('OK to throw away modifications you have made? This cannot be undone')) return;
	dispatch({
		type: CLEAR_MODIFICATIONS,
	});
};

export const simulationChanged = () => {
	return {
		type: SIMULATION_CHANGED
	};
};

export const canonicalizeHash = () => (dispatch, getState) => {
	const state = getState();
	if (!selectDataIsFullyLoaded(state)) return;
	const hash = selectHashForCurrentState(state);
	dispatch(updateHash(hash));
};

const ingestHash = (hash) => (dispatch, getState) => {
	const state = getState();
	const pieces = parseHash(hash);
	for (const [key, value] of Object.entries(pieces)) {
		switch (key) {
		case DIFF_URL_KEY:
			const [mods, warning] = unpackModificationsFromURL(value, selectSimulationCollection(state), selectSimulationIndex(state));
			if (warning) dispatch(updateWarning(warning));
			dispatch(replaceModifications(mods));
			break;
		case RUN_INDEX_URL_KEY:
			const index = parseInt(value);
			if (!isNaN(index)) dispatch(updateRunIndex(index));
			break;
		case CHART_SINGLE_RUN_URL_KEY:
			const val = parseInt(value);
			if (!isNaN(val) && val) dispatch(updateChartSingleRun(true));
			break;
		default:
			console.warn('Unknown hash parameter: ', key, value);
		}
	}
};

export const updateHash = (hash, comesFromURL) => (dispatch, getState) => {
	if (hash.startsWith('#')) hash = hash.substring(1);
	const state = getState();
	const dataFullyLoaded = selectDataIsFullyLoaded(state);
	const currentHash = selectHash(state);
	if (hash == currentHash && dataFullyLoaded && !comesFromURL) return;
	//Only try to parse the hash if fully loaded
	if (comesFromURL && dataFullyLoaded) {
		dispatch(ingestHash(hash));
	} else {
		window.location.hash = hash;
		//Clear the '#'
		if (!hash) history.replaceState('', '', window.location.pathname + window.location.search);
	}
	dispatch({
		type: UPDATE_HASH,
		hash
	});
};

const replaceModifications = (modifications) => {
	return {
		type: REPLACE_MODIFICATIONS,
		modifications,
	};
};

export const updateWarning = (message) => {
	return {
		type: UPDATE_WARNING,
		message
	};
};

export const updateChartSingleRun = (singleRun) => {
	return {
		type: UPDATE_CHART_SINGLE_RUN,
		singleRun,
	};
};

//ids should be an object of key => true. An object with no keys means "all items"
export const updateChartConfigIDs = (ids) => {
	return {
		type: UPDATE_CHART_CONFIG_IDS,
		ids,
	};
};