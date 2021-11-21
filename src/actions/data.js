export const LOAD_DATA = "LOAD_DATA";
export const UPDATE_SIMULATION_INDEX = 'UPDATE_SIMULATION_INDEX';
export const UPDATE_RUN_INDEX = 'UPDATE_RUN_INDEX';
export const UPDATE_FRAME_INDEX = 'UPDATE_FRAME_INDEX';

import {
	canonicalizePath
} from './app.js';

import {
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

export const nextIndex = () => (dispatch, getState) => {
	let currentIndex = selectFrameIndex(getState());
	currentIndex++;
	dispatch(updateFrameIndex(currentIndex));
};

export const prevIndex = () => (dispatch, getState) => {
	let currentIndex = selectFrameIndex(getState());
	currentIndex--;
	if (currentIndex < 0) return;
	dispatch(updateFrameIndex(currentIndex));
};

export const updateSimulationIndex = (index) => (dispatch) => {
	dispatch({
		type: UPDATE_SIMULATION_INDEX,
		index,
	});
	dispatch(canonicalizePath());
};

export const updateFrameIndex = (index) => (dispatch, getState) => {
	if (typeof index == 'string') index = parseInt(index);
	const state = getState();
	const run = selectCurrentSimulationRun(state);
	const maxFrameIndex = run ? run.maxFrameIndex : Number.MAX_SAFE_INTEGER;
	if (index > maxFrameIndex) index = maxFrameIndex;
	//no op
	if (index == selectFrameIndex(state)) return;
	dispatch({
		type: UPDATE_FRAME_INDEX,
		index,
	});
	dispatch(canonicalizePath());
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
	dispatch(canonicalizePath());
};
