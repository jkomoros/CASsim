import { LitElement, html, css, TemplateResult} from 'lit';
import { customElement, state } from 'lit/decorators.js';
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
	selectHasModifications,
	selectCurrentSimulationRunStatuses,
	selectCurrentSimulatorShadowedModifications,
	selectWarning,
	selectChartExpanded,
	selectCurrentSimulationHasChartableData,
	selectCurrentSimulationChartData,
	selectChartSingleRun,
	selectChartConfigIDs
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
	updateChartExpanded,
	removeModificationsForPath,
	updateFilename,
	DIALOG_TYPE_JSON,
	clearModifications,
	updateWarning,
	updateChartSingleRun,
	updateChartConfigIDs
} from '../actions/data.js';

import {
	CODE_ICON,
	PLAY_ICON,
	REPLAY_ICON,
	PAUSE_ICON,
	FAST_FORWARD_ICON,
	WARNING_ICON,
	CANCEL_ICON,
	INFO_ICON,
	SETTINGS_ICON,
	UNDO_ICON,
	AREA_CHART_ICON
} from "./my-icons.js";

import { ButtonSharedStyles } from "./button-shared-styles.js";
import { SharedStyles } from "./shared-styles.js";

import {
	ChartConfigIDsMap,
	ChartData,
	Filename,
	ModificationsPathMap,
	OptionsPath,
	RootState
} from '../types.js';

import {
	Simulation,
	SimulationsMap
} from '../simulation.js';

import './run-summary.js';
import './run-chart.js';
import './options-control.js';
import './multi-select.js';

import {
	MultiSelect
} from './multi-select.js';

const optionsForMultiSelect = (chartData : ChartData) => {
	const result : {[id : string] : {title: string, description: string}} = {};
	for (const [key, value] of Object.entries(chartData || {})) {
		if (!value) continue;
		if (!value.length) continue;
		const config = value[0].config;
		result[key] = {
			title: config.title,
			description: config.description,
		};
	}
	return result;
};

@customElement('simulation-controls')
class SimulationControls extends connect(store)(LitElement) {

	@state()
	_showControls : boolean;

	@state()
	_warning: string;

	@state()
	_hasModifications: boolean;

	@state()
	_modifiedPaths: ModificationsPathMap;

	@state()
	_configurationExpanded: boolean;

	@state()
	_chartExpanded: boolean;

	@state()
	_chartData: ChartData;

	@state()
	_chartSingleRun: boolean;

	@state()
	_chartConfigIDs: ChartConfigIDsMap;

	@state()
	_currentSimulationHasChartableData: boolean;

	@state()
	_descriptionExpanded: boolean;

	@state()
	_filename: Filename;

	@state()
	_datafiles: Filename[];

	@state()
	_simulationsMap: SimulationsMap;

	@state()
	_simulationIndex: number;

	@state()
	_simulationMaxRunIndex: number;
	
	@state()
	_maxFrameIndex: number;

	@state()
	_simulation: Simulation;

	@state()
	_frameIndex: number;

	@state()
	_runIndex: number;

	@state()
	_runStatuses: number[];

	@state()
	_playing: boolean;

	@state()
	_pathExpanded: {[path : OptionsPath]: true}

