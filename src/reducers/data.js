import {
	LOAD_DATA
} from '../actions/data.js';

const INITIAL_STATE = {
	data: [],
};

const counter = (state = INITIAL_STATE, action) => {
	switch (action.type) {
		case LOAD_DATA:
			return {
				...state,
				data: action.data,
			};
		default:
			return state;
	}
};

export default counter;
