import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
	COLOR_BEHAVIOR_NAME,
	isRoot,
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
	DialogTypeAddFieldExtras,
	OptionsConfig,
	OptionsConfigMap,
	OptionsPath,
	OptionValue,
	OptionValueMap
} from '../types.js';

import {
	makeOpenDialogAddFieldEvent,
	makeOptionChangedEvent,
	makePathToggledEvent,
	makeUndoClickedEvent
} from '../events.js';

const doHide = (subConfig : OptionsConfig, parentValue : OptionValueMap, rootValue : OptionValueMap) => subConfig.hide ? subConfig.hide(parentValue, rootValue) : false;

@customElement('options-control')
class OptionsControl extends LitElement {

	@property({ type : String })
	path: OptionsPath;

	@property({ type : String })
	name: string;

	@property({ type : Object })
	config: OptionsConfig;

	@property({ type : Object })
	value: OptionValue;

	@property({ type : Object })
	rootValue: OptionValueMap;

	@property({ type : Boolean })
	readonly: boolean;

	@property({ type : Object })
	modifiedPaths: {[path : OptionsPath] : OptionValue};

	@property({ type : Boolean })
	disallowDelete: boolean;

	@property({ type : Object })
	pathExpanded: {[path : OptionsPath]: true};

	static override get styles() {
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

	override render() : TemplateResult {
		return html`
		<div class='container ${this._modified ? 'modified' : ''}'>
			${this._inner()}
		</div>`;
	}

	get _modified() : boolean {
		return this.modifiedPaths ? this.modifiedPaths[this.path] != undefined : false;
	}

	get _deletedSubPaths() {
		if (!this.modifiedPaths) return {};
		const result : {[path : OptionsPath] : true} = {};
		const pathPrefix = this.path ? this.path + '.' : '';
		for (const [key, value] of Object.entries(this.modifiedPaths)) {
			if (!key.startsWith(pathPrefix)) continue;
			if (value != DELETE_SENTINEL) continue;
			const subKey = key.slice(pathPrefix.length);
			result[subKey] = true;
		}
		return result;
	}

	_dottedPath(nextPart : string | number) : string {
		const path = this.path || '';
		if (!path) return String(nextPart);
		return path + '.' + nextPart;
	}

	_inner() : TemplateResult {
		const config = this.config || {};
		return html`
			${this.name !== undefined ? html`<span class='label ${this.value === undefined ? 'deleted' : ''}'>${this.name} ${config.description ? html`${help(config.description, this.readonly)}` : ''} 
				${config.optional && this.value !== undefined ? html`<button class='small' @click=${this._handleNullableClicked} .disabled=${this.readonly || this.disallowDelete} title='Remove'>${CANCEL_ICON}</button>` : ''}
				${config.example && Array.isArray(config.example) && this.value !== undefined ? html`<button class='small' .disabled=${this.readonly || config.max === (this.value as [] || []).length} @click=${this._handleAddArrayItem} title='Add additional item'>${PLUS_ICON}</button>` : ''}
				${this._nulledEntries().length && this.value !== undefined ? html`<button class='small' .disabled=${this.readonly} @click=${this._handleAddNulledClicked} title='Add field...'>${PLUS_ICON}</button>` : ''}
				${this._modified ? html`<button class='small' .disabled=${this.readonly} @click=${this._handleUndoClicked} title='Undo modification...'>${UNDO_ICON}</button>` : ''}
			</span>`: ''}
			${this._innerControl()}
		`;
	}

	_nulledEntries(includeHidden = false) : [string, OptionsConfig][] {
		const config = this.config || {};
		const nonNullValue = this.value as OptionValueMap || {};
		if (!config.example) return [];
		if (Array.isArray(config.example)) return [];
		return Object.entries(config.example).filter(entry => entry[1].optional && nonNullValue[entry[0]] == undefined && (includeHidden ? true : !doHide(entry[1], nonNullValue, this.rootValue)));
	}

	get _rootValue() : OptionValue {
		const config = this.config || {};
		if (config.example === undefined) return this.rootValue;
		return isRoot(config) ? this.value : this.rootValue;
	}

	_innerControl() : TemplateResult {
		const config : OptionsConfig = this.config || {};
		const example = config.example;
		if (typeof example == 'object') {
			if (Array.isArray(example)) {
				const val = this.value as [] || [];
				//If we're at min size already, disallow deleting for sub-items.
				return html`${val.map((item, index) => html`<options-control .readonly=${this.readonly} .rootValue=${this._rootValue} .disallowDelete=${config.min === val.length} .value=${item} .config=${example[0]} .name=${String(index)} .path=${this._dottedPath(index)} .pathExpanded=${this.pathExpanded} .modifiedPaths=${this.modifiedPaths}></options-control>`)}`;
			}
			const deletedSubPaths = this._deletedSubPaths;
			const exampleMap = example;
			//value might be null
			const nonNullValue = this.value as OptionValueMap || {};
			//We iterate through in the order the EXAMPLE defines them so they show up in order.
			const nonAdvancedEntries = Object.entries(example).filter(entry => nonNullValue[entry[0]] != undefined || deletedSubPaths[entry[0]]).filter(entry => !doHide(entry[1], nonNullValue, this.rootValue)).filter(entry => !entry[1].advanced).map((entry) : [string, OptionValue] => [entry[0], nonNullValue[entry[0]]]);
			const advancedEntries = Object.entries(example).filter(entry => nonNullValue[entry[0]] != undefined || deletedSubPaths[entry[0]]).filter(entry => !doHide(entry[1], nonNullValue, this.rootValue)).filter(entry => entry[1].advanced).map((entry) : [string, OptionValue] => [entry[0], nonNullValue[entry[0]]]);
			return html`
				${nonAdvancedEntries.map(entry => html`<options-control .rootValue=${this._rootValue} .readonly=${this.readonly} .value=${entry[1]} .config=${exampleMap[entry[0]]} .name=${entry[0]} .path=${this._dottedPath(entry[0])} .pathExpanded=${this.pathExpanded} .modifiedPaths=${this.modifiedPaths}></options-control>`)}
				${advancedEntries.length ? html`<details .open=${this.pathExpanded[this.path || '']} @toggle=${this._handleDetailsToggle}>
					<summary><label>Advanced</label></summary>
					${advancedEntries.map(entry => html`<options-control .rootValue=${this._rootValue} .readonly=${this.readonly} .value=${entry[1]} .config=${exampleMap[entry[0]]} .name=${entry[0]} .path=${this._dottedPath(entry[0])} .pathExpanded=${this.pathExpanded} .modifiedPaths=${this.modifiedPaths}></options-control>`)}
				</details>` : ''}`;
		}
		//We might have this.value === undefined if we were deleted
		if (this.value === undefined) return html``;
		if (config.options) {
			return html`<select @change=${this._handleInputChanged} .disabled=${this.readonly} .value=${String(this.value)}>${config.options.map(opt => html`<option .value=${String(opt.value)} .selected=${opt.value == this.value} .title=${opt.description || opt.display || String(opt.value)}>${opt.display || opt.value}</option>`)}</select>`;
		}
		let type = 'text';
		if (typeof example == 'number') type = 'number';
		if (typeof example == 'boolean') type = 'checkbox';
		if (config.behavior == COLOR_BEHAVIOR_NAME) type = 'color';

		return html`<input .disabled=${this.readonly} @change=${this._handleInputChanged} .type=${type} .min=${String(config.min || 0.0)} .max=${String(config.max || Number.MAX_SAFE_INTEGER)} .step=${String(config.step || 1.0)} .value=${String(this.value)} .checked=${typeof this.value == 'boolean' && this.value}></input>`;
	}

	_handleUndoClicked() {
		this.dispatchEvent(makeUndoClickedEvent(this.path));
	}

	_handleNullableClicked() {
		const value = this.value && typeof this.value == 'object' && Object.keys(this.value).length == 0 && this.config.optional ? null : DELETE_SENTINEL;
		this.dispatchEvent(makeOptionChangedEvent(this.path, value));
	}

	_handleInputChanged(e : Event) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLInputElement) && !(ele instanceof HTMLSelectElement)) throw new Error('not input or select ele');
		let value : (number | string | boolean) = (ele instanceof HTMLInputElement && ele.type == 'checkbox') ? ele.checked : ele.value;
		if (typeof this.config.example == 'number' && typeof value == 'string') value = parseFloat(value);
		this.dispatchEvent(makeOptionChangedEvent(this.path, value));
	}

	_handleAddArrayItem() {
		const subPath = this.path + '.' + (this.value as []).length;
		const value = DEFAULT_SENTINEL;
		this.dispatchEvent(makeOptionChangedEvent(subPath, value));
	}

	_handleDetailsToggle(e : Event) {
		const ele = e.composedPath()[0];
		if (!(ele instanceof HTMLDetailsElement)) throw new Error('not details element');
		this.dispatchEvent(makePathToggledEvent(this.path || '', ele.open));
	}

	_handleAddNulledClicked() {
		const example = this.config.example as OptionsConfigMap;
		const nulledEntries = this._nulledEntries(true);

		const extras : DialogTypeAddFieldExtras = {
			options: nulledEntries.map(entry => ({
				path: this.path ? this.path + '.' + entry[0] : entry[0],
				value: entry[0],
				description: example[entry[0]].description || '',
				disabled: doHide(example[entry[0]], this.value as OptionValueMap || {}, this.rootValue),
			}))
		};

		this.dispatchEvent(makeOpenDialogAddFieldEvent(extras));
	}

}

declare global {
	interface HTMLElementTagNameMap {
		'options-control': OptionsControl;
	}
}
