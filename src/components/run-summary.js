import { LitElement, html, css } from "lit-element";
import { SharedStyles } from "./shared-styles.js";

class RunSummary extends LitElement {
	static get properties() {
		return {
			selectedIndex: {type: Number},
			statuses: {type: Array},
		};
	}

	static get styles() {
		return [
			SharedStyles,
			css`

			:host {
				margin: 0.5em 0;
			}

			.statuses {
				display: flex;
				flex-direction: row;
				align-items: center;
			}

			span {
				color: var(--dark-gray-color);
				font-weight: bold;
			}

			.output {
				margin-left: 0.25em;
				flex-grow: 1;
				display: flex;
				flex-direction: row;
			}
			
			.status {
				border: 0.0625em solid white;
				height: 1.5em;
				background-color: gray;
				cursor: pointer;
				flex-grow:1;
				box-sizing: border-box;
			}

			.status.selected {
				border: 0.0625em solid black;
			}

			.status.failure {
				background-color: darkred;
			}

			.status.success {
				background-color: darkgreen;
			}
			`
		];
	}

	render() {
		const successCount = this.statuses.map(value => value == 1.0 ? 1.0 : 0.0).reduce((prev, curr) => prev + curr, 0);
		const successPercentage = '' + Math.floor(100 * successCount / (this.statuses.length || 1)) + '%';

		return html`
				<div class='statuses'>
					<span>${successPercentage}</span>
					<div class='output'>${this.statuses.map((status, index) => html`<div class='status ${this.selectedIndex == index ? 'selected' : ''} ${status < 0 ? 'indeterminate' : (status == 1.0 ? 'success' : 'failure')}' @click=${this._handleStatusClicked} .index=${index}></div>`)}</div>
				</div>
		`;
	}

	_handleStatusClicked(e) {
		const ele = e.composedPath()[0];
		this.dispatchEvent(new CustomEvent('run-clicked', {composed:true, detail: {index: ele.index}}));
	}
}

window.customElements.define("run-summary", RunSummary);
