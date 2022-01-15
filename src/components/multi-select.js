import { LitElement, html, css } from "lit-element";

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
			css``
		];
	}

	render() {
		const defaultText = this.defaultText || 'None';
		const options = {'': defaultText, ...this.options};
		return html`<select @change=${this._handleSelectChanged} .disabled=${this.disabled}>
			${Object.entries(options).map(entry => html`<option .value=${entry[0]} .selected=${entry[0] == this.value}>${typeof entry[1] == 'string' && entry[1] ? entry[1] : entry[0]}</option>`)}
		</select>`;
	}

	_handleSelectChanged(e) {
		const ele = e.composedPath()[0];
		this.value = ele.value;
		this.dispatchEvent(new CustomEvent('change', {composed: true, detail: {value:ele.value}}));
	}


}

window.customElements.define("multi-select", MultiSelect);
