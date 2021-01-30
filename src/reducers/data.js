import {
	LOAD_DATA,
	UPDATE_INDEX
} from "../actions/data.js";

const INITIAL_STATE = {
	data: [],
	//-1 signals it should be the default value, either 0 or the last state
	index: -1,
};

const data = (state = INITIAL_STATE, action) => {
	switch (action.type) {
	case LOAD_DATA:
		return {
			...state,
			data: action.data,
		};
	case UPDATE_INDEX:
		return {
			...state,
			index: action.index,
		};
	default:
		return state;
	}
};

export default data;
