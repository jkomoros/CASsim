import { LitElement, html, css } from "lit-element";

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
				}

				options-control {
					margin-left: 0.5em;
				}
			`
		];
	}

	render() {
		return html`
		${HelpStyles}
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
		const example = this.config.example;
		if (this.config.example == undefined) {
			return html`${Object.entries(this.config).map(entry => html`<options-control .value=${this.value[entry[0]]} .config=${entry[1]} .name=${entry[0]} .path=${this._dottedPath(entry[0])}></options-control>`)}`;
		}
		return html`
			<label>${this.name} ${help(this.config.description)}</label>
			${typeof example == 'object' ?
		(Array.isArray(example) ?
			html`${this.value.map((item, index) => html`<options-control .value=${item} .config=${example[0]} .name=${index} .path=${this._dottedPath(index)}></options-control>`)}` :
			(this.value == null ? html`<em>null</em>` :
				html`${Object.entries(this.value).map(entry => html`<options-control .value=${entry[1]} .config=${example[entry[0]]} .name=${entry[0]} .path=${this._dottedPath(entry[0])}></options-control>`)}`)) :
		html`<input @change=${this._handleInputChanged} .type=${typeof example == 'number' ? 'number' : (typeof example =='string' ? 'text' : 'checkbox')} .min=${this.config.min || 0.0} .max=${this.config.max || Number.MAX_SAFE_INTEGER} .step=${this.config.step || 1.0} .value=${this.value} .checked=${this.value}></input>`}
		`;
	}

	_handleInputChanged(e) {
		const ele = e.composedPath()[0];
		const value = ele.type == 'checkbox' ? ele.checked : ele.value;
		this.dispatchEvent(new CustomEvent('option-changed', {composed: true, detail: {path: this.path, value:value}}));
	}

}

window.customElements.define("options-control", OptionsControl);
