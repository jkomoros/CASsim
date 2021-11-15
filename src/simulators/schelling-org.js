const COLLABORATORS_PROPERTY_NAME = 'collaborators';
const PROJECTS_PROPERTY_NAME = 'projects';

const DEFAULT_EMOJIS = [
	'🧑‍⚕️',
	'🧑‍🎓',
	'🧑‍🏫',
	'🧑‍⚖️',
	'🧑‍🌾',
	'🧑‍🍳',
	'🧑‍🔧',
	'🧑‍🔬',
	'🧑‍🎨',
	'🧑‍✈️',
	'🧑‍🚒',
	'👮'
];

const SchellingOrgSimulator = class {
	static generator(previousFrames, simOptions) {
		const collaborators = [];
		for (let i = 0; i < simOptions[COLLABORATORS_PROPERTY_NAME].count; i++) {
			collaborators.push({
				index: i,
				emoji: DEFAULT_EMOJIS[i % DEFAULT_EMOJIS.length]
			});
		}
		const projects = [];
		for (let i = 0; i < simOptions[PROJECTS_PROPERTY_NAME].count; i++) {
			projects.push({index: i});
		}
		return {
			index: previousFrames.length,
			collaborators,
			projects
		};
	}

	static _collaboratorOptionsValidator(collaboratorOptions) {
		if (!collaboratorOptions || typeof collaboratorOptions !== 'object') return ['If collaborators is provided it must be an object'];
		if (!collaboratorOptions.count || typeof collaboratorOptions.count != 'number' || collaboratorOptions.count < 1) return ['collaborators.count must exist and be a positive number'];
		return [];
	}

	static _projectOptionsValidator(projectOptions) {
		if (!projectOptions || typeof projectOptions !== 'object') return ['If projects is provided it must be an object'];
		if (!projectOptions.count || typeof projectOptions.count != 'number' || projectOptions.count < 1) return ['projectOptions.count must exist and be a positive number'];
		return [];
	}

	static optionsValidator(simOptions) {
		let problems = [];
		for (const [key, value] of Object.entries(simOptions)) {
			if (key == COLLABORATORS_PROPERTY_NAME) {
				problems = [...problems, ...SchellingOrgSimulator._collaboratorOptionsValidator(value)];
			}
			if (key == PROJECTS_PROPERTY_NAME) {
				problems = [...problems, ...SchellingOrgSimulator._projectOptionsValidator(value)];
			}
		}
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

import { LitElement, html, css} from "lit-element";

// This is a reusable element. It is not connected to the store. You can
// imagine that it could just as well be a third-party element that you
// got from someone else.
class SchellingOrgRenderer extends LitElement {
	static get properties() {
		return {
			frame: { type: Object },
		};
	} 

	static get styles() {
		return [
			css`

			:host {
				width: 100%;
				height: 100%;
				position: relative;
			}

			svg {
				position: relative;
				width: 100%;
				height: 100%;
				background-color: blue;
			}

			`
		];
	}

	render() {
		return html`
			<svg>
				<rect x='0' y='0' width='100' height='100' fill='purple'></rect>
			</svg>
		`;
	}
}

window.customElements.define("schelling-org-renderer", SchellingOrgRenderer);