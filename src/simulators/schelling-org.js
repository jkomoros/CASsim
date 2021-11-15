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
	static generator(previousFrames, simOptions, rnd) {
		const projectsCount = simOptions[PROJECTS_PROPERTY_NAME].count;
		const collaborators = [];
		for (let i = 0; i < simOptions[COLLABORATORS_PROPERTY_NAME].count; i++) {
			collaborators.push({
				index: i,
				emoji: DEFAULT_EMOJIS[i % DEFAULT_EMOJIS.length],
				project: Math.floor(rnd.quick() * projectsCount),
			});
		}
		const projects = [];
		for (let i = 0; i < projectsCount; i++) {
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

import { LitElement, html, css, svg} from "lit-element";

// This is a reusable element. It is not connected to the store. You can
// imagine that it could just as well be a third-party element that you
// got from someone else.
class SchellingOrgRenderer extends LitElement {
	static get properties() {
		return {
			frame: { type: Object },
			width: {type:Number},
			height: {type:Number},
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
				background-color: #EEEEEE;
			}

			.project {
				fill: var(--primary-color);
			}

			`
		];
	}

	render() {
		return html`
			<svg width=${this.width} height=${this.height}>
				${this._collaborators.map(item => this._collaboratorSVG(item))}
				${this._projects.map(item => this._projectSVG(item))}
			</svg>
		`;
	}

	get _projects() {
		if (!this.frame) return [];
		return this.frame[PROJECTS_PROPERTY_NAME] || [];
	}

	get _collaborators() {
		if (!this.frame) return [];
		return this.frame[COLLABORATORS_PROPERTY_NAME] || [];
	}

	_collaboratorWidth() {
		return this.width / (this.frame[COLLABORATORS_PROPERTY_NAME].length * 2 - 1);
	}

	_collaboratorPosition(index) {
		const width = this._collaboratorWidth();
		const x = index * (width * 2);
		const y = ((this.height / 3) * 2);
		return [x,y];
	}

	_collaboratorSVG(collaborator) {

		const width = this._collaboratorWidth();
		const position = this._collaboratorPosition(collaborator.index);
		const x = position[0] + width / 2;
		const y = position[1] - width / 2;

		return svg`<text x=${x} y=${y} text-anchor='middle' dominant-baseline='middle' font-size='40'>${collaborator.emoji}</text>`;
	}

	_projectWidth() {
		return this.width / (this.frame[PROJECTS_PROPERTY_NAME].length * 2 - 1);
	}

	_projectPosition(index) {
		const width = this._projectWidth();
		const x = index * (width * 2) + (width / 2);
		const y = this.height / 3;
		return [x, y];
	}

	_projectSVG(project) {

		const width = this._projectWidth();
		const position = this._projectPosition(project.index);

		const x = position[0] - (width / 2);
		const y = position[1] - (width / 2);

		return svg`<rect class='project' x=${x} y=${y} width=${width} height=${width}></rect>`;
	}


}

window.customElements.define("schelling-org-renderer", SchellingOrgRenderer);