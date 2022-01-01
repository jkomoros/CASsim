
import { LitElement, html, css, svg} from "lit-element";

import { repeat } from 'lit-html/directives/repeat';

import { styleMap } from "lit-html/directives/style-map.js";

import {
	inflateGraph,
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

export class PositionedGraphRenderer extends BaseRenderer {
	
	static get styles() {
		return [
			BaseRenderer.styles,
			css`
				.node {
					box-sizing: border-box;
					position: absolute;
					height: var(--node-height);
					width: var(--node-width);
					border-radius: var(--node-radius);
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
					height: var(--node-height);
					width: var(--node-width);
					display: flex;
					font-size: calc(var(--node-size) * 0.7);
					align-items: center;
					justify-content: center;
					/* TODO: do the animations in a way that won't make Paul Lewis cry */
					transition: left var(--animation-delay), top var(--animation-delay);
				}

				svg {
					width: 100%;
					height: 100%;
				}
			`
		];
	}
	
	//This is an override point for your renderer to tell the renderer where the positioned graph data is
	graphData(frame) {
		return frame.graph;
	}

	_graph() {
		const data = this.graphData(this.frame);
		return inflateGraph(data);
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

	//eslint-disable-next-line no-unused-vars
	additionalStylesForNode(node, graph) {
		return {};
	}

	/* eslint-disable-next-line */
	renderNode(node, graph) {
		let styles = this._positionStylesForNode(node, graph);
		styles = {...styles, ['background-color']: this.colorForNode(node, graph)};
		styles = {...styles, ...this.additionalStylesForNode(node, graph)};
		const spanStyles = {
			'opacity': this.opacityForNodeText(node, graph)
		};
		return html`<div class='node ${node.type ? node.type : ''}' style=${styleMap(styles)}><span style='${styleMap(spanStyles)}'>${this.textForNode(node,graph)}</span></div>`;
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
	renderEdges(frame) {
		return false;
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
		return html`<div class='agent ${agent.type ? agent.type : ''}' style=${styleMap(this._positionStylesForNode(node, graph))}>${this.agentEmoji(agent)}</div>`;
	}

	//eslint-disable-next-line no-unused-vars
	colorForEdge(edge, graph) {
		return 'var(--secondary-color)';
	}

	//eslint-disable-next-line no-unused-vars
	widthForEdge(edge, graph) {
		return '1';
	}

	//eslint-disable-next-line no-unused-vars
	opacityForEdge(edge, graph) {
		return '1.0';
	}

	//eslint-disable-next-line no-unused-vars
	dasharrayForEdge(edge, graph) {
		//Note: you might not be able to see the dasharray if edges overlap.
		return '';
	}

	/*
		radiusForNode is used to set width/height if they aren't provided by
		graph.nodePosition.
	*/
	//eslint-disable-next-line no-unused-vars
	radiusForNode(node, graph) {
		return 10;
	}

	widthForNode(node, graph) {
		const position = graph.nodePosition(node);
		if (position.width) return position.width;
		return this.radiusForNode(node, graph) * 2;
	}

	heightForNode(node, graph) {
		const position = graph.nodePosition(node);
		if (position.height) return position.height;
		return this.radiusForNode(node, graph) * 2;
	}

	//must return svg. Note coordinates are viewBoxed so don't need any scaling.
	renderEdge(edge, graph) {
		if (!graph) return '';
		const fromNodePosition = graph.nodePosition(edge.from);
		const toNodePosition = graph.nodePosition(edge.to);
		return svg`<path id=${edge.id} class='edge' d='M ${fromNodePosition.x}, ${fromNodePosition.y} L ${toNodePosition.x}, ${toNodePosition.y}' stroke='${this.colorForEdge(edge, graph)}' stroke-width='${this.widthForEdge(edge, graph)}' stroke-opacity='${this.opacityForEdge(edge, graph)}' stroke-dasharray='${this.dasharrayForEdge(edge, graph)}'></path>`;
	}

	_positionStylesForNode(node, graph) {
		const nodePosition = graph ? graph.nodePosition(node) : {left: '0px', top: '0px'};
		const result = {
			left: '' + (nodePosition.x - (nodePosition.width / 2)) * this.scale + 'px',
			top: '' + (nodePosition.y - (nodePosition.height / 2)) * this.scale + 'px',
		};
		if (graph.nodesSameSize) {
			result.width = '' + this.widthForNode(node, graph) * this.scale + 'px';
			result.height = '' + this.heightForNode(node, graph) * this.scale + 'px';
		}
		return result;
	}

	innerRender() {
		const graph = this._graph();
		const lastNodeIdentifier = graph.lastNodeIdentifier();
		const width = this.widthForNode(lastNodeIdentifier, graph);
		const height = this.heightForNode(lastNodeIdentifier, graph);
		const size = Math.min(width, height);
		const styles = {
			'--node-width': width * this.scale + 'px',
			'--node-height': height * this.scale + 'px',
			'--node-size': size * this.scale + 'px',
			'--node-radius': '' + 100 * graph.nodeBorderRadius + '%',
			'height': '' + graph.height * this.scale + 'px',
			'width': '' + graph.width * this.scale + 'px',
		};
		return html`
			<div class='nodes' style=${styleMap(styles)}>
				${Object.values(graph.nodes()).map(node => this.renderNode(node, graph))}
				${repeat(Object.values(this.agentData(this.frame)), agent => agent.id, agent => this.renderAgent(agent, graph))}
				${graph && this.renderEdges(this.frame) ?
		html`<svg viewBox='0 0 ${graph.width} ${graph.height}'>
					${repeat(Object.values(graph.allEdges()), edge => edge.id, edge => this.renderEdge(edge, graph))}
				</svg>` : ''}
			</div>
			`;
	}
}