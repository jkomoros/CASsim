import { LitElement, html, css } from "lit-element";

import {
	COLOR_BEHAVIOR_NAME,
} from "../options.js";

import {
	DELETE_SENTINEL,
	DEFAULT_SENTINEL
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
	PLUS_ICON,
	UNDO_ICON
} from './my-icons.js';

import {
	DIALOG_TYPE_ADD_FIELD
} from '../actions/data.js';

class OptionsControl extends LitElement {
	static get properties() {
		return {
			path: {type:String},
			name: {type:String},
			config: {type: Object},
			value: {type: Object},
			readonly: {type: Boolean},
			modifiedPaths: {type:Object},
			disallowDelete: {type:Boolean},
			pathExpanded: {type:Object},
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

				.container.modified {
					font-style: italic;
					background-color: var(--app-background-color);
				}

				.deleted {
					text-decoration: line-through;
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
		<div class='container ${this._modified ? 'modified' : ''}'>
			${this._inner()}
		</div>`;
	}

	get _modified() {
		return this.modifiedPaths ? this.modifiedPaths[this.path] != undefined : false;
	}

	get _deletedSubPaths() {
		if (!this.modifiedPaths) return {};
		const result = {};
		const pathPrefix = this.path + '.';
		for (const [key, value] of Object.entries(this.modifiedPaths)) {
			if (!key.startsWith(pathPrefix)) continue;
			if (value != DELETE_SENTINEL) continue;
			const subKey = key.slice(pathPrefix.length);
			result[subKey] = true;
		}
		return result;
	}

	_dottedPath(nextPart) {
		const path = this.path || '';
		if (!path) return nextPart;
		return path + '.' + nextPart;
	}

	_inner() {
		const config = this.config || {};
		return html`
			${this.name !== undefined ? html`<span class='label ${this.value === undefined ? 'deleted' : ''}'>${this.name} ${config.description ? html`${help(config.description, this.readonly)}` : ''} 
				${config.optional ? html`<button class='small' @click=${this._handleNullableClicked} .disabled=${this.readonly || this.disallowDelete} title='Remove'>${CANCEL_ICON}</button>` : ''}
				${config.example && Array.isArray(config.example) ? html`<button class='small' .disabled=${this.readonly || config.max === (this.value || []).length} @click=${this._handleAddArrayItem} title='Add additional item'>${PLUS_ICON}</button>` : ''}
				${this._nulledEntries().length ? html`<button class='small' .disabled=${this.readonly} @click=${this._handleAddNulledClicked} title='Add field...'>${PLUS_ICON}</button>` : ''}
				${this._modified ? html`<button class='small' .disabled=${this.readonly} @click=${this._handleUndoClicked} title='Undo modification...'>${UNDO_ICON}</button>` : ''}
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
				const val = this.value || [];
				//If we're at min size already, disallow deleting for sub-items.
				return html`${val.map((item, index) => html`<options-control .readonly=${this.readonly} .disallowDelete=${config.min === val.length} .value=${item} .config=${example[0]} .name=${index} .path=${this._dottedPath(index)} .pathExpanded=${this.pathExpanded} .modifiedPaths=${this.modifiedPaths}></options-control>`)}`;
			}
			const deletedSubPaths = this._deletedSubPaths;
			//value might be null
			const nonNullValue = this.value || {};
			//We iterate through in the order the EXAMPLE defines them so they show up in order.
			const nonAdvancedEntries = Object.entries(example).filter(entry => nonNullValue[entry[0]] != undefined || deletedSubPaths[entry[0]]).filter(entry => !entry[1].advanced).map(entry => [entry[0], nonNullValue[entry[0]]]);
			const advancedEntries = Object.entries(example).filter(entry => nonNullValue[entry[0]] != undefined || deletedSubPaths[entry[0]]).filter(entry => entry[1].advanced).map(entry => [entry[0], nonNullValue[entry[0]]]);
			return html`
				${nonAdvancedEntries.map(entry => html`<options-control .readonly=${this.readonly} .value=${entry[1]} .config=${example[entry[0]]} .name=${entry[0]} .path=${this._dottedPath(entry[0])} .pathExpanded=${this.pathExpanded} .modifiedPaths=${this.modifiedPaths}></options-control>`)}
				${advancedEntries.length ? html`<details .open=${this.pathExpanded[this.path || '']} @toggle=${this._handleDetailsToggle}>
					<summary><label>Advanced</label></summary>
					${advancedEntries.map(entry => html`<options-control .readonly=${this.readonly} .value=${entry[1]} .config=${example[entry[0]]} .name=${entry[0]} .path=${this._dottedPath(entry[0])} .pathExpanded=${this.pathExpanded} .modifiedPaths=${this.modifiedPaths}></options-control>`)}
				</details>` : ''}`;
		}
		//We might have this.value === undefined if we were deleted
		if (this.value === undefined) return html``;
		if (config.options) {
			return html`<select @change=${this._handleInputChanged} .disabled=${this.readonly} .value=${this.value}>${config.options.map(opt => html`<option .value=${opt.value} .selected=${opt.value == this.value} .title=${opt.description || opt.display || opt.value}>${opt.display || opt.value}</option>`)}</select>`;
		}
		let type = 'text';
		if (typeof example == 'number') type = 'number';
		if (typeof example == 'boolean') type = 'checkbox';
		if (config.behavior == COLOR_BEHAVIOR_NAME) type = 'color';

		return html`<input .disabled=${this.readonly} @change=${this._handleInputChanged} .type=${type} .min=${config.min || 0.0} .max=${config.max || Number.MAX_SAFE_INTEGER} .step=${config.step || 1.0} .value=${this.value} .checked=${this.value}></input>`;
	}

	_handleUndoClicked() {
		this.dispatchEvent(new CustomEvent('undo-clicked', {composed: true, detail: {path:this.path}}));
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

	_handleDetailsToggle(e) {
		const ele = e.composedPath()[0];
		this.dispatchEvent(new CustomEvent('path-toggled', {composed: true, detail: {path: this.path || '', open:ele.open}}));
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
