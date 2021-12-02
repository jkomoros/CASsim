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
	selectPlaying,
	selectShowControls,
} from "../selectors.js";

import {
	updateSimulationIndex,
	updateFrameIndex,
	updateRunIndex,
	updateCurrentSimulationOptions,
	openDialog,
	updatePlaying,
	resetSimulation,
	advanceToLastFrameInRun
} from '../actions/data.js';

import {
	CODE_ICON,
	PLAY_ICON,
	REPLAY_ICON,
	PAUSE_ICON,
	FAST_FORWARD_ICON
} from "./my-icons.js";

import { ButtonSharedStyles } from "./button-shared-styles.js";
import { SharedStyles } from "./shared-styles.js";

import './run-summary.js';
import './options-control.js';

class SimulationControls extends connect(store)(LitElement) {
	static get properties() {
		return {
			_showControsl : {type:Boolean},
			_simulationsMap: { type:Object },
			_simulationIndex: { type:Number },
			_simulationMaxRunIndex: { type:Number },
			_maxFrameIndex: { type: Number },
			_simulation: { type: Object},
			_frameIndex: { type: Number },
			_runIndex: {type: Number},
			_runStatuses: { type:Array },
			_playing: {type: Boolean},
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
					width: 18em;
					background-color: white;
					padding: 0.5em;
					z-index: 1;
				}

				input {
					width: 3.0em;
				}

				[hidden] {
					display:none;
				}

				.row {
					display:flex;
					flex-direction:row;
				}

				input, select {
					margin-right: 0.5em;
				}

				select {
					margin-left: 0.5em;
				}
			`
		];
	}


	render() {
		return html`
			<div class='container' ?hidden=${!this._showControls}>
				<div class='row'>
					<label for='simulationIndex'>Simulation</label>
					<select id='simulationIndex' .value=${this._simulationIndex} @change=${this._handleSimulationIndexChanged} .readonly=${this._playing}>
						${Object.entries(this._simulationsMap).map((entry, index) => html`<option value=${index}>${entry[1].description}</option>`)}
					</select>
					<div>
						<button class='small' .disabled=${this._playing} @click=${this._handleShowJSONClicked}>${CODE_ICON}</button>
					</div>
				</div>
				<div class='row'>
					<div>
						<label for='runIndex'>Run</label>
						<input id='runIndex' .value=${this._runIndex} type='number' min='0' max=${this._simulationMaxRunIndex} @change=${this._handleRunIndexChanged} .readonly=${this._playing}>
					</div>
					<div>
						<label for='frameIndex'>Frame</label>
						<input id='frameIndex' .value=${this._frameIndex} type='number' min='0' max=${this._maxFrameIndex} @change=${this._handleFrameIndexChanged} .readonly=${this._playing}>
					</div>
					<div>
						<button class='small' .disabled=${this._playing} @click=${this._handlePlayClicked}>${PLAY_ICON}</button>
					</div>
					<div>
						<button class='small' .disabled=${!this._playing} @click=${this._handlePauseClicked}>${PAUSE_ICON}</button>
					</div>
					<div>
						<button class='small' .disabled=${this._playing} @click=${this._handleFastForwardClicked}>${FAST_FORWARD_ICON}</button>
					</div>
					<div>
						<button class='small' .disabled=${this._playing} @click=${this._handleReplayClicked}>${REPLAY_ICON}</button>
					</div>
				</div>
				<div>
					<run-summary .statuses=${this._runStatuses} .selectedIndex=${this._runIndex} @run-clicked=${this._handleStatusClicked}></run-summary>
				</div>
				<div>
					<details>
						<summary><label>Simulation Configuration</label></summary>
						<options-control .readonly=${this._playing} @option-changed=${this._handleOptionChanged} @open-dialog=${this._handleOpenDialog} .config=${this._simulation ? this._simulation.optionsConfig : null} .value=${this._simulation ? this._simulation.rawConfig : null} .name=${''}></options-control>
					</details>
				</div>
			</div>
		`;
	}

	// This is called every time something is updated in the store.
	stateChanged(state) {
		this._showControls = selectShowControls(state);
		this._simulationsMap = selectSimulationsMap(state);
		this._simulationIndex = selectSimulationIndex(state);
		this._simulationMaxRunIndex = selectCurrentSimulationMaxRunIndex(state);
		this._frameIndex = selectFrameIndex(state);
		this._runIndex = selectRunIndex(state);
		this._playing = selectPlaying(state);

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

	_handlePlayClicked() {
		store.dispatch(updatePlaying(true));
	}

	_handlePauseClicked() {
		store.dispatch(updatePlaying(false));
	}

	_handleFastForwardClicked() {
		store.dispatch(advanceToLastFrameInRun());
	}

	_handleReplayClicked() {
		store.dispatch(resetSimulation());
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

	_handleOpenDialog(e) {
		store.dispatch(openDialog(e.detail.type, e.detail.extras));
	}
}

window.customElements.define("simulation-controls", SimulationControls);
