
export type RandomGenerator = () => number;

export type SimulationConfigName = string;

//A string that can be used directly anywhere CSS expects a color. Hex, RGB(),
//RGBA(), and named colors all work.
export type CSSColor = string;

export type RGBColor = [r : number, g : number, b : number];
export type RGBAColor = [r : number, g : number, b : number, a : number];

export type Color = {
    r : number;
    g : number;
    b : number;
    a : number;
    hex : CSSColor;
    rgb : RGBColor;
    rgba : RGBAColor;
    rgbStr : CSSColor;
    rgbaStr : CSSColor;
}

//TODO: lock this down dynamically based on allowed simulator types
export type SimulatorType = string;

//TODO: define more
export type SimOptions = object;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NormalizedSimOptions extends SimOptions {

}

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

export type FrameScore = number;

export type FrameScores = FrameScore[];

//A dotted string like 'A.B' that is a concantenation of property names to index
//into.
export type OptionsPath = string;

export type PartialSimulationFrame = object;

export interface SimulationFrame extends PartialSimulationFrame {
    index : number;
    simOptions : NormalizedSimOptions;
    runIndex : number;
    width : number;
    height : number;
}

export type Fingerprint = string;

export type OptionsConfigMap = {
    [key : string] : OptionsConfig
}

export type OptionConfigBehavior = 'seed' | 'color';

export type OptionConfigOptionItem = {
    //The actual value, the only required key
    value : string | boolean | number;
    //The string to show in the UI. Defaults to value if not provided
    display? : string;
    //The help text to render in the UI. Defaults to the value of display, or value, if not provided.
    description? : string;
}

export type OptionsValues = {
    [key : string]: number | boolean | string | OptionsValues[] | OptionsValues;
};

export type OptionsConfigExample = number | boolean | string | [OptionsConfig] | OptionsConfig | OptionsConfigMap;

export type OptionsConfig = {
    //Example is the most important property and the only reserved word. If an object in the config has 
	//a "example" property then all of its other properties are treated like an optionsLeaf.
	//example may be:
	// - a number
	// - a boolean
	// - a string
	// - an array containing precisely one optionsLeaf object (any others will be ignored)
	// - an object, which is itself an optionsLeaf, or where each of its keys points to an optionsLeaf
	// for numbers, booleans, and strings, this value will also be used as the default.
	// One exception: if you also set 'optional' to true, then this value will not be included by default 
	//but only if a user explicitly adds it, so the example should be the 'on' version of the value,
	//so that when a user explicitly adds it, they don't have to then change the value to the 'on' value.
	example? : OptionsConfigExample;
	//OPTIONAL - the defaulting machinery does most of the work. If provided, then paths to this option can 
	//be known by their long name (the property name that points 
	//to this leaf), or by this shortName. When being packed for a URL, the path will be shortened to its 
	//shortName. The shortName must be unique among its peers in its parent object, now or any time
	//in the past, otherwise URLs out in the wild that were packed with this shortName might expand improperly.
	//Idiomatically, the shortName is the first letter of the name, plus any uppercass letters (e.g. 'fooPropertyName'
	//would be 'fPN') unless there would be a collision, in which case it's typically the property name minus vowels.
	//If not provided, will be set to reasonable defaults according to these idioms. You only have to provide a shortName
	//if you want the shortName to be something atypical for it.
	shortName? : string;
	//A help string to show in the UI to explain what it does
	description? : string;
	//For numbers, the minimum amount. For arrays, the minimum length. Defaults to 0.0
	min? : number;
	//For numbers, the maximum number. For arrays, the maximum length. Defaults to Number.MAX_SAFE_INTEGER
	max? : number;
	//For numbers, the smallest allowable increment. Defaults to 1.0 (integer)
	step? : number;
	//Extra behavior for a string type. Can be omitted, 'color', or 'seed'. For color, will render an input type = color.
	behavior? : OptionConfigBehavior;
	//If options is provided, then a select will be rendered, allowing only those options.
	options? : OptionConfigOptionItem[];
	//Hide (optional) is a function that is passed the values of the _parent_ (meaning it can inspect its siblings values), as well as rootValues.
	//If it returns true, it will be hidden from the UI (although values in it will still be there)
	hide?: (parentValues : OptionsValues) => boolean;
	//Whether the field is allowed to just not be provided. Defaults to false
    optional? : boolean;
	//If true, then when this value is being generated as a a default, value, it will be included even if optional. May only be
	//true if optional is true. This is useful for when you don't want to force hand-coded configs to include the value, but in the UI when 
	//the user adds a default value you want it to be included.
	default? : boolean;
	//If backfill is true, then if the value is not provided by the user (which is only allowed if optional:false), then the
	//example value will automatically be normalized into the simOptions object before it's provided to the simulator's normalizeOptions.
	//This can make sure that downstream parts of your simulator can assume the value exists, even if it wasn't explicitly provided by the user.
	backfill? : boolean;
	//Advanced options will only render UI if the user has enabled advanced mode. This is useful to hide infrequently needed options.
	advanced? : boolean;
};

