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
	selectConfigurationExpanded,
	selectPathExpanded,
	selectDescriptionExpanded,
	selectFilename,
	selectKnownDatafiles,
} from "../selectors.js";

import {
	updateSimulationIndex,
	updateFrameIndex,
	updateRunIndex,
	updateCurrentSimulationOptions,
	openDialog,
	updatePlaying,
	resetSimulation,
	advanceToLastFrameInRun,
	updatePathExpanded,
	updateConfigurationExpanded,
	updateDescriptionExpanded,
	updateFilename,
	DIALOG_TYPE_JSON
} from '../actions/data.js';

import {
	CODE_ICON,
	PLAY_ICON,
	REPLAY_ICON,
	PAUSE_ICON,
	FAST_FORWARD_ICON,
	INFO_ICON,
	SETTINGS_ICON
} from "./my-icons.js";

import { ButtonSharedStyles } from "./button-shared-styles.js";
import { SharedStyles } from "./shared-styles.js";

import './run-summary.js';
import './options-control.js';

class SimulationControls extends connect(store)(LitElement) {
	static get properties() {
		return {
			_showControsl : {type:Boolean},
			_configurationExpanded: {type:Boolean},
			_descriptionExpanded: {type:Boolean},
			_filename: {type:String},
			_datafiles: {type:Array},
			_simulationsMap: { type:Object },
			_simulationIndex: { type:Number },
			_simulationMaxRunIndex: { type:Number },
			_maxFrameIndex: { type: Number },
			_simulation: { type: Object},
			_frameIndex: { type: Number },
			_runIndex: {type: Number},
			_runStatuses: { type:Array },
			_playing: {type: Boolean},
			_pathExpanded: {type:Object},
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
					width: var(--controls-width);
					background-color: white;
					padding: 0.5em;
					z-index: 1;
				}

				input {
					width: 3.0em;
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

		const rawDescription = this._simulation ? this._simulation.rawDescription : '';

		return html`
			<div class='container' ?hidden=${!this._showControls}>
			<div class='row' ?hidden=${!(this._datafiles && this._datafiles.length > 1)}>
					<label for='file'>File</label>
					<select id='file' .value=${this._filename} @change=${this._handleFilenameChanged} .readonly=${this._playing}>
						${(this._datafiles || []).map(item => html`<option .value=${item} .title=${item}>${item}</option>`)}
					</select>
				</div>
				<div class='row'>
					<label for='simulationIndex'>Simulation</label>
					<select id='simulationIndex' .value=${this._simulationIndex} @change=${this._handleSimulationIndexChanged} .readonly=${this._playing}>
						${Object.entries(this._simulationsMap || {}).map((entry, index) => html`<option .value=${index} .title=${entry[1].description}>${entry[1].title}</option>`)}
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
					<run-summary .statuses=${this._runStatuses} .selectedIndex=${this._runIndex} @run-clicked=${this._handleStatusClicked} .compact=${true}></run-summary>
				</div>
				<div class='description' ?hidden=${!rawDescription}>
					<details .open=${this._descriptionExpanded} @toggle=${this._handleDescriptionExpandedToggled}>
						<summary><label><button class='small'>${INFO_ICON}</button> Description</label></summary>
						<div class='label'>${rawDescription}</div>
					</details>
				</div>
				<div>
					<details .open=${this._configurationExpanded} @toggle=${this._handleConfigurationExpandedToggled}>
						<summary><label><button class='small'>${SETTINGS_ICON}</button> Configuration</label></summary>
						<options-control .readonly=${this._playing} @option-changed=${this._handleOptionChanged} @open-dialog=${this._handleOpenDialog} @path-toggled=${this._handlePathToggled} .config=${this._simulation ? this._simulation.optionsConfig : null} .value=${this._simulation ? this._simulation.rawConfig : null} .name=${''} .pathExpanded=${this._pathExpanded}></options-control>
					</details>
				</div>
			</div>
		`;
	}

	// This is called every time something is updated in the store.
	stateChanged(state) {
		this._showControls = selectShowControls(state);
		this._configurationExpanded = selectConfigurationExpanded(state);
		this._descriptionExpanded = selectDescriptionExpanded(state);
		this._pathExpanded = selectPathExpanded(state);
		this._filename = selectFilename(state);
		this._datafiles = selectKnownDatafiles(state);
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

	_handleConfigurationExpandedToggled(e) {
		const ele = e.composedPath()[0];
		store.dispatch(updateConfigurationExpanded( ele.open));
	}

	_handleDescriptionExpandedToggled(e) {
		const ele = e.composedPath()[0];
		store.dispatch(updateDescriptionExpanded( ele.open));
	}

	_handleStatusClicked(e) {
		store.dispatch(updateRunIndex(e.detail.index));
	}

	_handlePathToggled(e) {
		store.dispatch(updatePathExpanded(e.detail.path, e.detail.open));
	}

	_handleShowJSONClicked() {
		store.dispatch(openDialog(DIALOG_TYPE_JSON));
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

	_handleFilenameChanged(e) {
		const ele = e.composedPath()[0];
		store.dispatch(updateFilename(ele.value));
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
