import {
	LOAD_DATA,
	UPDATE_SIMULATION_INDEX,
	UPDATE_RUN_INDEX,
	UPDATE_FRAME_INDEX
} from "../actions/data.js";

const INITIAL_STATE = {
	data: [],
	simulationIndex: 0,
	runIndex: 0,
	frameIndex: 0,
};

const data = (state = INITIAL_STATE, action) => {
	switch (action.type) {
	case LOAD_DATA:
		return {
			...state,
			data: action.data,
		};
	case UPDATE_SIMULATION_INDEX:
		return {
			...state,
			simulationIndex: action.index,
		};
	case UPDATE_RUN_INDEX:
		return {
			...state,
			runIndex: action.index,
		};
	case UPDATE_FRAME_INDEX:
		return {
			...state,
			frameIndex: action.index,
		};
	default:
		return state;
	}
};

export default data;
