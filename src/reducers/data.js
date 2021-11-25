import {
	LOAD_DATA,
	UPDATE_SIMULATION_INDEX,
	UPDATE_RUN_INDEX,
	UPDATE_FRAME_INDEX
} from "../actions/data.js";

const INITIAL_STATE = {
	data: [],
	//Either a string (preferred) referring to the name of the item in the current collection to select, or an index.
	simulationIndex: 0,
	runIndex: 0,
	frameIndex: 0,
};

const data = (state = INITIAL_STATE, action) => {
	switch (action.type) {
	case LOAD_DATA:
		//Make it so we swap simulationIndex to name once we know it.
		//TODO: it feels a bit weird to do this here...
		const newSimulationIndex = typeof state.simulationIndex == 'number' && action.data && action.data.length > state.simulationIndex && action.data[state.simulationIndex].name ? action.data[state.simulationIndex].name : state.simulationIndex;
		return {
			...state,
			simulationIndex: newSimulationIndex,
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
