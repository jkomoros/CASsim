
import { LitElement, html, css} from "lit-element";

import {
	RectangleGraph
} from './graph.js';

export class BaseRenderer extends LitElement {
	static get properties() {
		return {
			frame: { type: Object },
			width: {type:Number},
			height: {type:Number},
		};
	} 

	static get styles() {
		return [
			css`

			:host {
				width: 100%;
				height: 100%;
				position: relative;
			}

			.container {
				height: 100%;
				width: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				flex-direction: column;
			}

			pre {
				height: 100%;
				width: 100%;
				overflow: scroll;
			}
			`
		];
	}

	render() {
		return html`
			<div class='container'>
				${this.innerRender()}
			</div>
		`;
	}

	//This the override point for subclasses
	innerRender() {
		return html`<pre>${JSON.stringify(this.frame, '', 2)}</pre>`;
	}

}

export class RectangleGraphRenderer extends BaseRenderer {
	
	static get styles() {
		return [
			BaseRenderer.styles,
			css`
				.node {
					position: absolute;
					height: var(--node-size);
					width: var(--node-size);
					background-color: var(--primary-color);
					border: 1px solid black;
				}
			`
		];
	}
	
	//This is an override point for your renderer to tell the renderer where the rectangle graph data is
	rectangleGraphData(frame) {
		return frame.graph;
	}

	innerRender() {
		//TODO: calculate this based on rows/cols of graph and size
		const size = 50;
		const data = this.rectangleGraphData(this.frame);
		if (!data) return html`<em>Loading...</em>`;
		const graph = new RectangleGraph(data);
		return html`
			<style>
				:host {
					--node-size: ${size}px;
				}
			</style>
			${Object.values(graph.nodes()).map(nodeValues => html`<div class='node' style=${'left:' + nodeValues.col * size + 'px; top:' + nodeValues.row * size + 'px;'}></div>`)}`;
	}
}