import { html, css} from "lit-element";
import { PageViewElement } from "./page-view-element.js";
import { connect } from "pwa-helpers/connect-mixin.js";

// This element is connected to the Redux store.
import { store } from "../store.js";

import {
	loadData,
	nextIndex,
	prevIndex,
	updateWithSimPageExtra
} from "../actions/data.js";

import {
	canonicalizePath
} from "../actions/app.js";

import {
	selectCurrentFrame,
	selectPageExtra,
	selectFrameIndex,
	selectCurrentSimulationHeight,
	selectCurrentSimulationWidth
} from "../selectors.js";

import {
	GIF_COMMAND
} from "../simulation.js";

// We are lazy loading its reducer.
import data from "../reducers/data.js";
store.addReducers({
	data
});

//rendevous point with screenshot service. Duplicated in screenshot.js
const CURRENT_INDEX_VARIABLE = 'current_index';
const PREVIOUS_MAP_VARIABLE = 'previous_map';
const RENDER_COMPLETE_VARIABLE = 'render_complete';
const GIF_NAME_VARIABLE = 'gif_name';

window[RENDER_COMPLETE_VARIABLE] = false;

window[PREVIOUS_MAP_VARIABLE] = () => {
	//The sim-view will set this high when update is done
	window[RENDER_COMPLETE_VARIABLE] = false;
	store.dispatch(prevIndex());
};


import "./frame-visualization.js";
import "./simulation-controls.js";

// These are the shared styles needed by this element.
import { SharedStyles } from "./shared-styles.js";

const CONFIG_FILE_NAME = 'config.json';
const SAMPLE_CONFIG_FILE_NAME = 'config.SAMPLE.json';

const fetchData = async() => {
	let res;
	let fetchErrored = false;
	try {
		res = await fetch("/" + CONFIG_FILE_NAME);
	} catch (err) {
		fetchErrored = err;
	}

	if (fetchErrored || !res.ok) {
		console.warn(CONFIG_FILE_NAME + ' not found. Using ' + SAMPLE_CONFIG_FILE_NAME + ' instead.');
		res = await fetch("/" + SAMPLE_CONFIG_FILE_NAME);
	}

	const data = await res.json();

	store.dispatch(loadData(data));
};

class SimView extends connect(store)(PageViewElement) {
	static get properties() {
		return {
			// This is the data from the store.
			_currentFrame: { type: Object },
			_pageExtra: { type: String },
			_frameIndex: { type: Number },
			_height: {type: Number},
			_width: {type: Number},
		};
	}

	static get styles() {
		return [
			SharedStyles,
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
					/* TODO: set these based on the simulation config */
					--primary-color: #fb8c00;
					--secondary-color: #51b9a3;
					--disabled-color: #cccccc;
				}

			`
		];
	}

	firstUpdated() {
		fetchData();
		document.addEventListener('keydown', e => this._handleKeyDown(e));
	}

	_handleKeyDown(e) {
		//We have to hook this to issue content editable commands when we're
		//active. But most of the time we don't want to do anything.
		if (!this.active) return;

		if (e.key == 'ArrowRight') {
			store.dispatch(nextIndex());
		} else if (e.key == 'ArrowLeft') {
			store.dispatch(prevIndex());
		}

	}

	render() {
		return html`
			<style>
				:host {
					--app-background-color: ${this._backgroundColor}
				}
			</style>
			<simulation-controls></simulation-controls>
			<div class='container'>
				<frame-visualization .frame=${this._currentFrame} .width=${this._width} .height=${this._height}></frame-visualization>
			</div>
		`;
	}

	get _backgroundColor() {
		if (!this._currentFrame) return 'transparent';
		if (!this._currentFrame.colors) return 'transparent';
		return this._currentFrame.colors.background.hex;
	}

	// This is called every time something is updated in the store.
	stateChanged(state) {
		this._currentFrame = selectCurrentFrame(state);
		this._pageExtra = selectPageExtra(state);
		this._frameIndex = selectFrameIndex(state);
		this._height = selectCurrentSimulationHeight(state);
		this._width = selectCurrentSimulationWidth(state);

		this.updateComplete.then(() => {
			window[RENDER_COMPLETE_VARIABLE] = true;
		});
	}

	updated(changedProps) {
		if (changedProps.has('_pageExtra') && this._pageExtra) {
			store.dispatch(updateWithSimPageExtra(this._pageExtra));
		}
		if (changedProps.has('_frameIndex')) {
			window[CURRENT_INDEX_VARIABLE] = this._frameIndex;
		}
		if (changedProps.has('_currentFrame')) {
			const data = this._currentFrame || {};
			window[GIF_NAME_VARIABLE] = data[GIF_COMMAND];
			store.dispatch(canonicalizePath());
		}
	}
}

window.customElements.define("sim-view", SimView);
