import { html } from "lit-element";
import { PageViewElement } from "./page-view-element.js";
import { connect } from "pwa-helpers/connect-mixin.js";

// This element is connected to the Redux store.
import { store } from "../store.js";

import {
	loadData
} from "../actions/data.js";

import {
	selectExpandedCurrentMapData
} from "../selectors.js";

// We are lazy loading its reducer.
import data from "../reducers/data.js";
store.addReducers({
	data
});

import "./map-visualization.js";

// These are the shared styles needed by this element.
import { SharedStyles } from "./shared-styles.js";

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
		};
	}

	static get styles() {
		return [
			SharedStyles
		];
	}

	firstUpdated() {
		fetchData();
	}

	render() {
		return html`
			<map-visualization .data=${this._expandedMapData}></map-visualization>
		`;
	}

	// This is called every time something is updated in the store.
	stateChanged(state) {
		this._expandedMapData = selectExpandedCurrentMapData(state);
	}
}

window.customElements.define("main-view", MainView);
