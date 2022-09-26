
import { LitElement, html, css, svg, TemplateResult, SVGTemplateResult} from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { repeat } from 'lit/directives/repeat.js';

import { StyleInfo, styleMap } from 'lit/directives/style-map.js';

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
	Angle,
	CSSColor,
	Emoji,
	GraphData,
	GraphEdge,
	GraphNodeID,
	GraphNodeValues,
	Position,
	SimulationFrame
} from './types.js';

import {
	Agent,
	AgentSimulationFrame
} from './agent-simulator.js';

import {
	PositionedGraph
} from './graph/positioned.js';

import {
	ANGLE_MIN,
	normalizeAngle
} from './util.js';

import {
	EMOJI_TO_INFO_MAP
} from './emojis.js';

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
	innerRender() : TemplateResult {
		return html`<pre>${JSON.stringify(this.frame, null, 2)}</pre>`;
	}

}

@customElement('positioned-graph-renderer')
export class PositionedGraphRenderer<A extends Agent, F extends AgentSimulationFrame<A>, G extends PositionedGraph> extends BaseRenderer {
	
	@property({ type : Object })
	override frame : F;

	static override get styles() {
		return [
			...BaseRenderer.styles,
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
	graphData(frame : F) : GraphData {
		return frame.positions;
	}

	_graph() : G {
		const data = this.graphData(this.frame);
		if (!data) return null;
		//Techncially it might be a positioned graph
		return inflateGraph(data) as G;
	}

	//This is an override point for your renderer, to tell the renderer where the information on each agent is.
	agentData(frame : F) : A[] {
		return frame.agents;
	}

	agentEmoji(agent : A) : Emoji {
		return agent.emoji || '🧑‍⚕️';
	}

	agentNodeID(agent : A) : GraphNodeID {
		return agent.node;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	agentOpacity(_agent : A, _graph : G) : number {
		return 1.0;
	}

	emojiRotation(emoji : Emoji) : Angle {
		//Emojis that are flipped are already 
		if (this.emojiFlipped(emoji)) return ANGLE_MIN;
		const info = EMOJI_TO_INFO_MAP[emoji];
		return info ? info.direction : ANGLE_MIN;
	}

	/**
	 *
	 * Whether the emoji shoul be flipped horizontally. Many emojis in the apple
	 * set are facing left, which is the exact backward of our default orientation. 
	 *
	 * */
	emojiFlipped(emoji : Emoji) : boolean {
		//Emojis that are turned facing left (the majority of the ones with a direction)
		//Should be flipped.
		const info = EMOJI_TO_INFO_MAP[emoji];
		if (!info) return false;
		return info.direction == Math.PI;
	}

	/**
	 * Whether the emoji is oriented horizontally. If they are, then when
	 * they're rotated between 90 and 270 degrees they'll be flipped vertically.
	 */
	emojiHorizontal(emoji : Emoji) : boolean {
		const info = EMOJI_TO_INFO_MAP[emoji];
		if (!info) return false;
		return info.direction == Math.PI || info.direction == 0.0;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	agentRotation(agent : A, _graph : G) : Angle {
		const baseAngle = agent.angle === undefined ? ANGLE_MIN : agent.angle;
		const emoji = this.agentEmoji(agent);
		const emojiAngle = this.emojiRotation(emoji);
		return baseAngle + emojiAngle;
	}

	agentX(agent : A) : number {
		if (agent.x !== undefined) return agent.x;
		const rnd = makeSeededRandom(agent.id);
		return this.width * rnd();
	}

	agentY(agent : A) : number {
		if (agent.y !== undefined) return agent.y;
		const rnd = makeSeededRandom(agent.id);
		return this.height * rnd();
	}

	agentHeight(agent : A) : number {
		return agent.height === undefined ? this.agentSize(agent) : agent.height;
	}

	agentWidth(agent : A) : number {
		return agent.width === undefined ? this.agentSize(agent) : agent.width;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	agentSizeMultiplier(_agent : A) : number {
		return 1.0;
	}

	agentDefaultMinNodeSize() : number {
		return 10;
	}

	agentDefaultMaxNodeSize() : number {
		return 10;
	}

	agentSize(agent : A) : number {
		return (this.agentDefaultMaxNodeSize() - this.agentDefaultMinNodeSize()) * this.agentSizeMultiplier(agent) + this.agentDefaultMinNodeSize();
	}

	agentPosition(agent : A, graph : G) : Position {
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	nodeAdditionalStyles(_node : GraphNodeValues, _graph : G) : StyleInfo {
		return {};
	}

	renderNode(node : GraphNodeValues, graph : G) : TemplateResult {
		let styles = this._positionStylesForNode(node, graph);
		styles = {...styles, ['background-color']: this.nodeColor(node, graph)};
		styles = {...styles, ...this.nodeAdditionalStyles(node, graph)};
		const spanStyles = {
			'opacity': String(this.nodeTextOpacity(node, graph))
		};
		return html`<div class='node ${node.type ? node.type : ''}' style=${styleMap(styles)}><span style='${styleMap(spanStyles)}'>${this.nodeText(node,graph)}</span></div>`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	nodeText(node : GraphNodeValues, _graph : G) : string {
		return node['emoji'] as string || '';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	nodeTextOpacity(_node : GraphNodeValues, _graph : G) : number {
		return 1.0;
	}
 
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	nodeColorGradientPercentage(node : GraphNodeValues, _graph : G) : number {
		return node['value'] as number || 0;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	renderEdges(_frame : F) : boolean {
		return false;
	}

	nodeColor(node : GraphNodeValues, graph : G) : CSSColor {
		const style = getComputedStyle(this);
		const primaryColor = style.getPropertyValue('--primary-color');
		const secondaryColor = style.getPropertyValue('--secondary-color');
		const color =  gradient(primaryColor, secondaryColor, this.nodeColorGradientPercentage(node, graph));
		return color;
	}

	renderAgent(agent : A, graph : G) : TemplateResult {
		let styles = this._positionStyles(this.agentPosition(agent, graph));
		const rotation = normalizeAngle(this.agentRotation(agent, graph));
		let transform = 'rotate(' + String(rotation) + 'rad)';
		const emoji = this.agentEmoji(agent);
		transform += this.emojiFlipped(emoji) ? ' scaleX(-1) ' : '';
		transform += (this.emojiHorizontal(emoji) && rotation > Math.PI / 2 && rotation < (Math.PI * 3 / 2)) ? ' scaleY(-1)' : '';
		styles = {
			...styles,
			'opacity': String(this.agentOpacity(agent, graph)),
			'transform': transform
		};
		const agentType = agent['type'] || '';
		return html`<div class='agent ${agentType}' style=${styleMap(styles)}>${this.agentEmoji(agent)}</div>`;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	edgeColor(_edge : GraphEdge, _graph : G) : CSSColor {
		return 'var(--secondary-color)';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	edgeWidth(_edge : GraphEdge, _graph : G) : string {
		return '1';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	edgeOpacity(_edge : GraphEdge, _graph : G ) : string {
		return '1.0';
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	edgeDasharray(_edge : GraphEdge, _graph : G) : string {
		//Note: you might not be able to see the dasharray if edges overlap.
		return '';
	}

	//must return svg. Note coordinates are viewBoxed so don't need any scaling.
	renderEdge(edge : GraphEdge, graph : G) : SVGTemplateResult {
		if (!graph) return svg``;
		const fromNodePosition = graph.nodePosition(edge.from);
		const toNodePosition = graph.nodePosition(edge.to);
		return svg`<path id=${edge.id} class='edge' d='M ${fromNodePosition.x}, ${fromNodePosition.y} L ${toNodePosition.x}, ${toNodePosition.y}' stroke='${this.edgeColor(edge, graph)}' stroke-width='${this.edgeWidth(edge, graph)}' stroke-opacity='${this.edgeOpacity(edge, graph)}' stroke-dasharray='${this.edgeDasharray(edge, graph)}'></path>`;
	}

	//position should be an opbject with x,y,width,height;
	_positionStyles(position : Position) : StyleInfo {
		const size = Math.min(position.width, position.height);
		return {
			left: '' + (position.x - (position.width / 2)) * this.scale + 'px',
			top: '' + (position.y - (position.height / 2)) * this.scale + 'px',
			width: '' + position.width * this.scale + 'px',
			height: '' + position.height * this.scale + 'px',
			'--node-size': '' + size * this.scale + 'px'
		};
	}

	_positionStylesForNode(node : GraphNodeValues, graph : G) : StyleInfo {
		return this._positionStyles(graph ? graph.nodePosition(node) : {x: 0, y: 0, width: 10, height: 10});
	}

	override innerRender() : TemplateResult {
		const graph = this._graph();
		const nodeRoundness = graph ? graph.nodeRoundness : 0.0;
		const height = this.frame.height;
		const width = this.frame.width;
		const styles = {
			'--node-radius': '' + 100 * nodeRoundness + '%',
			'height': '' + height * this.scale + 'px',
			'width': '' + width * this.scale + 'px',
		};
		return html`
			<div class='nodes' style=${styleMap(styles)}>
				${Object.values((graph ? graph.nodes() : {})).map(node => this.renderNode(node, graph))}
				${repeat(Object.values(this.agentData(this.frame)), agent => agent.id, agent => this.renderAgent(agent, graph))}
				${graph && this.renderEdges(this.frame) ?
		html`<svg viewBox='0 0 ${graph.width} ${graph.height}'>
					${repeat(Object.values(graph.allEdges()), edge => edge.id, edge => this.renderEdge(edge, graph))}
				</svg>` : ''}
			</div>
			`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'base-renderer': BaseRenderer;
		'positioned-graph-renderer': PositionedGraphRenderer<Agent, AgentSimulationFrame<Agent>, PositionedGraph>;
	}
}