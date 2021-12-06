import {
	Urn,
	deepCopy
} from '../util.js';

import {
	BaseSimulator
} from '../simulator.js';

const SCHELLING_ORG_SIMULATION_NAME = 'schelling-org';

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
const BROADCAST_LIKELIHOOD_PROPERTY_NAME = 'broadcastLikelihood';
const INDIVIDUALS_PROPERTY_NAME = 'individuals';
const MARKED_PROPERTY_NAME = 'marked';
const EPSILON_PROPERTY_NAME = 'epsilon';
const BELIEFS_PROPERTY_NAME = 'beliefs';
const COMPELLING_PROPERTY_NAME = 'compelling';
const EMOJI_PROPERTY_NAME = 'emoji';
const NORTH_STAR_PROPERTY_NAME = 'northStar';
const OFFSET_PROPERTY_NAME = 'offset';
const STRENGTH_PROPERTY_NAME = 'strength';
const SPREAD_PROPERTY_NAME = 'spread';
const OFFSET_TYPE_PROPERTY_NAME = 'offsetType';
const MIN_OFFSET_PROPERTY_NAME = 'minOffset';
const MAX_OFFSET_PROPERTY_NAME = 'maxOffset';

const OFFSET_TYPE_MANUAL = 'manual';
const OFFSET_TYPE_RANDOM = 'random';

const DEFAULT_COMPELLING_VALUE = 0.5;

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

const DEFAULT_NORTH_STAR_EMOJI = '🌟';

//bias is where in the range of min to max the value will be. 0.5 will be
//equally likely across whole range, whereas a bias of 0.0 will be very
//pessimistic (very bottom edge of range, and bias of 1.0 will be extremely
//optimistic)
const randomValueWithBias = (rnd, min, max, bias = 0.5) => {
	if (bias < 0.0) bias = 0.0;
	if (bias > 1.0) bias = 1.0;

	//Effectively what we'll do is make it so the percentage between max and min
	//we do will be clipped based on bias, to between 0.0 and 1.0.
	//bias -> minPercentage, maxPercentage
	//0.5 -> 0.0, 1.0
	//1.0 -> 1.0, 1.0
	//0.0 -> 0.0, 0.0
	//0.75 -> 0.5, 1.0
	//0.25 -> 0.0, 0.5

	//Convert bias to a convenient range
	//0.5 -> 0.0, 1.0 -> 1.0, 0.0 -> -1.0, 0.75 -> 0.5, 0.25 -> -0.5
	const normalizedBias = (bias * 2 - 1);
	const percentMin = normalizedBias > 0.0 ? normalizedBias : 0.0;
	const percentMax = normalizedBias < 0.0 ? 1.0 + normalizedBias : 1.0;
	let percentage = (percentMax - percentMin) * rnd() + percentMin;
	return (max - min) * percentage + min;
};

const projectWidth = (projectCount, stageWidth = 1.0) => {
	return stageWidth / (projectCount * 3 - 1);
};

const projectX = (index, projectCount, stageWidth = 1.0) => {
	const width = projectWidth(projectCount, stageWidth);
	return index * (width * 3) + width;
};

class SchellingOrgSimulator extends BaseSimulator {

	get name() {
		return SCHELLING_ORG_SIMULATION_NAME;
	}

