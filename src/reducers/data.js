import {
	LOAD_DATA,
	UPDATE_SIMULATION_INDEX,
	UPDATE_RUN_INDEX,
	UPDATE_FRAME_INDEX,
	UPDATE_CURRENT_SIMULATION_CONFIG,
	UPDATE_DIALOG_OPEN
} from "../actions/data.js";

import {
	setPropertyInObject
} from '../util.js';

const INITIAL_STATE = {
	data: [],
	//Either a string (preferred) referring to the name of the item in the current collection to select, or an index.
	simulationIndex: 0,
	runIndex: 0,
	frameIndex: 0,
	dialogOpen: false,
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
	case UPDATE_CURRENT_SIMULATION_CONFIG:
		const newData = [...state.data];
		let index = state.simulationIndex;
		if (typeof index != 'number') {
			for (const [i, obj] of newData.entries()) {
				if (obj.name == state.simulationIndex) {
					index = i;
					break;
				}
			}
		}
		newData[index] = setPropertyInObject(newData[index], action.path, action.value);
		return {
			...state,
			data: newData
		};
	case UPDATE_DIALOG_OPEN:
		return {
			...state,
			dialogOpen: action.open
		};
	default:
		return state;
	}
};

export default data;
