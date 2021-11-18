const COLLABORATORS_PROPERTY_NAME = 'collaborators';
const PROJECTS_PROPERTY_NAME = 'projects';
const COMMUNICATION_PROPERTY_NAME = 'communication';
const MAX_EXTRA_VALUE_PROPERTY_NAME = 'maxExtraValue';
const INDIVIDUALS_PROPERTY_NAME = 'individuals';
const MARKED_PROPERTY_NAME = 'marked';
const EPSILON_PROPERTY_NAME = 'epsilon';

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

/*
Sim options shape:

{
	//How many rounds of communication should be allowed between agents before they decide. 0 is no communication.
	"communication": 0,
	"collaborators": {
		//How many collaborators there should be
		"count": 5,
		//Project values within this amount of each other will be considered to be the same
		"epsilon": 0.05,
	},
	"projects": {
		//How many projects there should be
		"count": 3,
		//Each project will get between 0.0 and this number randomly set on top of 1.0 for the value
		"maxExtraValue": 1.0,
		//individuals is set to override the computed individuals with the given properties. null values will be ignored, and keys not in the override will be left in place.
		"individuals": [
			null,
			{
				//A marked project shows up distinctively; collaborators, when deciding between two projects that look like the same value, will prefer the marked one.
				"marked": true,
				//Value is the height of the project, in units of 1.0 = width
				"value": 1.2
			}
		]
	}
}

*/

