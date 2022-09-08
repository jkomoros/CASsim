import { LitElement, html, css } from 'lit';
import { SharedStyles } from "./shared-styles.js";
import { customElement, property } from 'lit/decorators.js';
import { makeRunClickedEvent } from '../events.js';

//This number is the point at which compact versions of runSummary should have no-border.
//These numbers are tied to the border size below, as well as the var(--controls-width);
const NO_BORDER_COMPACT_COUNT_THRESHOLD = 25;
const NO_BORDER_COUNT_THRESHOLD = 100;

@customElement('run-summary')
class RunSummary extends LitElement {

	@property({ type : Number })
	selectedIndex: number;

	@property({ type : Array })
	statuses: number[];

	//If true, then statuses beyond the selectedIndex will be rendered as indeterminate
	@property({ type : Boolean })
	clipFuture: boolean;

	@property({ type : Boolean })
	centerPercentage: boolean;

	@property({ type : Boolean })
	compact: boolean;

	static override get styles() {
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

			.no-border .status {
				border: none;
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

	override render() {
		const statuses = this.clipFuture ? this.statuses.map((value, index) => index <= this.selectedIndex ? value : -1) : this.statuses;
		const successCount = statuses.map(value => value == 1.0 ? 1.0 : 0.0).reduce((prev, curr) => prev + curr, 0);
		const denominator = statuses.map(value => value < 0.0 ? 0 : 1).reduce((prev, curr) => prev + curr, 0);
		const successPercentage = '' + Math.floor(100 * successCount / (denominator || 1)) + '%';

		return html`
				<div class='statuses ${this.centerPercentage ? 'center-percentage' : ''} ${statuses.length > (this.compact ? NO_BORDER_COMPACT_COUNT_THRESHOLD : NO_BORDER_COUNT_THRESHOLD) ? 'no-border' : ''}'>
					<span>${successPercentage}</span>
					<div class='output'>${statuses.map((status, index) => html`<div class='status ${this.selectedIndex == index ? 'selected' : ''} ${status < 0 ? 'indeterminate' : (status == 1.0 ? 'success' : 'failure')}' @click=${this._handleStatusClicked} data-index=${index}></div>`)}</div>
				</div>
		`;
	}

	_handleStatusClicked(e : MouseEvent) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLElement)) throw new Error('not an element as expected');
		this.dispatchEvent(makeRunClickedEvent(parseInt(ele.dataset.index)));
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'run-summary': RunSummary;
	}
}
