import { LitElement, html, css, svg } from 'lit';
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

const TICK_INTERVALS = [0.05, 0.10, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 25.0, 50.0, 100.0, 250.0, 500.0, 1000.0, 2500.0, 5000.0, 10000.0];
const INTERMEDIATE_TICK_COUNT = 6;

class RunChart extends LitElement {
	static get properties() {
		return {
			data: {type:Object},
			configIDs: {type:Object},
			runIndex: {type:Number},
			frameIndex: {type:Number},
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

				.tick.bold {
					stroke-width: 2px;
				}

				.tick.line {
					stroke: var(--app-background-color);
				}

				.tick.line.bold {
					stroke: var(--dark-gray-color);
					stroke-width: 1px;
				}

				path.run {
					stroke-width: 2px;
					fill: transparent;
				}

				path.run.bold {
					stroke-width: 3px;
				}

				path.run:hover {
					stroke-width: 4px;
					opacity: 1.0;
				}
			`
		];
	}

	get _enabledConfigIDs() {
		const configIDs = this.configIDs || {};
		if (Object.keys(configIDs).length == 0) {
			//Return one where everything is on
			return this.data || {};
		}
		return configIDs;
	}

	get _minX() {
		//The run with the longest number of frameValues, or 1.
		let min = 0;
		const enabledConfigIDs = this._enabledConfigIDs;
		for (const [id, runs] of Object.entries(this.data)) {
			if (!enabledConfigIDs[id]) continue;
			for (const run of runs) {
				const value = run.data.length - 1;
				if (value < min) min = value;
			}
		}
		return min;
	}

	get _minY() {
		//The highest value seen in the entire data run, or 1
		let min = 0;
		const enabledConfigIDs = this._enabledConfigIDs;
		for (const [id, runs] of Object.entries(this.data)) {
			if (!enabledConfigIDs[id]) continue;
			for (const run of runs) {
				const value = run.data.reduce((prev, next) => Math.min(prev, next));
				if (value < min) min = value;
			}
		}
		return min;
	}

	get _maxX() {
		//The run with the longest number of frameValues, or 1.
		let max = 1;
		const enabledConfigIDs = this._enabledConfigIDs;
		for (const [id, runs] of Object.entries(this.data)) {
			if (!enabledConfigIDs[id]) continue;
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
		const enabledConfigIDs = this._enabledConfigIDs;
		for (const [id, runs] of Object.entries(this.data)) {
			if (!enabledConfigIDs[id]) continue;
			for (const run of runs) {
				const value = run.data.reduce((prev, next) => Math.max(prev, next));
				if (value > max) max = value;
			}
		}
		return max;
	}

	//max - min
	_interval(range) {
		let low = 0;
		let high = TICK_INTERVALS.length - 1;

		if (range < 1.0) return 1.0;

		while (low != high) {
			const index = Math.floor((high - low) / 2 + low);

			if (index == low) return TICK_INTERVALS[high];
			if (index == high) return TICK_INTERVALS[low];
		
			const interval = TICK_INTERVALS[index];
			const count = range / interval;
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
		const minX = this._minX;
		const middle = [];
		const interval = this._interval(maxX - minX);
		let index = minX + interval;
		let startedNegative = index < 0.0;
		while (index < maxX) {
			middle.push({value: index});
			if (startedNegative && index > 0.0) {
				startedNegative = false;
				middle.push({value: 0.0, title: '0', bold: true});
			}
			index += interval;
		}
		return [{value: minX, bold: true}, ...middle, {value:maxX, title: ''+maxX, bold: true}];
	}

	_yTicks() {
		const maxY = this._maxY;
		const minY = this._minY;
		const middle = [];
		const interval = this._interval(maxY - minY);
		let index = minY + interval;
		let startedNegative = index < 0.0;
		while (index < maxY) {
			middle.push({value: index});
			if (startedNegative && index > 0.0) {
				startedNegative = false;
				middle.push({value: 0.0, title: '0', bold: true});
			}
			index += interval;
		}
		return [{value: minY, bold: true}, ...middle, {value:maxY, title: ''+maxY, bold: true}];
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
		const enabledConfigIDs = this._enabledConfigIDs;
		const padding = rect.width * PADDING_PROPORTION;
		const tickLength = padding * TICK_PROPORTION;
		const chartWidth = rect.width - padding;
		const chartHeight = rect.height - padding;
		const chartOriginX = padding;
		const chartOriginY = rect.height - padding;
		const maxX = this._maxX;
		const maxY = this._maxY;
		const minX = this._minX;
		const minY = this._minY;
		const xRange = maxX - minX;
		const yRange = maxY - minY;
		const xFactor = chartWidth / xRange;
		const yFactor = chartHeight / yRange;
	
		return html`
			<svg viewBox='0 0 ${rect.width} ${rect.height}'>
				<rect x='${padding}' y='0' width='${chartWidth}' height='${chartHeight}' fill-opacity='0.0'></rect>
				${this._xTicks().map((tick, index, ticks) => svg`<path class='tick xTick ${tick.bold ? 'bold' : ''}' d='M${chartOriginX - minX + tick.value * xFactor},${chartOriginY} v ${tickLength}'></path><path class='tick line xTick ${tick.bold ? 'bold' : ''}' d='M${chartOriginX - minX + tick.value * xFactor},${chartOriginY} v ${-1 * chartHeight}'></path>${tick.title ? svg`<text class='label' text-anchor='${index == ticks.length - 1 ? 'end' : 'middle'}' x='${chartOriginX - minX + tick.value * xFactor}' y='${rect.height}' font-size='${tickLength * 1.5}px'>${tick.title}</text>` : ''}`)}
				${this._yTicks().map((tick, index, ticks) => svg`<path class='tick yTick ${tick.bold ? 'bold' : ''}' d='M${chartOriginX},${chartOriginY  - ((tick.value - minY) * yFactor)} h ${-1.0 * tickLength}'></path><path class='tick line yTick ${tick.bold ? 'bold' : ''}' d='M${chartOriginX},${chartOriginY - ((tick.value - minY) * yFactor)} h ${chartWidth}'></path>${tick.title ? svg`<text class='label' dominant-baseline='center' x='0' y='${chartOriginY - ((tick.value - minY) * yFactor) + (index == ticks.length - 1 ? tickLength * 1.5 : 0)}' font-size='${tickLength * 1.5}px'>${tick.title}</text>` : ''}`)}
				<path class='tick line xTick bold' d='M${chartOriginX - minX + this.frameIndex * xFactor},${chartOriginY} v ${-1 * chartHeight}'></path>
				${Object.entries(this.data).filter(entry =>  enabledConfigIDs[entry[0]]).map(entry => entry[1]).map(runs => runs.map((run,index,runs) => 
		svg`<path class='run ${index === this.runIndex && runs.length > 1 ? 'bold' : ''}' stroke='${this._colorForRun(run)}' stroke-opacity='${1.0 - (index / runs.length / 1.1)}' d='${run.data.map((value, index) => (index == 0 ? 'M ' : 'L ') + ((index * xFactor) - minX + chartOriginX) + ', ' + (chartOriginY - ((value - minY) * yFactor)) + ' ')}'>
						<title>${(run.config.title || run.config.id) + (runs.length > 1 ? ' - Run ' + index : '')}</title>
					</path>`))}
			</svg>
		`;
	}
}

window.customElements.define("run-chart", RunChart);
