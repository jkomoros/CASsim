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

//In percent of width
const PADDING_PROPORTION = 0.1;
//In percent of padding
const TICK_PROPORTION = 0.3;

const TICK_INTERVALS = [0.05, 0.25, 0.5, 1.0, 5.0, 10.0, 25.0, 50.0, 100.0, 500.0, 1000.0, 5000.0, 10000.0];
const INTERMEDIATE_TICK_COUNT = 5;

class RunChart extends LitElement {
	static get properties() {
		return {
			data: {type:Object},
			configID: {type:String},
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
					stroke-width: 1px;
				}

				text.label {
					fill: var(--dark-gray-color);
				}

				.tick {
					stroke: var(--dark-gray-color);
					stroke-width: 1px;
				}

				.tick.line {
					stroke: var(--app-background-color);
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
		let max = 1;
		for (const [id, runs] of Object.entries(this.data)) {
			if (this.configID && this.configID != id) continue;
			for (const run of runs) {
				const value = run.data.length - 1;
				if (value > max) max = value;
			}
		}
		return max;
	}

	get _maxY() {
		//The highest value seen in the entire data run, or 1
		let max = 1;
		for (const [id, runs] of Object.entries(this.data)) {
			if (this.configID && this.configID != id) continue;
			for (const run of runs) {
				const value = run.data.reduce((prev, next) => Math.max(prev, next));
				if (value > max) max = value;
			}
		}
		return max;
	}

	_interval(max) {
		let low = 0;
		let high = TICK_INTERVALS.length - 1;

		if (max < 1.0) return 1.0;

		while (low != high) {
			const index = Math.floor((high - low) / 2 + low);

			if (index == low) return TICK_INTERVALS[high];
			if (index == high) return TICK_INTERVALS[low];
		
			const interval = TICK_INTERVALS[index];
			const count = max / interval;
			if (count == INTERMEDIATE_TICK_COUNT) return interval;
			if (count > INTERMEDIATE_TICK_COUNT) {
				low = index;
			} else {
				high = index;
			}
		}
		return TICK_INTERVALS[low];
	}

	_xTicks() {
		const maxX = this._maxX;
		const middle = [];
		const interval = this._interval(maxX);
		let index = interval;
		while (index < maxX) {
			middle.push({value: index});
			index += interval;
		}
		return [{value: 0}, ...middle, {value:maxX, title: ''+maxX}];
	}

	_yTicks() {
		const maxY = this._maxY;
		const middle = [];
		const interval = this._interval(maxY);
		let index = interval;
		while (index < maxY) {
			middle.push({value: index});
			index += interval;
		}
		return [{value: 0}, ...middle, {value:maxY, title: ''+maxY}];
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
		const padding = rect.width * PADDING_PROPORTION;
		const tickLength = padding * TICK_PROPORTION;
		const chartWidth = rect.width - padding;
		const chartHeight = rect.height - padding;
		const chartOriginX = padding;
		const chartOriginY = rect.height - padding;
		const xFactor = chartWidth / this._maxX;
		const yFactor = chartHeight / this._maxY;
	
		return html`
			<svg viewBox='0 0 ${rect.width} ${rect.height}'>
				<rect x='${padding}' y='0' width='${chartWidth}' height='${chartHeight}' fill-opacity='0.0'></rect>
				${this._xTicks().map((tick, index, ticks) => svg`<path class='tick xTick' d='M${chartOriginX + tick.value * xFactor},${chartOriginY} v ${tickLength}'></path><path class='tick line xTick' d='M${chartOriginX + tick.value * xFactor},${chartOriginY} v ${-1 * chartHeight}'></path>${tick.title ? svg`<text class='label' text-anchor='${index == ticks.length - 1 ? 'end' : 'middle'}' x='${chartOriginX + tick.value * xFactor}' y='${rect.height}' font-size='${tickLength * 1.5}px'>${tick.title}</text>` : ''}`)}
				${this._yTicks().map((tick, index, ticks) => svg`<path class='tick yTick' d='M${chartOriginX},${chartOriginY - (tick.value * yFactor)} h ${-1.0 * tickLength}'></path><path class='tick line yTick' d='M${chartOriginX},${chartOriginY - (tick.value * yFactor)} h ${chartWidth}'></path>${tick.title ? svg`<text class='label' dominant-baseline='center' x='0' y='${chartOriginY - (tick.value * yFactor) + (index == ticks.length - 1 ? tickLength * 1.5 : 0)}' font-size='${tickLength * 1.5}px'>${tick.title}</text>` : ''}`)}
				${Object.entries(this.data).filter(entry => !this.configID || this.configID == entry[0]).map(entry => entry[1]).map(runs => runs.map(run => 
		svg`<path class='run' stroke='${this._colorForRun(run)}' d='${run.data.map((value, index) => (index == 0 ? 'M ' : 'L ') + ((index * xFactor) + chartOriginX) + ', ' + (chartOriginY - (value * yFactor)) + ' ')}'>
						<title>${run.config.title || run.config.id}</title>
					</path>`))}
			</svg>
		`;
	}
}

window.customElements.define("run-chart", RunChart);