	static override get styles() {
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

				.flex {
					flex-grow: 1.0;
				}

				select {
					overflow: hidden;
				}

				input {
					width: 3.0em;
				}

				.row {
					display:flex;
					flex-direction:row;
					align-items: center;
				}

				input, select {
					margin-right: 0.5em;
				}

				input[type=checkbox] {
					width: unset;
				}

				select, multi-select {
					margin-left: 0.5em;
				}
			`
		];
	}


	override render() : TemplateResult {

		const rawDescription = this._simulation ? this._simulation.rawDescription : '';
		const datafiles = [...this._datafiles] || [];
		const datafilesMap = Object.fromEntries(datafiles.map(file => [file, true]));
		if (!datafilesMap[this._filename]) datafiles.push(this._filename);
		return html`
			<div class='container' ?hidden=${!this._showControls}>
			<div class='row' ?hidden=${datafiles.length < 2}>
					<label for='file'>File</label>
					<select id='file' .value=${this._filename} @change=${this._handleFilenameChanged} .disabled=${this._playing}>
						${datafiles.map(item => html`<option .value=${item} .title=${item} .selected=${item == this._filename}>${item}</option>`)}
					</select>
				</div>
				<div class='row'>
					<label for='simulationIndex'>Simulation</label>
					<select class='flex' id='simulationIndex' .value=${String(this._simulationIndex)} @change=${this._handleSimulationIndexChanged} .disabled=${this._playing}>
						${Object.entries(this._simulationsMap || {}).map((entry, index) => html`<option .value=${String(index)} .selected=${index == this._simulationIndex} .title=${entry[1].description}>${entry[1].title}</option>`)}
					</select>
					<div>
						<button class='small' .disabled=${this._playing} @click=${this._handleShowJSONClicked}>${CODE_ICON}</button>
					</div>
					<div>
						<button class='small' .disabled=${!this._hasModifications} @click=${this._handleRemoveModificationsClicked} title="Remove modifications you've made">${UNDO_ICON}</button>
					</div>
				</div>
				<div class='row'>
					<div>
						<label for='runIndex'>Run</label>
						<input id='runIndex' .value=${String(this._runIndex)} type='number' min='0' max=${this._simulationMaxRunIndex} @change=${this._handleRunIndexChanged} .readonly=${this._playing}>
					</div>
					<div>
						<label for='frameIndex'>Frame</label>
						<input id='frameIndex' .value=${String(this._frameIndex)} type='number' min='0' max=${this._maxFrameIndex} @change=${this._handleFrameIndexChanged} .readonly=${this._playing}>
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
				<div>
					${this._warning ? html`<label><button class='small'>${WARNING_ICON}</button><strong>Warning</strong><button class='small' @click=${this._handleClearWarningClicked} title='Clear warning'>${CANCEL_ICON}</button></label><div class='label'>${this._warning}</div>` : ''}
				</div>
				<div class='description' ?hidden=${!rawDescription}>
					<details .open=${this._descriptionExpanded} @toggle=${this._handleDescriptionExpandedToggled}>
						<summary><label><button class='small'>${INFO_ICON}</button> Description</label></summary>
						<div class='label'>${rawDescription}</div>
					</details>
				</div>
				<div>
					${this._currentSimulationHasChartableData ? html`
						<details .open=${this._chartExpanded} @toggle=${this._handleChartExpandedToggled}>
							<summary><label><button class='small'>${AREA_CHART_ICON}</button> Chart</label></summary>
							<run-chart .data=${this._chartData} .configIDs=${this._chartConfigIDs} .runIndex=${this._runIndex} .frameIndex=${this._frameIndex}></run-chart>
							<div class='row'>
								<input id='singleRun' type='checkbox' .checked=${this._chartSingleRun || this._runStatuses.length == 1} .disabled=${this._runStatuses.length == 1} @change=${this._handleChartSingleRunUpdated}><label for='singleRun'>Current run only</label>	
								<multi-select id='configID' .defaultText=${'All Data'} .disabled=${Object.keys(this._chartData).length == 1} @change=${this._handleChartConfigIDsUpdated} .values=${this._chartConfigIDs} .options=${optionsForMultiSelect(this._chartData)}></multi-select>
							</div>
						</details>
					` : ''}
				</div>
				<div>
					<details .open=${this._configurationExpanded} @toggle=${this._handleConfigurationExpandedToggled}>
						<summary><label><button class='small'>${SETTINGS_ICON}</button> Configuration</label></summary>
						<options-control .readonly=${this._playing} @option-changed=${this._handleOptionChanged} @undo-clicked=${this._handleUndoClicked} @open-dialog=${this._handleOpenDialog} @path-toggled=${this._handlePathToggled} .config=${this._simulation ? this._simulation.optionsConfig : null} .value=${this._simulation ? this._simulation.rawConfig : null} .rootValue=${this._simulation ? this._simulation.rawConfig : null} .name=${''} .pathExpanded=${this._pathExpanded} .modifiedPaths=${this._modifiedPaths}></options-control>
					</details>
				</div>
			</div>
		`;
	}

	// This is called every time something is updated in the store.
	override stateChanged(state : RootState) {
		this._showControls = selectShowControls(state);
		this._warning = selectWarning(state);
		this._hasModifications = selectHasModifications(state);
		this._modifiedPaths = selectCurrentSimulatorShadowedModifications(state);
		this._configurationExpanded = selectConfigurationExpanded(state);
		this._descriptionExpanded = selectDescriptionExpanded(state);
		this._chartExpanded = selectChartExpanded(state);
		this._currentSimulationHasChartableData = selectCurrentSimulationHasChartableData(state);
		this._chartData = this._chartExpanded && this._currentSimulationHasChartableData ? selectCurrentSimulationChartData(state) : {};
		this._chartSingleRun = selectChartSingleRun(state);
		this._chartConfigIDs = selectChartConfigIDs(state);
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
		this._runStatuses = selectCurrentSimulationRunStatuses(state);
		
	}

	_handleClearWarningClicked() {
		store.dispatch(updateWarning(''));
	}

	_handleUndoClicked(e : CustomEvent) {
		store.dispatch(removeModificationsForPath(e.detail.path));
	}

	_handleChartConfigIDsUpdated(e : Event) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof MultiSelect)) throw new Error('Not multi select as expected');
		store.dispatch(updateChartConfigIDs(ele.values));
	}

	_handleChartSingleRunUpdated(e : Event) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLInputElement)) throw new Error('Not checkbox input');
		store.dispatch(updateChartSingleRun(ele.checked));
	}

	_handleRemoveModificationsClicked() {
		store.dispatch(clearModifications());
	}

	_handleConfigurationExpandedToggled(e : Event) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLDetailsElement)) throw new Error('not details object');
		store.dispatch(updateConfigurationExpanded( ele.open));
	}

	_handleChartExpandedToggled(e : Event) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLDetailsElement)) throw new Error('not details object');
		store.dispatch(updateChartExpanded(ele.open));	
	}

	_handleDescriptionExpandedToggled(e : Event) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLDetailsElement)) throw new Error('not details object');
		store.dispatch(updateDescriptionExpanded( ele.open));
	}

	_handleStatusClicked(e : CustomEvent) {
		store.dispatch(updateRunIndex(e.detail.index));
	}

	_handlePathToggled(e : CustomEvent) {
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

	_handleFilenameChanged(e : Event) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLSelectElement)) throw new Error('not a select element');
		store.dispatch(updateFilename(ele.value));
	}

	_handleSimulationIndexChanged(e : Event) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLSelectElement)) throw new Error('not a select element');
		store.dispatch(updateSimulationIndex(ele.value));
	}

	_handleFrameIndexChanged(e) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLInputElement)) throw new Error('not an input element');
		store.dispatch(updateFrameIndex(ele.value));
	}

	_handleRunIndexChanged(e) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLInputElement)) throw new Error('not an input element');
		store.dispatch(updateRunIndex(ele.value));
	}

	_handleOptionChanged(e : CustomEvent) {
		store.dispatch(updateCurrentSimulationOptions(e.detail.path, e.detail.value));
	}

	_handleOpenDialog(e : CustomEvent) {
		store.dispatch(openDialog(e.detail.type, e.detail.extras));
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'simulation-controls': SimulationControls;
	}
}
