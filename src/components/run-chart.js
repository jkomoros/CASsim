import { LitElement, html, css } from "lit-element";
import { SharedStyles } from "./shared-styles.js";

class RunChart extends LitElement {
	static get properties() {
		return {
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

				.container {
					height: 100%;
					width: 100%;
					justify-content: center;
					align-items: center;
				}
			`
		];
	}

	render() {
		return html`
			<div class='container'>
				<div>
					<em>Not yet implemented</em>
				</div>
			</div>
		`;
	}
}

window.customElements.define("run-chart", RunChart);
