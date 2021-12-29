/* eslint-disable no-unused-vars */

import { LitElement, html, css} from "lit-element";

import {
	defaultValueForConfig,
	configForPath
} from './options.js';

import {
	stringHash
} from './util.js';

//See README.md for more on each of these methods.
export class BaseSimulator {

	//Your simulator constructor will be passed no state, and shouldn't store any kind of state.
	//The only reason it's non-static is so this class can call subClasses's overriden methods.
	constructor() {

	}

	get name() {
		return 'INVALID-NAME';
	}

	//The default generator will call this.generateFirstFrame(simOptions, rnd)
	//for the first frame, then for every subsequent frame call
	//generateFrame(frame, rnd) (you can modify the top-level properties of
	//frame, but if you modify any sub-properties you should clone them). When
	//simulationComplete(lastFrame) returns true, it will start returning null
	//frames, signifying the simulation is over. This generator will also ensure
	//that each frame has a 'index' property set to the frameIndex, and
	//`simOptions` property set to simOptions, so generateFrame can retrieve
	//those from the frame if necessary. The behavior of this function is
	//typically a good starting point to use for your own method.
	generator(frameIndex, previousFrame, simOptions, rnd) {
		if (!previousFrame) {
			const firstFrame = this.generateFirstFrame(simOptions, rnd) || {};
			firstFrame.index = frameIndex;
			firstFrame.simOptions = simOptions;
			return firstFrame;
		}
		if (this.simulationComplete(previousFrame)) return null;
		//Note: frame is only a shallow copy, so sub-generators will need to clone sub options.
		const frame = {...previousFrame, index: frameIndex, simOptions: simOptions};
		this.generateFrame(frame, rnd);
		return frame;
	}

	//This is called by the default generator to 
	generateFirstFrame(simOptions, rnd) {
		return {};
	}

	//This is called by the default generator. If you need frame index or
	//simOptions you can inspect frame.index or frame.simOptions. It should
	//modify frame directly, but if it changes any sub-objects it should clone
	//them first.
	generateFrame(frame, rnd) {
		//Your own logic should go here.
	}

	//This is called by the default generator to know when to stop generating
	//frames. frame.index and frame.simOptions can be inspected to get those
	//values.
	simulationComplete(frame) {
		//Your own termination logic should go here.
		return true;
	}

	//An opportunity to make sure that simOptions is set with reasonable
	//defaults. You may modify rawSimOptions directly. Typically you just set
	//optional:true/default:true on fields you want to ensure are defintiely
	//there and don't need to override this.
	normalizeOptions(rawSimOptions) {
		return rawSimOptions;
	}

	//Typically your options are mostly validated based on the configuration you
	//return from optionsConfig. This method is only necessary to override if
	//you need additional validation not handled by that default machinery.
	optionsValidator(normalizedSimOptions) {
		return;
	}

	//The score for the frame. Typically the first number is the 'main' score,
	//and other numbers are auxilary scores, useful for charting over time.
	frameScorer(frame, simOptions) {
		return [0.0];
	}

	//By retuning null we will communicate that none of the scores for this
	//simulator should be offered to be shown to a user.
	scoreConfig(normalizedSimOptions) {
		return [null];
	}

	//This behavior is almost always what you want and can be left alone
	successScorer(frameScore) {
		return frameScore[0];
	}

	frameValidator(frame) {
		return;
	}

	maxFrameIndex(normalizedSimOptions) {
		return 10000;
	}
	
	get optionsConfig() {
		return {};
	}

	//This behavior is almost always what you want and can typically be left
	//alone. You might override it if there are some paths where you would set a
	//default that the basic machinery won't generate automatically, in which
	//case you'd override this, and call super.defaultValueForPath() for the
	//non-special cases.
	defaultValueForPath(path, simOptions) {
		const result = defaultValueForConfig(configForPath(this.optionsConfig, path));
		return result;
	}

	get version() {
		return 0;
	}

	renderer() {
		return new StubSimulatorRenderer();
	}

	get fingerprint() {
		return stringHash(JSON.stringify(this.optionsConfig) + this.version);
	}
}

class StubSimulatorRenderer extends LitElement {
	static get properties() {
		return {
			frame: { type: Object },
			width: {type:Number},
			height: {type:Number},
		};
	} 

	static get styles() {
		return [
			css`

			:host {
				width: 100%;
				height: 100%;
				position: relative;
			}

			`
		];
	}

	render() {
		return html`
			<em>TODO: override this renderer</em>
		`;
	}
}

window.customElements.define("stub-simulator-renderer", StubSimulatorRenderer);