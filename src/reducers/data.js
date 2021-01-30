import {
	LOAD_DATA,
	UPDATE_INDEX
} from "../actions/data.js";

const INITIAL_STATE = {
	data: [],
	index: -1,
};

const data = (state = INITIAL_STATE, action) => {
	switch (action.type) {
	case LOAD_DATA:
		return {
			...state,
			data: action.data,
			index: state.index == -1 ? action.data.length - 1 : state.index,
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
