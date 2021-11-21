import {
	Urn
} from '../util.js';

const COLLABORATORS_PROPERTY_NAME = 'collaborators';
const PROJECTS_PROPERTY_NAME = 'projects';
const CONNECTIONS_PROPERTY_NAME = 'connections';
const DISPLAY_PROPERTY_NAME = 'display';
const DEBUG_PROPERTY_NAME = 'debug';
const COMMUNICATION_PROPERTY_NAME = 'communication';
const MAX_EXTRA_VALUE_PROPERTY_NAME = 'maxExtraValue';
const MAX_ERROR_VALUE_PROPERTY_NAME = 'maxErrorValue';
const AVG_CONNECTION_LIKELIHOOD_PROPERTY_NAME = 'avgConnectionLikelihood';
const CONNECTION_LIKELIHOOD_SPREAD_PROPERTY_NAME = 'connectionLikelihoodSpread';
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
	//An optional object that controls how things render. If not provided, will be interpreted as though it enables no optional rendering.
	"display": {
		//If true, then the SVG will render debug information
		"debug": true,
	}
	//How many rounds of communication should be allowed between agents before they decide. 0 is no communication.
	"communication": 0,
	"collaborators": {
		//How many collaborators there should be
		"count": 5,
		//Project values within this amount of each other will be considered to be the same
		"epsilon": 0.05,
		//We compute a range of possible connection likelihoods based on [avgConnectionLikelihood - connectionLikelihoodSpread, avgConnectionLikelihood + connectionLikelihoodSpread]
		//Numbers below 0.0 or 1.0 will be clipped, which is a convenient way of making a lot of them drop out or be maximum strength.
		"avgConnectionLikelihood": 0.5,
		"connectionLikelihoodSpread": 0.5,
		//individuals is set to override the computed individuals with the given properties. null values will be ignored, and keys not in the override will be left in place.
		"individuals": [
			null,
			{
				//The starter beliefs of this individual of the values of projects. Must be an array of the same length as number of projects
				"beliefs": [0.0, 0.2, 0.3, 0.4],
				//The epsilon for this specific individual
				"epsilon": 0.05,
				//The specific emoji to use for this individual
				"emoji": "A",
				"avgConnectionLikelihood": 0.5,
				"connectionLikelihoodSpread": 0.25
			}
		]
	},
	"projects": {
		//How many projects there should be
		"count": 3,
		//Each project will get between 0.0 and this number randomly set on top of 1.0 for the value
		"maxExtraValue": 1.0,
		//Each project will get between 0.0 and this number randomly set, which are the "error bars" for the value; its value is considered by collaborators to be somewhere within those values.
		"maxErrorValue": 0.5,
		//individuals is set to override the computed individuals with the given properties. null values will be ignored, and keys not in the override will be left in place.
		"individuals": [
			null,
			{
				//A marked project shows up distinctively; collaborators, when deciding between two projects that look like the same value, will prefer the marked one.
				"marked": true,
				//Value is the height of the project, in units of 1.0 = width
				"value": 1.2,
				//The error bars for this value; collaborators will consider the true value to be somewhere within value +/- this value
				"error": 0.2,
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
		const projectErrorValue = simOptions[PROJECTS_PROPERTY_NAME][MAX_ERROR_VALUE_PROPERTY_NAME] || 0.0;
		const communicationValue = simOptions[COMMUNICATION_PROPERTY_NAME] || 0.0;
		const displayValue = simOptions[DISPLAY_PROPERTY_NAME] || {};
		const collaboratorEpsilonValue = simOptions[COLLABORATORS_PROPERTY_NAME][EPSILON_PROPERTY_NAME] || 0.0;
		const individualProjectOverrides = simOptions[PROJECTS_PROPERTY_NAME][INDIVIDUALS_PROPERTY_NAME] || [];
		const individualCollaboratorOverrides = simOptions[COLLABORATORS_PROPERTY_NAME][INDIVIDUALS_PROPERTY_NAME] || [];
		const avgConnectionLikelihood = simOptions[COLLABORATORS_PROPERTY_NAME][AVG_CONNECTION_LIKELIHOOD_PROPERTY_NAME] || 0.5;
		const connectionLikelihoodSpread = simOptions[COLLABORATORS_PROPERTY_NAME][CONNECTION_LIKELIHOOD_SPREAD_PROPERTY_NAME] || 0.5;
		//Assign basic values to projects.
		let projects = [];
		for (let i = 0; i < projectsCount; i++) {
			projects.push({
				index: i,
				//We'll select this later based on which ones were actually selected.
				selected: false,
				value: 1.0 + (rnd.quick() * projectExtraValue),
				error: 0.0 + (rnd.quick() * projectErrorValue),
			});
		}
		projects = projects.map((item, index) => individualProjectOverrides[index] ? {...item, ...individualProjectOverrides[index]} : item);

		//The default beliefs for each individual.
		const baseBeliefs = projects.map(item => item.value);

		//Assign basic values to collaborators.
		let collaborators = [];
		for (let i = 0; i < collaboratorsCount; i++) {
			const personalBeliefs = [...baseBeliefs];
			for (let j = 0; j < personalBeliefs.length; j++) {
				personalBeliefs[j] += (rnd.quick() < 0.5 ? -1 : 1) * (rnd.quick() * projects[j].error);
			}
			collaborators.push({
				index: i,
				emoji: DEFAULT_EMOJIS[i % DEFAULT_EMOJIS.length],
				epsilon: collaboratorEpsilonValue,
				beliefs: personalBeliefs,
				[AVG_CONNECTION_LIKELIHOOD_PROPERTY_NAME]: avgConnectionLikelihood,
				[CONNECTION_LIKELIHOOD_SPREAD_PROPERTY_NAME]: connectionLikelihoodSpread
			});
		}
		collaborators = collaborators.map((item, index) => individualCollaboratorOverrides[index] ? {...item, ...individualCollaboratorOverrides[index]} : item);

		//connections is array of objs, {i, j, strength, index}, where i is the
		//speaker, j is the listener, and strength is between 0.0 to 1.0 about
		//how strong the connection is (how likely it is to be picked.)
		const connections = [];
		if (communicationValue) {
			let count = 0;
			for (let i = 0; i < collaboratorsCount; i++) {
				for (let j = 0; j < collaboratorsCount; j++) {
					//Don't connect to self
					if (i == j) continue;
					const sender = collaborators[i];
					const senderAvgConnectionLikelihood = sender[AVG_CONNECTION_LIKELIHOOD_PROPERTY_NAME];
					const senderConnectionLikelihoodSpread = sender[CONNECTION_LIKELIHOOD_SPREAD_PROPERTY_NAME];
					const minConnectionLikelihood = senderAvgConnectionLikelihood - senderConnectionLikelihoodSpread;
					const maxConnectionLikelihood = senderAvgConnectionLikelihood + senderConnectionLikelihoodSpread;
					let strength = (maxConnectionLikelihood - minConnectionLikelihood) * rnd.quick() + minConnectionLikelihood;
					if (strength < 0.0) strength = 0.0;
					if (strength > 1.0) strength = 1.0;
					connections.push({i, j, strength, index:count});
					count++;
				}
			}
		}

		return {
			[DISPLAY_PROPERTY_NAME]: displayValue,
			[COMMUNICATION_PROPERTY_NAME]: communicationValue,
			[CONNECTIONS_PROPERTY_NAME]: connections,
			[COLLABORATORS_PROPERTY_NAME]: collaborators,
			[PROJECTS_PROPERTY_NAME]: projects
		};
	}

	static _selectFinalProject(frame, simOptions, rnd) {
		const collaboratorsCount = simOptions[COLLABORATORS_PROPERTY_NAME].count;
		const projectsCount = simOptions[PROJECTS_PROPERTY_NAME].count;
		let projects = [...frame[PROJECTS_PROPERTY_NAME]];
		let collaborators = [...frame[COLLABORATORS_PROPERTY_NAME]];
		//Go through each collaborator and pick a project for them.
		const selectedProjects = {};
		for (let i = 0; i < collaboratorsCount; i++) {

			const collaborator = collaborators[i];

			//Collect all of the projects of max height/
			//We do this within the loop because later each collaborator will have their own beliefs.
			let maxProjectValue = 0.0;
			let maxProjects = [];
			for (const [projectIndex, projectBelief] of collaborator.beliefs.entries()) {
				if (Math.abs(projectBelief - maxProjectValue) < collaborators[i].epsilon) {
					//Effectively equal
					maxProjects.push(projectIndex);
					continue;
				}
				if (projectBelief < maxProjectValue) continue;
				//This is a new max value
				maxProjects = [projectIndex];
				maxProjectValue = projectBelief;
			}

			//If any of the projects that are max value are marked, only selected from them.
			if (maxProjects.some(projectIndex => projects[projectIndex][MARKED_PROPERTY_NAME])) maxProjects = maxProjects.filter(projectIndex => projects[projectIndex][MARKED_PROPERTY_NAME]);

			const selectedProject = maxProjects[Math.floor(rnd.quick() * maxProjects.length)];
			selectedProjects[selectedProject] = (selectedProjects[selectedProject] || 0) + 1;
			collaborators[i] = {...collaborators[i], project:selectedProject};
		}

		//Mark the project as selected if it was selected by all collaborators.
		for (let i = 0; i < projectsCount; i++) {
			if (selectedProjects[i] == collaboratorsCount) {
				projects[i] = {...projects[i],selected:true};
			}
		}

		//Make sure anything that was active in the last frame isn't rendered as active now 
		const newConnections = frame[CONNECTIONS_PROPERTY_NAME].map(connection => ({...connection, active: false}));

		return {
			...frame,
			[PROJECTS_PROPERTY_NAME]: projects,
			[COLLABORATORS_PROPERTY_NAME]: collaborators,
			[CONNECTIONS_PROPERTY_NAME]: newConnections
		};
	}

	static _communicationRound(frame, rnd) {

		//Copy connections
		let connections = frame[CONNECTIONS_PROPERTY_NAME].map(connection => ({...connection}));
		//Set all of them to not active
		connections = connections.map(connection => ({...connection, active: false}));

		//Pick a connection randomly, samping from ones with higher connection weights higher.
		const urn = new Urn(rnd);
		for (const connection of connections) {
			urn.add(connection.index, connection.strength);
		}
		const connectionIndex = urn.pick();

		const connection = connections[connectionIndex];
		connection.active = true;

		const collaborators = [...frame[COLLABORATORS_PROPERTY_NAME]];

		//Which project to communicate about.
		//TODO: allow overriding this based on different strategies.
		const projectIndex = Math.floor(rnd.quick() * frame[PROJECTS_PROPERTY_NAME].length);

		const senderBeliefs = collaborators[connection.i].beliefs;
		const recieverBeliefs = collaborators[connection.j].beliefs;

		const senderProjectBelief = senderBeliefs[projectIndex];
		const receiverProjectBelief = recieverBeliefs[projectIndex];

		//The receiver should update their current belief to be halfway between their previous belief and the sender's belief.
		const updatedBelief = ((senderProjectBelief - receiverProjectBelief) / 2) + receiverProjectBelief;

		const receiverUpdatedBeliefs = [...recieverBeliefs];
		receiverUpdatedBeliefs[projectIndex] = updatedBelief;

		collaborators[connection.j] = {...collaborators[connection.j], beliefs: receiverUpdatedBeliefs};

		return {
			...frame,
			[COLLABORATORS_PROPERTY_NAME]: collaborators,
			[CONNECTIONS_PROPERTY_NAME]: connections
		};
	}

	static generator(previousFrames, simOptions, rnd) {
		const communicationRounds = simOptions[COMMUNICATION_PROPERTY_NAME] || 0.0;
		if (previousFrames.length > communicationRounds) return null;
		let frame = previousFrames.length ? previousFrames[previousFrames.length - 1] : SchellingOrgSimulator._firstFrameGenerator(simOptions, rnd);
		frame = {...frame, index: previousFrames.length};
		if (frame.index < communicationRounds) frame = SchellingOrgSimulator._communicationRound(frame, rnd);
		if (frame.index == communicationRounds) frame = SchellingOrgSimulator._selectFinalProject(frame, simOptions, rnd);
		return frame;
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
		if (projectOptions[MAX_ERROR_VALUE_PROPERTY_NAME] && typeof projectOptions[MAX_ERROR_VALUE_PROPERTY_NAME] != 'number') return ['projectOptions.' + MAX_ERROR_VALUE_PROPERTY_NAME + ' must be a number'];
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

	static frameValidator(frame) {
		const problems = [];
		const projects = frame[PROJECTS_PROPERTY_NAME];
		const collaborators = frame[COLLABORATORS_PROPERTY_NAME];
		const connections = frame[CONNECTIONS_PROPERTY_NAME];
		if (projects) {
			for (const [index, project] of projects.entries()) {
				if (project.index != index) problems.push('Project ' + index + ' has an invalid index');
			}
		} else {
			problems.push('Projects is not provided');
		}
		if (collaborators) {
			for (const [index, collaborator] of collaborators.entries()) {
				if (collaborator.index != index) problems.push('Collaborator ' + index + ' has an invalid index');
				if (typeof collaborator.beliefs != 'object' || !Array.isArray(collaborator.beliefs) || collaborator.beliefs.length != projects.length) problems.push('Collaborator ' + index + ' has an invalid beliefs');
			}
		} else {
			problems.push('Collaborators is not provided');
		}
		if (connections) {
			for (const [index, connection] of connections.entries()) {
				if (connection.index != index) problems.push('Connection ' + index + ' has an invalid index');
				if (connection.i < 0 || connection.i >= collaborators.length) problems.push('Connection ' + index + ' has an invalid index for i');
				if (connection.j < 0 || connection.j >= collaborators.length) problems.push('Connection ' + index + ' has an invalid index for j');
				if (connection.strength < 0 || connection.strength > 1.0) problems.push('Connection ' + index + ' has an invalid strength');
			}
		} else {
			problems.push('Connections is not provided');
		}
		return problems;
	}
};

export default SchellingOrgSimulator;

import { LitElement, html, css, svg} from "lit-element";

const COLLABORATOR_CIRCLE_FACTOR = 7;

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
				stroke: var(--disabled-color);
			}

			.error {
				stroke: black;
			}

			.belief {
				stroke: black;
			}

			.debug {
				stroke: var(--disabled-color);
				stroke-width: 1px;
				fill: transparent;
			}

			.connection {
				stroke: black;
				stroke-width: 1px;
			}

			.connection.active {
				stroke: var(--secondary-color);
				stroke-width: 3px;
			}

			`
		];
	}

	render() {
		return html`
			<svg width=${this.width} height=${this.height}>
				${this._debugRender()}
				${this._connections.map(item => this._connectionSVG(item))}
				${this._collaborators.map(item => this._collaboratorSVG(item))}
				${this._projects.map(item => this._projectSVG(item))}
			</svg>
		`;
	}

	get _projects() {
		if (!this.frame) return [];
		return this.frame[PROJECTS_PROPERTY_NAME] || [];
	}

	get _connections() {
		if (!this.frame) return [];
		return this.frame[CONNECTIONS_PROPERTY_NAME] || [];
	}

	get _collaborators() {
		if (!this.frame) return [];
		return this.frame[COLLABORATORS_PROPERTY_NAME] || [];
	}

	get _communication() {
		if (!this.frame) return false;
		return this.frame[COMMUNICATION_PROPERTY_NAME];
	}

	get _debug() {
		if (!this.frame) return false;
		const displayValue = this.frame[DISPLAY_PROPERTY_NAME] || {};
		return displayValue[DEBUG_PROPERTY_NAME] || false;
	}

	_debugRender() {
		if (!this._debug) return '';
		const collaboratorPosition = this._collaboratorPosition(0);
		const projectPosition = this._projectPosition(0);
		const collaboratorsInCircle = this._communication;
		return svg`
			<path class='debug' d='M 0,${projectPosition[1]} H ${this.width}'></path>
			${collaboratorsInCircle ? 
		svg`<circle class='debug' cx='${this.width / 2}' cy='${this._collaboratorVerticalLine()}' r='${this._collaboratorCircleRadius()}'></circle>` : 
		svg`<path class='debug' d='M 0, ${collaboratorPosition[1]} H ${this.width}'></path>`}
		`;
	}

	_collaboratorVerticalLine() {
		return this._communication ? (this.height / 10) * COLLABORATOR_CIRCLE_FACTOR : (this.height / 4) * 3;
	}

	_collaboratorCircleRadius() {
		return this.width / COLLABORATOR_CIRCLE_FACTOR;
	}

	_collaboratorWidth() {
		return this.width / (this.frame[COLLABORATORS_PROPERTY_NAME].length * 2 - 1);
	}

	_collaboratorPosition(index) {
		if (!this._communication) {
			//Simple linear positioning
			const width = this._collaboratorWidth();
			const x = index * (width * 2) + (width / 2);
			const y = this._collaboratorVerticalLine();
			return [x,y];
		}
		//Along a circle.
		const numCollaborators = this.frame[COLLABORATORS_PROPERTY_NAME].length;
		const r = this._collaboratorCircleRadius();
		const cx = this.width / 2;
		const cy = this._collaboratorVerticalLine();
		//There are 2 Pi radians in a circle. The first item should be at the top, but 0 radian is at the right center.
		const t = (index * (2 * Math.PI / numCollaborators)) - (Math.PI / 2);
		const x = r * Math.cos(t) + cx;
		const y = r * Math.sin(t) + cy;
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

		const ERROR_BAR_CAP_WIDTH = 8;

		const hasError = project.error != 0.0;
		const errorStartX = position[0] - (width / ERROR_BAR_CAP_WIDTH);
		const errorEndX = position[0] + (width / ERROR_BAR_CAP_WIDTH);
		const errorStartY = y - (project.error * width);
		const errorEndY = y + (project.error * width);

		const errorStrokeWidth = width / 40;

		return svg`<rect class='project ${project.selected ? 'selected' : 'not-selected'} ${project[MARKED_PROPERTY_NAME] ? 'marked' : ''}' x=${x} y=${y} width=${width} height=${height}></rect>
					${hasError ? svg`<path class='error' d='M ${errorStartX}, ${errorStartY} H ${errorEndX} M ${position[0]}, ${errorStartY} V ${errorEndY} M ${errorStartX}, ${errorEndY} H ${errorEndX}' stroke-width=${errorStrokeWidth}></path>
						${this._collaborators.map(collaborator => svg`<path class='belief' d='M ${position[0] - ERROR_BAR_CAP_WIDTH / 2},${position[1] - width * collaborator.beliefs[project.index]} h ${ERROR_BAR_CAP_WIDTH}' stroke-width='${errorStrokeWidth / 2}'></path>`)}
					` : ''}`;
	}

	_connectionSVG(connection) {

		const iPos = this._collaboratorPosition(connection.i);
		const jPos = this._collaboratorPosition(connection.j);

		//There will be two connections rendered on top of each other (each way). But because we use opacity, they will naturally blend.
		return svg`<path class='connection ${connection.active ? 'active' : ''}' stroke-opacity='${connection.active ? 1.0 : connection.strength}' d='M ${iPos[0]},${iPos[1]} L ${jPos[0]}, ${jPos[1]}' ></path>`;
	}

}

window.customElements.define("schelling-org-renderer", SchellingOrgRenderer);