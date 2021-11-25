export const LOAD_DATA = "LOAD_DATA";
export const UPDATE_SIMULATION_INDEX = 'UPDATE_SIMULATION_INDEX';
export const UPDATE_RUN_INDEX = 'UPDATE_RUN_INDEX';
export const UPDATE_FRAME_INDEX = 'UPDATE_FRAME_INDEX';

import {
	canonicalizePath
} from './app.js';

import {
	selectSimulationIndex,
	selectFrameIndex,
	selectRunIndex,
	selectCurrentSimulationMaxRunIndex,
	selectCurrentSimulationRun
} from '../selectors.js';

export const loadData = (data) => {
	return {
		type: LOAD_DATA,
		data,
	};
};

export const updateWithSimPageExtra = (pageExtra) => (dispatch) => {
	const parts = pageExtra.split('/');
	//The last piece is the trailing slash
	//TODO: handle malformed URLs better
	if (parts.length != 4) return; 
	const simulationIndex = parts[0];
	let runIndex = parseInt(parts[1]);
	if (isNaN(runIndex)) runIndex = 0;
	let frameIndex = parseInt(parts[2]);
	if (isNaN(frameIndex)) frameIndex = 0;
	//Each of these will return if a no op
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

export const updateSimulationIndex = (index, skipCanonicalize) => (dispatch, getState) => {
	const currentIndex = selectSimulationIndex(getState());
	if (currentIndex == index) return;
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
	if (!skipCanonicalize) dispatch(canonicalizePath());
};
