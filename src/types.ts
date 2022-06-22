
export type RandomGenerator = () => number;

export type SimulationConfigName = string;

type CSSColor = string;

//TODO: lock this down dynamically based on allowed simulator types
export type SimulatorType = string;

//TODO: define more
type SimOptions = object;

export interface RawSimulationConfig {
    //Must be a string with only a-zA-z0-9_- characters. Will be shown in the URL. May be omitted.
	name? : SimulationConfigName;
	//The human-readable description of the config. Optional. Will use a transformation of name like "two-words" -> "Two Words" if not provided.
	title? : string;
	//A longer description of the simulation. If not provided will use title or name.
	description?: string;
	//If true, then this config will not be included; typically you only include this for things that other configs will extend.
	hidden? : boolean;
	//If set, then this config will extend and overlay the config given by "this-is-another-name". It will not copy over any 'hidden' config value, and for object values, it will entirely overwrite the value. Note that these extensions won't be visible at all in the UI; the transformation is done before the UI sees it, and the UI operates as though each config is fully specified. You may point to configs that extend other configs, but cycles are not allowed.
	extend? : SimulationConfigName;
	//Height and width. Mainly used for aspect ratio, but for screenshotting this will be the literal height and width in pixels (modulo if you include the display.status)
	width : number;
	height : number;
	//How many runs to generate in the set
	runs : number;
	//The base random number seed for each run (each run and frame gets its own initialized seed based on this.) If omitted, will use a value derived from current time, leading to nondeterministic behavior.
	seed? : string;
	//How many milliseconds to wait before advancing to the next frame when playing.
	frameDelay? : number;
	//How many notional extra frames the final frame as a round should be held on when playing. This allows you to pause on the final frame for longer.
	extraFinalFrameCount? : number;
	//if true, then it will automatically generate all frames in all runs immediately on creation. This can be very expensive; this should only be set to true for simulations with limited computational overhead.
	autoGenerate? : boolean;
	//If true, will start playing the simulation immediately upon load.
	autoPlay? : boolean;
	//If true, then when all rounds have played, it will loop back around to first round and continue playing.
	repeat? : boolean;
	//Configures whether or not to display certain things. May be omitted.
	display? : {
		//If true, then a status line will be rendered beneath the diagram. This changes the height of the final screenshot from the configured value.
		status? : boolean;
	};
	//These colors will be provided to the simulation renderer as `--primary-color` etc CSS variables.
	colors? : {
		primary? : CSSColor;
		secondary? : CSSColor;
		disabled? : CSSColor;
		background? : CSSColor;
	};
	//The simulator type to run, which must be one of the names of a simulator in simulators/ directory.
	sim: SimulatorType;
	//The options to feed to the simulator. These will be different shapes depending on the value of "sim". If this is missing or null, then the simulator's default simOptions will be used. See each specific simulator's documentation for the specific config shapes it expects.
	simOptions? : SimOptions;
}

export interface SimulationConfig extends RawSimulationConfig {
    //An expanded SimulationConfig always has a simOptions
    simOptions : SimOptions;
}

export type ScoreConfigID = string;

export interface ScoreConfigItem {
    id : ScoreConfigID;
    title? : string;
    description? : string;
    color? : CSSColor;
}

export type ScoreConfig = null | ScoreConfigItem[];

//A dotted string like 'A.B' that is a concantenation of property names to index
//into.
export type OptionsPath = string;

export type SimulationFrame = object;