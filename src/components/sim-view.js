import { html, css} from "lit-element";
import { PageViewElement } from "./page-view-element.js";
import { connect } from "pwa-helpers/connect-mixin.js";

// This element is connected to the Redux store.
import { store } from "../store.js";

import {
	loadData,
	nextFrameIndex,
	prevFrameIndex,
	updateWithSimPageExtra,
	closeDialog,
	updateCurrentSimulationOptions,
	DIALOG_TYPE_JSON,
	DATA_DIRECTORY,
	LISTINGS_JSON_PATH,
	togglePlaying,
	updateScale,
	updateKnownDatafiles,
	updateKnownSimulatorNames,
	simulationChanged,
	enableScreenshotting,
	canonicalizeHash,
	updateHash,
	fetchNeededSimulators
} from "../actions/data.js";

import {
	canonicalizePath
} from "../actions/app.js";

import {
	DEFAULT_SENTINEL
} from "../util.js";

import {
	selectCurrentFrame,
	selectPageExtra,
	selectFrameIndex,
	selectCurrentSimulationHeight,
	selectCurrentSimulationWidth,
	selectDialogOpen,
	selectConfigData,
	selectDialogType,
	selectDialogExtras,
	selectFilename,
	selectCurrentSimulation,
	selectSimulationIndex,
	selectRunIndex,
	selectScale,
	selectConfigurationExpanded,
	selectResizeVisualization,
	selectDescriptionExpanded,
	selectDataIsFullyLoaded,
	selectCurrentSimulationRunStatuses,
	selectScrenshotting,
	selectRequiredSimulatorsLoaded,
	selectRequiredSimulatorNames,
	selectFrameDelay,
	selectHashForCurrentState,
} from "../selectors.js";

// We are lazy loading its reducer.
import data from "../reducers/data.js";
store.addReducers({
	data
});

//rendevous point with screenshot service. Duplicated in screenshot.js
const CURRENT_SIMULATION_INDEX_VARIABLE = 'current_simulation_index';
const CURRENT_RUN_INDEX_VARIABLE = 'current_run_index';
const CURRENT_FRAME_INDEX_VARIABLE = 'current_frame_index';
const CURRENT_SIMULATION_NAME_VARIABLE = 'current_simulation_name';
const SETUP_METHOD_VARIABLE = 'setup_method';
const PREVIOUS_FRAME_METHOD_VARIABLE = 'previous_frame';
const RENDER_COMPLETE_VARIABLE = 'render_complete';

window[RENDER_COMPLETE_VARIABLE] = false;

window[PREVIOUS_FRAME_METHOD_VARIABLE] = () => {
	//The sim-view will set this high when update is done
	window[RENDER_COMPLETE_VARIABLE] = false;
	store.dispatch(prevFrameIndex());
};

window[SETUP_METHOD_VARIABLE] = () => {
	//This is the setup that the screenshot service will call before starting screenshots
	store.dispatch(enableScreenshotting());
};


import "./frame-visualization.js";
import "./simulation-controls.js";
import "./dialog-element.js";

// These are the shared styles needed by this element.
import { SharedStyles } from "./shared-styles.js";

import {
	ButtonSharedStyles
} from "./button-shared-styles.js";

import { PLUS_ICON } from "./my-icons.js";

import {
	packConfigJSON
} from "../config.js";

//Size in px that we want to allow around the visualization edge. Pixels per 100
//px of width.
const VISUALIZATION_PADDING = 8;

const fetchListings = async() => {
	let res;
	try {
		res = await fetch(LISTINGS_JSON_PATH);
	} catch(err) {
		console.warn('Couldn\'t load listings');
		return;
	}
	const data = await res.json();
	store.dispatch(updateKnownDatafiles(data.datafiles));
	store.dispatch(updateKnownSimulatorNames(data.simulatorNames));
};

