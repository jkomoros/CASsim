/* eslint-disable no-unused-vars */

import { LitElement, html, css} from "lit-element";

/*
	Simulators are classes that have the following static methods:

	get name() - Returns the name of the simulator, e.g. 'schelling-org'. Must be
	the same as the name of the file in the src/simulators/ directory.

	optionsValidator(normalizedSimOptions) => array of problem strings, or [] if
	OK. Note that the harness will already check for config problems against
	optionsConfig() before this, so you only need to do validation that isn't
	possible to do declaratively via optionsConfig() (e.g. checking a text field
	against a regular expression, etc.)

	normalizeOptions(rawSimOptions) => normalizedSimOptions. An opportunity for
	the simulator to take a raw sim options and return a fully normalized
	options, e.g. with all defaults set, so that all other methods can assume
	that all relevant properties are set. All other methods that receive
	simOptions will receive the normalized result of this. normalizeOptions may
	mutate the rawSimOptions and also return it.

	generator(previousFrames, normalizedSimOptions, randomGenerator, runIndex)
	=> nextFrameData, or null if the simulation run is terminated

	frameScorer(frame, normalizedSimOptions) => an array of numbers between 0.0
	and 1.0 or below 0 to signal indeterminate

	successScorer(frameScore, normalizedSimOptions) => 0.0 if failure, 1.0 if
	full success, negative numbers to say indeterminate

	frameValidator(frame, normalizedSimOptions) => array of strings defining
	problems, or [] if OK

	get optionsConfig() optionsConfig - Describes the options, their legal values,
	and what they mean. See optionsConfig shape, below.

	renderer() - Should return a custom element ready to be inserted into the
	DOM.

*/
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
		return [];
	}

	//The score for the frame. Typically the first number is the 'main' score,
	//and other numbers are auxilary scores, useful for charting over time.
	frameScorer(frame, simOptions) {
		return [0.0];
	}

	successScorer(frameScore) {
		return frameScore[0];
	}

	frameValidator(frame) {
		return [];
	}
	
	get optionsConfig() {
		return {};
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