import { LitElement, html, css } from "lit-element";
import { SharedStyles } from "./shared-styles.js";

class RunSummary extends LitElement {
	static get properties() {
		return {
			selectedIndex: {type: Number},
			statuses: {type: Array},
			//If true, then statuses beyond the selectedIndex will be rendered as indeterminate
			clipFuture: {type:Boolean},
			centerPercentage: {type:Boolean},
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
				margin-right: 0.5em;
			}

			.statuses.center-percentage span {
				width: 3.0em;
				text-align: center;
				margin-right: 0;
			}

			.output {
				flex-grow: 1;
				display: flex;
				flex-direction: row;
			}
			
			.status {
				border: 0.000625em solid white;
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
		const statuses = this.clipFuture ? this.statuses.map((value, index) => index <= this.selectedIndex ? value : -1) : this.statuses;
		const successCount = statuses.map(value => value == 1.0 ? 1.0 : 0.0).reduce((prev, curr) => prev + curr, 0);
		const denominator = statuses.map(value => value < 0.0 ? 0 : 1).reduce((prev, curr) => prev + curr, 0);
		const successPercentage = '' + Math.floor(100 * successCount / (denominator || 1)) + '%';

		return html`
				<div class='statuses ${this.centerPercentage ? 'center-percentage' : ''}'>
					<span>${successPercentage}</span>
					<div class='output'>${statuses.map((status, index) => html`<div class='status ${this.selectedIndex == index ? 'selected' : ''} ${status < 0 ? 'indeterminate' : (status == 1.0 ? 'success' : 'failure')}' @click=${this._handleStatusClicked} .index=${index}></div>`)}</div>
				</div>
		`;
	}

	_handleStatusClicked(e) {
		const ele = e.composedPath()[0];
		this.dispatchEvent(new CustomEvent('run-clicked', {composed:true, detail: {index: ele.index}}));
	}
}

window.customElements.define("run-summary", RunSummary);