	_firstFrameGenerator(simOptions, rnd) {
		const projectsCount = simOptions[PROJECTS_PROPERTY_NAME].count;
		const collaboratorsCount = simOptions[COLLABORATORS_PROPERTY_NAME].count;
		const projectExtraValue = simOptions[PROJECTS_PROPERTY_NAME][MAX_EXTRA_VALUE_PROPERTY_NAME];
		const projectErrorValue = simOptions[PROJECTS_PROPERTY_NAME][MAX_ERROR_VALUE_PROPERTY_NAME];
		const communicationValue = simOptions[COMMUNICATION_PROPERTY_NAME];
		const displayValue = simOptions[DISPLAY_PROPERTY_NAME];
		const northStarValue = simOptions[NORTH_STAR_PROPERTY_NAME] ? deepCopy(simOptions[NORTH_STAR_PROPERTY_NAME]) : undefined;
		const collaboratorEpsilonValue = simOptions[COLLABORATORS_PROPERTY_NAME][EPSILON_PROPERTY_NAME];
		const individualProjectOverrides = simOptions[PROJECTS_PROPERTY_NAME][INDIVIDUALS_PROPERTY_NAME];
		const individualCollaboratorOverrides = simOptions[COLLABORATORS_PROPERTY_NAME][INDIVIDUALS_PROPERTY_NAME];
		const avgConnectionLikelihood = simOptions[COLLABORATORS_PROPERTY_NAME][AVG_CONNECTION_LIKELIHOOD_PROPERTY_NAME];
		const connectionLikelihoodSpread = simOptions[COLLABORATORS_PROPERTY_NAME][CONNECTION_LIKELIHOOD_SPREAD_PROPERTY_NAME];
		const defaultCompellingValue = simOptions[COLLABORATORS_PROPERTY_NAME][COMPELLING_PROPERTY_NAME];
		const broadcastLikelihood = simOptions[COLLABORATORS_PROPERTY_NAME][BROADCAST_LIKELIHOOD_PROPERTY_NAME];

		if (northStarValue && northStarValue[OFFSET_TYPE_PROPERTY_NAME] != OFFSET_TYPE_MANUAL) {
			const minOffset = northStarValue[MIN_OFFSET_PROPERTY_NAME];
			const maxOffset = northStarValue[MAX_OFFSET_PROPERTY_NAME];
			northStarValue[OFFSET_PROPERTY_NAME] = (maxOffset - minOffset) * rnd() + minOffset;
		}

		//Assign basic values to projects.
		let projects = [];
		for (let i = 0; i < projectsCount; i++) {

			//Default of no northStar bias
			let northStarBias = 0.5;
			if (northStarValue) {
				//There is a north star. Conceptually we'll calulate the bias to
				//be a triangle centered on north star offset, trailing off
				//linearly on either side of offset by spread. And the lowest
				//and highest values at the extremes are given by strength,
				//where strength of 1.0 will have the extremes be 0.0..1.0
				const northStarOffset = northStarValue[OFFSET_PROPERTY_NAME];
				const northStarSpread = northStarValue[SPREAD_PROPERTY_NAME];
				const northStarStrength = northStarValue[STRENGTH_PROPERTY_NAME];
				const minNorthStarBias = 0.5 - (0.5 * northStarStrength);
				const maxNorthStarBias = 0.5 + (0.5 * northStarStrength);
				const projectXOffset = projectX(i, projectsCount);
				if (projectXOffset < northStarOffset - northStarSpread) {
					northStarBias = minNorthStarBias;
				} else if (projectXOffset > northStarOffset + northStarSpread) {
					northStarBias = minNorthStarBias;
				} else if (projectXOffset > northStarOffset) {
					//Linear
					const percentage = (projectXOffset - northStarOffset) / northStarSpread;
					northStarBias = (maxNorthStarBias - minNorthStarBias) * (1.0 - percentage) + minNorthStarBias;
				} else if (projectXOffset < northStarOffset) {
					//Linear fall off
					const percentage = (northStarOffset - projectXOffset) / northStarSpread;
					northStarBias = (maxNorthStarBias - minNorthStarBias) * (1.0 - percentage) + minNorthStarBias;
				} else {
					//Precisely the same
					northStarBias = maxNorthStarBias;
				}
			}

			projects.push({
				index: i,
				//We'll select this later based on which ones were actually selected.
				selected: false,
				value: 1.0 + (rnd() * projectExtraValue),
				error: 0.0 + (rnd() * projectErrorValue),
				northStarBias
			});
		}

		projects = projects.map((item, index) => individualProjectOverrides[index] ? {...item, ...individualProjectOverrides[index]} : item);

		//Assign basic values to collaborators.
		let collaborators = [];
		for (let i = 0; i < collaboratorsCount; i++) {
			const personalBeliefs = new Array(projects.length);
			for (let j = 0; j < personalBeliefs.length; j++) {
				const project = projects[j];
				personalBeliefs[j] = randomValueWithBias(rnd, project.value - project.error, project.value + project.error, project.northStarBias);
			}
			collaborators.push({
				index: i,
				[EMOJI_PROPERTY_NAME]: DEFAULT_EMOJIS[i % DEFAULT_EMOJIS.length],
				[EPSILON_PROPERTY_NAME]: collaboratorEpsilonValue,
				[BELIEFS_PROPERTY_NAME]: personalBeliefs,
				[BROADCAST_LIKELIHOOD_PROPERTY_NAME]: broadcastLikelihood,
				[COMPELLING_PROPERTY_NAME]: defaultCompellingValue,
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
					let strength = (maxConnectionLikelihood - minConnectionLikelihood) * rnd() + minConnectionLikelihood;
					if (strength < 0.0) strength = 0.0;
					if (strength > 1.0) strength = 1.0;
					connections.push({i, j, strength, index:count});
					count++;
				}
			}
		}

		return {
			[DISPLAY_PROPERTY_NAME]: displayValue,
			[NORTH_STAR_PROPERTY_NAME]: northStarValue,
			[COMMUNICATION_PROPERTY_NAME]: communicationValue,
			[CONNECTIONS_PROPERTY_NAME]: connections,
			[COLLABORATORS_PROPERTY_NAME]: collaborators,
			[PROJECTS_PROPERTY_NAME]: projects
		};
	}