export type Filename = string;

export type Modification = {
    simulationIndex : number;
    path : OptionsPath;
    value : OptionsValues;
}

export type Modifications = Modification[];

//TODO: tighten
export type PlayType = string;

//TODO: tigthen
export type DialogType = string;

//TODO: tighten;
export type DistributionType = string;

//TODO: tighten
export type RoundType = string;

export type DistributionOptions = {
	// - types: an array of allowed distribution types (e.g. LINEAR, MIN_MAX). If not provided, will default to [type]. If neith types nor type is provided, all distribution types are allowed.
    types? : DistributionType[];
    // - distribution: the default type
    distribution? : DistributionType;
	// - average: the default average value if type = LINEAR
    average? : number;
	// - spread: the spread value if type = LINEAR
    spread? : number;
	// - min: the lower value if type = MIN_MAX. Defaults to limitMin.
    min? : number;
	// - max: the upper value if type = MIN_MAX. Defaults to limitMax.
    max? : number;
	// - limitMin: the clip value. If the final sample is below this value it will be clipped to this. Defaults to 0.0.
    limitMin? : number;
	// - limitMax: the clip value. If the final sample is abvove this value it will be clipped to this. Defaults to 1.0.
    limitMax? : number;
	// - step: defaults to 0.01
    step? : number;
	// - round: if the final generated number should be rounded. legal values are '', 'round', floor'.
    round? : RoundType;
	// - default: if ture, then the optionsConfig for the overall distributionObject will have default set to true.
    default? : boolean;
	// - description: A description for the overall value
    description? : string;
	// - shortName: the shortName to be returned in optionsConfig.
    shortName? : string;
	// - name: a name for the overall value
    name? : string;
}

//TODO: tighten;
export type GraphType = string;

export type GraphNodeID = string | number;
export type GraphEdgeID = string;

export type GraphNodeIdentifier = GraphNodeID | GraphNode | GraphNodeValues | GraphNodeID[];

export type GraphNodeValues = {
    id : GraphNodeID;
    [key : string] : unknown;
};

export type GraphNodeValuesMap = {
    [id : GraphNodeID] : GraphNodeValues
};

export type GraphNode = {
    id: GraphNodeID,
    values : GraphNodeValues;
    edges: {
        [to: GraphNodeID]: GraphEdge;
    }
}

export type GraphEdge = {
    from: GraphNodeID;
    to: GraphNodeID;
    id: GraphEdgeID;
    [key : string] : unknown;
}

export type GraphNodes = {[nodeID : GraphNodeID]: GraphNode};

export type GraphProperty = number | string | boolean | Position | RowCol;

export type GraphPropertyName = string;

export type GraphProperties = {[key : GraphPropertyName]: GraphProperty};

export type GraphData = {
    nodes : GraphNodes;
    properties: GraphProperties;
    graphType: GraphType;
}

export type GraphNodeExplorationResult = {
    node : GraphNodeValues,
    path : GraphEdge[],
    length : number;
}

export type GraphExplorationCollectionResult = {
    [id : GraphNodeID] : GraphNodeExplorationResult;
}

export type GraphExplorationTargetResult = [distance : number, path : GraphEdge[]];

export type GraphExplorationResult = GraphExplorationCollectionResult | GraphExplorationTargetResult;

export type GraphExplorationNodeTester = (node : GraphNodeValues, path : GraphEdge[], length : number) => boolean;

export type GraphExplorationEdgeScorer = (edge : GraphEdge) => number;

export type OptionsOverridesMap = {
    [optionName : string] : string;
};

export type ForceLayoutGraphOptions = {
    // edgeValues: (default: {}) - the starter values for an edge
    edgeValues? : Partial<GraphEdge>;
    // minNodeSize: (default: 10.0) - The smallest rendered nodeSize in pixels
    minNodeSize? : number;
    // maxNodeSize: (default: 10.0) - The largest rendered nodeSize in pixels
    maxNodeSize? : number;
    // nodeMargin: (default: 0.1) - How much space should be left between this node and other nodes, in units of percentage of this node's size.
    nodeMargin? : number;
    // nodeSize: (default: () -> 1.0) - A method given nodeValues and rnd, that should return the value to set.
    nodeSize? : (node : GraphNodeValues, rnd : RandomGenerator) => number;
    // noCollide: (default: false) - If true then there will be no collison forces
    noCollide? : boolean;
    // randomLinkLikelihood: (default: 0.0) - How likely two random children in the parent are to have an extra connection amongst themselves. 0.0 is no connections, 1.0 is all connections.
    randomLinkLikelihood? : number;
}

export type BloomGraphOptions = ForceLayoutGraphOptions & {
    // levels (default: 3.0) - how many layers from the first node to go to.
    levels? : number;
    // nodeValues: (default: {}) - the values to start each node with
    nodeValues? : GraphNodeValues;
    // childCount: (default: 5.0) - how many children each node should have
    childCount? : number;
    // childFactor: (deafault: 1.0) - at each level, the final childCount is childCount * Math.pow(childFactor, level)
    childFactor? : number;
    // childLinkLikelihood: (default: 0.0) - How likely the children of each parent node are to have connections amongst themselves. 1.0 is all connected, 0.0 is no connections.
    childLinkLikelihood? : number;
}