const fetchData = async(filename) => {
	let res;
	filename = ('' + filename).toLowerCase();
	filename = filename.split('/')[0];
	const path = '/' + DATA_DIRECTORY + '/' + filename + '.json';
	try {
		res = await fetch(path);
	} catch (err) {
		console.warn('Couldn\'t fetch ' + path + ': ' + err);
	}

	const blob = await res.json();

	store.dispatch(loadData(blob));
};

class SimView extends connect(store)(PageViewElement) {
	static get properties() {
		return {
			// This is the data from the store.
			_currentFrame: { type: Object },
			_requiredSimulatorsLoaded: {type: Boolean},
			_requiredSimulatorNames: {type: Object},
			_currentSimulation: { type: Object },
			_currentSimulationName: {type: String},
			_currentSimulationLastChanged: {type:Number},
			_animationLength: {type:Number},
			_pageExtra: { type: String },
			_simulationIndex: { type: Number },
			_runIndex: { type: Number },
			_frameIndex: { type: Number },
			_filename: {type:String},
			_dialogOpen: {type: Boolean},
			_dialogType: {type: String},
			_dialogExtras: {type:Object},
			_configData: {type: Object},
			_height: {type: Number},
			_width: {type: Number},
			_scale: {type: Number},
			_configurationExpanded: {type:Boolean},
			_descriptionExpanded: {type:Boolean},
			_dataIsFullyLoaded: {type:Boolean},
			_screenshotting: {type:Boolean},
			_runStatues: {type:Object},
			_hashForCurrentState: {type:String},
			//Note: this is calculated in this._resizeVisualzation, NOT in state
			_needsMarginLeft : {type:Boolean},
			_resizeVisualization: {type:Boolean},
		};
	}

	static get styles() {
		return [
			SharedStyles,
			ButtonSharedStyles,
			css`
				:host {
					position:relative;
					height:100vh;
					width: 100vw;
					background-color: var(--override-app-background-color, var(--app-background-color, #356F9E));
					overflow:scroll;
				}

				.container {
					display: flex;
					justify-content: center;
					align-items: center;
					height: 100%;
					width: 100%;
				}

				.container.needs-margin-left frame-visualization {
					margin-left: var(--controls-width);
				}

				.row {
					display: flex;
					flex-direction: row;
				}

				.right {
					justify-content: flex-end;
				}

			`
		];
	}

	firstUpdated() {
		document.addEventListener('keydown', e => this._handleKeyDown(e));
		window.addEventListener('resize', () => this.resizeVisualization());
		this.resizeVisualization();
		fetchListings();
		window.addEventListener('hashchange', () => this._handleHashChange());
		//We don't yet have all of the information to fully parse this, but the
		//hash might include information we need to know what simulators to
		//fetch. We'll also call it again when we're fully loaded.
		this._handleHashChange();
	}

	_handleHashChange() {
		store.dispatch(updateHash(window.location.hash, true));
	}

	_handleKeyDown(e) {
		//We have to hook this to issue content editable commands when we're
		//active. But most of the time we don't want to do anything.
		if (!this.active) return;

		//Don't trigger keyboard shortcuts if the user is editing a text field
		for (const ele of e.composedPath()) {
			if (ele.localName == 'input') return;
			if (ele.localName == 'textarea') return;
		}

		if (e.key == 'ArrowRight') {
			store.dispatch(nextFrameIndex());
		} else if (e.key == 'ArrowLeft') {
			store.dispatch(prevFrameIndex());
		} else if (e.key == ' ') {
			store.dispatch(togglePlaying());
			e.preventDefault();
		}

	}

	render() {
		const colors = this._currentSimulation ? Object.entries(this._currentSimulation.colors || {}).map(entry => '--' + entry[0] + '-color: ' + entry[1].hex + ';').join(' ') : '';
		const includeRunStatuses = this._currentSimulation && (this._screenshotting ? this._currentSimulation.screenshotDisplayStatus : this._currentSimulation.displayStatus);
		return html`
			<dialog-element .open=${this._dialogOpen} .title=${this._dialogTitle()} @dialog-should-close=${this._handleDialogShouldClose}>
				${this._dialogInner()}
			</dialog-element>
			<simulation-controls></simulation-controls>
			<div class='container ${this._needsMarginLeft ? 'needs-margin-left' : ''}' style='${colors}'>
				<frame-visualization .simulation=${this._currentSimulation} .frame=${this._currentFrame} .width=${this._width} .height=${this._height} .scale=${this._scale} .runStatuses=${includeRunStatuses ? this._runStatuses : null} .runIndex=${this._runIndex} .animationLength=${this._animationLength}></frame-visualization>
			</div>
		`;
	}

