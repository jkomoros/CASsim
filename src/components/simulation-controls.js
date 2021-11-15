import { LitElement, html, css} from "lit-element";
import { connect } from "pwa-helpers/connect-mixin.js";

// This element is connected to the Redux store.
import { store } from "../store.js";

import {
	selectFrameIndex,
	selectRunIndex,
} from "../selectors.js";

import {
	updateFrameIndex,
	updateRunIndex
} from '../actions/data.js';

// These are the shared styles needed by this element.
import { SharedStyles } from "./shared-styles.js";

class SimulationControls extends connect(store)(LitElement) {
	static get properties() {
		return {
			_frameIndex: { type: Number },
			_runIndex: {type: Number},
		};
	}

	static get styles() {
		return [
			SharedStyles,
			css``
		];
	}


	render() {
		return html`
			<div class='container'>
				<div>
					<label for='runIndex'>Run</label>
					<input id='runIndex' .value=${this._runIndex} type='number' min='0' @change=${this._handleRunIndexChanged}>
				</div>
				<div>
					<label for='frameIndex'>Frame</label>
					<input id='frameIndex' .value=${this._frameIndex} type='number' min='0' @change=${this._handleFrameIndexChanged}>
				</div>
			</div>
		`;
	}

	// This is called every time something is updated in the store.
	stateChanged(state) {
		this._frameIndex = selectFrameIndex(state);
		this._runIndex = selectRunIndex(state);
	}

	_handleFrameIndexChanged(e) {
		const ele = e.composedPath()[0];
		store.dispatch(updateFrameIndex(ele.value));
	}

	_handleRunIndexChanged(e) {
		const ele = e.composedPath()[0];
		store.dispatch(updateRunIndex(ele.value));
	}
}

window.customElements.define("simulation-controls", SimulationControls);
