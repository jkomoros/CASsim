/* eslint-disable no-unused-vars */

import { LitElement, html, css} from "lit-element";

import {
	defaultValueForConfig,
	configForPath
} from './options.js';

//See README.md for more on each of these methods.
export class BaseSimulator {

	//Your simulator constructor will be passed no state, and shouldn't store any kind of state.
	//The only reason it's non-static is so this class can call subClasses's overriden methods.
	constructor() {

	}

	get name() {
		return 'INVALID-NAME';
	}

	generator(previousFrames, simOptions, rnd) {
		return {};
	}

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

	renderer() {
		return new StubSimulatorRenderer();
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