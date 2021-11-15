import { LitElement, html, css} from "lit-element";
import { connect } from "pwa-helpers/connect-mixin.js";

// This element is connected to the Redux store.
import { store } from "../store.js";

import {
	selectFrameIndex,
} from "../selectors.js";

import {
	updateFrameIndex
} from '../actions/data.js';

// These are the shared styles needed by this element.
import { SharedStyles } from "./shared-styles.js";

class SimulationControls extends connect(store)(LitElement) {
	static get properties() {
		return {
			_frameIndex: { type: Number },
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
				<label for='frameIndex'>Frame</label>
				<input id='frameIndex' .value=${this._frameIndex} type='number' min='0' @change=${this._handleFrameIndexChanged}>
			</div>
		`;
	}

	// This is called every time something is updated in the store.
	stateChanged(state) {
		this._frameIndex = selectFrameIndex(state);
	}

	_handleFrameIndexChanged(e) {
		const ele = e.composedPath()[0];
		store.dispatch(updateFrameIndex(ele.value));
	}
}

window.customElements.define("simulation-controls", SimulationControls);
