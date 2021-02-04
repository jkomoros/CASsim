import { html, css} from "lit-element";
import { PageViewElement } from "./page-view-element.js";
import { connect } from "pwa-helpers/connect-mixin.js";

// This element is connected to the Redux store.
import { store } from "../store.js";

import {
	loadData,
	nextIndex,
	prevIndex,
} from "../actions/data.js";

import {
	selectExpandedCurrentMapData,
	selectPageExtra,
	selectCurrentDataIndex,
} from "../selectors.js";

import {
	GIF_COMMAND
} from "../map-data.js";

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
	//The main-view will set this high when update is done
	window[RENDER_COMPLETE_VARIABLE] = false;
	store.dispatch(prevIndex());
};


import "./map-visualization.js";

// These are the shared styles needed by this element.
import { SharedStyles } from "./shared-styles.js";
import { updateIndex } from '../actions/data.js';

const fetchData = async() => {
	const res = await fetch("/map_data.json");

	const data = await res.json();

	store.dispatch(loadData(data));
};

class MainView extends connect(store)(PageViewElement) {
	static get properties() {
		return {
			// This is the data from the store.
			_expandedMapData: { type: Object },
			_pageExtra: { type: String },
			_currentIndex: { type: Number },
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
			${this._expandedMapData && this._expandedMapData.background ? html`
			<style>
				:host {
					--app-background-color: ${this._expandedMapData.background}
				}
			</style>` : ''}
			<div class='container'>
				<map-visualization .data=${this._expandedMapData}></map-visualization>
			</div>
		`;
	}

	// This is called every time something is updated in the store.
	stateChanged(state) {
		this._expandedMapData = selectExpandedCurrentMapData(state);
		this._pageExtra = selectPageExtra(state);
		this._currentIndex = selectCurrentDataIndex(state);

		this.updateComplete.then(() => {
			window[RENDER_COMPLETE_VARIABLE] = true;
		});
	}

	updated(changedProps) {
		if (changedProps.has('_pageExtra')) {
			const index = this._pageExtra ? parseInt(this._pageExtra) : -1;
			store.dispatch(updateIndex(index));
		}
		if (changedProps.has('_currentIndex')) {
			window[CURRENT_INDEX_VARIABLE] = this._currentIndex;
		}
		if (changedProps.has('_expandedMapData')) {
			const data = this._expandedMapData || {};
			window[GIF_NAME_VARIABLE] = data[GIF_COMMAND];
		}
	}
}

window.customElements.define("main-view", MainView);
