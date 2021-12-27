
import { LitElement, html, css} from "lit-element";

import { styleMap } from "lit-html/directives/style-map.js";

import {
	RectangleGraph
} from './graph.js';

export class BaseRenderer extends LitElement {
	static get properties() {
		return {
			scale: { type: Number},
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

				.nodes {
					position: relative;
				}

				.agent {
					position: absolute;
					height: var(--node-size);
					width: var(--node-size);
					display: flex;
					font-size: calc(var(--node-size) * 0.7);
					align-items: center;
					justify-content: center;
				}
			`
		];
	}
	
	//This is an override point for your renderer to tell the renderer where the rectangle graph data is
	rectangleGraphData(frame) {
		return frame.graph;
	}

	_rectangleGraph() {
		const data = this.rectangleGraphData(this.frame);
		return new RectangleGraph(data);
	}

	//This is an override point for your renderer, to tell the renderer where the information on each agent is.
	agentData(frame) {
		return frame.agents;
	}

	agentEmoji(agent) {
		return agent.emoji || '🧑‍⚕️';
	}

	agentNodeID(agent) {
		return agent.node;
	}

	renderAgent(agent, graph) {
		const node = graph.node(this.agentNodeID(agent));
		return html`<div class='agent' style=${styleMap(this._positionForNode(node))}>${this.agentEmoji(agent)}</div>`;
	}

	_positionForNode(node) {
		const size = this._size;
		return {
			left: '' + node.col * size + 'px',
			top: '' + node.row * size + 'px',
		};
	}

	get _size() {
		if (!this.frame) return 50;
		const graph = this._rectangleGraph();
		const colSize = this.width * this.scale / graph.cols;
		const rowSize = this.height * this.scale / graph.rows;
		return Math.min(rowSize, colSize);
	}

	innerRender() {
		const graph = this._rectangleGraph();
		const size = this._size;
		return html`
			<div class='nodes' style=${styleMap({'--node-size': size + 'px', height: size * graph.rows + 'px', width: size * graph.cols + 'px'})}>
				${Object.values(graph.nodes()).map(nodeValues => html`<div class='node' style=${styleMap(this._positionForNode(nodeValues))}></div>`)}
				${Object.values(this.agentData(this.frame)).map(agent => this.renderAgent(agent, graph))}
			</div>
			`;
	}
}