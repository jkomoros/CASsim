
import { LitElement, html, css, svg} from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { repeat } from 'lit/directives/repeat.js';

import { styleMap } from 'lit/directives/style-map.js';

import {
	inflateGraph,
} from './graph/graph.js';

import {
	gradient
} from './color.js';

import {
	makeSeededRandom
} from './random.js';

import {
	SimulationFrame
} from './types.js';

@customElement('base-renderer')
export class BaseRenderer extends LitElement {

	@property({ type : Number })
	scale : number;

	@property({ type : Number })
	height : number;

	@property({ type : Number })
	width : number;

	@property({ type : Object })
	frame : SimulationFrame;

	static override get styles() {
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

	override render() {
		return html`
			<div class='container'>
				${this.innerRender()}
			</div>
		`;
	}

	//This the override point for subclasses
	innerRender() {
		return html`<pre>${JSON.stringify(this.frame, null, 2)}</pre>`;
	}

}

declare global {
	interface HTMLElementTagNameMap {
		'base-renderer': BaseRenderer;
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
	agentOpacity(agent, graph) {
		return 1.0;
	}

	agentX(agent) {
		if (agent.x !== undefined) return agent.x;
		const rnd = makeSeededRandom(agent.id);
		return this.width * rnd();
	}

	agentY(agent) {
		if (agent.y !== undefined) return agent.y;
		const rnd = makeSeededRandom(agent.id);
		return this.height * rnd();
	}

	agentHeight(agent) {
		return agent.height === undefined ? this.agentSize(agent) : agent.height;
	}

	agentWidth(agent) {
		return agent.width === undefined ? this.agentSize(agent) : agent.width;
	}

	//eslint-disable-next-line no-unused-vars
	agentSizeMultiplier(agent) {
		return 1.0;
	}

	agentDefaultMinNodeSize() {
		return 10;
	}

	agentDefaultMaxNodeSize() {
		return 10;
	}

	agentSize(agent) {
		return (this.agentDefaultMaxNodeSize() - this.agentDefaultMinNodeSize()) * this.agentSizeMultiplier(agent) + this.agentDefaultMinNodeSize();
	}

	agentPosition(agent, graph) {
		if (!graph) {
			return {
				x: this.agentX(agent),
				y: this.agentY(agent),
				width: this.agentWidth(agent),
				height: this.agentHeight(agent),
			};
		}
		const nodeID = this.agentNodeID(agent);
		return graph.nodePosition(nodeID);
	}

	//eslint-disable-next-line no-unused-vars
	nodeAdditionalStyles(node, graph) {
		return {};
	}

	/* eslint-disable-next-line */
	renderNode(node, graph) {
		let styles = this._positionStylesForNode(node, graph);
		styles = {...styles, ['background-color']: this.nodeColor(node, graph)};
		styles = {...styles, ...this.nodeAdditionalStyles(node, graph)};
		const spanStyles = {
			'opacity': this.nodeTextOpacity(node, graph)
		};
		return html`<div class='node ${node.type ? node.type : ''}' style=${styleMap(styles)}><span style='${styleMap(spanStyles)}'>${this.nodeText(node,graph)}</span></div>`;
	}

	//eslint-disable-next-line no-unused-vars
	nodeText(node, graph) {
		return node.emoji || '';
	}

	//eslint-disable-next-line no-unused-vars
	nodeTextOpacity(node, graph) {
		return 1.0;
	}

	//eslint-disable-next-line
	nodeColorGradientPercentage(node, graph) {
		return node.value;
	}

	//eslint-disable-next-line no-unused-vars
	renderEdges(frame) {
		return false;
	}

	//eslint-disable-next-line no-unused-vars
	nodeColor(node, graph) {
		const style = getComputedStyle(this);
		const primaryColor = style.getPropertyValue('--primary-color');
		const secondaryColor = style.getPropertyValue('--secondary-color');
		const color =  gradient(primaryColor, secondaryColor, this.nodeColorGradientPercentage(node));
		return color;
	}

	renderAgent(agent, graph) {
		let styles = this._positionStyles(this.agentPosition(agent, graph));
		styles = {...styles, 'opacity': this.agentOpacity(agent, graph)};
		return html`<div class='agent ${agent.type ? agent.type : ''}' style=${styleMap(styles)}>${this.agentEmoji(agent)}</div>`;
	}

	//eslint-disable-next-line no-unused-vars
	edgeColor(edge, graph) {
		return 'var(--secondary-color)';
	}

	//eslint-disable-next-line no-unused-vars
	edgeWidth(edge, graph) {
		return '1';
	}

	//eslint-disable-next-line no-unused-vars
	edgeOpacity(edge, graph) {
		return '1.0';
	}

	//eslint-disable-next-line no-unused-vars
	edgeDasharray(edge, graph) {
		//Note: you might not be able to see the dasharray if edges overlap.
		return '';
	}

	//must return svg. Note coordinates are viewBoxed so don't need any scaling.
	renderEdge(edge, graph) {
		if (!graph) return '';
		const fromNodePosition = graph.nodePosition(edge.from);
		const toNodePosition = graph.nodePosition(edge.to);
		return svg`<path id=${edge.id} class='edge' d='M ${fromNodePosition.x}, ${fromNodePosition.y} L ${toNodePosition.x}, ${toNodePosition.y}' stroke='${this.edgeColor(edge, graph)}' stroke-width='${this.edgeWidth(edge, graph)}' stroke-opacity='${this.edgeOpacity(edge, graph)}' stroke-dasharray='${this.edgeDasharray(edge, graph)}'></path>`;
	}

	//position should be an opbject with x,y,width,height;
	_positionStyles(position) {
		const size = Math.min(position.width, position.height);
		return {
			left: '' + (position.x - (position.width / 2)) * this.scale + 'px',
			top: '' + (position.y - (position.height / 2)) * this.scale + 'px',
			width: '' + position.width * this.scale + 'px',
			height: '' + position.height * this.scale + 'px',
			'--node-size': '' + size * this.scale + 'px'
		};
	}

	_positionStylesForNode(node, graph) {
		return this._positionStyles(graph ? graph.nodePosition(node) : {x: 0, y: 0, width: 10, height: 10});
	}

	innerRender() {
		const graph = this._graph();
		const styles = {
			'--node-radius': '' + 100 * graph.nodeRoundness + '%',
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