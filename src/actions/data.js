export const LOAD_DATA = "LOAD_DATA";
export const UPDATE_INDEX = 'UPDATE_INDEX';

import {
	canonicalizePath
} from './app.js';

export const loadData = (data) => {
	return {
		type: LOAD_DATA,
		data,
	};
};

export const updateIndex = (index) => (dispatch) => {
	dispatch({
		type: UPDATE_INDEX,
		index,
	});
	dispatch(canonicalizePath());
};
