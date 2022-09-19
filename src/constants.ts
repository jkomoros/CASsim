import {
	OptionsConfigInput,
	OptionsConfig,
	OptionsConfigMap,
	Angle
} from './types.js';

//rendevous point with screenshot service.
export const CURRENT_SIMULATION_INDEX_VARIABLE = 'current_simulation_index';
export const CURRENT_RUN_INDEX_VARIABLE = 'current_run_index';
export const CURRENT_FRAME_INDEX_VARIABLE = 'current_frame_index';
export const CURRENT_SIMULATION_NAME_VARIABLE = 'current_simulation_name';
export const SETUP_METHOD_VARIABLE = 'setup_method';
export const PREVIOUS_FRAME_METHOD_VARIABLE = 'previous_frame';
export const RENDER_COMPLETE_VARIABLE = 'render_complete';

export const DEFAULT_FRAME_DELAY = 100;
export const DEFAULT_EXTRA_FINAL_FRAME_COUNT = 0;
export const DEFAULT_REPEAT = false;

export const EXAMPLE_PROPERTY_NAME = 'example';

export const configIsConfig = (config : OptionsConfigInput) : config is OptionsConfig => {
	return typeof config == 'object' && !Array.isArray(config) && config[EXAMPLE_PROPERTY_NAME] != undefined;
};

export const configIsMap = (config : OptionsConfigInput) : config is OptionsConfigMap => {
	return typeof config == 'object' && !Array.isArray(config) && config[EXAMPLE_PROPERTY_NAME] == undefined;
};

const FULL_ROTATION =  Math.PI * 2;

export const ROTATION_UP : Angle = FULL_ROTATION / 4;
export const ROTATION_LEFT : Angle = FULL_ROTATION / 2;
export const ROTATION_DOWN : Angle = FULL_ROTATION  * 3/4;
export const ROTATION_RIGHT : Angle = 0;