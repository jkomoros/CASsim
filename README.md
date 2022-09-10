# CASsim
<img src='images/manifest/icon-96x96.png?raw=true' align='right' />
CASsim stands for Complex Adaptive Systems simulator.

This is a very basic harness and framework to make configurable, interactive agent based models and then generate animated screenshots of their results.

It's in a very messy, hacky state, but I'm continuing to work on it. File an issue with thoughts on how to improve it! If you use it for anything, let me know at alex@komoroske.com.

You can see a live demo at [https://cassim-viewer.web.app/](https://cassim-viewer.web.app/)

![interface Demo](/examples/screenshot.png?raw=true)

![Animated Example](/examples/example.gif?raw=true)

![Animated Agent Example](/examples/pasture.gif?raw=true)

## Why this exists

Many problems can be modeled as **complex adaptive systems**. In complex adaptive systems, a number of 'agents' continually make decisions based on their context. Crucially, their context includes the actions and state of *other* agents. This interdependence of decisions among agents is why these systems demonstrate **complexity**. A complex problem domain is one that exhibits non-linear behavior that cannot be captured in static equations. The only way to see what will happen in a complex system is to 'run' it&mdash;either let it play out in reality, or to simulate some code.

These kinds of systems have emergent, evolving behaviors that are notoriously difficult to predict. Typical reductionist tools that work in linear domains (statistics, Excel-based modeling) simply do not work, because they can't model the interdependencies. As a general rule of thumb, if you have a complex problem and are trying to model it in a spreadsheet, you've already failed. If you erroneously model a complex system as a linear one, you will come to sometimes dangerously misleading conclusions and be lulled by faux precision&mdash;to say nothing of often completely missing fundamental dynamics.

In the last century, reductionist tools have gotten *very* good and have been successfully applied to myriad domains. But most of the problems that are left that vex modern society are complex ones. As a society we keep applying the wrong reductionist tools to them, and then get frustrated and angry when reality doesn't line up with the analysis.

One bright spot is that although complex adapative systems are very difficult to predict in their specifics, it is possible to make generalized, stochastic predictions by modeling the problem as a simulation to execute. Although the *precise* behaviors are highly contingent, you can often capture the high-level dynamics of the system in a small number of rules that agents execute. For example, bird flocking behavior is famously "explained" by only three simple rules.

That's where **agent based modelling** comes in. Instead of doing a typical linear model in Excel, you write a small set of rules for agents to execute. You try to build a model by imagining the basic decision procedures an agent might follow, and add them to their rules. Then you keep on tweaking and adding until you get behavior that mimics the real-world phenomenon, which tells you that you've 'captured' a meaningful portion of the dynamics. You can then do experiments with the model to see how it might behave in other siuations. These predictions should be taken merely as calibrated hypotheses, but they are better than dangerous faux precision from Excel models, or from just throwing your hands in the air and treating the system as entirely unpredictable and chaotic. And because the models are interactive, they allow someone to play with them and experiemnt, developing a deep, ineffable intuition for how that model works. 

There is nothing special about agent based models; any simple little program could be called one, and often the core logic is almost embarassingly simple. However, there's quite a bit of work to do for the harness around the model, to help make it interactive, have nice visualizations, etc. There's been many times when the right way to get a handle on a problem I was wrestling with was to write a very simple agent based model... but I was deterred by the amount of overhead it took to do the infrastructure for each one. While working on https://medium.com/@komorama/on-schelling-points-in-organizations-e90647cdd81b I realized that it would be more effective to show not a single, manually created example of each situation, but to show a number of simulated runs, and allow readers to play with the simulations. I decided to overbuild the harness for that system so that it would be easy to create additional agent based models for other problems more quickly, too.

## Installing

Install npm.

Check out this repo.

Run `npm install` to install dependencies.

### Installing on Apple Silicon

The machinery to do screenshotting relies on a library that doesn't install cleanly on Apple Silicon.

Can get everything but screenshots running with `npm install --only=prod`

Install homebrew if not already installed

Run `arch -arm64 brew install pkg-config cairo pango libpng jpeg giflib librsvg`

Then run `npm install canvas` and `npm install`

## Running

Run `npm run start` from command line.

Visit http://localhost:8081

Arrow keys left or right to move forward or backward in state. Spacebar toggles play/pause.

The main config that will be loaded up is `data/default.json`. You can also create additional config files in that directory, and load them by changing the `default` in the URL to be the filename of the json file you want to load.

Run `npm run screenshots` to generate screenshots, one for each state in your `data/default.json`, blowing away whatever was in the screenshots/ directory.

If you only want to generate the screenshots, not the gifs, run `npm run screenshots:png`. If you only want to generate the gifs based on already-generated screenshots, run `npm run screenshots:gif`.

## Deploying

If you want to deploy to firebase hosting, set up a firebase project. Then run `firebase use <PROJECT-ID>`.

Now, you can deploy whenever you want to:

`npm run deploy`

Your web app will now be available at `https://<PROJECT-ID>.web.app/`

## Modifying a simulation

The simulation is configured by reading the JSON in `data/default.json` (or other files in that directory if the URL points to a different file).

The JSON of each of these files is an object containing a version number (1) and a "configs" property containing an array of simulationObjects. You can define
these by hand in the JSON, by carefully reading the documentation for simulatorOptions, and the simOptions documentation for the simulator type you're using, or you can modify them live in the web app using the UI and help affordances. Note that the modifications you make live in the web app don't get saved back to the backing JSON file. However, if you click the `<>` icon to the right of the Simulation selector in the controls, it will open a dialog including the fully modified configuration objects, which you can then copy and paste back into the underlying data JSON files to "save" your live edits.

### Simulation options

```
{
	//Must be a string with only a-zA-z0-9_- characters. Will be shown in the URL. May be omitted.
	"name": "this-is-a-name",
	//The human-readable description of the config. Optional. Will use a transformation of name like "two-words" -> "Two Words" if not provided.
	"title": "This is the name",
	//A longer description of the simulation. If not provided will use title or name.
	"description": "This is a longer description of what you'll notice in this particular configuration of the simulation.",
	//If true, then this config will not be included; typically you only include this for things that other configs will extend.
	"base": false,
	//If set, then this config will extend and overlay the config given by "this-is-another-name". It will not copy over any 'base' config value, and for object values, it will entirely overwrite the value. Note that these extensions won't be visible at all in the UI; the transformation is done before the UI sees it, and the UI operates as though each config is fully specified. You may point to configs that extend other configs, but cycles are not allowed.
	"extend": "this-is-another-name",
	//Height and width. Mainly used for aspect ratio, but for screenshotting this will be the literal height and width in pixels (modulo if you include the display.status)
	"width": 800,
	"height": 450,
	//How many runs to generate in the set
	"runs": 12,
	//The base random number seed for each run (each run and frame gets its own initialized seed based on this.) If omitted, will use a value derived from current time, leading to nondeterministic behavior.
	"seed": "abc",
	//How many milliseconds to wait before advancing to the next frame when playing.
	"frameDelay": 100,
	//How many notional extra frames the final frame as a round should be held on when playing. This allows you to pause on the final frame for longer.
	"extraFinalFrameCount": 10,
	//if true, then it will automatically generate all frames in all runs immediately on creation. This can be very expensive; this should only be set to true for simulations with limited computational overhead.
	"autoGenerate": true,
	//If true, will start playing the simulation immediately upon load.
	"autoPlay": false,
	//If true, then when all rounds have played, it will loop back around to first round and continue playing.
	"repeat": false,
	//Configures whether or not to display certain things. May be omitted.
	"display": {
		//If true, then a status line will be rendered beneath the diagram. This changes the height of the final screenshot from the configured value.
		"status": false,
	},
	//These colors will be provided to the simulation renderer as `--primary-color` etc CSS variables.
	"colors": {
		"primary": "#fb8c00",
		"secondary": "#51b9a3",
		"disabled": "#CCCCCC",
		"background": "transparent"
	}
	//The simulator type to run, which must be one of the names of a simulator in simulators/ directory.
	"sim": "schelling-org",
	//The options to feed to the simulator. These will be different shapes depending on the value of "sim". If this is missing or null, then the simulator's default simOptions will be used. See each specific simulator's documentation for the specific config shapes it expects.
	"simOptions": {}
}

```

## Creating a new Simulator type

The harness comes with a couple of pre-built agent based models (`schelling-org` and `dice-roll-demo` currently). That allows you to play around with those models, but not create your own.

If you want to model your own problem, you'll likely want to create your own type of simulator. This section describes how to do that.

In the `src/simulators/` directory, copy `dice-roll-demo.js` (a simulator that is extremely simple) to whatever file name you want. Then, customize the file. Note that the name property of your class must match the name of the file.

(If you want the new simulator to immediately show up in the drop down in the simulator options, you'll need to run `npm run generate:config`. That will be run automatically when building or deploying.)

If you want to do a simulator that has 'agents' making decisions, pasture-demo.js and standing-ovation.js are better starting points, because they demonstrate how to use graphs, AgentSimulator subclasess, etc.

### Simulator Class

Your customizable simulator is a class that must have the methods described below. Note that the `BaseSimulator` class provides stubs for most of these.

`get name()` - Returns the name of the simulator, e.g. 'schelling-org'. Must be
the same as the name of the file in the src/simulators/ directory. Will show up
in the URL.

`get optionsConfig() => optionsConfig` - Describes the configuration options
specific to this simulator, their legal values, and what they mean. This
generates the UI and also drives a lot of validation behavior. See the
optionsConfig section below for more.

`optionsValidator(normalizedSimOptions) => (no return value)` This method will
be called as an opportunity to do further validation on the options. Throw an
error if the options don't validate. Note that the harness will already check
for config problems against `optionsConfig` before this, so you only need to do
validation that isn't possible to do declaratively via optionsConfig (e.g.
checking a text field against a regular expression, etc.)

`normalizeOptions(rawDefaultedSimOptions) => normalizedSimOptions`. An
opportunity for the simulator to take a raw simOptions and return a fully
normalized options, e.g. with all defaults set, so that all other methods can
assume that all relevant properties are set. All other methods that receive
simOptions will receive the normalized result of this. normalizeOptions may
mutate the rawSimOptions and also return it. Before normalizeOptions is called,
the harness will automatically set any missing config properties with
`optional:true` and `default:true` to the example value. In practice, this means
that a number of optional values can be defaulted automatically and don't
require you to do much in this method, if anything. Note that when setting
defaults for values, it uses the built-in defaulting machinery and does NOT call
out into the simulator.defaultValueForPath.

`generator(frameIndex, previousFrame, normalizedSimOptions, randomGenerator,
runIndex, simWidth, simHeight) => nextFrameData, or null if the simulation run
is terminated` This is the workhorse of your simulator, the thing that actually
does the whole body of your simulation. previousFrame will be null if frameIndex
is 0, otherwise it will be precisely the frame object the generator returned for
frameIndex - 1. This should return null when a run of a simulation is finished.
lastFrame will be frozen, to ensure you don't accidentally modify any part of
it. Typically your generator function will call out to helper functions (for
example, generating the first frame, determining if a simulation is done, etc.)
randomGenerator is a fucntion that, when called, will return a number between
0.0 and 1.0, in a deterministic order for this seed. This generator is based on
the seeded values; use it instead of Math.random() to generate deterministic
results. 

`frameScorer(frame, normalizedSimOptions) => an array of numbers between 0.0 and
1.0 or below 0 to signal indeterminate` This method takes a frame and scores it,
returning an array of numbers. What the numbers mean is up to you; your
`successScorer` method will be the thing that extracts whether a run was
successful or not for the harness. scoreConfig is an override point for you to
describe what your score means. Future iterations of the harness will allow you
to chart these numbers over time.

`scoreConfig(normalizedSimOptions) => an array of info objects describing what
the score at each index of frameScorer means. A null or undefined entry means
'do not show this to a user'. If not null, it should be an object with: `id`: a
consistent ID, `title`:for displaying what that runs means to a user (if
omitted, the id will be converted to a reasonable title), `description`: for
displaying to the user a tooltip of what the metric means (optional), `color`: a
CSS color value for the color of the run in the chart.

`successScorer(frameScore, normalizedSimOptions) => 0.0 if failure, 1.0 if full
success, negative numbers to say indeterminate` This is the method that is
passed the result of a frame's frameScorer, and tells the harness if it was a
success (1.0), a failure (0.0), inbetween (0.0 to 1.0) or indeterminate / not
yet finished (a negative number).

`frameValidator(frame) => (no return value)` - This method
is optional, just to ensure for yourself that your generator hasn't output
invalid frames. Throw an error if the frame is incorrectly structured.

`defaultValueForPath(path, normalizedSimOptions) => value` - Returns the default
value for the property at path, where path is something like
`collaborators.individuals.0' that selects into your simOptions object.
Typically you can leave this as what BaseSimulator does. But for some
properties, you need custom logic to generate a legal default. For example, if
there's extra validation you do in optionsValidator then you might need to do
special case behavior in this.

`get version => integer` - Should return a constant value for the version of
your simulator. You would increment this whenever the properties in your
optionsConfig change in incompatible ways, such that modifications that users
might have made in an old version might no longer work in the new version.

`maxFrameIndex(normalizedSimOptions) => integer` - Should return the maximum
allowable frame count. This is a saftey mechanism to verify that if your
generator forgets to return a null frame (signaling end of sequence) that there
is SOME maximum. BaseSimulator returns 10,000 for this which is a reasonable
extreme; if you have a longer-running sim, override it to return a higher
number.

`renderer() => CustomElementInstance` - Should return a new custom element ready to be inserted into the
DOM. The result will be cached and typically reused many times. See more about
renderers below.

`get fingerprint() => hash` - Should return a fingerprint tied to the optionsConfig
and version. The default behavior of BaseSimulator.fingerprint() is fine to just
leave.

### optionsConfig

The object you emit from your Simulator's `get optionsConfig()` determines a lot
of validation and UI logic for interacting with your simulation. 

Note that typically you define your optionsConfig and then you `npm run generate:types`
to automatically generate a typescript type for your simulator's SimOptions that is based
on your optionsConfig shape. This helps ensure that you don't accidentally have differences
between your optionsConfigs and the shape of SimOptions that you expect.

You can also run `npm run generate` to generate all of the things automatically.
It is customary to check in the `*.GENERATED.*` files so they don't have to be
regenerated often.

It's a declarative format that has the following shape, called an optionsLeaf:
```
{
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
	"example": 1.0,
	//OPTIONAL - the defaulting machinery does most of the work. If provided, then paths to this option can 
	//be known by their long name (the property name that points 
	//to this leaf), or by this shortName. When being packed for a URL, the path will be shortened to its 
	//shortName. The shortName must be unique among its peers in its parent object, now or any time
	//in the past, otherwise URLs out in the wild that were packed with this shortName might expand improperly.
	//Idiomatically, the shortName is the first letter of the name, plus any uppercass letters (e.g. 'fooPropertyName'
	//would be 'fPN') unless there would be a collision, in which case it's typically the property name minus vowels.
	//If not provided, will be set to reasonable defaults according to these idioms. You only have to provide a shortName
	//if you want the shortName to be something atypical for it.
	"shortName": 'a',
	//A help string to show in the UI to explain what it does
	"description": "A string to show in the UI"
	//For numbers, the minimum amount. For arrays, the minimum length. Defaults to 0.0
	"min": 0.0,
	//For numbers, the maximum number. For arrays, the maximum length. Defaults to Number.MAX_SAFE_INTEGER
	"max": 10.0,
	//For numbers, the smallest allowable increment. Defaults to 1.0 (integer)
	"step": 1.0,
	//Extra behavior for a string type. Can be omitted, 'color', or 'seed'. For color, will render an input type = color.
	"behavior": "color",
	//If options is provided, then a select will be rendered, allowing only those options.
	"options": [
		{
			//The actual value, the only required key
			"value": "a",
			//The string to show in the UI. Defaults to value if not provided
			"display": "A"
			//The help text to render in the UI. Defaults to the value of display, or value, if not provided.
			"description": "This option is a string"
		},
	],
	//Hide (optional) is a function that is passed the values of the _parent_ (meaning it can inspect its siblings values), as well as rootValues.
	//If it returns true, it will be hidden from the UI (although values in it will still be there)
	"hide": parentValues => parentValues.type == 'foo'
	//Whether the field is allowed to just not be provided. Defaults to false
	"optional": false,
	//If true, then when this value is being generated as a a default, value, it will be included even if optional. May only be
	//true if optional is true. This is useful for when you don't want to force hand-coded configs to include the value, but in the UI when 
	//the user adds a default value you want it to be included.
	"default": false,
	//If backfill is true, then if the value is not provided by the user (which is only allowed if optional:false), then the
	//example value will automatically be normalized into the simOptions object before it's provided to the simulator's normalizeOptions.
	//This can make sure that downstream parts of your simulator can assume the value exists, even if it wasn't explicitly provided by the user.
	"backfill": false,
	//Advanced options will only render UI if the user has enabled advanced mode. This is useful to hide infrequently needed options.
	"advanced": false,
}
```

In practice, your optionsLeafs will typically nest inside of other optionsLeafs,
with alternating layers of "example" objects. Here's a more complex example:

```
{
	"communication": {
		"example": 0.0,
		"min": 0.0,
		"step": 1.0,
		"description": "How many rounds of communication are allowed before picking. 0 means no communication"
	},
	"display": {
		"example": {
			"debug": {
				"example": false,
				"description": "Whether or not to render debug hints in drawing",
				"advanced": true,
			},
			"individualBeliefs": {
				"example": false,
				"description": "Whether to render dots on each error bar for each individuals' beliefs"
			}
		},
		"description": "Boolean flags that control aspects of rendering",
	},
	"projects": {
		"example": {
			"count": {
				"example": 5.0,
				"min": 1.0,
				"description": "How many projects there should be",
			},
			"individuals": {
				"example": [
					{
						"optional": true,
						"example": {
							"epsilon": {
								"example": 0.05,
								"step": 0.01,
								"description": "The individuals likelihood",
								"optional": true,
							},
							"avgLikelihood": {
								"example": 1.0,
								"optional": true,
								"description": "This individual's specific avg likelihood"
							}
							"description": "Options for a single individual"
						}
						"description": "A single individual. Leave nulls between if you want",
					}
				],
				"description": "An override point for individual projects"
			},
			"position": {
				"example": [
					{
						"example": 0.0,
					}
				],
				"description": "X and y coordinates as a 2-item array"
				"min": 2.0,
				"max": 2.0,
			}
		}
		"description": "Information about projects"
	}
}

```

### Renderer

Your renderer is a custom element that will be inserted into the DOM to render
your frame for the end user. Typically this is implemented as an svg, but it
need not be.

Your renderer is defined in your main simulator file, at the bottom below the
main simulator. All imports (including transitive ones) of Lit must occur below
the `export default SIMULATOR` line. If you copy/paste an example you'll see
a comment warning you of this. This is necessary for `npm run generate:types` to
be able to automatically generate your types for you.

Your simulator custom element will receive the following properties:

`width` - The precise configured width (not necessarily the actual layout width)

`height` - The precise confiugred height (not necessarily the actual layout height)

`frame` - The current frame, which is a shape of object specific to your
simulator, the thing that `generator()` emits. Anything you need to render your
simulation deterministically should be included in the frame.

`scale` - A float that says how much bigger or larger the actual pixel size is
compared to width/height

Your renderer will have a `font-size` targeted at it that will keep the font the
same notional size to scale with the overal visualization as it scales.

Your renderer will also have have CSS variables of the form: `--primary-color`,
etc, targeted at it, based on your simulation configuration.

Your renderer will be placed in a container that will be sized to the same
aspect ratio as the simulations width/height, although perhaps a different value
than the literal value of pixels, because it's sized to fit the available space.
This means you typically want a style like 

```
:host {
	height: 100%;
	width: 100%;
}
```

in the custom element. If you render with an svg, you typically want to have
`viewBox='0 0 ${this.width} ${this.height}` so your layout logic can assume the
literal width height even if the actual display width and height is differently.

Don't forget that even though the harness will instatiate your custom elements
directly, you must register them with the browser before they maybe used, with
something like `window.customElements.define("schelling-org-renderer",
SchellingOrgRenderer);`

### Building / Generating

There is a complex set of node commands for building and generating files.

Confusingly, `npm run generate:types` requires a valid, complining typescript
build (because it relies on executing compiled .js files for each simulator).
This means that if you are missing the *.GENERATED.* files generated by `npm run generate`,
then the build won't complete. That's why there's `npm run generate:stubs`, which
generates little stubs that are enough for a typescript build, after which point you
can run `npm run generate`. In practice you run `npm run generate:pre-build` which
does the stub generation necessary to enable a basic build.

On a fresh checkout where all GENERATED files are checked in: `npm run start`
will get it running. If GENERATED files aren't checked in, `npm run start:clean`
will get it running.

Note that `npm run build` doesn't actually run the generation pipeline, assuming
it's checked in. It's currently safest to run `npm run build:full` before
deploying to fully guarentee all necesary files are generated.

If you want to test a fully clean, no-generated-files checkout, you can run 
`npm run build:clean:pristine` to get the checkout to a fully pristine state to test
against.