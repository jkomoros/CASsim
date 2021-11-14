const SchellingOrgSimulator = class {
	static generator(previousFrames) {
		return {
			value: previousFrames.length
		};
	}

	static optionsValidator(simOptions) {
		const problems = [];
		if (Object.keys(simOptions).length) problems.push('Doesn\'t currently expect any properties');
		return problems;
	}

	static frameScorer() {
		return [1.0];
	}

	static successScorer() {
		return -1.0;
	}

	static frameValidator() {
		return [];
	}
};

export default SchellingOrgSimulator;

import { LitElement, html} from "lit-element";

// This is a reusable element. It is not connected to the store. You can
// imagine that it could just as well be a third-party element that you
// got from someone else.
class SchellingOrgRenderer extends LitElement {
	static get properties() {
		return {
			frame: { type: Object },
		};
	} 
	render() {
		return html`
			<pre>
				${JSON.stringify(this.frame, '', 2)}
			</pre>
		`;
	}
}

window.customElements.define("schelling-org-renderer", SchellingOrgRenderer);