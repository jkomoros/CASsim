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

import {
	CANCEL_ICON
} from './my-icons.js';

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

				/* TODO: remove the following items into a button shared styles */

				button {
					font-size: inherit;
					vertical-align: middle;
					color: var(--app-light-text-color);
					background: var(--app-dark-text-color);
					padding: 0.5em;
					box-shadow: 0 2px 2px var(--shadow-color);
					border: none;
					cursor: pointer;
					margin: 0.5em;
					position: relative;
					overflow: hidden;
					transition: background-color var(--transition-fade), color var(--transition-fade), box-shadow var(--transition-fade);
				}

				button.small {
					background:transparent;
					padding: 0;
					margin:0;
					box-shadow: none;
				}
			
				button.small svg {
					fill: var(--disabled-color);
					height:1.0em;
					width:1.0em;
				}
			
				button.small:hover svg {
					fill: var(--dark-gray-color);
					box-shadow:none;
					padding:0;
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
		return html`
			${this.path ? html`<label>${this.name} ${help(this.config.description)} ${this.config.nullable ? html`<button class='small' @click=${this._handleNullableClicked} title='Remove'>${CANCEL_ICON}</button>` : ''}</label>`: ''}
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
			const nulledEntries = Object.entries(example).filter(entry => entry[1].nullable && this.value[entry[0]] == undefined);
			return html`
				${nonAdvancedEntries.map(entry => html`<options-control .value=${entry[1]} .config=${example[entry[0]]} .name=${entry[0]} .path=${this._dottedPath(entry[0])}></options-control>`)}
				${nulledEntries.length ? html`<select @input=${this._handleAddNulled}>
					<option .selected=${true}><em>Add a missing field...</em></option>
					${nulledEntries.map(entry => html`<option .value=${entry[0]}>${entry[0]}</option>`)}
				</select>` : ''}
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

	_handleAddNulled(e) {
		const ele = e.composedPath()[0];
		const subPath = this.path ? this.path + '.' + ele.value : ele.value;
		const subExample = this.config.example[ele.value].example;
		let value = subExample;
		//TODO: handle objects and arrays better
		this.dispatchEvent(new CustomEvent('option-changed', {composed: true, detail: {path: subPath, value: value}}));
		//Flip it back to unselected
		ele.selectedIndex = 0;
	}

}

window.customElements.define("options-control", OptionsControl);
