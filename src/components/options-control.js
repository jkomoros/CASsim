import { LitElement, html, css } from "lit-element";

import {
	COLOR_BEHAVIOR_NAME
} from "../options.js";

import {
	DELETE_SENTINEL
} from '../util.js';

import {
	help,
	HelpStyles
} from './help-badges.js';

class OptionsControl extends LitElement {
	static get properties() {
		return {
			path: {type:String},
			name: {type:String},
			config: {type: Object},
			value: {type: Object},
		};
	}

	static get styles() {
		return [
			css`
				.container {
					display: flex;
					flex-direction: column;
					line-height: 1.0em;
					padding-left: 0.3em;
					border-left: 1px solid var(--disabled-color);
				}

				.container.top {
					padding-left: 0;
					border-left-width: 0;
				}

				details {
					display: flex;
					flex-direction: column;
				}

				label, em {
					font-size: 0.8em;
					color: var(--dark-gray-color);
				}

				options-control {
					margin-left: 0.3em;
				}
			`
		];
	}

	render() {
		return html`
		${HelpStyles}
		<div class='container ${(this.path || '').split('.').length < 2 ? 'top' : ''}'>
			${this._inner()}
		</div>`;
	}

	_dottedPath(nextPart) {
		const path = this.path || '';
		if (!path) return nextPart;
		return path + '.' + nextPart;
	}

	_inner() {
		const example = this.config.example;
		if (example == undefined) {
			const nonAdvancedEntries = Object.entries(this.config).filter(entry => !entry[1].advanced);
			const advancedEntries = Object.entries(this.config).filter(entry => entry[1].advanced);
			return html`
			${nonAdvancedEntries.map(entry => html`<options-control .value=${this.value[entry[0]]} .config=${entry[1]} .name=${entry[0]} .path=${this._dottedPath(entry[0])}></options-control>`)}
			${advancedEntries.length ? html`<details>
				<summary><label>Advanced</label></summary>
				${advancedEntries.map(entry => html`<options-control .value=${this.value[entry[0]]} .config=${entry[1]} .name=${entry[0]} .path=${this._dottedPath(entry[0])}></options-control>`)}
			</details>` : ''}`;
		}
		return html`
			<label>${this.name} ${help(this.config.description)} ${this.config.nullable ? html`<button @click=${this._handleNullableClicked}>X</button>` : ''}</label>
			${this._innerControl()}
		`;
	}

	_innerControl() {
		const example = this.config.example;
		if (typeof example == 'object') {
			if (Array.isArray(example)) {
				return html`${this.value.map((item, index) => html`<options-control .value=${item} .config=${example[0]} .name=${index} .path=${this._dottedPath(index)}></options-control>`)}`;
			}
			if (this.value == null) {
				return html`<em>null</em>`;
			}
			const nonAdvancedEntries = Object.entries(this.value).filter(entry => !example[entry[0]].advanced);
			const advancedEntries = Object.entries(this.value).filter(entry => example[entry[0]].advanced);
			return html`
				${nonAdvancedEntries.map(entry => html`<options-control .value=${entry[1]} .config=${example[entry[0]]} .name=${entry[0]} .path=${this._dottedPath(entry[0])}></options-control>`)}
				${advancedEntries.length ? html`<details>
					<summary><label>Advanced</label></summary>
					${advancedEntries.map(entry => html`<options-control .value=${entry[1]} .config=${example[entry[0]]} .name=${entry[0]} .path=${this._dottedPath(entry[0])}></options-control>`)}
				</details>` : ''}`;
		}
		if (this.config.options) {
			return html`<select @change=${this._handleInputChanged} .value=${this.value}>${this.config.options.map(opt => html`<option .value=${opt.value} .selected=${opt.value == this.value} .title=${opt.description || opt.display || opt.value}>${opt.display || opt.value}</option>`)}</select>`;
		}
		let type = 'text';
		if (typeof example == 'number') type = 'number';
		if (typeof example == 'boolean') type = 'checkbox';
		if (this.config.behavior == COLOR_BEHAVIOR_NAME) type = 'color';

		return html`<input @change=${this._handleInputChanged} .type=${type} .min=${this.config.min || 0.0} .max=${this.config.max || Number.MAX_SAFE_INTEGER} .step=${this.config.step || 1.0} .value=${this.value} .checked=${this.value}></input>`;
	}

	_handleNullableClicked() {
		this.dispatchEvent(new CustomEvent('option-changed', {composed: true, detail: {path: this.path, value:DELETE_SENTINEL}}));
	}

	_handleInputChanged(e) {
		const ele = e.composedPath()[0];
		let value = ele.type == 'checkbox' ? ele.checked : ele.value;
		if (typeof this.config.example == 'number') value = parseFloat(value);
		this.dispatchEvent(new CustomEvent('option-changed', {composed: true, detail: {path: this.path, value:value}}));
	}

}

window.customElements.define("options-control", OptionsControl);
