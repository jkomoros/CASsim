export const LOAD_DATA = "LOAD_DATA";
export const UPDATE_SIMULATION_INDEX = 'UPDATE_SIMULATION_INDEX';
export const UPDATE_RUN_INDEX = 'UPDATE_RUN_INDEX';
export const UPDATE_FRAME_INDEX = 'UPDATE_FRAME_INDEX';

import {
	canonicalizePath
} from './app.js';

import {
	selectCurrentDataIndex,
} from '../selectors.js';

export const loadData = (data) => {
	return {
		type: LOAD_DATA,
		data,
	};
};

export const nextIndex = () => (dispatch, getState) => {
	let currentIndex = selectCurrentDataIndex(getState());
	currentIndex++;
	dispatch(updateFrameIndex(currentIndex));
};

export const prevIndex = () => (dispatch, getState) => {
	let currentIndex = selectCurrentDataIndex(getState());
	currentIndex--;
	if (currentIndex < 0) return;
	dispatch(updateFrameIndex(currentIndex));
};

export const updateFrameIndex = (index) => (dispatch) => {
	dispatch({
		type: UPDATE_FRAME_INDEX,
		index,
	});
	dispatch(canonicalizePath());
};
