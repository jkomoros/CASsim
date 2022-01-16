import { LitElement, html, css } from "lit-element";
import { SharedStyles } from './shared-styles.js';

import {
	help,
	ButtonSharedStyles
} from './button-shared-styles';

class MultiSelect extends LitElement {
	static get properties() {
		return {
			disabled: {type:Boolean},
			//key --> {title: '', description: ''}. If key is to a string, will be intepreted where the string is the description
			options: {type:Object},
			values: {type:Object},
			defaultText: {type:String},
		};
	}

	static get styles() {
		return [
			SharedStyles,
			ButtonSharedStyles,
			css`
				:host {
					display: inline-block;
				}

				details > label {
					display: block;
				}
			`
		];
	}

	_defaultOption(key, optionValue) {
		const title = optionValue && typeof optionValue == 'object' && optionValue.title ? optionValue.title : (typeof optionValue == 'string' ? optionValue : key);
		const description = optionValue && typeof optionValue == 'object' && optionValue.description ? optionValue.description : ''; 
		return {
			title,
			description
		};
	}

	render() {
		const defaultText = this.defaultText || 'None';
		//If there's a single option, then 'All' doesn't have any meaning so only render that one
		const options = Object.keys(this.options).length == 1 ? this.options : {'': {title: defaultText, description: 'All metrics'}, ...this.options};
		//Fill in display values
		const defaultedOptions = Object.fromEntries(Object.entries(options).map(entry => [entry[0], this._defaultOption(entry[0], entry[1])]));
		const values = this.values || {};
		const noOptionsSelected = Object.keys(values).length == 0;
		const summary = Object.keys(defaultedOptions).length == 1 ? Object.values(defaultedOptions)[0].title : (noOptionsSelected ? defaultText : Object.keys(values).map(key => defaultedOptions[key].title).join(', '));
		return html`<details>
			<summary><label class='subtle'>${summary}</label></summary>
			${Object.entries(defaultedOptions).map((entry, index, entries) => html`<label title=${entry[1].description}><input type='checkbox' .disabled=${this.disabled || (index == 0 && noOptionsSelected)} .checked=${index == 0 ? noOptionsSelected : (values[entry[0]] || entries.length == 1)} .value=${entry[0]} @change=${this._handleCheckboxChanged}></input>${index == 0 && entries.length > 1 ? html`<em>${entry[1].title}</em>` : entry[1].title}${entry[1].description ? help(entry[1].description) : ''}</label>`)}
		</details>
		`;

	}

	_handleCheckboxChanged(e) {
		const ele = e.composedPath()[0];
		let newValues = {...(this.values || {})};
		if (!ele.value) {
			//If they check OR actively uncheck all items, it will be all Items
			newValues = {};
		} else {
			if (ele.checked) {
				newValues[ele.value] = true;
			} else {
				delete newValues[ele.value];
			}
		}

		this.values = newValues;
		this.dispatchEvent(new CustomEvent('change', {composed: true, detail: {values:newValues}}));
	}


}

window.customElements.define("multi-select", MultiSelect);
