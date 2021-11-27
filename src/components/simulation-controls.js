import { LitElement, html, css} from "lit-element";
import { connect } from "pwa-helpers/connect-mixin.js";

// This element is connected to the Redux store.
import { store } from "../store.js";

import {
	selectFrameIndex,
	selectRunIndex,
	selectSimulationIndex,
	selectSimulationsMap,
	selectCurrentSimulationMaxRunIndex,
	selectCurrentSimulationRun,
	selectCurrentSimulation,
} from "../selectors.js";

import {
	updateSimulationIndex,
	updateFrameIndex,
	updateRunIndex,
	updateCurrentSimulationOptions,
	openDialog,
} from '../actions/data.js';

import {
	CODE_ICON
} from "./my-icons.js";

import { ButtonSharedStyles } from "./button-shared-styles.js";
import { SharedStyles } from "./shared-styles.js";

import './run-summary.js';
import './options-control.js';

class SimulationControls extends connect(store)(LitElement) {
	static get properties() {
		return {
			_simulationsMap: { type:Object },
			_simulationIndex: { type:Number },
			_simulationMaxRunIndex: { type:Number },
			_maxFrameIndex: { type: Number },
			_simulation: { type: Object},
			_frameIndex: { type: Number },
			_runIndex: {type: Number},
			_runStatuses: { type:Array },
		};
	}

	static get styles() {
		return [
			SharedStyles,
			ButtonSharedStyles,
			css`
				:host {
					position:absolute;
					top: 0;
					left: 0;
				}
				.row {
					display:flex;
					flex-direction:row;
				}
			`
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
				<div class='row'>
					<div>
						<label for='runIndex'>Run</label>
						<input id='runIndex' .value=${this._runIndex} type='number' min='0' max=${this._simulationMaxRunIndex} @change=${this._handleRunIndexChanged}>
					</div>
					<div>
						<label for='frameIndex'>Frame</label>
						<input id='frameIndex' .value=${this._frameIndex} type='number' min='0' max=${this._maxFrameIndex} @change=${this._handleFrameIndexChanged}>
					</div>
					<div>
						<button class='small' @click=${this._handleShowJSONClicked}>${CODE_ICON}</button>
					</div>
				</div>
				<div>
					<run-summary .statuses=${this._runStatuses} .selectedIndex=${this._runIndex} @run-clicked=${this._handleStatusClicked}></run-summary>
				</div>
				<div>
					<options-control @option-changed=${this._handleOptionChanged} .config=${this._simulation.optionsConfig} .value=${this._simulation.rawConfig}></options-control>
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

		//We can't just have a selector for these, because the value will change
		//even when the inputs don't, so the selector would give an old value.
		const run = selectCurrentSimulationRun(state);
		this._maxFrameIndex = run ? run.maxFrameIndex : Number.MAX_SAFE_INTEGER;

		this._simulation = selectCurrentSimulation(state);
		this._runStatuses = this._simulation ? this._simulation.runs.map(run => run.finalStatus) : [];
		
	}

	_handleStatusClicked(e) {
		store.dispatch(updateRunIndex(e.detail.index));
	}

	_handleShowJSONClicked() {
		store.dispatch(openDialog());
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

	_handleOptionChanged(e) {
		store.dispatch(updateCurrentSimulationOptions(e.detail.path, e.detail.value));
	}
}

window.customElements.define("simulation-controls", SimulationControls);