export type PreferentialAttachmentGraphOptions = ForceLayoutGraphOptions & {
    // nodeCount: (default: 100) - How many nodes to create
    nodeCount? : number;
    // iterations: (default: 100) - How many iterations of adding edges we should do
    iterations? : number;
    // nodeBoost: (default: 0.00001) - How much to boost every node when choosing which one to add. Higher numbers make the preferential attachment effect weaker.
    nodeBoost? : number;
    // distantNodeBoost: (default: 3) - How much to boost even nodes who are far away from (or not even connected to) the node that has been selected. Higher numbers make the preferential attachmetn effect weaker.
    distantNodeBoost? : number;
    // edgeCount: (default: 3) - How many edges, on each iteartion, we should add.
    edgeCount? : number;
    // nodeValues: (deafult: {}) - The base values to set on nodes
    nodeValues? : GraphNodeValues;
}

export type RectangleGraphOptions = {
    // starterValues - the values to clone and set for each cell
    starterValues? : GraphNodeValues;
    // nodeMargin - the margin to have between nodes. It is in units of
    // percentage of nodeWidth. If you want a different value for x and y,
    // you can set an array with [xMargin, yMargin]
    nodeMargin? : number | [number, number];
    // nodeRoundness - a value from 0.0 to 1.0 for size of radius
    nodeRoundness? : number;

    // The follow keys are boolean and may be set to true on options:
    // rectangular - Allow nodes to have a width and height that differs
    rectangular? : boolean;
    // noLeft - Don't connect directly to the left
    noLeft? : boolean;
    // noRight - Don't connect directly to the right
    noRight? : boolean;
    // noUp - Don't connect directly up
    noUp? : boolean;
    // noDown - Don't connect directly down
    noDown? : boolean;
    // noHorizontal - Equivalent to noLeft, noRight
    noHorizontal? : boolean;
    // noVertical - Equivalent to noUp, noDown
    noVertical? : boolean;
    // noRightAngle - Equivalent to noHorizontal, noVertical
    noRightAngle? : boolean;
    // diagonalUpLeft - Also connect diagonal up and left
    diagonalUpLeft? : boolean;
    // diagonalDownLeft - Also connect diagonals down and left
    diagonalDownLeft? : boolean;
    // diagonalUpRight - Also connect diagonals up and right
    diagonalUpRight? : boolean;
    // diagonalDownRight - Also connect diagonals down and right
    diagonalDownRight? : boolean;
    // diagonalRight - equivalent to diagonalUpRight, diagonalDownRight
    diagonalRight? : boolean;
    // diagonalLeft - equilvalent to diagonalUpLeft, diagonalDownLeft
    diagonalLeft? : boolean;
    // diagonalUp - equivalent to diagonalUpLeft, diagonalUpRight
    diagonalUp? : boolean;
    // diagonalDown - equivalent to diagonalDownLeft, diagonalDownRight
    diagonalDown? : boolean;
    // diagonal - equivalent to diagonalUp, diagonalDown
    diagonal? : boolean;
}

export type Coordinates = {
    x : number;
    y : number;
}

export type Size = {
    width : number;
    height : number;
}

export type Position = Coordinates & Size;

export type RowCol = [number, number];

export type AppState = {
    page : string;
    pageExtra : string;
    offline : boolean;
};

export type DataState = {
    filename : Filename;
	loadingSimulators : {[name : SimulatorType] : true},
	loadedSimulators : {[name : SimulatorType] : true},
	knownDatafiles : Filename[],
	knownSimulatorNames : SimulatorType[],
	data : RawSimulationConfig[],
	//A list of objects with {simulationIndex: <index>, path: <dottedPath>, value}
	modifications : Modifications,
	simulationIndex : number,
	runIndex : number,
	frameIndex : number,
	playType : PlayType,
	playing : boolean,
	screenshotting : boolean,
	delayCount : number,
	warning : string,
	resizeVisualization : boolean,
	scale : number,
	//The entire contents of window.location.hash as last seen or set by us
	hash : string,
	//A thing that will change when a simulation has changed, e.g. they have
	//calculated new frames.
	simulationLastChanged : number,
	//Whether the whole controls is visible or not
	showControls : boolean,
	chartExpanded : boolean,
	configurationExpanded : boolean,
	//Note: selectHashForCurrentState and ingestHash both assume that description is on by default.
	descriptionExpanded : boolean,
	chartSingleRun : boolean,
	//An object of key => true. An empty object means "all chart configs"
	chartConfigIDs : {[name : ScoreConfigID] : true},
	//The options-paths whose "Advanced" zippy should be shown as expanded. ''
	//is the top level 
	pathExpanded : {[path : OptionsPath] : true},
	dialogOpen : boolean,
	dialogType : DialogType,
	dialogExtras: {[key : string] : unknown},
}

export type RootState = {
    app : AppState;
    data? : DataState;
}