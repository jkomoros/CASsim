import {
	LOAD_DATA
} from "../actions/data.js";

const INITIAL_STATE = {
	data: [],
	index: 0,
};

const data = (state = INITIAL_STATE, action) => {
	switch (action.type) {
	case LOAD_DATA:
		return {
			...state,
			data: action.data,
			index: action.data.length - 1,
		};
	default:
		return state;
	}
};

export default data;
