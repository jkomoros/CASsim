import {
	LOAD_DATA,
	UPDATE_FILENAME,
	UPDATE_SIMULATION_INDEX,
	UPDATE_RUN_INDEX,
	UPDATE_FRAME_INDEX,
	UPDATE_CURRENT_SIMULATION_CONFIG,
	UPDATE_DIALOG_OPEN,
	UPDATE_PLAY_TYPE,
	UPDATE_PLAYING,
	UPDATE_DELAY_COUNT,
	UPDATE_SHOW_CONTROLS,
	UPDATE_SCALE,
	UPDATE_CONFIGURATION_EXPANDED,
	SIMULATOR_LOADED,

	DIALOG_TYPE_JSON,
	DEFAULT_FILE_NAME,
	PLAY_TYPE_ROUND,
} from "../actions/data.js";

import {
	setPropertyInObject
} from '../util.js';

const INITIAL_STATE = {
	filename: DEFAULT_FILE_NAME,
	loadedSimulators: {},
	data: [],
	simulationIndex: 0,
	runIndex: 0,
	frameIndex: 0,
	playType: PLAY_TYPE_ROUND,
	playing: false,
	delayCount: 0,
	scale: 1.0,
	//Whether the whole controls is visible or not
	showControls: true,
	//Whether the Simulation Controls zippy within simulation-controls is open
	configurationExpanded: false,
	dialogOpen: false,
	dialogType: DIALOG_TYPE_JSON,
	dialogExtras: {},
};

const data = (state = INITIAL_STATE, action) => {
	switch (action.type) {
	case LOAD_DATA:
		return {
			...state,
			data: action.data,
		};
	case UPDATE_FILENAME:
		return {
			...state,
			filename: action.filename
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
		newData[index] = setPropertyInObject(newData[index], action.path, action.value);
		return {
			...state,
			data: newData
		};
	case UPDATE_DIALOG_OPEN:
		return {
			...state,
			dialogOpen: action.open,
			dialogType: action.dialogType ? action.dialogType : state.dialogType,
			dialogExtras: action.extras ? action.extras : {}
		};
	case UPDATE_PLAY_TYPE:
		return {
			...state,
			playType: action.playType
		};
	case UPDATE_PLAYING:
		return {
			...state,
			playing: action.playing
		};
	case UPDATE_DELAY_COUNT:
		return {
			...state,
			delayCount: action.count
		};
	case UPDATE_SHOW_CONTROLS:
		return {
			...state,
			showControls: action.show,
		};
	case UPDATE_CONFIGURATION_EXPANDED:
		return {
			...state,
			configurationExpanded: action.expanded
		};
	case UPDATE_SCALE:
		return {
			...state,
			scale: action.scale
		};
	case SIMULATOR_LOADED:
		return {
			...state,
			loadedSimulators: {...state.loadedSimulators, [action.name]: true},
		};
	default:
		return state;
	}
};

export default data;
