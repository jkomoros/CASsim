import { LitElement, html, css } from "lit-element";
import { SharedStyles } from './shared-styles.js';

class MultiSelect extends LitElement {
	static get properties() {
		return {
			disabled: {type:Boolean},
			options: {type:Object},
			value: {type:String},
			defaultText: {type:String},
		};
	}

	static get styles() {
		return [
			SharedStyles,
			css`
				:host {
					display: inline-block;
				}
			`
		];
	}

	render() {
		const defaultText = this.defaultText || 'None';
		//If there's a single option, then 'All' doesn't have any meaning so only render that one
		const options = Object.keys(this.options).length == 1 ? this.options : {'': defaultText, ...this.options};
		//Fill in display values
		const defaultedOptions = Object.fromEntries(Object.entries(options).map(entry => [entry[0], typeof entry[1] == 'string' && entry[1] ? entry[1] : entry[0]]));
		const summary = Object.keys(defaultedOptions).length == 1 ? Object.values(defaultedOptions)[0] : defaultedOptions[this.value];
		return html`<details>
			<summary><label class='subtle'>${summary}</label></summary>
			${Object.entries(defaultedOptions).map((entry, index, entries) => html`<input id=${entry[0]} type='checkbox' .disabled=${this.disabled} .checked=${entry[0] == this.value || entries.length == 1} .value=${entry[0]} @change=${this._handleCheckboxChanged}></input><label for=${entry[0]}>${entry[1]}</label>`)}
		</details>
		`;

	}

	_handleCheckboxChanged(e) {
		const ele = e.composedPath()[0];
		this.value = ele.value;
		this.dispatchEvent(new CustomEvent('change', {composed: true, detail: {value:ele.value}}));
	}


}

window.customElements.define("multi-select", MultiSelect);
