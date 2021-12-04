# CASsim
CASsim stands for Complex Adaptive Systems simulator.

This is a very basic harness and framework to make configurable, interactive agent based models and then generate animated screenshots of their results.

It's in a very messy, hacky state, but I'm continuing to work on it. File an issue with thoughts on how to improve it!

You can see a live demo at [https://cassim-viewer.web.app/](https://cassim-viewer.web.app/)

![interface Demo](/examples/screenshot.png?raw=true)

![Animated Example](/examples/example.gif?raw=true)

## Why this exists

Many problems can be modeled as **complex adaptive systems**. In complex adaptive systems, a number of 'agents' continually make decisions based on their context. Crucially, their context includes the actions and state of *other* agents. This interdependence of decisions among agents is why these systems demonstrate **complexity**. A complex problem domain is one that exhibits non-linear behavior that cannot be captured in static equations. The only way to see what will happen in a complex system is to 'run' it&mdash;either let it play out in reality, or to simulate some code.

These kinds of systems have emergent, evolving behaviors that are notoriously difficult to predict. Typical reductionist tools that work in linear domains (statistics, Excel-based modeling) simply do not work, because they can't model the interdepenencies. As a general rule of thumb, if you have a complex problem and are trying to model it in a spreadsheet, you've already failed. If you erroneously model a complex system as a linear one, you will come to sometimes dangerously misleading conclusions.

In the last century, reductionist tools have gotten *very* good and have been successfully applied to myriad domains. But most of the problems that vex modern society are complex ones. As a society we keep applying the wrong reductionist tools to them, and then get frustrated and angry when reality doesn't line up with the analysis.

One bright spot is that although complex adapative systems are very difficult to predict in their specifics, it is possible to make generalized, stochastic predictions by modeling the problem as a simulation to execute. Although the *precise* behaviors are highly contingent, you can often capture the high-level dynamics of the system in an extremely small number of rules that agents execute. For example, bird flocking behavior is famously "explained" by only three simple rules.

That's where Agent Based Modelling comes in. Instead of doing a typical linear model in Excel, you write a small set of rules for agents to execute. You can then simulate many different configurations and develop an intuition for how they will respond to different situations. You try to build a model by imagining the basic decision procedures an agent might follow, and add them to their rules. Then you keep on testing until you get behavior that mimics the real-world phenomenon, which tells you that you've 'captured' a meaningful portion of the dynamics. You can then do experiments with the model to see how it might behave in other siuations. These predictions should be taken merely as calibrated hypotheses, but they are better than dangerous faux precision from Excel models, or from just throwing your hands in the air and treating the system as entirely unpredictable and chaotic. And because the models are interactive, they allow someone to play with them and experiemnt, developing a deep, ineffable intuition for how that model works. 

There is nothing special about agent based model; any simple little program could be called one, and often the core logic is almost embarassingly simple. However, there's quite a bit of work to do for the harness around the model, to help make it interactive, have nice visualizations, etc. There's been many times when the right way to get a handle on a problem I was wrestling with was to write a very simple agent based model... but I was deterred by the amount of overhead it took to do the infrastructure for each one. While working on https://medium.com/@komorama/schelling-points-in-organizations-e90647cdd81b I realized that it would be more effective to show not a single, manually created example of each situation, but to show a number of simulated runs. I decided to overbuild the harness for that system so that it would be easy to create additional agent based models for other domains far more quickly.

## Installing

Install npm.

Check out this repo.

Run `npm install` to install dependencies.

### Installing on an M1 chip

Can get everything but screenshots running with `npm install --only=prod`

Install homebrew if not already installed

Run `arch -arm64 brew install pkg-config cairo pango libpng jpeg giflib librsvg`

Then run `npm install canvas` and `npm install` (?)

## Running

If you want to do your own config, create a `config.json` in the root of the repo. If not provided, `config.SAMPLE.json` will be used.

Run `polymer serve` from command line.

Visit http://localhost:8081

Arrow keys left or right to move forward or backward in state.

Run `npm run generate` to generate screenshots, one for each state in your `config.json`, blowing away whatever was in the screenshots/ directory.

If you only want to generate the screenshots, not the gifs, run `npm run generate:screenshot`. If you only want to generate the gifs based on already-generated screenshots, run `npm run generate:gif`.

## Deploying

`gulp deploy`

## Creating a new Simulator type

Create a new file in the src/simulators directory, copying an existing one (dice-roll-demo.js is a simple example) and tweaking.

Run `gulp generate-listings-json` to get the new sim type to show up in the simulation controls. (This is run for you automatically when you build or deploy)