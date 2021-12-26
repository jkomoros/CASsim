import { LitElement, html, css } from "lit-element";
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
			`
		];
	}

	render() {
		const rect = this.getBoundingClientRect();
		return html`
			<svg viewBox='0 0 ${rect.width} ${rect.height}'>
				<rect x='0' y='0' width='${rect.width}' height='${rect.height}' fill='blue'></rect>
			</svg>
		`;
	}
}

window.customElements.define("run-chart", RunChart);