	_dialogTitle() {
		if (this._dialogType == DIALOG_TYPE_JSON) return 'JSON Output';
		return 'Add a field...';
	}

	_dialogInner() {
		if (!this._dialogOpen) return html``;
		if (this._dialogType == DIALOG_TYPE_JSON) return html`<textarea readonly style='height:100%; width:100%'>${JSON.stringify(this._configData, '', '\t')}</textarea>`;
		return html`
			${this._dialogExtras.options.map((item, index) => html`<div class='row'><input id=${item.value} type='radio' name='add' .checked=${index == 0} .value=${item.value} .path=${item.path}><label for=${item.value}><strong>${item.value}</strong>${item.description ? html`: ${item.description}` : ''}</label></div>`)}
			<div class='row right'><button class='round' @click=${this._handleAddFieldButtonClicked}>${PLUS_ICON}</button></div>
			`;
	}

	// This is called every time something is updated in the store.
	stateChanged(state) {
		this._configData = packConfigJSON(selectConfigData(state));
		this._requiredSimulatorsLoaded = selectRequiredSimulatorsLoaded(state);
		this._requiredSimulatorNames = selectRequiredSimulatorNames(state);
		this._currentSimulation = selectCurrentSimulation(state);
		this._currentSimulationName = this._currentSimulation ? this._currentSimulation.name : '';
		this._dialogOpen = selectDialogOpen(state);
		this._dialogType = selectDialogType(state);
		this._dialogExtras = selectDialogExtras(state);
		this._currentFrame = selectCurrentFrame(state);
		this._pageExtra = selectPageExtra(state);
		this._frameIndex = selectFrameIndex(state);
		this._simulationIndex = selectSimulationIndex(state);
		this._runIndex = selectRunIndex(state);
		this._height = selectCurrentSimulationHeight(state);
		this._width = selectCurrentSimulationWidth(state);
		this._filename = selectFilename(state);
		this._scale = selectScale(state);
		this._screenshotting = selectScrenshotting(state);
		this._animationLength = this._screenshotting ? 0 : selectFrameDelay(state) / 2;
		this._configurationExpanded = selectConfigurationExpanded(state);
		this._descriptionExpanded = selectDescriptionExpanded(state);
		this._resizeVisualization = selectResizeVisualization(state);
		this._dataIsFullyLoaded = selectDataIsFullyLoaded(state);
		this._runStatuses = selectCurrentSimulationRunStatuses(state);
		this._hashForCurrentState = selectHashForCurrentState(state);
		this._currentSimulationLastChanged = this._currentSimulation ? this._currentSimulation.lastChanged : 0;

		this.updateComplete.then(() => {
			window[RENDER_COMPLETE_VARIABLE] = true;
		});
	}

