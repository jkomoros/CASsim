export const LOAD_DATA = "LOAD_DATA";
export const UPDATE_INDEX = 'UPDATE_INDEX';

import {
	canonicalizePath
} from './app.js';

import {
	selectCurrentDataIndex,
	selectMaxLegalIndex
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
	if (currentIndex > selectMaxLegalIndex(getState())) return;
	dispatch(updateIndex(currentIndex));
};

export const prevIndex = () => (dispatch, getState) => {
	let currentIndex = selectCurrentDataIndex(getState());
	currentIndex--;
	if (currentIndex < 0) return;
	dispatch(updateIndex(currentIndex));
};

export const updateIndex = (index) => (dispatch) => {
	dispatch({
		type: UPDATE_INDEX,
		index,
	});
	dispatch(canonicalizePath());
};
