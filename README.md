# CASsim
<img src='images/manifest/icon-96x96.png?raw=true' align='right' />
CASsim stands for Complex Adaptive Systems simulator.

This is a very basic harness and framework to make configurable, interactive agent based models and then generate animated screenshots of their results.

It's in a very messy, hacky state, but I'm continuing to work on it. File an issue with thoughts on how to improve it!

You can see a live demo at [https://cassim-viewer.web.app/](https://cassim-viewer.web.app/)

![interface Demo](/examples/screenshot.png?raw=true)

![Animated Example](/examples/example.gif?raw=true)

## Why this exists

Many problems can be modeled as **complex adaptive systems**. In complex adaptive systems, a number of 'agents' continually make decisions based on their context. Crucially, their context includes the actions and state of *other* agents. This interdependence of decisions among agents is why these systems demonstrate **complexity**. A complex problem domain is one that exhibits non-linear behavior that cannot be captured in static equations. The only way to see what will happen in a complex system is to 'run' it&mdash;either let it play out in reality, or to simulate some code.

These kinds of systems have emergent, evolving behaviors that are notoriously difficult to predict. Typical reductionist tools that work in linear domains (statistics, Excel-based modeling) simply do not work, because they can't model the interdependencies. As a general rule of thumb, if you have a complex problem and are trying to model it in a spreadsheet, you've already failed. If you erroneously model a complex system as a linear one, you will come to sometimes dangerously misleading conclusions and lulled by faux precision&mdash;to say nothing of often completely missing fundamental dynamics.

In the last century, reductionist tools have gotten *very* good and have been successfully applied to myriad domains. But most of the problems that are left that vex modern society are complex ones. As a society we keep applying the wrong reductionist tools to them, and then get frustrated and angry when reality doesn't line up with the analysis.

One bright spot is that although complex adapative systems are very difficult to predict in their specifics, it is possible to make generalized, stochastic predictions by modeling the problem as a simulation to execute. Although the *precise* behaviors are highly contingent, you can often capture the high-level dynamics of the system in an extremely small number of rules that agents execute. For example, bird flocking behavior is famously "explained" by only three simple rules.

That's where **agent based modelling** comes in. Instead of doing a typical linear model in Excel, you write a small set of rules for agents to execute. You try to build a model by imagining the basic decision procedures an agent might follow, and add them to their rules. Then you keep on tweaking and adding until you get behavior that mimics the real-world phenomenon, which tells you that you've 'captured' a meaningful portion of the dynamics. You can then do experiments with the model to see how it might behave in other siuations. These predictions should be taken merely as calibrated hypotheses, but they are better than dangerous faux precision from Excel models, or from just throwing your hands in the air and treating the system as entirely unpredictable and chaotic. And because the models are interactive, they allow someone to play with them and experiemnt, developing a deep, ineffable intuition for how that model works. 

There is nothing special about agent based models; any simple little program could be called one, and often the core logic is almost embarassingly simple. However, there's quite a bit of work to do for the harness around the model, to help make it interactive, have nice visualizations, etc. There's been many times when the right way to get a handle on a problem I was wrestling with was to write a very simple agent based model... but I was deterred by the amount of overhead it took to do the infrastructure for each one. While working on https://medium.com/@komorama/schelling-points-in-organizations-e90647cdd81b I realized that it would be more effective to show not a single, manually created example of each situation, but to show a number of simulated runs, and allow readers to play with the simulations. I decided to overbuild the harness for that system so that it would be easy to create additional agent based models for other problems more quickly, too.

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

Run `polymer serve` from command line.

Visit http://localhost:8081

Arrow keys left or right to move forward or backward in state. Spacebar toggles play/pause.

The main config that will be loaded up is `data/default.json`. You can also create additional config files in that directory, and load them by changing the `default` in the URL to be the filename of the json file you want to load.

Run `gulp generate` to generate screenshots, one for each state in your `data/default.json`, blowing away whatever was in the screenshots/ directory.

If you only want to generate the screenshots, not the gifs, run `gulp generate:screenshot`. If you only want to generate the gifs based on already-generated screenshots, run `gulp generate:gif`.

## Deploying

If you want to deploy to firebase hosting, set up a firebase project. Then run `firebase use <PROJECT-ID>`.

Now, you can deploy whenever you want to:

`gulp deploy`

Your web app will now be available at `https://<PROJECT-ID>.web.app/`

## Modifying a simulation

The simulation is configured by reading the JSON in `data/default.json` (or other files in that directory if the URL points to a different file).

The JSON of each of these files is an array of simulationObjects. You can define
these by hand in the JSON, by carefully reading the documentation for simulatorOptions, and the simOptions documentation for the simulator type you're using, or you can modify them live in the web app using the UI and help affordances. Note that the modifications you make live in the web app don't get saved back to the backing JSON file. However, if you click the `<>` icon to the right of the Simulation selector in the controls, it will open a dialog including the fully modified configuration objects, which you can then copy and paste back into the underlying data JSON files to "save" your live edits.

## Creating a new Simulator type

The harness comes with a couple of pre-built agent based models (`schelling-org` and `dice-roll-demo` currently). That allows you to play around with those models, but not create your own.

If you want to model your own problem, you'll likely want to create your own type of simulator. This section describes how to do that.

In the `src/simulators/` directory, copy `dice-roll-demo.js` (a simulator that is extremely simple) to whatever file name you want. Then, customize the file. Note that the name property of your class must match the name of the file.

(If you want the new simulator to immediately show up in the drop down in the simulator options, you'll need to run `gulp generate-listings-json`. That will be run automatically when building or deploying.)

### Simulator Class

Your customizable simulator is a class that must have the methods described below. Note that the `BaseSimulator` class provides stubs for most of these.

`get name()` - Returns the name of the simulator, e.g. 'schelling-org'. Must be
the same as the name of the file in the src/simulators/ directory. Will show up
in the URL.

`get optionsConfig() => optionsConfig` - Describes the configuration options
specific to this simulator, their legal values, and what they mean. This
generates the UI and also drives a lot of validation behavior. See the
optionsConfig section below for more.

`optionsValidator(normalizedSimOptions) => array of problem strings, or [] if
OK.` Note that the harness will already check for config problems against
`optionsConfig` before this, so you only need to do validation that isn't
possible to do declaratively via optionsConfig (e.g. checking a text field
against a regular expression, etc.)

`normalizeOptions(rawSimOptions) => normalizedSimOptions`. An opportunity for
the simulator to take a raw simOptions and return a fully normalized
options, e.g. with all defaults set, so that all other methods can assume
that all relevant properties are set. All other methods that receive
simOptions will receive the normalized result of this. normalizeOptions may
mutate the rawSimOptions and also return it.

`generator(previousFrames, normalizedSimOptions, randomGenerator, runIndex) =>
nextFrameData, or null if the simulation run is terminated` This is the
workhorse of your simulator, the thing that actually does the whole body of your
simulation. This should return null when a run of a simulation is finished.
Typically your generator function will call out to helper functions (for
example, generating the first frame, determining if a simulation is done, etc.)
randomGenerator is a fucntion that, when called, will return a number between
0.0 and 1.0, in a deterministic order for this seed. This generator is based on
the seeded values; use it instead of Math.random() to generate deterministic
results. 

`frameScorer(frame, normalizedSimOptions) => an array of numbers between 0.0 and
1.0 or below 0 to signal indeterminate` This method takes a frame and scores it,
returning an array of numbers. What the numbers mean is up to you; your
`successScorer` method will be the thing that extracts whether a run was
successful or not for the harness. Future iterations of the harness will allow
you to chart these numbers over time.

`successScorer(frameScore, normalizedSimOptions) => 0.0 if failure, 1.0 if full
success, negative numbers to say indeterminate` This is the method that is
passed the result of a frame's frameScorer, and tells the harness if it was a
success (1.0), a failure (0.0), inbetween (0.0 to 1.0) or indeterminate / not
yet finished (a negative number).

`frameValidator(frame, normalizedSimOptions) => array of strings defining
problems, or [] if OK` - This method is optional, just to ensure for yourself
that your generator hasn't output invalid frames.

`defaultValueForPath(path, normalizedSimOptions) => value` - Returns the default
value for the property at path, where path is something like
`collaborators.individuals.0' that selects into your simOptions object.
Typically you can leave this as what BaseSimulator does. But for some
properties, you need custom logic to generate a legal default. For example, if
there's extra validation you do in optionsValidator then you might need to do
special case behavior in this.

`renderer() => CustomElementInstance` - Should return a new custom element ready to be inserted into the
DOM. The result will be cached and typically reused many times. See more about
renderers below.

### optionsConfig

The object you emit from your Simulator's `get optionsConfig()` determines a lot
of validation and UI logic for interacting with your simulation. It's a
declarative format that has the following shape, called an optionsLeaf:
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
    // for numbers, booleans, and strings, this value will also be used as the default
    "example": 1.0,
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
    //For array and object types, whether a given item is allowed to be set explicitly to null.
    //Defaults to false
    "optional": false,
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

Your simulator custom element will receive the following properties:

`width` - The precise configured width (not necessarily the actual layout width)

`height` - The precise confiugred height (not necessarily the actual layout height)

`frame` - The current frame, which is a shape of object specific to your
simulator, the thing that `generator()` emits. Anything you need to render your
simulation deterministically should be included in the frame.

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