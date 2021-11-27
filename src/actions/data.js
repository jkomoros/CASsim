export const LOAD_DATA = "LOAD_DATA";
export const UPDATE_CURRENT_SIMULATION_CONFIG = "UPDATE_CURRENT_SIMULATION_CONFIG";
export const UPDATE_FILENAME = 'UPDATE_FILENAME';
export const UPDATE_SIMULATION_INDEX = 'UPDATE_SIMULATION_INDEX';
export const UPDATE_RUN_INDEX = 'UPDATE_RUN_INDEX';
export const UPDATE_FRAME_INDEX = 'UPDATE_FRAME_INDEX';
export const UPDATE_DIALOG_OPEN = 'UPDATE_DIALOG_OPEN';

export const DIALOG_TYPE_JSON = 'json';
export const DIALOG_TYPE_ADD_FIELD = 'add-field';

export const DATA_DIRECTORY = 'data';
export const DEFAULT_FILE_NAME = 'default';

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
	selectSimulationsMap
} from '../selectors.js';

import {
	maySetPropertyInConfigObject
} from '../options.js';

export const loadData = (data) => (dispatch) => {
	dispatch({
		type: LOAD_DATA,
		data,
	});
	dispatch(verifyValidIndexes());
};

export const verifyValidIndexes = () => (dispatch, getState) => {
	const runIndex = selectRunIndex(getState());
	//These will either be no ops or cut them down to size.
	dispatch(updateRunIndex(runIndex));
	//Fetch state again because it might have changed just above
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

export const nextFrameIndex = () => (dispatch, getState) => {
	let currentIndex = selectFrameIndex(getState());
	currentIndex++;
	dispatch(updateFrameIndex(currentIndex));
};

export const prevFrameIndex = () => (dispatch, getState) => {
	let currentIndex = selectFrameIndex(getState());
	currentIndex--;
	if (currentIndex < 0) return;
	dispatch(updateFrameIndex(currentIndex));
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
	if (currentIndex == index) return;
	if (index < 0) return;
	dispatch({
		type: UPDATE_SIMULATION_INDEX,
		index,
	});
	if (!skipCanonicalize) dispatch(canonicalizePath());
};

export const updateFrameIndex = (index, skipCanonicalize) => (dispatch, getState) => {
	if (typeof index == 'string') index = parseInt(index);
	const state = getState();
	const run = selectCurrentSimulationRun(state);
	if (index < 0) return;
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