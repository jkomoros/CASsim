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
					position: absolute;
					bottom: -1em;
					left: 0;
					width:100%;
					height: 1em;
				}

				.container {
					position:relative;
				}
			
			`
		];
	}

	render() {
		const scale = this.scale || 1.0;
		return html`
		<div class='container' style='height:${this.height * scale}px; width: ${this.width * scale}px; font-size:${DEFAULT_FONT_SIZE_PX_HEIGHT * scale}px'>
			${this.runStatuses ? html`<run-summary .statuses=${this.runStatuses}></run-summary>` : ''}
			${this._renderer()}
		</div>
		`;
	}

	_renderer() {
		const ele = memoizedRenderer(this.simulation, this);
		if (!ele) return html`<em>Unknown renderer</em>`;
		ele.frame = this.frame;
		ele.width = this.width;
		ele.height = this.height;
		return ele;
	}
}

window.customElements.define("frame-visualization", FrameVisualization);
