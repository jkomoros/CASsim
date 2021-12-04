/* eslint-disable no-unused-vars */

import { LitElement, html, css} from "lit-element";

export class BaseSimulator {

	static name() {
		return 'INVALID-NAME';
	}

	static generator(previousFrames, simOptions, rnd) {
		return {};
	}

	static normalizeOptions(rawSimOptions) {
		return rawSimOptions;
	}

	static optionsValidator(normalizedSimOptions) {
		return [];
	}

	static frameScorer(frame, simOptions) {
		return [0.0];
	}

	static successScorer(frameScore) {
		return frameScore[0];
	}

	static frameValidator(frame) {
		return [];
	}
	
	static optionsConfig() {
		return {};
	}

	static renderer() {
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