	_selectFinalProject(frame, simOptions, rnd) {
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
			for (const [projectIndex, projectBelief] of collaborator[BELIEFS_PROPERTY_NAME].entries()) {
				if (Math.abs(projectBelief - maxProjectValue) < collaborators[i][EPSILON_PROPERTY_NAME]) {
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

			const selectedProject = maxProjects[Math.floor(rnd() * maxProjects.length)];
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

	_communicationRound(frame, rnd) {

		//Copy connections
		let connections = frame[CONNECTIONS_PROPERTY_NAME].map(connection => ({...connection}));
		//Set all of them to not active
		connections = connections.map(connection => ({...connection, active: false}));

		//Pick a connection randomly, samping from ones with higher connection weights higher.
		const urn = new Urn(rnd);
		for (const connection of connections) {
			urn.add(connection.index, connection[STRENGTH_PROPERTY_NAME]);
		}
		const connectionIndex = urn.pick();

		const primaryConnection = connections[connectionIndex];
		
		const collaborators = [...frame[COLLABORATORS_PROPERTY_NAME]];

		//Which project to communicate about.
		//TODO: allow overriding this based on different strategies.
		const projectIndex = Math.floor(rnd() * frame[PROJECTS_PROPERTY_NAME].length);

		const doBroadcast = rnd() <= collaborators[primaryConnection.i][BROADCAST_LIKELIHOOD_PROPERTY_NAME];

		//If we do broadcast, then we'll transmit to each connection where sender is the sender, and the value is greater than the primaryConnection value.
		const connectionsToSend = doBroadcast ? connections.filter(connection => connection.i == primaryConnection.i && connection[STRENGTH_PROPERTY_NAME] >= primaryConnection[STRENGTH_PROPERTY_NAME]) : [primaryConnection];

		const senderCompelling = collaborators[primaryConnection.i][COMPELLING_PROPERTY_NAME];
		
		for (const connection of connectionsToSend) {
			connection.active = true;

			const senderBeliefs = collaborators[connection.i][BELIEFS_PROPERTY_NAME];
			const recieverBeliefs = collaborators[connection.j][BELIEFS_PROPERTY_NAME];

			const senderProjectBelief = senderBeliefs[projectIndex];
			const receiverProjectBelief = recieverBeliefs[projectIndex];

			//The receiver should update their current belief to be halfway between their previous belief and the sender's belief.
			const updatedBelief = ((senderProjectBelief - receiverProjectBelief) * senderCompelling) + receiverProjectBelief;

			const receiverUpdatedBeliefs = [...recieverBeliefs];
			receiverUpdatedBeliefs[projectIndex] = updatedBelief;

			collaborators[connection.j] = {...collaborators[connection.j], beliefs: receiverUpdatedBeliefs};
		}

		return {
			...frame,
			[COLLABORATORS_PROPERTY_NAME]: collaborators,
			[CONNECTIONS_PROPERTY_NAME]: connections
		};
	}

	generator(previousFrames, simOptions, rnd) {
		const communicationRounds = simOptions[COMMUNICATION_PROPERTY_NAME];
		if (previousFrames.length > communicationRounds) return null;
		let frame = previousFrames.length ? previousFrames[previousFrames.length - 1] : this._firstFrameGenerator(simOptions, rnd);
		frame = {...frame, index: previousFrames.length};
		if (frame.index < communicationRounds) frame = this._communicationRound(frame, rnd);
		if (frame.index == communicationRounds) frame = this._selectFinalProject(frame, simOptions, rnd);
		return frame;
	}

	normalizeOptions(rawSimOptions) {
		rawSimOptions[COMMUNICATION_PROPERTY_NAME] = rawSimOptions[COMMUNICATION_PROPERTY_NAME] || 0.0;
		if (!rawSimOptions[COLLABORATORS_PROPERTY_NAME]) {
			rawSimOptions[COLLABORATORS_PROPERTY_NAME] = {
				count: 0,
			};
		}

		if (!rawSimOptions[PROJECTS_PROPERTY_NAME]) {
			rawSimOptions[PROJECTS_PROPERTY_NAME] = {
				count: 0,
			};
		}

		if (!rawSimOptions[DISPLAY_PROPERTY_NAME]) rawSimOptions[DISPLAY_PROPERTY_NAME] = {};

		const projects = rawSimOptions[PROJECTS_PROPERTY_NAME];
		if (projects[MAX_EXTRA_VALUE_PROPERTY_NAME] == undefined) projects[MAX_EXTRA_VALUE_PROPERTY_NAME] = 0.0;
		if (projects[MAX_ERROR_VALUE_PROPERTY_NAME] == undefined) projects[MAX_ERROR_VALUE_PROPERTY_NAME] = 0.0;
		if (projects[INDIVIDUALS_PROPERTY_NAME] == undefined) projects[INDIVIDUALS_PROPERTY_NAME] = [];

		const collaborators = rawSimOptions[COLLABORATORS_PROPERTY_NAME];
		if (collaborators[EPSILON_PROPERTY_NAME] == undefined) collaborators[EPSILON_PROPERTY_NAME] = 0.0;
		if (collaborators[INDIVIDUALS_PROPERTY_NAME] == undefined) collaborators[INDIVIDUALS_PROPERTY_NAME] = [];
		if (collaborators[AVG_CONNECTION_LIKELIHOOD_PROPERTY_NAME] == undefined) collaborators[AVG_CONNECTION_LIKELIHOOD_PROPERTY_NAME] = 0.5;
		if (collaborators[CONNECTION_LIKELIHOOD_SPREAD_PROPERTY_NAME] == undefined) collaborators[CONNECTION_LIKELIHOOD_SPREAD_PROPERTY_NAME] = 0.5;
		if (collaborators[COMPELLING_PROPERTY_NAME] == undefined) collaborators[COMPELLING_PROPERTY_NAME] = DEFAULT_COMPELLING_VALUE;
		if (collaborators[BROADCAST_LIKELIHOOD_PROPERTY_NAME] == undefined) collaborators[BROADCAST_LIKELIHOOD_PROPERTY_NAME] = 0.0;

		return rawSimOptions;
	}

	optionsValidator(normalizedSimOptions) {
		//Our validations are mainly served by the config in optionsConfig.
		const individuals = normalizedSimOptions[COLLABORATORS_PROPERTY_NAME][INDIVIDUALS_PROPERTY_NAME];
		if (!individuals) return [];
		const numProjects = normalizedSimOptions[PROJECTS_PROPERTY_NAME].count;
		for (const [i, individual] of individuals.entries()) {
			if (!individual) continue;
			if (!individual[BELIEFS_PROPERTY_NAME]) continue;
			if (individual[BELIEFS_PROPERTY_NAME].length != numProjects) return ['Collaborator ' + i + ' had beliefs provided but they didn\'t match the number of projects'];
		}
		return [];
	}

	frameScorer(frame, simOptions) {
		const communicationRounds = simOptions[COMMUNICATION_PROPERTY_NAME];
		//If we aren't done yet signal indeterminate.
		if (frame.index < communicationRounds) return [-1];
		for (const project of frame[PROJECTS_PROPERTY_NAME]) {
			//If we find a single selected project then we succeeded.
			if (project.selected) return [1.0];
		}
		return [0.0];
	}

	frameValidator(frame) {
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
				if (typeof collaborator[BELIEFS_PROPERTY_NAME] != 'object' || !Array.isArray(collaborator[BELIEFS_PROPERTY_NAME]) || collaborator[BELIEFS_PROPERTY_NAME].length != projects.length) problems.push('Collaborator ' + index + ' has an invalid beliefs');
			}
		} else {
			problems.push('Collaborators is not provided');
		}
		if (connections) {
			for (const [index, connection] of connections.entries()) {
				if (connection.index != index) problems.push('Connection ' + index + ' has an invalid index');
				if (connection.i < 0 || connection.i >= collaborators.length) problems.push('Connection ' + index + ' has an invalid index for i');
				if (connection.j < 0 || connection.j >= collaborators.length) problems.push('Connection ' + index + ' has an invalid index for j');
				if (connection[STRENGTH_PROPERTY_NAME] < 0 || connection[STRENGTH_PROPERTY_NAME] > 1.0) problems.push('Connection ' + index + ' has an invalid strength');
			}
		} else {
			problems.push('Connections is not provided');
		}
		return problems;
	}

	defaultValueForPath(path, simOptions) {
		const parts = path.split('.');
		if (parts.length == 4 && parts[3] == BELIEFS_PROPERTY_NAME){
			const base = super.defaultValueForPath(path, simOptions);
			const length = simOptions[PROJECTS_PROPERTY_NAME].count;
			const result = [];
			for (let i = 0; i < length; i++) {
				result.push(base[0]);
			}
			return result;
		}
		return super.defaultValueForPath(path, simOptions);
	}
	
	get optionsConfig() {
		return {
			[DISPLAY_PROPERTY_NAME]: {
				example: {
					[DEBUG_PROPERTY_NAME]: {
						example: false,
						description: "If true, then the SVG will render debug information",
						optional: true,
					},
					[BELIEFS_PROPERTY_NAME]: {
						example: false,
						description: "If true, then each individuals' beliefs about the value of a project will be rendered as a tick mark",
						optional: true
					}
				},
				optional: true,
				description: "An optional object that controls how things render. If not provided, will be interpreted as though it enables no optional rendering.",
				advanced: true
			},
			[COMMUNICATION_PROPERTY_NAME]: {
				example: 0,
				description: "How many rounds of communication should be allowed between agents before they decide. 0 is no communication."
			},
			[NORTH_STAR_PROPERTY_NAME]: {
				example: {
					[EMOJI_PROPERTY_NAME]: {
						example: DEFAULT_NORTH_STAR_EMOJI,
						description: "The emoji to render for that item",
					},
					[OFFSET_TYPE_PROPERTY_NAME]: {
						example: OFFSET_TYPE_MANUAL,
						options: [
							{
								value: OFFSET_TYPE_MANUAL,
								description: 'The offset is specifically the value of ' + OFFSET_TYPE_PROPERTY_NAME
							},
							{
								value: OFFSET_TYPE_RANDOM,
								description: 'The offset is a random value per run, between ' + MIN_OFFSET_PROPERTY_NAME + ' and ' + MAX_OFFSET_PROPERTY_NAME,
							}
						]
					},
					[MIN_OFFSET_PROPERTY_NAME]: {
						example: 0.0,
						description: 'The lowest random offset to choose if ' + OFFSET_TYPE_PROPERTY_NAME + ' is randomly selected (not ' + OFFSET_TYPE_MANUAL + ')',
						min: 0.0,
						max: 1.0,
						step: 0.05,
					},
					[MAX_OFFSET_PROPERTY_NAME]: {
						example: 1.0,
						description: 'The highest random offset to choose if ' + OFFSET_TYPE_PROPERTY_NAME + ' is randomly selected (not ' + OFFSET_TYPE_MANUAL + ')',
						min: 0.0,
						max: 1.0,
						step: 0.05,
					},
					[OFFSET_PROPERTY_NAME]: {
						example: 0.5,
						description: "How far from fully at left to fully at right is the northstar?",
						min: 0.0,
						max: 1.0,
						step: 0.05,
					},
					[STRENGTH_PROPERTY_NAME]: {
						example: 0.5,
						description: "How strong is the north star effect?",
						min: 0.0,
						max: 1.0,
						step: 0.05
					},
					[SPREAD_PROPERTY_NAME]: {
						example: 0.25,
						description: 'How far is the positive effect of the northstar affect, from plus or minus the offset position?',
						min: 0.0,
						max: 1.0,
						step: 0.05,
					}
				},
				description: "Information on an (optional) north star, which people will tend to pick towards",
				optional: true
			},
			[COLLABORATORS_PROPERTY_NAME]: {
				example: {
					count: {
						example: 5,
						description: "How many collaborators there should be"
					},
					[EPSILON_PROPERTY_NAME]: {
						example: 0.05,
						step: 0.05,
						description: "Project values within this amount of each other will be considered to be the same"
					},
					[AVG_CONNECTION_LIKELIHOOD_PROPERTY_NAME]: {
						example: 0.5,
						step: 0.05,
						description: "We compute a range of possible connection likelihoods based on [avgConnectionLikelihood - connectionLikelihoodSpread, avgConnectionLikelihood + connectionLikelihoodSpread] Numbers below 0.0 or 1.0 will be clipped, which is a convenient way of making a lot of them drop out or be maximum strength."
					},
					[CONNECTION_LIKELIHOOD_SPREAD_PROPERTY_NAME]: {
						example: 0.5,
						step: 0.05,
						description: "We compute a range of possible connection likelihoods based on [avgConnectionLikelihood - connectionLikelihoodSpread, avgConnectionLikelihood + connectionLikelihoodSpread] Numbers below 0.0 or 1.0 will be clipped, which is a convenient way of making a lot of them drop out or be maximum strength."
					},
					[COMPELLING_PROPERTY_NAME]: {
						example: 0.5,
						description: 'When each individual speaks to another, how much does the receiver update their beliefs, between their old belief and new belief? 0.5 would be moving halfway from old belief to new belief',
						min: 0.0,
						max: 1.0,
						step: 0.05,
						optional: true,
					},
					[BROADCAST_LIKELIHOOD_PROPERTY_NAME]: {
						example: 0.0,
						description: 'For each time a speaker is selected to present, how likely are they are they to broadcast to multiple people, with any individual with a connection equal to or stronger than the selected connection is communicated with at once?',
						min: 0.0,
						max: 1.0,
						step: 0.05,
						optional: true,
					},
					[INDIVIDUALS_PROPERTY_NAME]: {
						optional: true,
						example: [
							{
								example: {
									[BELIEFS_PROPERTY_NAME]: {
										example: [
											{
												example: 0.0,
											}
										],
										description: "The starter beliefs of this individual of the values of projects. Must be an array of the same length as number of projects",
										optional: true,
									},
									[EPSILON_PROPERTY_NAME]: {
										example: 0.5,
										step: 0.05,
										description: "The epsilon for this specific individual",
										optional:true,
									},
									[EMOJI_PROPERTY_NAME]: {
										example: 'A',
										description: 'The specific emoji',
										optional:true,
									},
									[AVG_CONNECTION_LIKELIHOOD_PROPERTY_NAME]: {
										example: 0.5,
										description: AVG_CONNECTION_LIKELIHOOD_PROPERTY_NAME + ' for this individual',
										optional:true,
									},
									[CONNECTION_LIKELIHOOD_SPREAD_PROPERTY_NAME]: {
										example: 0.5,
										description: CONNECTION_LIKELIHOOD_SPREAD_PROPERTY_NAME + ' for this individual',
										optional:true,
									},
									[COMPELLING_PROPERTY_NAME]: {
										example: DEFAULT_COMPELLING_VALUE,
										description: 'When this person speaks to another person, how much does the receiver update their beliefs? 0.5 means the receiver would move their belief to be halfway between their previous belief and the speaker\'s belief',
										max: 1.0,
										min: 0.0,
										step: 0.05,
										optional:true,
									},
									[BROADCAST_LIKELIHOOD_PROPERTY_NAME]: {
										example: 0.0,
										description: 'For each time a speaker is selected to present, how likely are they are they to broadcast to multiple people, with any individual with a connection equal to or stronger than the selected connection is communicated with at once?',
										min: 0.0,
										max: 1.0,
										step: 0.05,
										optional: true,
									}
								},
								description: "An individual",
								optional: true
							}
						],
						description: "individuals is set to override the computed individuals with the given properties. null values will be ignored, and keys not in the override will be left in place."
					}
				},
				description: "Information on the collaborators"
			},
			[PROJECTS_PROPERTY_NAME]: {
				example: {
					count: {
						example: 3,
						description: "How many projects there are"
					},
					[MAX_EXTRA_VALUE_PROPERTY_NAME]: {
						example: 0.0,
						step: 0.05,
						description: "Each project will get between 0.0 and this number randomly set on top of 1.0 for the value"
					},
					[MAX_ERROR_VALUE_PROPERTY_NAME]: {
						example: 0.0,
						step: 0.05,
						description: 'Each project will get between 0.0 and this number randomly set, which are the "error bars" for the value; its value is considered by collaborators to be somewhere within those values.'
					},
					[INDIVIDUALS_PROPERTY_NAME]: {
						example: [
							{
								example: {
									[MARKED_PROPERTY_NAME]: {
										example: false,
										description: "A marked project shows up distinctively; collaborators, when deciding between two projects that look like the same value, will prefer the marked one.",
										optional: true
									},
									value: {
										example: 1.0,
										step: 0.05,
										description: "Value is the height of the project, in units of 1.0 = width",
										optional: true
									},
									error: {
										example: 0.0,
										step: 0.05,
										description: "The error bars for this value; collaborators will consider the true value to be somewhere within value +/- this value",
										optional: true
									}
								},
								description: "A specific project",
								optional:true,
							}
						],
						optional: true,
						description: "individuals is set to override the computed individuals with the given properties. null values will be ignored, and keys not in the override will be left in place."
					}
				},
				description: "Information on projects"
			}
		};
	}

	renderer() {
		return new SchellingOrgRenderer();
	}
}

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
				opacity: 0.5;
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

