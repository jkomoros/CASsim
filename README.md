# CASsim
Complex Adaptive Systems Simulator.

In a very very messy state.

# Installing

Install npm.

Check out this repo.

Run `npm install` to install dependencies.

# Running

If you want to do your own config, create a `config.json` in the root of the repo. If not provided, `config.SAMPLE.json` will be used.

Run `polymer serve` from command line.

Visit http://localhost:8081

Arrow keys left or right to move forward or backward in state.

Run `npm run generate` to generate screenshots, one for each state in your `config.json`, blowing away whatever was in the screenshots/ directory.

If you only want to generate the screenshots, not the gifs, run `npm run generate:screenshot`. If you only want to generate the gifs based on already-generated screenshots, run `npm run generate:gif`.