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
import { repeat } from "lit-html/directives/repeat";

import {
	EMPTY_EXPANDED_MAP_DATA
} from "../frame.js";

// This is a reusable element. It is not connected to the store. You can
// imagine that it could just as well be a third-party element that you
// got from someone else.
class MapVisualization extends LitElement {
	static get properties() {
		return {
			data: { type: Object },
		};
	}

	static get styles() {
		return [
			css`
				:host {
					--cell-margin: 0.2em;
					--effective-cell-size: var(--cell-size, 3.0em);
					--total-cell-width: calc(var(--effective-cell-size) + (2 * var(--cell-margin)));
				}

				.container {
					display: flex;
					flex-wrap: wrap;
					width: var(--container-size);
				}

				.cell {
					height: var(--effective-cell-size);
					width: var(--effective-cell-size);
					margin: var(--cell-margin);
					box-sizing: border-box;
					overflow: hidden;
					position:relative;
				}

				.cell div {
					border-radius: calc(var(--effective-cell-size) / 2);
					position: absolute;
					box-sizing: border-box;
					top: 0;
					left: 0;
					height: 100%;
					width: 100%;
				}

				.cell.highlighted div.stroke {
					border: 0.25em solid var(--highlighted-cell-color, white);
				}

				.cell.captured div.stroke, .cell.active div.stroke {
					border: 0.25em solid var(--captured-cell-color, black);
				}
			`
		];
	}

	render() {
		return html`
			<style>
				:host {
					--container-size: calc(${this._cleanData.cols} * var(--total-cell-width));
					font-size: ${this._cleanData.scale}em;
				}
			</style>
			<div class='container'>
				${repeat(this._cleanData.cells,item => "" + item.row + "-" + item.col, item => this._htmlForCell(item))}
			</div>
		`;
	}

	_htmlForCell(cell) {
		const fillOpacity = cell.fillOpacity === undefined || cell.fillOpacity === null ? cell.autoOpacity : cell.fillOpacity;
		const strokeOpacity = cell.strokeOpacity === undefined || cell.strokeOpacity === null? cell.autoOpacity : cell.strokeOpacity;
		//Gray color for empty
		let color = [102, 102, 102];
		if (cell.value != null) {
			const baseColor = [255,255,255];
			let cellValue = cell.value;
			if (cellValue > 1.0) cellValue = 1.0;
			if (cellValue < -1.0) cellValue = -1.0;
			//CC0000, and #38761D
			const maxColor = cellValue < 0.0 ? [204, 0, 0] : [56, 118, 29];
			const interpolated = maxColor.map((maxComponent, index) => {
				const baseComponent = baseColor[index];
				return Math.round(baseComponent + Math.abs(cellValue) * (maxComponent - baseComponent));
			});
			color = interpolated;
		}
		const colorString = 'rgba(' + color.join(', ') + ', ' + fillOpacity + ')';
		const styleString = cell.scale != 1.0 ? 'transform:scale(' + cell.scale + ');z-index:1' : '';

		return html`<div class='cell ${cell.highlighted ? "highlighted" : ""} ${cell.captured ? 'captured' : ''} ${cell.active ? 'active' : ''}' style='${styleString}'><div class='fill' style='background-color:${colorString};'></div><div class='stroke' style='opacity:${strokeOpacity}'></div></div>`;
	}

	get _cleanData() {
		return this.data || EMPTY_EXPANDED_MAP_DATA;
	}
}

window.customElements.define("map-visualization", MapVisualization);
