/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { html } from 'lit-element';
import { PageViewElement } from './page-view-element.js';
import { connect } from 'pwa-helpers/connect-mixin.js';

// This element is connected to the Redux store.
import { store } from '../store.js';

import {
	selectExpandedCurrentMapData
} from '../selectors.js';

// We are lazy loading its reducer.
import data from '../reducers/data.js';
store.addReducers({
	data
});

import './map-visualization.js';

// These are the shared styles needed by this element.
import { SharedStyles } from './shared-styles.js';

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

	render() {
		return html`
			<map-visualization .data=${this._expandedMapData}></map-visualization>
		`;
	}

	// This is called every time something is updated in the store.
	stateChanged(state) {
		this._expandedMapData = selectExpandedCurrentMapData(data);
	}
}

window.customElements.define('main-view', MainView);
