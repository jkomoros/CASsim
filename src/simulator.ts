/* eslint-disable no-unused-vars */

import {
	defaultValueForConfig,
	configForPath
} from './options.js';

import {
	BaseRenderer
} from './renderer.js';

import {
	Fingerprint,
	FrameScore,
	FrameScores,
	NormalizedSimOptions,
	OptionsConfigMap,
	OptionsPath,
	OptionValue,
	RandomGenerator,
	ScoreConfig,
	SimOptions,
	SimulationFrame,
	SimulatorType
} from './types.js';

import {
	stringHash
} from './util.js';

//See README.md for more on each of these methods.
export class BaseSimulator {

	//Your simulator constructor will be passed no state, and shouldn't store any kind of state.
	//The only reason it's non-static is so this class can call subClasses's overriden methods.
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	constructor() {

	}

	get name() : SimulatorType {
		return '';
	}

	//The default generator will call this.generateFirstFrame(simOptions, rnd)
	//for the first frame, then for every subsequent frame call
	//generateFrame(frame, rnd) (you can modify the top-level properties of
	//frame, but if you modify any sub-properties you should clone them). When
	//simulationComplete(lastFrame) returns true, it will start returning null
	//frames, signifying the simulation is over. This generator will also ensure
	//that each frame has a 'index' property set to the frameIndex, and
	//`simOptions` property set to simOptions, and runIndex, width, and height,
	//so generateFrame can retrieve those from the frame if necessary. The
	//behavior of this function is typically a good starting point to use for
	//your own method.
	generator(frameIndex : number, previousFrame : SimulationFrame, simOptions : NormalizedSimOptions, rnd : RandomGenerator, runIndex : number, simWidth : number, simHeight : number) : SimulationFrame {
		if (!previousFrame) {
			const firstFrame = {
				index: frameIndex,
				simOptions,
				runIndex,
				width: simWidth,
				height: simHeight
			};
			return this.generateFirstFrame(firstFrame, rnd);
		}
		if (this.simulationComplete(previousFrame)) return null;
		//Note: frame is only a shallow copy, so sub-generators will need to clone sub options.
		const frame = {...previousFrame, index: frameIndex};
		this.beforeGenerateFrame(frame,rnd);
		this.generateFrame(frame, rnd);
		this.afterGenerateFrame(frame, rnd);
		return frame;
	}

	//This is called by the default generator to generate the first frame.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	generateFirstFrame(baseFrame : SimulationFrame, _rnd : RandomGenerator) : SimulationFrame {
		return {
			...baseFrame
			//Extend with extra properties here
		};
	}

	//Called before generateFrame is called, for any non-first-frames. A chance
	//to set frame values.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
	beforeGenerateFrame(_frame : SimulationFrame, _rnd : RandomGenerator) : void {

	}

	//Called after generateFrame is called, for any non-first-frames. A chance
	//to set frame values.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
	afterGenerateFrame(_frame : SimulationFrame, _rnd : RandomGenerator) : void {

	}

	//This is called by the default generator. If you need frame index or
	//simOptions you can inspect frame.index or frame.simOptions. It should
	//modify frame directly, but if it changes any sub-objects it should clone
	//them first.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
	generateFrame(_frame : SimulationFrame, _rnd : RandomGenerator) : void {
		//Your own logic should go here.
	}

	//This is called by the default generator to know when to stop generating
	//frames. frame.index and frame.simOptions can be inspected to get those
	//values.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	simulationComplete(_frame : SimulationFrame) : boolean {
		//Your own termination logic should go here.
		return true;
	}

	//An opportunity to make sure that simOptions is set with reasonable
	//defaults. You may modify rawSimOptions directly. Typically you just set
	//optional:true/backfill:true on fields you want to ensure are defintiely
	//there and don't need to override this.
	normalizeOptions(rawSimOptions : SimOptions) : NormalizedSimOptions {
		return rawSimOptions;
	}

	//Typically your options are mostly validated based on the configuration you
	//return from optionsConfig. This method is only necessary to override if
	//you need additional validation not handled by that default machinery.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	optionsValidator(_normalizedSimOptions : NormalizedSimOptions) : void {
		return;
	}

	//The score for the frame. Typically the first number is the 'main' score,
	//and other numbers are auxilary scores, useful for charting over time.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	frameScorer(_frame : SimulationFrame, _simOptions : NormalizedSimOptions) : FrameScores {
		return [0.0];
	}

	//By retuning null we will communicate that none of the scores for this
	//simulator should be offered to be shown to a user.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	scoreConfig(_normalizedSimOptions : NormalizedSimOptions) : ScoreConfig {
		return [null];
	}

	//This behavior is almost always what you want and can be left alone
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	successScorer(frameScore : FrameScores, _normalizedSimOptions : NormalizedSimOptions) : FrameScore {
		return frameScore[0];
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	frameValidator(_frame : SimulationFrame) : void {
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	maxFrameIndex(_normalizedSimOptions : NormalizedSimOptions) : number {
		return 10000;
	}
	
	get optionsConfig() : OptionsConfigMap {
		//When you modify this method, re-run `npm run generate` to update the types and schema checking
		return {};
	}

	//This behavior is almost always what you want and can typically be left
	//alone. You might override it if there are some paths where you would set a
	//default that the basic machinery won't generate automatically, in which
	//case you'd override this, and call super.defaultValueForPath() for the
	//non-special cases.
	//eslint-disable-next-line @typescript-eslint/no-unused-vars
	defaultValueForPath(path : OptionsPath, _simOptions : NormalizedSimOptions) : OptionValue {
		const result = defaultValueForConfig(configForPath(this.optionsConfig, path));
		return result;
	}

	get version() : number {
		return 0;
	}

	renderer() : BaseRenderer {
		throw new Error('Unimplemented: Simulators should override this');
	}

	get fingerprint() : Fingerprint {
		return stringHash(JSON.stringify(this.optionsConfig) + this.version);
	}
}