			.mark {
				stroke: var(--disabled-color);
			}

			.connection.active {
				stroke: var(--secondary-color);
				stroke-width: 3px;
			}

			svg {
				width: 100%;
				height: 100%;
			}

			`
		];
	}

	render() {
		return html`
			<svg viewBox='0 0 ${this.width} ${this.height}'>
				${this._debugRender()}
				${this._renderNorthstar()}
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

	get _renderBeliefTicks() {
		if (!this.frame) return false;
		const displayValue = this.frame[DISPLAY_PROPERTY_NAME] || {};
		return displayValue[BELIEFS_PROPERTY_NAME] || false;
	}

	get _northStar() {
		if (!this.frame) return null;
		return this.frame[NORTH_STAR_PROPERTY_NAME];
	}

	_northStarWidth() {
		if (!this._northStar) return 0;
		return this._projectWidth() * this._northStar[STRENGTH_PROPERTY_NAME];
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

	_renderNorthstar() {
		const northStar = this._northStar;
		if (!northStar) return '';
		const width = this._northStarWidth();
		const x = this.width * northStar[OFFSET_PROPERTY_NAME];
		const y = (this.height / 40) + (width / 2);
		return svg`<text x=${x} y=${y} text-anchor='middle' dominant-baseline='middle' font-size='${width}'>${northStar[EMOJI_PROPERTY_NAME]}</text>`;
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
		<text x=${x} y=${y} text-anchor='middle' dominant-baseline='middle' font-size='${width * 0.8}'>${collaborator[EMOJI_PROPERTY_NAME]}</text>
		${this._communication ? '' : svg`<path class='wall' d='M ${x + width},${y - width / 2} L ${x + width},${y + width /2}' stroke-width='${width / 10}'></path>`}`;
	}

	_projectWidth() {
		return projectWidth(this.frame[PROJECTS_PROPERTY_NAME].length, this.width);
	}

	//Returns the x, y of the bottom center of the project bar
	_projectPosition(index) {
		if (index == undefined) return null;
		const x = projectX(index, this.frame[PROJECTS_PROPERTY_NAME].length, this.width);
		const y = this.height / 3;
		return [x, y];
	}

	_projectSVG(project) {

		const width = this._projectWidth();
		//Size is so the largest bar goes to the top of the area
		const maxVerticalRelativeSize = Math.max(...this._projects.map(project => project.value + project.error));

		//Spread it across the size avaialble; this.height/3 - some padding to not go all the way to the top
		let projectAvailableHeight = this.height / 3;
		projectAvailableHeight -= this.height / 40;
		//northStarWidth will be 0 if no northstar
		projectAvailableHeight -= this._northStarWidth();

		const verticalScaleFactor = projectAvailableHeight / maxVerticalRelativeSize;
		const height = project.value * verticalScaleFactor;
		const position = this._projectPosition(project.index);

		const x = position[0] - (width / 2);
		const y = position[1] - (height);

		const ERROR_BAR_CAP_WIDTH = 8;

		const hasError = project.error != 0.0;
		const errorStartX = position[0] - (width / ERROR_BAR_CAP_WIDTH);
		const errorEndX = position[0] + (width / ERROR_BAR_CAP_WIDTH);
		const beliefStartX = position[0] - (width / ERROR_BAR_CAP_WIDTH / 2);
		const beliefWidth = width / ERROR_BAR_CAP_WIDTH;
		const errorStartY = y - (project.error * verticalScaleFactor);
		const errorEndY = y + (project.error * verticalScaleFactor);

		const errorStrokeWidth = width / 40;

		const marked = project[MARKED_PROPERTY_NAME];
		const markStartX = errorStartX - (width / 12);
		const markEndX = errorEndX;
		//Deliberately not at center
		const markCenterY = position[1] - (height / 3);
		const markStartY = markCenterY - (height / 12);
		const markEndY = markCenterY + (height / 18);

		return svg`<rect class='project ${project.selected ? 'selected' : 'not-selected'}' x=${x} y=${y} width=${width} height=${height}></rect>
					${marked ?  svg`<path class='mark' d='M ${markStartX}, ${markStartY} L ${markEndX}, ${markEndY}' stroke-width=${errorStrokeWidth}></path>` : ''}
					${hasError ? svg`<path class='error' d='M ${errorStartX}, ${errorStartY} H ${errorEndX} M ${position[0]}, ${errorStartY} V ${errorEndY} M ${errorStartX}, ${errorEndY} H ${errorEndX}' stroke-width=${errorStrokeWidth}></path>
						${this._renderBeliefTicks ? html`${this._collaborators.map(collaborator => svg`<path class='belief' d='M ${beliefStartX},${position[1] - verticalScaleFactor * collaborator.beliefs[project.index]} h ${beliefWidth}' stroke-width='${errorStrokeWidth / 2}'></path>`)}` : ''}
					` : ''}`;
	}

	_connectionSVG(connection) {

		const iPos = this._collaboratorPosition(connection.i);
		const jPos = this._collaboratorPosition(connection.j);

		//There will be two connections rendered on top of each other (each way). But because we use opacity, they will naturally blend.
		return svg`<path class='connection ${connection.active ? 'active' : ''}' stroke-opacity='${connection.active ? 1.0 : connection[STRENGTH_PROPERTY_NAME]}' d='M ${iPos[0]},${iPos[1]} L ${jPos[0]}, ${jPos[1]}' ></path>`;
	}

}

window.customElements.define("schelling-org-renderer", SchellingOrgRenderer);