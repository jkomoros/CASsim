import { LitElement, html, css } from "lit-element";

import {
	COLOR_BEHAVIOR_NAME,
} from "../options.js";

import {
	DELETE_SENTINEL
} from '../util.js';

import {
	help,
	ButtonSharedStyles
} from "./button-shared-styles.js";

import {
	SharedStyles
} from "./shared-styles.js";

import {
	CANCEL_ICON,
	PLUS_ICON
} from './my-icons.js';

import {
	DIALOG_TYPE_ADD_FIELD,
	DEFAULT_SENTINEL
} from '../actions/data.js';

class OptionsControl extends LitElement {
	static get properties() {
		return {
			path: {type:String},
			name: {type:String},
			config: {type: Object},
			value: {type: Object},
			readonly: {type: Boolean},
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

				details {
					display: flex;
					flex-direction: column;
				}

				em {
					font-size: 0.8em;
					color: var(--dark-gray-color);
				}

				options-control {
					margin-left: 0.3em;
				}
			`,
			SharedStyles,
			ButtonSharedStyles,
		];
	}

	render() {
		return html`
		<div class='container'>
			${this._inner()}
		</div>`;
	}

	_dottedPath(nextPart) {
		const path = this.path || '';
		if (!path) return nextPart;
		return path + '.' + nextPart;
	}

	_inner() {
		const config = this.config || {};
		return html`
			${this.name !== undefined ? html`<span class='label'>${this.name} ${config.description ? html`${help(config.description, this.readonly)}` : ''} 
				${config.optional ? html`<button class='small' @click=${this._handleNullableClicked} .disabled=${this.readonly} title='Remove'>${CANCEL_ICON}</button>` : ''}
				${config.example && Array.isArray(config.example) ? html`<button class='small' .disabled=${this.readonly} @click=${this._handleAddArrayItem} title='Add additional item'>${PLUS_ICON}</button>` : ''}
				${this._nulledEntries().length ? html`<button class='small' .disabled=${this.readonly} @click=${this._handleAddNulledClicked} title='Add field...'>${PLUS_ICON}</button>` : ''}
			</span>`: ''}
			${this._innerControl()}
		`;
	}

	_nulledEntries() {
		const config = this.config || {};
		const nonNullValue = this.value || {};
		if (!config.example) return [];
		if (Array.isArray(config.example)) return [];
		return Object.entries(config.example).filter(entry => entry[1].optional && nonNullValue[entry[0]] == undefined);
	}

	_innerControl() {
		const config = this.config || {};
		const example = config.example;
		if (typeof example == 'object') {
			if (Array.isArray(example)) {
				return html`${this.value.map((item, index) => html`<options-control .readonly=${this.readonly} .value=${item} .config=${example[0]} .name=${index} .path=${this._dottedPath(index)}></options-control>`)}`;
			}
			//value might be null
			const nonNullValue = this.value || {};
			const nonAdvancedEntries = Object.entries(nonNullValue).filter(entry => !example[entry[0]].advanced);
			const advancedEntries = Object.entries(nonNullValue).filter(entry => example[entry[0]].advanced);
			return html`
				${this.value == null ? html`<em>null</em>` : ''}
				${nonAdvancedEntries.map(entry => html`<options-control .readonly=${this.readonly} .value=${entry[1]} .config=${example[entry[0]]} .name=${entry[0]} .path=${this._dottedPath(entry[0])}></options-control>`)}
				${advancedEntries.length ? html`<details>
					<summary><label>Advanced</label></summary>
					${advancedEntries.map(entry => html`<options-control .readonly=${this.readonly} .value=${entry[1]} .config=${example[entry[0]]} .name=${entry[0]} .path=${this._dottedPath(entry[0])}></options-control>`)}
				</details>` : ''}`;
		}
		if (config.options) {
			return html`<select @change=${this._handleInputChanged} .disabled=${this.readonly} .value=${this.value}>${config.options.map(opt => html`<option .value=${opt.value} .selected=${opt.value == this.value} .title=${opt.description || opt.display || opt.value}>${opt.display || opt.value}</option>`)}</select>`;
		}
		let type = 'text';
		if (typeof example == 'number') type = 'number';
		if (typeof example == 'boolean') type = 'checkbox';
		if (config.behavior == COLOR_BEHAVIOR_NAME) type = 'color';

		return html`<input .disabled=${this.readonly} @change=${this._handleInputChanged} .type=${type} .min=${config.min || 0.0} .max=${config.max || Number.MAX_SAFE_INTEGER} .step=${config.step || 1.0} .value=${this.value} .checked=${this.value}></input>`;
	}

	_handleNullableClicked() {
		const value = this.value && typeof this.value == 'object' && Object.keys(this.value).length == 0 && this.config.optional ? null : DELETE_SENTINEL;
		this.dispatchEvent(new CustomEvent('option-changed', {composed: true, detail: {path: this.path, value:value}}));
	}

	_handleInputChanged(e) {
		const ele = e.composedPath()[0];
		let value = ele.type == 'checkbox' ? ele.checked : ele.value;
		if (typeof this.config.example == 'number') value = parseFloat(value);
		this.dispatchEvent(new CustomEvent('option-changed', {composed: true, detail: {path: this.path, value:value}}));
	}

	_handleAddArrayItem() {
		const subPath = this.path + '.' + this.value.length;
		let value = DEFAULT_SENTINEL;
		this.dispatchEvent(new CustomEvent('option-changed', {composed: true, detail: {path: subPath, value: value}}));
	}

	_handleAddNulledClicked() {
		const example = this.config.example;
		const nulledEntries = this._nulledEntries();

		const extras = {
			options: nulledEntries.map(entry => ({
				path: this.path ? this.path + '.' + entry[0] : entry[0],
				value: entry[0],
				description: example[entry[0]].description || '',
			}))
		};

		this.dispatchEvent(new CustomEvent('open-dialog', {composed: true, detail: {type: DIALOG_TYPE_ADD_FIELD, extras}}));
	}

}

window.customElements.define("options-control", OptionsControl);
