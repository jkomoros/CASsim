import { LitElement, html, css} from "lit-element";
import { connect } from "pwa-helpers/connect-mixin.js";

// This element is connected to the Redux store.
import { store } from "../store.js";

import {
	selectFrameIndex,
	selectRunIndex,
	selectSimulationIndex,
	selectSimulationsMap,
	selectCurrentSimulationMaxRunIndex
} from "../selectors.js";

import {
	updateSimulationIndex,
	updateFrameIndex,
	updateRunIndex
} from '../actions/data.js';

// These are the shared styles needed by this element.
import { SharedStyles } from "./shared-styles.js";

class SimulationControls extends connect(store)(LitElement) {
	static get properties() {
		return {
			_simulationsMap: { type:Object },
			_simulationIndex: { type:Number },
			_simulationMaxRunIndex: { type:Number },
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
					<label for='simulationIndex'>Simulation</label>
					<select id='simulationIndex' .value=${this._simulationIndex} @change=${this._handleSimulationIndexChanged}>
						${Object.entries(this._simulationsMap).map(entry => html`<option value=${entry[0]}>${entry[1].description}</option>`)}
					</select>
				</div>
				<div>
					<label for='runIndex'>Run</label>
					<input id='runIndex' .value=${this._runIndex} type='number' min='0' max=${this._simulationMaxRunIndex} @change=${this._handleRunIndexChanged}>
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
		this._simulationsMap = selectSimulationsMap(state);
		this._simulationIndex = selectSimulationIndex(state);
		this._simulationMaxRunIndex = selectCurrentSimulationMaxRunIndex(state);
		this._frameIndex = selectFrameIndex(state);
		this._runIndex = selectRunIndex(state);
	}

	_handleSimulationIndexChanged(e) {
		const ele = e.composedPath()[0];
		store.dispatch(updateSimulationIndex(ele.value));
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