const SchellingOrgSimulator = class {

	static _firstFrameGenerator(simOptions, rnd) {
		const projectsCount = simOptions[PROJECTS_PROPERTY_NAME].count;
		const collaboratorsCount = simOptions[COLLABORATORS_PROPERTY_NAME].count;
		const projectExtraValue = simOptions[PROJECTS_PROPERTY_NAME][MAX_EXTRA_VALUE_PROPERTY_NAME] || 0.0;
		const communicationValue = simOptions[COMMUNICATION_PROPERTY_NAME] || 0.0;
		const collaboratorEpsilonValue = simOptions[COLLABORATORS_PROPERTY_NAME][EPSILON_PROPERTY_NAME] || 0.0;
		const individualProjectOverrides = simOptions[PROJECTS_PROPERTY_NAME][INDIVIDUALS_PROPERTY_NAME] || [];

		//Assign basic values to projects.
		let projects = [];
		for (let i = 0; i < projectsCount; i++) {
			projects.push({
				index: i,
				//We'll select this later based on which ones were actually selected.
				selected: false,
				value: 1.0 + (rnd.quick() * projectExtraValue),
			});
		}
		projects = projects.map((item, index) => individualProjectOverrides[index] ? {...item, ...individualProjectOverrides[index]} : item);

		//Assign basic values to collaborators.
		const collaborators = [];
		for (let i = 0; i < collaboratorsCount; i++) {
			collaborators.push({
				index: i,
				emoji: DEFAULT_EMOJIS[i % DEFAULT_EMOJIS.length],
				epsilon: collaboratorEpsilonValue,
			});
		}

		//Go through each collaborator and pick a project for them.
		const selectedProjects = {};
		for (let i = 0; i < collaboratorsCount; i++) {

			//Collect all of the projects of max height/
			//We do this within the loop because later each collaborator will have their own beliefs.
			let maxProjectValue = 0.0;
			let maxProjects = [];
			for (const project of projects) {
				if (Math.abs(project.value - maxProjectValue) < collaborators[i].epsilon) {
					//Effectively equal
					maxProjects.push(project);
					continue;
				}
				if (project.value < maxProjectValue) continue;
				//This is a new max value
				maxProjects = [project];
				maxProjectValue = project.value;
			}

			//If any of the projects that are max value are marked, only selected from them.
			if (maxProjects.some(project => project[MARKED_PROPERTY_NAME])) maxProjects = maxProjects.filter(project => project[MARKED_PROPERTY_NAME]);

			const selectedProject = maxProjects[Math.floor(rnd.quick() * maxProjects.length)].index;
			selectedProjects[selectedProject] = (selectedProjects[selectedProject] || 0) + 1;
			collaborators[i].project = selectedProject;
		}

		//Mark the project as selected if it was selected by all collaborators.
		for (let i = 0; i < projectsCount; i++) {
			if (selectedProjects[i] == collaboratorsCount) {
				projects[i].selected = true;
			}
		}

		return {
			index: 0,
			communication: communicationValue,
			collaborators,
			projects
		};
	}

	static generator(previousFrames, simOptions, rnd) {
		//There should only be a single frame
		if (previousFrames.length) return null;
		return SchellingOrgSimulator._firstFrameGenerator(simOptions, rnd);
	}

	static _collaboratorOptionsValidator(collaboratorOptions) {
		if (!collaboratorOptions || typeof collaboratorOptions !== 'object') return ['If collaborators is provided it must be an object'];
		if (!collaboratorOptions.count || typeof collaboratorOptions.count != 'number' || collaboratorOptions.count < 1) return ['collaborators.count must exist and be a positive number'];
		return [];
	}

	static _projectOptionsValidator(projectOptions) {
		if (!projectOptions || typeof projectOptions !== 'object') return ['If projects is provided it must be an object'];
		if (!projectOptions.count || typeof projectOptions.count != 'number' || projectOptions.count < 1) return ['projectOptions.count must exist and be a positive number'];
		if (projectOptions[MAX_EXTRA_VALUE_PROPERTY_NAME] && typeof projectOptions[MAX_EXTRA_VALUE_PROPERTY_NAME] != 'number') return ['projectOptions.' + MAX_EXTRA_VALUE_PROPERTY_NAME + ' must be a number'];
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
			if (key == COMMUNICATION_PROPERTY_NAME) {
				if (typeof value != 'number' || value < 0) problems.push(COMMUNICATION_PROPERTY_NAME + ' must be a non-negative number');
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

			.selected-project {
				stroke: var(--secondary-color);
				stroke-width: 3px;
				stroke-dasharray: 5,5;
			}

			.project.not-selected {
				filter: saturate(30%) brightness(1.3);
			}

			.project.marked {
				stroke-width: 2px;
				stroke: var(--secondary-color);
			}

			.wall {
				stroke: black;
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

	get _communication() {
		if (!this.frame) return false;
		return this.frame[COMMUNICATION_PROPERTY_NAME];
	}

	_collaboratorWidth() {
		return this.width / (this.frame[COLLABORATORS_PROPERTY_NAME].length * 2 - 1);
	}

	_collaboratorPosition(index) {
		const width = this._collaboratorWidth();
		const x = index * (width * 2) + (width / 2);
		const y = ((this.height / 4) * 3);
		return [x,y];
	}

	_collaboratorSVG(collaborator) {

		const width = this._collaboratorWidth();
		const position = this._collaboratorPosition(collaborator.index);
		const x = position[0];
		const y = position[1];

		const projectPosition = this._projectPosition(collaborator.project);

		return svg`
		${projectPosition ? svg`<path class='selected-project' d='M ${projectPosition[0]},${projectPosition[1]} L ${x}, ${y}'></path>` : ''}
		<text x=${x} y=${y} text-anchor='middle' dominant-baseline='middle' font-size='${width * 0.8}'>${collaborator.emoji}</text>
		${this._communication ? '' : svg`<path class='wall' d='M ${x + width},${y - width / 2} L ${x + width},${y + width /2}' stroke-width='${width / 10}'></path>`}`;
	}

	_projectWidth() {
		return this.width / (this.frame[PROJECTS_PROPERTY_NAME].length * 3 - 1);
	}

	_projectPosition(index) {
		if (index == undefined) return null;
		const width = this._projectWidth();
		const x = index * (width * 3) + width;
		const y = this.height / 3;
		return [x, y];
	}

	_projectSVG(project) {

		const width = this._projectWidth();
		const height = width * project.value;
		const position = this._projectPosition(project.index);

		const x = position[0] - (width / 2);
		const y = position[1] - (height);

		return svg`<rect class='project ${project.selected ? 'selected' : 'not-selected'} ${project[MARKED_PROPERTY_NAME] ? 'marked' : ''}' x=${x} y=${y} width=${width} height=${height}></rect>`;
	}


}

window.customElements.define("schelling-org-renderer", SchellingOrgRenderer);