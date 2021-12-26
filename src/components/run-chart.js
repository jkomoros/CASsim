import { LitElement, html, css, svg } from "lit-element";
import { SharedStyles } from "./shared-styles.js";

import {
	hash
} from '../util.js';

const DEFAULT_RUN_COLORS = [
	//Indianred
	'#CD5C5C',
	//darkkhahki
	'#BDB76B',
	//limegreen
	'#32CD32',
	//darkcyan
	'#008B8B',
	//navy
	'#000080',
	//sandybrown
	'#F4A460',
	//gold
	'#FFD700',
	//darkmagenta
	'#8B008B',
	//royalblue
	'#4169E1',
];

class RunChart extends LitElement {
	static get properties() {
		return {
			data: {type:Object}
		};
	}

	static get styles() {
		return [
			SharedStyles,
			css`
				:host {
					min-height: 10em;
					width: 100%;
					position: relative;
				}

				svg {
					height: 100%;
					width: 100%;
					/* positioned absolutely to make sure we don't affect the layout of host, since we read back that layout each time */
					position: absolute;
				}

				svg rect {
					stroke: var(--dark-gray-color);
				}

				path.run {
					stroke-width: 2px;
					fill: transparent;
				}

				path.run:hover {
					stroke-width: 4px;
				}
			`
		];
	}

	get _maxX() {
		//The run with the longest number of frameValues, or 1.
		return Object.values(this.data).map(run => run.data.length).reduce((prev, next) => Math.max(prev, next), 1);
	}

	get _maxY() {
		//The highest value seen in the entire data run, or 1
		return Object.values(this.data).map(run => run.data.reduce((prev, next) => Math.max(prev, next), 0)).reduce((prev, next) => Math.max(prev, next), 1);
	}

	_xTicks() {
		const maxX = this._maxX;
		return [
			{
				value: maxX,
				title: '' + maxX,
			}
		];
	}

	_yTicks() {
		const maxY = this._maxY;
		return [
			{
				value: maxY,
				title: '' + maxY,
			}
		];
	}

	_colorForRun(run) {
		let color = run.config.color;
		if (!color) {
			const h = Math.abs(hash(run.config.id));
			const colorIndex = Math.floor(h % DEFAULT_RUN_COLORS.length);
			color = DEFAULT_RUN_COLORS[colorIndex];
		}
		return color;
	}

	render() {
		const rect = this.getBoundingClientRect();
		const chartWidth = rect.width;
		const chartHeight = rect.height;
		const chartOriginX = 0;
		const chartOriginY = rect.height;
		const xFactor = chartWidth / (this._maxX - 1);
		const yFactor = chartHeight / this._maxY;
	
		return html`
			<svg viewBox='0 0 ${rect.width} ${rect.height}'>
				<rect x='0' y='0' width='${rect.width}' height='${rect.height}' fill-opacity='0.0' stroke-width='1px'></rect>
				${Object.values(this.data).map(run => 
		svg`<path class='run' stroke='${this._colorForRun(run)}' d='${run.data.map((value, index) => (index == 0 ? 'M ' : 'L ') + ((index * xFactor) + chartOriginX) + ', ' + (chartOriginY - (value * yFactor)) + ' ')}'>
						<title>${run.config.title || run.config.id}</title>
					</path>`)}
			</svg>
		`;
	}
}

window.customElements.define("run-chart", RunChart);
