/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html, css } from "lit-element";

//schelling-org-renderer will already be loaded by simulation.js 

// This is a reusable element. It is not connected to the store. You can
// imagine that it could just as well be a third-party element that you
// got from someone else.
class FrameVisualization extends LitElement {
	static get properties() {
		return {
			frame: { type: Object },
			width: {type:Number},
			height: {type:Number},
		};
	}

	static get styles() {
		return [
			css``
		];
	}

	render() {
		return html`
			<schelling-org-renderer .frame=${this.frame} .width=${this.width} .height=${this.height}></schelling-org-renderer>
		`;
	}
}

window.customElements.define("frame-visualization", FrameVisualization);
