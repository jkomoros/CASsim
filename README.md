# CASsim
CASsim stands for Complex Adaptive Systems simulator.

This is a very basic harness and framework to make configurable, interactive agent based models and then generate animated screenshots of their results.

It's in a very messy, hacky state, but I'm continuing to work on it. File an issue with thoughts on how to improve it!

You can see a live demo at [https://cassim-viewer.web.app/](https://cassim-viewer.web.app/)

![interface Demo](/examples/screenshot.png?raw=true)

![Animated Example](/examples/example.gif?raw=true)

# Installing

Install npm.

Check out this repo.

Run `npm install` to install dependencies.

### Installing on an M1 chip

Can get everything but screenshots running with `npm install --only=prod`

Install homebrew if not already installed

Run `arch -arm64 brew install pkg-config cairo pango libpng jpeg giflib librsvg`

Then run `npm install canvas` and `npm install` (?)

# Running

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