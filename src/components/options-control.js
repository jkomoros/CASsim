import { LitElement, html, css } from "lit-element";

class OptionsControl extends LitElement {
	static get properties() {
		return {
			config: {type: Object},
			value: {type: Object},
		};
	}

	static get styles() {
		return [
			css``
		];
	}

	render() {
		return html`
            <pre>${JSON.stringify(this.config, '', 2)}</pre>
            <pre>${JSON.stringify(this.value, '', 2)}</pre>
		`;
	}

}

window.customElements.define("options-control", OptionsControl);
