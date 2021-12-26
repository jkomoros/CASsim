import { LitElement, html, css, svg } from "lit-element";
import { SharedStyles } from "./shared-styles.js";

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
				}

				svg rect {
					stroke: var(--dark-gray-color);
				}

				path.run {
					stroke: black;
					fill: transparent;
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

	_renderRun(run, chartWidth, chartHeight, chartOriginX, chartOriginY) {
		const xFactor = chartWidth / (this._maxX - 1);
		const yFactor = chartHeight / this._maxY;
		return svg`<path class='run' stroke-width='2' d='${run.data.map((value, index) => (index == 0 ? 'M ' : 'L ') + ((index * xFactor) + chartOriginX) + ', ' + (chartOriginY - (value * yFactor)) + ' ')}'>
						<title>${run.config.title || run.config.id}</title>
					</path>`;
	}

	render() {
		const rect = this.getBoundingClientRect();
		return html`
			<svg viewBox='0 0 ${rect.width} ${rect.height}'>
				<rect x='0' y='0' width='${rect.width}' height='${rect.height}' fill-opacity='0.0' stroke-width='1px'></rect>
				${Object.values(this.data).map(run => this._renderRun(run, rect.width, rect.height, 0, rect.height))}
			</svg>
		`;
	}
}

window.customElements.define("run-chart", RunChart);