	//Should be called any time the scale of visualization might need to change.
	//width, height, configurationExpanded, descriptionExpanded or page resizes
	resizeVisualization() {

		if (!this._resizeVisualization) {
			store.dispatch(updateScale(1.0));
			return;
		}

		const pageRect = this.getBoundingClientRect();
		const configurationOptionsEle = this.shadowRoot.querySelector('simulation-controls');
		if (!configurationOptionsEle) {
			console.warn('Couldn\'t find configuration-options');
			return;
		}
		const configurationRect = configurationOptionsEle.getBoundingClientRect();
		let availableWidth = pageRect.width - (this._configurationExpanded ? configurationRect.width : 0);
		let availableHeight = pageRect.height;

		const effectivePadding = VISUALIZATION_PADDING * (pageRect.width / 100);

		availableWidth -= (2 * effectivePadding);
		availableHeight -= (2 * effectivePadding);

		const heightScale = availableHeight / this._height;
		const widthScale = availableWidth / this._width;

		const scale =  Math.min(heightScale, widthScale);
		if (!Number.isFinite(scale)) return;

		const newHeight = this._height * scale;
		//If there's so little height, then it will overlpa with the
		//configurationRect vertically, so push it to the right.

		//TODO: the fact that this is just a weird non-state-backed property
		//implies scale could be, too, since it's a downstream/derivable
		//property of the state
		//+ window size.
		this._needsMarginLeft = pageRect.height - newHeight < 2 * configurationRect.height;
		store.dispatch(updateScale(scale));

	}

	_handleAddFieldButtonClicked() {
		const eles = this.shadowRoot.querySelectorAll('input[type=radio]');
		let selectedEle = null;
		for (const ele of eles) {
			if (ele.checked) {
				selectedEle = ele;
				break;
			}
		}
		if (selectedEle){
			store.dispatch(updateCurrentSimulationOptions(selectedEle.path, DEFAULT_SENTINEL));
		}
		store.dispatch(closeDialog());
	}

	_handleDialogShouldClose() {
		store.dispatch(closeDialog());
	}

	updated(changedProps) {
		if (changedProps.has('_filename') && this._filename) {
			fetchData(this._filename);
		}
		//We're responsible for calling updateWithSimPageExtra. It has to be
		//called early to figure out what data file to load... but
		//simulationIndex wont' be able to be resolved until data is fully
		//loaded, so we'll need to call it again once that happens.
		if ((changedProps.has('_pageExtra') || changedProps.has('_dataIsFullyLoaded')) && this._pageExtra) {
			store.dispatch(updateWithSimPageExtra(this._pageExtra));
		}
		if (changedProps.has('_simulationIndex')) {
			window[CURRENT_SIMULATION_INDEX_VARIABLE] = this._simulationIndex;
		}
		if (changedProps.has('_runIndex')) {
			window[CURRENT_RUN_INDEX_VARIABLE] = this._runIndex;
		}
		if (changedProps.has('_frameIndex')) {
			window[CURRENT_FRAME_INDEX_VARIABLE] = this._frameIndex;
		}
		if (changedProps.has('_currentSimulationName')) {
			window[CURRENT_SIMULATION_NAME_VARIABLE] = this._currentSimulationName;
		}
		if (changedProps.has('_currentSimulation') && this._currentSimulation) {
			//Activate, which might generate mroe state in the simulation that needs to be rendered
			if(this._currentSimulation.activate()) store.dispatch(simulationChanged());
		}
		if (changedProps.has('_currentSimulationLastChanged')) {
			//If we notice the simulation seems to have changed since last time we saw it, update the
			//state so downstream properties can be regenerated.
			store.dispatch(simulationChanged());
		}
		if (changedProps.has('_requiredSimulatorNames') && !this._requiredSimulatorsLoaded) {
			store.dispatch(fetchNeededSimulators());
		}
		if (changedProps.has('_currentFrame')) {
			store.dispatch(canonicalizePath());
		}
		if (changedProps.has('_dataIsFullyLoaded') && this._dataIsFullyLoaded) {
			//On first load process hash, but wait until we know the simulationIndex, since the meaning of the packed data diff can't be interpreted until then.
			this._handleHashChange();
		}
		if (changedProps.has('_hashForCurrentState')) {
			store.dispatch(canonicalizeHash());
		}
		if (changedProps.has('_height') || changedProps.has('_width') || changedProps.has('_configurationExpanded') || changedProps.has('_resizeVisualization') || changedProps.has('_descriptionExpanded')) {
			//This method requires the layout to have been rendered, so wait a tick until it has settled and then calculate
			setTimeout(() => this.resizeVisualization(), 0);
		}
	}
}

window.customElements.define("sim-view", SimView);
