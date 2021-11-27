import { LitElement, html, css } from "lit-element";

class RunSummary extends LitElement {
	static get properties() {
		return {
			selectedIndex: {type: Number},
			statuses: {type: Array},
		};
	}

	static get styles() {
		return [
			css`
			.statuses {
				display: flex;
				flex-direction: row;
				flex-wrap: wrap;
			}
		
			.status {
				height: 1em;
				width: 1em;
				border-radius: 1em;
				background-color: gray;
				cursor: pointer;
			}

			.status.selected {
				border: 1px solid black;
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
		const successPercentage = '' + Math.floor(100 * successCount / this.statuses.length) + '%';

		return html`
				<div class='statuses'>
					${this.statuses.map((status, index) => html`<div class='status ${this.selectedIndex == index ? 'selected' : ''} ${status < 0 ? 'indeterminate' : (status == 1.0 ? 'success' : 'failure')}' @click=${this._handleStatusClicked} .index=${index}></div>`)}
					<span>${successPercentage}</span>
				</div>
		`;
	}

	_handleStatusClicked(e) {
		const ele = e.composedPath()[0];
		this.dispatchEvent(new CustomEvent('run-clicked', {composed:true, detail: {index: ele.index}}));
	}
}

window.customElements.define("run-summary", RunSummary);
