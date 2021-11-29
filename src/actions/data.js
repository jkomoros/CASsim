export const LOAD_DATA = "LOAD_DATA";
export const UPDATE_CURRENT_SIMULATION_CONFIG = "UPDATE_CURRENT_SIMULATION_CONFIG";
export const UPDATE_FILENAME = 'UPDATE_FILENAME';
export const UPDATE_SIMULATION_INDEX = 'UPDATE_SIMULATION_INDEX';
export const UPDATE_RUN_INDEX = 'UPDATE_RUN_INDEX';
export const UPDATE_FRAME_INDEX = 'UPDATE_FRAME_INDEX';
export const UPDATE_DIALOG_OPEN = 'UPDATE_DIALOG_OPEN';
export const UPDATE_PLAY_TYPE = 'UPDATE_PLAY_TYPE';
export const UPDATE_PLAYING = 'UPDATE_PLAYING';
export const UPDATE_DELAY_COUNT = 'UPDATE_DELAY_COUNT';
export const UPDATE_SHOW_CONTROLS = 'UPDATE_SHOW_CONTROLS';

export const DIALOG_TYPE_JSON = 'json';
export const DIALOG_TYPE_ADD_FIELD = 'add-field';

export const DATA_DIRECTORY = 'data';
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
	selectDelayCount
} from '../selectors.js';

import {
	maySetPropertyInConfigObject
} from '../options.js';
import { store } from '../store.js';

export const loadData = (data) => (dispatch) => {
	dispatch({
		type: LOAD_DATA,
		data,
	});
	dispatch(verifyValidIndexes());
	dispatch(simulationActivated());
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
	if (parts.length != 5) return;
	const filename = parts[0];
	const simulationName = parts[1];
	let runIndex = parseInt(parts[2]);
	if (isNaN(runIndex)) runIndex = 0;
	let frameIndex = parseInt(parts[3]);
	if (isNaN(frameIndex)) frameIndex = 0;

	const simulationsMap = selectSimulationsMap(getState());
	const fallbackIndex = parseInt(simulationName);
	const simulationIndex = simulationsMap[simulationName] || (isNaN(fallbackIndex) ? 0 : fallbackIndex);

	//Each of these will return if a no op
	dispatch(updateFilename(filename), true);
	dispatch(updateSimulationIndex(simulationIndex), true);
	dispatch(updateRunIndex(runIndex), true);
	dispatch(updateFrameIndex(frameIndex), true);
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
	const currentFilename = selectFilename(getState());
	if (currentFilename == filename) return;
	dispatch({
		type: UPDATE_FILENAME,
		filename,
	});
	if (!skipCanonicalize) dispatch(canonicalizePath());
};

export const updateSimulationIndex = (index, skipCanonicalize) => (dispatch, getState) => {
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

export const updateFrameIndex = (index, skipCanonicalize) => (dispatch, getState) => {
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
	if (!skipCanonicalize) dispatch(canonicalizePath());
};

export const updateRunIndex = (index, skipCanonicalize) => (dispatch, getState) => {
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
	if (!skipCanonicalize) dispatch(canonicalizePath());
};

export const updateCurrentSimulationOptions = (path, value) => (dispatch, getState) => {
	const state = getState();
	const simulation = selectCurrentSimulation(state);
	const problems = maySetPropertyInConfigObject(simulation.optionsConfig, simulation.config, path, value);
	if (problems.length) {
		alert('Invalid modification proposed: ' + path + ': ' + value + ': ' + problems.join(', '));
		return;
	}
	dispatch({
		type: UPDATE_CURRENT_SIMULATION_CONFIG,
		path,
		value
	});
	dispatch(verifyValidIndexes());
};

export const openDialog = (optType, optExtras) => {
	return {
		type: UPDATE_DIALOG_OPEN,
		open: true,
		dialogType: optType,
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