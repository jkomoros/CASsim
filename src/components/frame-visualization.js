import { LitElement, html, css } from "lit-element";
import { memoizedRenderer } from "../util.js";

const DEFAULT_FONT_SIZE_PX_HEIGHT = 16;

// This is a reusable element. It is not connected to the store. You can
// imagine that it could just as well be a third-party element that you
// got from someone else.
class FrameVisualization extends LitElement {
	static get properties() {
		return {
			simulation: {type:Object},
			frame: { type: Object },
			width: {type:Number},
			height: {type:Number},
			scale: {type:Number},
			runStatuses: {type:Object},
			runIndex: {type:Number},
		};
	}

	static get styles() {
		return [
			css`
				:host {
					background-color: var(--override-app-background-color, var(--background-color, transparent));
				}
				
				run-summary {
					/* TODO: make it size based on scale */
					z-index: 1;
					position: relative;
					bottom: 0em;
					left: 0;
					width:100%;
					height: 1em;
				}

				.renderer {
					position:relative;
					top:0;
					left:0;
				}

				.message {
					display: flex;
					height: 100%;
					width: 100%;
					justify-content: center;
					align-items: center;
					text-align: center;
					font-size: 1.5em;
				}

				.message > div {

					display: flex;
					flex-direction: column;
				}

				.message span {
					font-size: 0.6em;
					color: var(--dark-gray-color);
				}
			
			`
		];
	}

	render() {
		const scale = this.scale || 1.0;
		return html`
		<div class='container' style='font-size:${DEFAULT_FONT_SIZE_PX_HEIGHT * scale}px'>
			<div class='renderer' style='height:${this.height * scale}px; width: ${this.width * scale}px; font-size:${DEFAULT_FONT_SIZE_PX_HEIGHT * scale}px'>
				${this._renderer()}
			</div>
			${this.runStatuses ? html`<run-summary .statuses=${this.runStatuses} .selectedIndex=${this.runIndex} .clipFuture=${true} .centerPercentage=${true}></run-summary>` : ''}
		</div>
		`;
	}

	_renderer() {
		const ele = memoizedRenderer(this.simulation, this);
		if (!ele) return html`<div class='message'><div><div><em>Loading...</em></div><div><span>If this message doesn't go away soon, check the console for errors.</span></div></div></div>`;
		ele.frame = this.frame;
		ele.width = this.width;
		ele.height = this.height;
		return ele;
	}
}

window.customElements.define("frame-visualization", FrameVisualization);
