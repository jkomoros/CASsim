import { LitElement, html, css } from "lit-element";

class OptionsControl extends LitElement {
	static get properties() {
		return {
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
		return html`<div class='container'>
			${this._inner()}
		</div>`;
	}

	_inner() {
		const example = this.config.example;
		if (this.config.example == undefined) {
			return html`${Object.entries(this.config).map(entry => html`<options-control .value=${this.value[entry[0]]} .config=${entry[1]} .name=${entry[0]}></options-control>`)}`;
		}
		return html`
			<label>${this.name} - ${this.config.description}</label>
			${typeof example == 'object' ?
		(Array.isArray(example) ?
			html`${this.value.map((item, index) => html`<options-control .value=${item} .config=${this.config[0]} .name=${index}></options-control>`)}` :
			html`${Object.entries(this.value).map(entry => html`<options-control .value=${entry[1]} .config=${example[entry[0]]} .name=${entry[0]}></options-control>`)}`) :
		html`<input .value=${this.value}></input>`}
		`;
	}

}

window.customElements.define("options-control", OptionsControl);
