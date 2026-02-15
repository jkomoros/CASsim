import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { InteractionDefinition } from '../types.js';

import { ButtonSharedStyles } from './button-shared-styles.js';

type InteractionSelectedEventDetail = {
	type: string;
};

class InteractionSelectedEvent extends CustomEvent<InteractionSelectedEventDetail> {
	constructor(type: string) {
		super('interaction-selected', { composed: true, bubbles: true, detail: { type } });
	}
}

@customElement('interaction-panel')
export class InteractionPanel extends LitElement {

	@property({ type: Array })
		interactions: InteractionDefinition[] = [];

	@property({ type: String })
		selectedAgentID: string | null = null;

	static override get styles() {
		return [
			ButtonSharedStyles,
			css`
				:host {
					position: absolute;
					bottom: 1em;
					left: 50%;
					transform: translateX(-50%);
					display: flex;
					gap: 0.5em;
					background: rgba(255, 255, 255, 0.9);
					padding: 0.5em 1em;
					border-radius: 8px;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
					z-index: 10;
				}

				button {
					padding: 0.4em 0.8em;
					border: 1px solid var(--dark-gray-color, #999);
					border-radius: 4px;
					background: white;
					cursor: pointer;
					font-size: 0.9em;
				}

				button:hover {
					background: var(--light-gray-color, #eee);
				}

				.shortcut {
					color: var(--dark-gray-color, #666);
					font-size: 0.8em;
					margin-left: 0.3em;
				}
			`
		];
	}

	override render(): TemplateResult {
		return html`
			${this.interactions.map(interaction => html`
				<button
					@click=${() => this._handleClick(interaction.type)}
					title=${interaction.description || interaction.label}
				>
					${interaction.label}${interaction.shortcut ? html`<span class='shortcut'>(${interaction.shortcut})</span>` : ''}
				</button>
			`)}
		`;
	}

	_handleClick(type: string) {
		this.dispatchEvent(new InteractionSelectedEvent(type));
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'interaction-panel': InteractionPanel;
	}
	interface HTMLElementEventMap {
		'interaction-selected': InteractionSelectedEvent;
	}
}
