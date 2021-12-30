
import { LitElement, html, css} from "lit-element";

import { repeat } from 'lit-html/directives/repeat';

import { styleMap } from "lit-html/directives/style-map.js";

import {
	RectangleGraph
} from './graph.js';

import {
	gradient
} from './color.js';

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
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: calc(var(--node-size) * 0.7);
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
					/* TODO: do the animations in a way that won't make Paul Lewis cry */
					transition: left var(--animation-delay), top var(--animation-delay);
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

	/* eslint-disable-next-line */
	renderNode(node, graph) {
		let styles = this._positionForNode(node);
		styles = {...styles, ['background-color']: this.colorForNode(node, graph)};
		const spanStyles = {
			'opacity': this.opacityForNodeText(node, graph)
		};
		return html`<div class='node' style=${styleMap(styles)}><span style='${styleMap(spanStyles)}'>${this.textForNode(node,graph)}</span></div>`;
	}

	//eslint-disable-next-line no-unused-vars
	textForNode(node, graph) {
		return node.emoji || '';
	}

	//eslint-disable-next-line no-unused-vars
	opacityForNodeText(node, graph) {
		return 1.0;
	}

	//eslint-disable-next-line
	colorGradientPercentageForNode(node, graph) {
		return node.value;
	}

	//eslint-disable-next-line no-unused-vars
	colorForNode(node, graph) {
		const style = getComputedStyle(this);
		const primaryColor = style.getPropertyValue('--primary-color');
		const secondaryColor = style.getPropertyValue('--secondary-color');
		const color =  gradient(primaryColor, secondaryColor, this.colorGradientPercentageForNode(node));
		return color;
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
				${Object.values(graph.nodes()).map(node => this.renderNode(node, graph))}
				${repeat(Object.values(this.agentData(this.frame)), agent => agent.id, agent => this.renderAgent(agent, graph))}
			</div>
			`;
	}
}