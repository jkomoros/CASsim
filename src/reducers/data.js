import {
	LOAD_DATA,
	UPDATE_FILENAME,
	UPDATE_SIMULATION_INDEX,
	UPDATE_RUN_INDEX,
	UPDATE_FRAME_INDEX,
	UPDATE_CURRENT_SIMULATION_CONFIG,
	REMOVE_MODIFICATIONS_FOR_PATH,
	UPDATE_DIALOG_OPEN,
	UPDATE_PLAY_TYPE,
	UPDATE_PLAYING,
	UPDATE_DELAY_COUNT,
	UPDATE_SHOW_CONTROLS,
	UPDATE_SCALE,
	UPDATE_CONFIGURATION_EXPANDED,
	UPDATE_DESCRIPTION_EXPANDED,
	UPDATE_PATH_EXPANDED,
	SIMULATOR_LOADED,
	UPDATE_KNOWN_DATAFILES,
	UPDATE_KNOWN_SIMULATOR_NAMES,
	UPDATE_RESIZE_VISUALIZATION,
	REPLACE_MODIFICATIONS,
	CLEAR_MODIFICATIONS,
	SIMULATION_CHANGED,
	UPDATE_SCREENSHOTTING,
	UPDATE_HASH,

	DIALOG_TYPE_JSON,
	DEFAULT_FILE_NAME,
	PLAY_TYPE_ROUND,
} from "../actions/data.js";

const INITIAL_STATE = {
	filename: DEFAULT_FILE_NAME,
	loadedSimulators: {},
	knownDatafiles: [],
	knownSimulatorNames: [],
	data: [],
	//A list of objects with {simulationIndex: <index>, path: <dottedPath>, value}
	modifications: [],
	simulationIndex: 0,
	runIndex: 0,
	frameIndex: 0,
	playType: PLAY_TYPE_ROUND,
	playing: false,
	screenshotting: false,
	delayCount: 0,
	resizeVisualization: true,
	scale: 1.0,
	//The entire contents of window.location.hash as last seen or set by us
	hash: '',
	//A thing that will change when a simulation has changed, e.g. they have
	//calculated new frames.
	simulationLastChanged: Date.now(),
	//Whether the whole controls is visible or not
	showControls: true,
	configurationExpanded: false,
	descriptionExpanded: true,
	//The options-paths whose "Advanced" zippy should be shown as expanded. ''
	//is the top level 
	pathExpanded: {},
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
		return {
			...state,
			modifications: [...state.modifications, {simulationIndex: state.simulationIndex, path: action.path, value: action.value}]
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
	case UPDATE_DESCRIPTION_EXPANDED:
		return {
			...state,
			descriptionExpanded: action.expanded
		};
	case UPDATE_PATH_EXPANDED:
		return {
			...state,
			pathExpanded: action.expanded ? {...state.pathExpanded, [action.path]:true} : Object.fromEntries(Object.entries(state.pathExpanded).filter(entry => entry[0] != action.path))
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
	case UPDATE_KNOWN_DATAFILES:
		return {
			...state,
			knownDatafiles: action.datafiles
		};
	case UPDATE_KNOWN_SIMULATOR_NAMES:
		return {
			...state,
			knownSimulatorNames: action.simulatorNames
		};
	case UPDATE_RESIZE_VISUALIZATION:
		return {
			...state,
			resizeVisualization: action.resize,
		};
	case REMOVE_MODIFICATIONS_FOR_PATH:
		return {
			...state,
			modifications: state.modifications.filter(mod => !(mod.path == action.path && mod.simulationIndex == state.simulationIndex)),
		};
	case CLEAR_MODIFICATIONS:
		return {
			...state,
			modifications: []
		};
	case REPLACE_MODIFICATIONS:
		return {
			...state,
			modifications: action.modifications
		};
	case SIMULATION_CHANGED:
		return {
			...state,
			simulationLastChanged: Date.now()
		};
	case UPDATE_SCREENSHOTTING:
		return {
			...state,
			screenshotting: action.on
		};
	case UPDATE_HASH:
		return {
			...state,
			hash: action.hash
		};
	default:
		return state;
	}
};

export default data;
