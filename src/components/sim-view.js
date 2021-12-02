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
	advanceToLastFrameInConfig,
	DIALOG_TYPE_JSON,
	DATA_DIRECTORY,
	updatePlayType,
	updateShowControls,
	PLAY_TYPE_SIMULATION,
	togglePlaying,
	updateScale,
} from "../actions/data.js";

import {
	canonicalizePath
} from "../actions/app.js";

import {
	selectCurrentFrame,
	selectPageExtra,
	selectFrameIndex,
	selectCurrentSimulationHeight,
	selectCurrentSimulationWidth,
	selectDialogOpen,
	selectRawConfigData,
	selectDialogType,
	selectDialogExtras,
	selectFilename,
	selectCurrentSimulation,
	selectSimulationIndex,
	selectRunIndex,
	selectScale,
	selectConfigurationExpanded
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
	store.dispatch(updateShowControls(false));
	store.dispatch(updatePlayType(PLAY_TYPE_SIMULATION));
	store.dispatch(advanceToLastFrameInConfig());
};


import "./frame-visualization.js";
import "./simulation-controls.js";
import "./dialog-element.js";

// These are the shared styles needed by this element.
import { SharedStyles } from "./shared-styles.js";

import {
	help,
	ButtonSharedStyles
} from "./button-shared-styles.js";

import { PLUS_ICON } from "./my-icons.js";

//Size in px that we want to allow around the visualization edge
const VISUALIZATION_PADDING = 100;

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

	const data = await res.json();

	store.dispatch(loadData(data));
};

class SimView extends connect(store)(PageViewElement) {
	static get properties() {
		return {
			// This is the data from the store.
			_currentFrame: { type: Object },
			_currentSimulation: { type: Object },
			_currentSimulationName: {type: String},
			_pageExtra: { type: String },
			_simulationIndex: { type: Number },
			_runIndex: { type: Number },
			_frameIndex: { type: Number },
			_filename: {type:String},
			_dialogOpen: {type: Boolean},
			_dialogType: {type: String},
			_dialogExtras: {type:Object},
			_rawConfigData: {type: Object},
			_height: {type: Number},
			_width: {type: Number},
			_scale: {type: Number},
			_configurationExpanded: {type:Boolean},
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
				}

				.container {
					display: flex;
					justify-content: center;
					align-items: center;
					height: 100%;
					width: 100%;
					background-color: var(--override-app-background-color, var(--app-background-color, #356F9E));
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
		return html`
			<dialog-element .open=${this._dialogOpen} .title=${this._dialogTitle()} @dialog-should-close=${this._handleDialogShouldClose}>
				${this._dialogInner()}
			</dialog-element>
			<simulation-controls></simulation-controls>
			<div class='container' style='${colors}'>
				<frame-visualization .frame=${this._currentFrame} .width=${this._width} .height=${this._height} .scale=${this._scale}></frame-visualization>
			</div>
		`;
	}

	_dialogTitle() {
		if (this._dialogType == DIALOG_TYPE_JSON) return 'JSON Output';
		return 'Add a field...';
	}

	_dialogInner() {
		if (!this._dialogOpen) return html``;
		if (this._dialogType == DIALOG_TYPE_JSON) return html`<textarea readonly style='height:100%; width:100%'>${JSON.stringify(this._rawConfigData, '', '\t')}</textarea>`;
		return html`
			${this._dialogExtras.options.map((item, index) => html`<div class='row'><input id=${item.value} type='radio' name='add' .checked=${index == 0} .value=${item.value} .path=${item.path} .default=${item.default}><label for=${item.value}>${item.value}</label>${item.description ? help(item.description) : ''}</div>`)}
			<div class='row right'><button class='round' @click=${this._handleAddFieldButtonClicked}>${PLUS_ICON}</button></div>
			`;
	}

	// This is called every time something is updated in the store.
	stateChanged(state) {
		this._rawConfigData = selectRawConfigData(state);
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
		this._configurationExpanded = selectConfigurationExpanded(state);

		this.updateComplete.then(() => {
			window[RENDER_COMPLETE_VARIABLE] = true;
		});
	}

	//Should be called any time the scale of visualization might need to change.
	//width, height, configurationExpanded, or page resizes
	resizeVisualization() {
		const pageRect = this.getBoundingClientRect();
		const configurationOptionsEle = this.shadowRoot.querySelector('simulation-controls');
		if (!configurationOptionsEle) {
			console.warn('Couldn\'t find configuration-options');
			return;
		}
		const configurationRect = configurationOptionsEle.getBoundingClientRect();
		let availableWidth = pageRect.width - (this._configurationExpanded ? configurationRect.width : 0);
		let availableHeight = pageRect.height;

		availableWidth -= (2 * VISUALIZATION_PADDING);
		availableHeight -= (2 * VISUALIZATION_PADDING);

		const heightScale = availableHeight / this._height;
		const widthScale = availableWidth / this._width;

		const scale =  Math.min(heightScale, widthScale);
		if (!Number.isFinite(scale)) return;
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
			store.dispatch(updateCurrentSimulationOptions(selectedEle.path, selectedEle.default));
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
		if (changedProps.has('_pageExtra') && this._pageExtra) {
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
		if (changedProps.has('_currentFrame')) {
			store.dispatch(canonicalizePath());
		}
		if (changedProps.has('_height') || changedProps.has('_width') || changedProps.has('_configurationExpanded')) {
			this.resizeVisualization();
		}
	}
}

window.customElements.define("sim-view", SimView);
