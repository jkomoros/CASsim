import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { InteractionDefinition } from '../types.js';

import {
	InteractionSelectedEvent,
	UndoInteractionEvent,
	RedoInteractionEvent
} from '../events.js';

import { ButtonSharedStyles } from './button-shared-styles.js';

import { UNDO_ICON, REDO_ICON } from './my-icons.js';

@customElement('interaction-panel')
export class InteractionPanel extends LitElement {

	@property({ type: Array })
		interactions: InteractionDefinition[] = [];

	@property({ type: String })
		selectedAgentID: string | null = null;

	@property({ type: Boolean })
		canUndo = false;

	@property({ type: Boolean })
		canRedo = false;

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
					align-items: center;
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

				button:hover:not(:disabled) {
					background: var(--light-gray-color, #eee);
				}

				button:disabled {
					opacity: 0.4;
					cursor: default;
				}

				button.icon-btn {
					display: flex;
					align-items: center;
					padding: 0.3em;
				}

				button.icon-btn svg {
					width: 18px;
					height: 18px;
				}

				.separator {
					width: 1px;
					height: 1.2em;
					background: var(--dark-gray-color, #ccc);
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
		const showSeparator = this.selectedAgentID && this.interactions.length > 0 && (this.canUndo || this.canRedo);
		return html`
			${this.selectedAgentID ? this.interactions.map(interaction => html`
				<button
					@click=${() => this._handleClick(interaction.type)}
					title=${interaction.description || interaction.label}
				>
					${interaction.label}${interaction.shortcut ? html`<span class='shortcut'>(${interaction.shortcut})</span>` : ''}
				</button>
			`) : ''}
			${showSeparator ? html`<div class='separator'></div>` : ''}
			${this.canUndo || this.canRedo ? html`
				<button class='icon-btn' @click=${this._handleUndo} ?disabled=${!this.canUndo} title='Undo (Ctrl+Z)'>${UNDO_ICON}</button>
				<button class='icon-btn' @click=${this._handleRedo} ?disabled=${!this.canRedo} title='Redo (Ctrl+Shift+Z)'>${REDO_ICON}</button>
			` : ''}
		`;
	}

	_handleClick(type: string) {
		this.dispatchEvent(new InteractionSelectedEvent(type));
	}

	_handleUndo() {
		this.dispatchEvent(new UndoInteractionEvent());
	}

	_handleRedo() {
		this.dispatchEvent(new RedoInteractionEvent());
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'interaction-panel': InteractionPanel;
	}
}
