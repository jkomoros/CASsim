import { LitElement, html, css, TemplateResult } from 'lit';
import { memoizedRenderer } from "../util.js";
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { Simulation } from '../simulation.js';
import { SimulationFrame } from '../types.js';
import './run-summary.js';

const DEFAULT_FONT_SIZE_PX_HEIGHT = 16;

// This is a reusable element. It is not connected to the store. You can
// imagine that it could just as well be a third-party element that you
// got from someone else.
@customElement('frame-visualization')
export class FrameVisualization extends LitElement {

	@property({ type : Object })
	simulation: Simulation;

	@property({ type : Object })
	frame: SimulationFrame;

	@property({ type : Number })
	width: number;

	@property({ type : Number })
	height: number;

	@property({ type : Number })
	scale: number;

	@property({ type : Number })
	animationLength: number;

	@property({ type : Array })
	runStatuses: number[];

	@property({ type : Number })
	runIndex: number;

	static override get styles() {
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
					overflow: clip;
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

	get _clipStatus() {
		if (!this.simulation) return false;
		return this.simulation.clipStatus;
	}

	override render() : TemplateResult {
		const scale = this.scale || 1.0;
		const containerStyles = {
			'font-size': '' + DEFAULT_FONT_SIZE_PX_HEIGHT * scale + 'px'
		};
		const rendererStyles = {
			'height': '' + this.height * scale + 'px',
			'width': '' + this.width * scale + 'px',
			'font-size': '' + DEFAULT_FONT_SIZE_PX_HEIGHT * scale + 'px',
			'--animation-delay': '' + this.animationLength + 'ms',
		};
		return html`
		<div class='container' style='${styleMap(containerStyles)}'>
			<div class='renderer' style='${styleMap(rendererStyles)}'>
				${this._renderer(scale)}
			</div>
			${this.runStatuses ? html`<run-summary .statuses=${this.runStatuses} .selectedIndex=${this.runIndex} .clipFuture=${this._clipStatus} .centerPercentage=${true}></run-summary>` : ''}
		</div>
		`;
	}

	_renderer(scale : number ) : HTMLElement | TemplateResult {
		const ele = memoizedRenderer(this.simulation, this);
		if (!ele) return html`<div class='message'><div><div><em>Loading...</em></div><div><span>If this message doesn't go away soon, check the console for errors.</span></div></div></div>`;
		ele.frame = this.frame;
		ele.width = this.width;
		ele.height = this.height;
		ele.scale = scale;
		return ele;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'frame-visualization': FrameVisualization;
	}
}
