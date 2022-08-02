import {
	Urn,
	deepCopy
} from '../util.js';

import {
	BaseSimulator
} from '../simulator.js';

import {
	AgentSimulationFrame
} from '../agent-simulator.js';

import {
	PROFESSIONAL_PEOPLE_EMOJIS
} from '../emojis.js';

const SCHELLING_ORG_SIMULATION_NAME = 'schelling-org';

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
const OPTIMISM_PROPERTY_NAME = 'optimism';
const COMMUNICATION_STRATEGY_PROPERTY_NAME = 'communicationStrategy';
const BELIEVABILITY_PROPERTY_NAME = 'believability';
const BELIEVES_PROPERTY_NAME = 'believes';
const DISABLE_SELECTION_PROPERTY_NAME = 'disableSelection';
const LAST_COMMUNICATED_PROJECT_PROPERTY_NAME = 'lastCommunicatedProject';
const DISABLE_BELIEFS_PROPERTY_NAME = 'disableBeliefs';
const RANDOM_INDIVIDUAL_PROPERTY_NAME = 'randomIndividual';

const SHORT_NAMES = {
	value: 'v',
	error: 'e',
	count: 'n',
	collaborators: 'c',
	projects: 'p',
	connections: 'c',
	display: 'dsp',
	debug: 'dbg',
	communication: 'o',
	maxExtraValue: 'mExtV',
	maxErrorValue: 'mErrV',
	twiddleValueAmount: 'tVA',
	avgConnectionLikelihood: 'aCL',
	connectionLikelihoodSpread: 'cLS',
	broadcastLikelihood: 'bL',
	individuals: 'i',
	marked: 'mrkd',
	[EPSILON_PROPERTY_NAME]:'eps',
	[BELIEFS_PROPERTY_NAME]: 'blfs',
	[COMPELLING_PROPERTY_NAME]: 'cmp',
	[EMOJI_PROPERTY_NAME]: 'em',
	[NORTH_STAR_PROPERTY_NAME]: 'nS',
	[OFFSET_PROPERTY_NAME]: 'ofst',
	[STRENGTH_PROPERTY_NAME]: 'str',
	[SPREAD_PROPERTY_NAME]: 'sprd',
	[OFFSET_TYPE_PROPERTY_NAME]: 'oT',
	[MIN_OFFSET_PROPERTY_NAME]: 'minO',
	[MAX_OFFSET_PROPERTY_NAME]: 'maxO',
	[OPTIMISM_PROPERTY_NAME]: 'opt',
	[COMMUNICATION_STRATEGY_PROPERTY_NAME]: 'cS',
	[BELIEVABILITY_PROPERTY_NAME]: 'blv',
	[BELIEVES_PROPERTY_NAME]: 'blv',
	[DISABLE_SELECTION_PROPERTY_NAME]: 'dSel',
	[LAST_COMMUNICATED_PROJECT_PROPERTY_NAME]: 'lCP',
	[DISABLE_BELIEFS_PROPERTY_NAME]: 'dBlf',
	[RANDOM_INDIVIDUAL_PROPERTY_NAME]: 'rI',
};

const OFFSET_TYPE_MANUAL = 'manual';
const OFFSET_TYPE_RANDOM = 'random';
const OFFSET_TYPE_RANDOM_PROJECT = 'random-project';

const COMMUNICATION_STRATEGY_RANDOM = 'random';
const COMMUNICATION_STRATEGY_MIN = 'min';
const COMMUNICATION_STRATEGY_MAX = 'max';
const COMMUNICATION_STRATEGY_DISAGREEMENT = 'disagreement';

const DEFAULT_COMPELLING_VALUE = 0.5;

const DEFAULT_NORTH_STAR_EMOJI = '🌟';

type DisplayValue = {
	debug: boolean;
}

type Collaborator = {
	index: number;
	beliefs: number[];
}

type Project = {
	value: number;
	error: number;
}

type Connection = {
	i: number;
	j: number;
	active: boolean;
}

interface SchellingOrgSimulationFrame extends AgentSimulationFrame {
	display: DisplayValue;
	collaborators: Collaborator[];
	projects: Project[];
	connections: Connection[];
	communication: boolean;
}

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

	override get name() {
		return SCHELLING_ORG_SIMULATION_NAME;
	}

	_firstFrameGenerator(simOptions, rnd) {
		const projectsCount = simOptions.projects.count;
		const collaboratorsCount = simOptions.collaborators.count;
		const projectExtraValue = simOptions.projects.maxExtraValue;
		const projectErrorValue = simOptions.projects.maxErrorValue;
		const projectTwiddleValueAmount = simOptions.projects.twiddleValueAmount;
		const communicationValue = simOptions.communication;
		const displayValue = simOptions.display;
		const northStarValue = simOptions[NORTH_STAR_PROPERTY_NAME] ? deepCopy(simOptions[NORTH_STAR_PROPERTY_NAME]) : undefined;
		const collaboratorEpsilonValue = simOptions.collaborators[EPSILON_PROPERTY_NAME];
		let individualProjectOverrides = simOptions.projects.individuals;
		let individualCollaboratorOverrides = simOptions.collaborators.individuals;
		const randomCollaboratorIndividualValues = simOptions.collaborators[RANDOM_INDIVIDUAL_PROPERTY_NAME];
		const randomProjectIndividualValues = simOptions.projects[RANDOM_INDIVIDUAL_PROPERTY_NAME];
		const avgConnectionLikelihood = simOptions.collaborators.avgConnectionLikelihood;
		const connectionLikelihoodSpread = simOptions.collaborators.connectionLikelihoodSpread;
		const defaultCompellingValue = simOptions.collaborators[COMPELLING_PROPERTY_NAME];
		const broadcastLikelihood = simOptions.collaborators.broadcastLikelihood;
		const communicationStrategy = simOptions.collaborators[COMMUNICATION_STRATEGY_PROPERTY_NAME];
		//This might be undefined if not provided
		const optimismValue = simOptions.collaborators[OPTIMISM_PROPERTY_NAME];
		const believabilityValue = simOptions[NORTH_STAR_PROPERTY_NAME] ? simOptions[NORTH_STAR_PROPERTY_NAME][BELIEVABILITY_PROPERTY_NAME] : 1.0;

		if (northStarValue && northStarValue[OFFSET_TYPE_PROPERTY_NAME] != OFFSET_TYPE_MANUAL) {
			const minOffset = northStarValue[MIN_OFFSET_PROPERTY_NAME];
			const maxOffset = northStarValue[MAX_OFFSET_PROPERTY_NAME];
			if (northStarValue[OFFSET_TYPE_PROPERTY_NAME] == OFFSET_TYPE_RANDOM) {
				northStarValue[OFFSET_PROPERTY_NAME] = (maxOffset - minOffset) * rnd() + minOffset;
			} else {
				//Random choce of projects
				const choices = [];
				for (let i = 0; i < projectsCount; i++) {
					const projectXOffset = projectX(i, projectsCount);
					if (projectXOffset < minOffset) continue;
					if (projectXOffset > maxOffset) continue;
					choices.push(projectXOffset);
				}
				if (choices.length) {
					//If there are no choices, falling back on the value of offset is a reasonable thing to do
					northStarValue[OFFSET_PROPERTY_NAME] = choices[Math.floor(choices.length * rnd())];
				}
			}
		}

		//Assign basic values to projects.
		let projects = [];
		for (let i = 0; i < projectsCount; i++) {

			//Default of no northStar bias
			let northStarBias;
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
				maxExtraValue: projectExtraValue,
				maxErrorValue: projectErrorValue,
				twiddleValueAmount: projectTwiddleValueAmount,
				northStarBias
			});
		}

		if (randomProjectIndividualValues) {
			individualProjectOverrides = new Array(projectsCount);
			const index = Math.floor(rnd() * projectsCount);
			individualProjectOverrides[index] = randomProjectIndividualValues;
		}

		projects = projects.map((item, index) => individualProjectOverrides[index] ? {...item, ...individualProjectOverrides[index]} : item);

		//Assign final value/error values now that we know each one's extra/error
		for (let i = 0; i < projectsCount; i++) {
			if (projects[i].value === undefined) projects[i].value = 1.0 + (rnd() * projects[i].maxExtraValue);
			if (projects[i].error === undefined) projects[i].error = 0.0 + (rnd() * projects[i].maxErrorValue);
			projects[i].value += (rnd() * projects[i].twiddleValueAmount * 2) - projects[i].twiddleValueAmount;
		}

		const emojiValues = Object.values(PROFESSIONAL_PEOPLE_EMOJIS);

		//Assign basic values to collaborators.
		let collaborators = [];
		for (let i = 0; i < collaboratorsCount; i++) {
			collaborators.push({
				index: i,
				[EMOJI_PROPERTY_NAME]: emojiValues[i % emojiValues.length],
				[EPSILON_PROPERTY_NAME]: collaboratorEpsilonValue,
				broadcastLikelihood,
				[COMPELLING_PROPERTY_NAME]: defaultCompellingValue,
				avgConnectionLikelihood,
				connectionLikelihoodSpread,
				[OPTIMISM_PROPERTY_NAME]: optimismValue,
				[COMMUNICATION_STRATEGY_PROPERTY_NAME]: communicationStrategy,
				[BELIEVES_PROPERTY_NAME]: rnd() < believabilityValue
			});
		}

		if (randomCollaboratorIndividualValues) {
			individualCollaboratorOverrides = new Array(collaboratorsCount);
			const index = Math.floor(rnd() * collaboratorsCount);
			individualCollaboratorOverrides[index] = randomCollaboratorIndividualValues;
		}

		//Override individuals' values
		collaborators = collaborators.map((item, index) => individualCollaboratorOverrides[index] ? {...item, ...individualCollaboratorOverrides[index]} : item);

		if (northStarValue) northStarValue[BELIEVABILITY_PROPERTY_NAME] = collaborators.filter(collaborator => collaborator[BELIEVES_PROPERTY_NAME]).length / collaboratorsCount;

		//Set basic beliefs
		for (let i = 0; i < collaboratorsCount; i++) {
			const personalBeliefs = new Array(projects.length);
			for (let j = 0; j < personalBeliefs.length; j++) {
				const project = projects[j];
				//Only count the northStarBias if the user believes. But if
				//there is a north star bias we'll treat it as 0.5 (otherwise
				//the mix with optimism/northStarBias might be out of whack for
				//this one collababorator compared to their peers)
				const northStarBias = collaborators[i][BELIEVES_PROPERTY_NAME] ? project.northStarBias : (project.northStarBias !== undefined ? 0.5 : undefined);
				const optimismBias = collaborators[i][OPTIMISM_PROPERTY_NAME];
				let bias = 0.5;
				if (northStarBias === undefined && optimismBias !== undefined) {
					bias = optimismBias;
				} else if (northStarBias !== undefined && optimismBias === undefined) {
					bias = northStarBias;
				} else if (northStarBias !== undefined && optimismBias !== undefined) {
					bias = (northStarBias + optimismBias) / 2;
				}

				personalBeliefs[j] = randomValueWithBias(rnd, project.value - project.error, project.value + project.error, bias);
			}
			collaborators[i][BELIEFS_PROPERTY_NAME] = personalBeliefs;
		}

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
					const senderAvgConnectionLikelihood = sender.avgConnectionLikelihood;
					const senderConnectionLikelihoodSpread = sender.connectionLikelihoodSpread;
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
			display: displayValue,
			[LAST_COMMUNICATED_PROJECT_PROPERTY_NAME]: -1,
			[NORTH_STAR_PROPERTY_NAME]: northStarValue,
			communication: communicationValue,
			connections,
			collaborators,
			projects
		};
	}

	_selectFinalProject(frame, simOptions, rnd) {
		const collaboratorsCount = simOptions.collaborators.count;
		const projectsCount = simOptions.projects.count;
		let projects = [...frame.projects];
		let collaborators = [...frame.collaborators];
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
			if (maxProjects.some(projectIndex => projects[projectIndex].marked)) maxProjects = maxProjects.filter(projectIndex => projects[projectIndex].marked);

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
		const newConnections = frame.connections.map(connection => ({...connection, active: false}));

		return {
			...frame,
			[LAST_COMMUNICATED_PROJECT_PROPERTY_NAME]: -1,
			projects,
			collaborators,
			connections: newConnections
		};
	}

	_communicationRound(frame, rnd) {

		//Copy connections
		let connections = frame.connections.map(connection => ({...connection}));
		//Set all of them to not active
		connections = connections.map(connection => ({...connection, active: false}));

		//Pick a connection randomly, samping from ones with higher connection weights higher.
		const urn = new Urn<number>(rnd);
		for (const connection of connections) {
			urn.add(connection.index, connection[STRENGTH_PROPERTY_NAME]);
		}
		const connectionIndex = urn.pick();

		const primaryConnection = connections[connectionIndex];
		
		const collaborators = [...frame.collaborators];

		const doBroadcast = rnd() <= collaborators[primaryConnection.i].broadcastLikelihood;

		//If we do broadcast, then we'll transmit to each connection where sender is the sender, and the value is greater than the primaryConnection value.
		const connectionsToSend = doBroadcast ? connections.filter(connection => connection.i == primaryConnection.i && connection[STRENGTH_PROPERTY_NAME] >= primaryConnection[STRENGTH_PROPERTY_NAME]) : [primaryConnection];


		//Which project to communicate about.
		const communicationStrategy = collaborators[primaryConnection.i][COMMUNICATION_STRATEGY_PROPERTY_NAME];

		//By default we do COMMUNCATION_STRATEGY_RANDOM
		let projectIndex = Math.floor(rnd() * frame.projects.length);

		if (communicationStrategy !== COMMUNICATION_STRATEGY_RANDOM) {
			let extremeValue = communicationStrategy == COMMUNICATION_STRATEGY_MIN ? Number.MAX_SAFE_INTEGER : -1 * Number.MAX_SAFE_INTEGER;
			for (let connection of connectionsToSend) {
				const senderBeliefs = collaborators[connection.i][BELIEFS_PROPERTY_NAME];
				const recieverBeliefs = collaborators[connection.j][BELIEFS_PROPERTY_NAME];
				for (let i = 0; i < senderBeliefs.length; i++) {
					const senderProjectBelief = senderBeliefs[i];
					const receiverProjectBelief = recieverBeliefs[i];
					switch (communicationStrategy) {
					case COMMUNICATION_STRATEGY_MIN:
						if (senderProjectBelief < extremeValue) {
							extremeValue = senderProjectBelief;
							projectIndex = i;
						}
						break;
					case COMMUNICATION_STRATEGY_MAX:
						if (senderProjectBelief > extremeValue) {
							extremeValue = senderProjectBelief;
							projectIndex = i;
						}
						break;
					case COMMUNICATION_STRATEGY_DISAGREEMENT:
						const disagreement = Math.abs(senderProjectBelief - receiverProjectBelief);
						if (disagreement > extremeValue) {
							extremeValue = disagreement;
							projectIndex = i;
						}
						break;
					}
				}
			}
		}

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
			[LAST_COMMUNICATED_PROJECT_PROPERTY_NAME]: projectIndex,
			collaborators,
			connections
		};
	}

	override generator(frameIndex, previousFrame, simOptions, rnd) {
		const communicationRounds = simOptions.communication;
		if (frameIndex > communicationRounds) return null;
		let frame = previousFrame || this._firstFrameGenerator(simOptions, rnd);
		frame = {...frame, index: frameIndex};
		if (frame.index < communicationRounds) frame = this._communicationRound(frame, rnd);
		if (frame.index == communicationRounds) frame = this._selectFinalProject(frame, simOptions, rnd);
		return frame;
	}

	override optionsValidator(normalizedSimOptions) {
		//Our validations are mainly served by the config in optionsConfig.
		const individuals = normalizedSimOptions.collaborators.individuals;
		if (!individuals) return;
		const numProjects = normalizedSimOptions.projects.count;
		for (const [i, individual] of individuals.entries()) {
			if (!individual) continue;
			if (!individual[BELIEFS_PROPERTY_NAME]) continue;
			if (individual[BELIEFS_PROPERTY_NAME].length != numProjects) throw new Error('Collaborator ' + i + ' had beliefs provided but they didn\'t match the number of projects');
		}
		return;
	}

	override frameScorer(frame, simOptions) {
		const communicationRounds = simOptions.communication;
		//If we aren't done yet signal indeterminate.
		if (frame.index < communicationRounds) return [-1];
		for (const project of frame.projects) {
			//If we find a single selected project then we succeeded.
			if (project.selected) return [1.0];
		}
		return [0.0];
	}

	override frameValidator(frame) {
		const projects = frame.projects;
		const collaborators = frame.collaborators;
		const connections = frame.connections;
		if (projects) {
			for (const [index, project] of projects.entries()) {
				if (project.index != index) throw new Error('Project ' + index + ' has an invalid index');
			}
		} else {
			throw new Error('Projects is not provided');
		}
		if (collaborators) {
			for (const [index, collaborator] of collaborators.entries()) {
				if (collaborator.index != index) throw new Error('Collaborator ' + index + ' has an invalid index');
				if (typeof collaborator[BELIEFS_PROPERTY_NAME] != 'object' || !Array.isArray(collaborator[BELIEFS_PROPERTY_NAME]) || collaborator[BELIEFS_PROPERTY_NAME].length != projects.length) throw new Error('Collaborator ' + index + ' has an invalid beliefs');
			}
		} else {
			throw new Error('Collaborators is not provided');
		}
		if (connections) {
			for (const [index, connection] of connections.entries()) {
				if (connection.index != index) throw new Error('Connection ' + index + ' has an invalid index');
				if (connection.i < 0 || connection.i >= collaborators.length) throw new Error('Connection ' + index + ' has an invalid index for i');
				if (connection.j < 0 || connection.j >= collaborators.length) throw new Error('Connection ' + index + ' has an invalid index for j');
				if (connection[STRENGTH_PROPERTY_NAME] < 0 || connection[STRENGTH_PROPERTY_NAME] > 1.0) throw new Error('Connection ' + index + ' has an invalid strength');
			}
		} else {
			throw new Error('Connections is not provided');
		}
	}

	override defaultValueForPath(path, simOptions) {
		const parts = path.split('.');
		if (parts.length == 4 && parts[3] == BELIEFS_PROPERTY_NAME){
			const base = super.defaultValueForPath(path, simOptions);
			const length = simOptions.projects.count;
			const result = [];
			for (let i = 0; i < length; i++) {
				result.push(base[0]);
			}
			return result;
		}
		return super.defaultValueForPath(path, simOptions);
	}
	
	override get optionsConfig() {
		return {
			display: {
				example: {
					debug: {
						example: true,
						shortName: SHORT_NAMES.debug || '',
						description: "If true, then the SVG will render debug information",
						optional: true,
					},
					[DISABLE_BELIEFS_PROPERTY_NAME]: {
						example: true,
						shortName: SHORT_NAMES[DISABLE_BELIEFS_PROPERTY_NAME] || '',
						description: "If true, then each individuals' beliefs about the value of a project will be rendered as a tick mark",
						optional: true
					},
					[DISABLE_SELECTION_PROPERTY_NAME]: {
						example: true,
						shortName: SHORT_NAMES[DISABLE_SELECTION_PROPERTY_NAME] || '',
						description: 'If true, then the line connecting each collaborator to the project they pick won\'t be rendered',
						optional: true
					}
				},
				shortName: SHORT_NAMES.display || '',
				optional: true,
				backfill: true,
				description: "An optional object that controls how things render. If not provided, will be interpreted as though it enables no optional rendering.",
				advanced: true
			},
			communication: {
				example: 0,
				optional: true,
				backfill: true,
				default: true,
				shortName: SHORT_NAMES.communication || '',
				description: "How many rounds of communication should be allowed between agents before they decide. 0 is no communication and will render a line of collaborators with walls between them."
			},
			collaborators: {
				example: {
					count: {
						example: 4,
						shortName: SHORT_NAMES.count || '',
						description: "How many collaborators there should be"
					},
					[EPSILON_PROPERTY_NAME]: {
						example: 0.0,
						optional: true,
						backfill: true,
						shortName: SHORT_NAMES[EPSILON_PROPERTY_NAME] || '',
						step: 0.05,
						description: "Project values within this amount of each other will be considered to be the same"
					},
					avgConnectionLikelihood: {
						example: 0.5,
						optional: true,
						backfill: true,
						shortName: SHORT_NAMES.avgConnectionLikelihood || '',
						step: 0.05,
						description: "We compute a range of possible connection likelihoods based on [avgConnectionLikelihood - connectionLikelihoodSpread, avgConnectionLikelihood + connectionLikelihoodSpread] Numbers below 0.0 or 1.0 will be clipped, which is a convenient way of making a lot of them drop out or be maximum strength."
					},
					connectionLikelihoodSpread: {
						example: 0.5,
						optional: true,
						backfill: true,
						shortName: SHORT_NAMES.connectionLikelihoodSpread || '',
						step: 0.05,
						description: "We compute a range of possible connection likelihoods based on [avgConnectionLikelihood - connectionLikelihoodSpread, avgConnectionLikelihood + connectionLikelihoodSpread] Numbers below 0.0 or 1.0 will be clipped, which is a convenient way of making a lot of them drop out or be maximum strength."
					},
					[COMPELLING_PROPERTY_NAME]: {
						example: DEFAULT_COMPELLING_VALUE,
						shortName: SHORT_NAMES[COMPELLING_PROPERTY_NAME] || '',
						description: 'When each individual speaks to another, how much does the receiver update their beliefs, between their old belief and new belief? 0.5 would be moving halfway from old belief to new belief',
						min: 0.0,
						max: 1.0,
						step: 0.05,
						optional: true,
						backfill: true,
					},
					broadcastLikelihood: {
						example: 0.0,
						shortName: SHORT_NAMES.broadcastLikelihood || '',
						description: 'For each time a speaker is selected to present, how likely are they are they to broadcast to multiple people, with any individual with a connection equal to or stronger than the selected connection is communicated with at once?',
						min: 0.0,
						max: 1.0,
						step: 0.05,
						optional: true,
						backfill: true,
					},
					[OPTIMISM_PROPERTY_NAME]: {
						example: 0.5,
						shortName: SHORT_NAMES[OPTIMISM_PROPERTY_NAME] || '',
						description: 'How optimistic or pessimistic the individual is. 1.0 is extremely optimistic--every value will be at the top of the possible range. 0.0 is extremely pessimistic--every value will be at the bottom of the possible range.',
						min: 0.0,
						max: 1.0,
						step: 0.05,
						optional: true
					},
					[COMMUNICATION_STRATEGY_PROPERTY_NAME]: {
						example: COMMUNICATION_STRATEGY_RANDOM,
						shortName: SHORT_NAMES[COMMUNICATION_STRATEGY_PROPERTY_NAME] || '',
						description: 'The communication strategy the individual will use when deciding which project to communicate about',
						options: [
							{
								value: COMMUNICATION_STRATEGY_RANDOM,
								description: 'A random project',
							},
							{
								value: COMMUNICATION_STRATEGY_MIN,
								description: 'The project the speaker is most pessimistic about'
							},
							{
								value: COMMUNICATION_STRATEGY_MAX,
								description: 'The project the speaker is most optimistic about'
							},
							{
								value: COMMUNICATION_STRATEGY_DISAGREEMENT,
								description: 'The project the speaker and receiver disagree most about'
							}
						],
						optional: true,
						backfill: true,
					},
					[RANDOM_INDIVIDUAL_PROPERTY_NAME]: {
						example: {
							[BELIEFS_PROPERTY_NAME]: {
								example: [
									{
										example: 0.0,
									}
								],
								shortName: SHORT_NAMES[BELIEFS_PROPERTY_NAME] || '',
								description: "The starter beliefs of this individual of the values of projects. Must be an array of the same length as number of projects",
								optional: true,
							},
							[EPSILON_PROPERTY_NAME]: {
								example: 0.5,
								shortName: SHORT_NAMES[EPSILON_PROPERTY_NAME] || '',
								step: 0.05,
								description: "The epsilon for this specific individual",
								optional:true,
							},
							[EMOJI_PROPERTY_NAME]: {
								example: 'A',
								shortName: SHORT_NAMES[EMOJI_PROPERTY_NAME] || '',
								description: 'The specific emoji',
								optional:true,
							},
							avgConnectionLikelihood: {
								example: 0.5,
								shortName: SHORT_NAMES.avgConnectionLikelihood || '',
								description: 'avgConnectionLikelihood for this individual',
								optional:true,
							},
							connectionLikelihoodSpread: {
								example: 0.5,
								shortName: SHORT_NAMES.connectionLikelihoodSpread || '',
								description: 'connectionLikelihoodSpread for this individual',
								optional:true,
							},
							[COMPELLING_PROPERTY_NAME]: {
								example: DEFAULT_COMPELLING_VALUE,
								shortName: SHORT_NAMES[COMPELLING_PROPERTY_NAME] || '',
								description: 'When this person speaks to another person, how much does the receiver update their beliefs? 0.5 means the receiver would move their belief to be halfway between their previous belief and the speaker\'s belief',
								max: 1.0,
								min: 0.0,
								step: 0.05,
								optional:true,
							},
							broadcastLikelihood: {
								example: 0.0,
								shortName: SHORT_NAMES.broadcastLikelihood || '',
								description: 'For each time a speaker is selected to present, how likely are they are they to broadcast to multiple people, with any individual with a connection equal to or stronger than the selected connection is communicated with at once?',
								min: 0.0,
								max: 1.0,
								step: 0.05,
								optional: true,
							},
							[OPTIMISM_PROPERTY_NAME]: {
								example: 0.5,
								shortName: SHORT_NAMES[OPTIMISM_PROPERTY_NAME] || '',
								description: 'How optimistic or pessimistic the individual is. 1.0 is extremely optimistic--every value will be at the top of the possible range. 0.0 is extremely pessimistic--every value will be at the bottom of the possible range.',
								min: 0.0,
								max: 1.0,
								step: 0.05,
								optional: true
							},
							[BELIEVES_PROPERTY_NAME]: {
								example: true,
								shortName: SHORT_NAMES[BELIEVES_PROPERTY_NAME] || '',
								description: 'Whether this person believes in the north star or not. If they don\'t believe then they will not be influenced by the effect.',
								optional: true
							},
							[COMMUNICATION_STRATEGY_PROPERTY_NAME]: {
								example: COMMUNICATION_STRATEGY_RANDOM,
								shortName: SHORT_NAMES[COMMUNICATION_STRATEGY_PROPERTY_NAME] || '',
								description: 'The communication strategy the individual will use when deciding which project to communicate about',
								options: [
									{
										value: COMMUNICATION_STRATEGY_RANDOM,
										description: 'A random project',
									},
									{
										value: COMMUNICATION_STRATEGY_MIN,
										description: 'The project the speaker is most pessimistic about'
									},
									{
										value: COMMUNICATION_STRATEGY_MAX,
										description: 'The project the speaker is most optimistic about'
									},
									{
										value: COMMUNICATION_STRATEGY_DISAGREEMENT,
										description: 'The project the speaker and receiver disagree most about'
									}
								],
								optional:true
							}
						},
						shortName: SHORT_NAMES[RANDOM_INDIVIDUAL_PROPERTY_NAME] || '',
						description: "If set, then the individuals array will be set so that a random individual has this configuration provided",
						optional: true,
					},
					individuals: {
						optional: true,
						backfill: true,
						example: [
							{
								example: {
									[BELIEFS_PROPERTY_NAME]: {
										example: [
											{
												example: 0.0,
											}
										],
										shortName: SHORT_NAMES[BELIEFS_PROPERTY_NAME] || '',
										description: "The starter beliefs of this individual of the values of projects. Must be an array of the same length as number of projects",
										optional: true,
									},
									[EPSILON_PROPERTY_NAME]: {
										example: 0.5,
										shortName: SHORT_NAMES[EPSILON_PROPERTY_NAME] || '',
										step: 0.05,
										description: "The epsilon for this specific individual",
										optional:true,
									},
									[EMOJI_PROPERTY_NAME]: {
										example: 'A',
										shortName: SHORT_NAMES[EMOJI_PROPERTY_NAME] || '',
										description: 'The specific emoji',
										optional:true,
									},
									avgConnectionLikelihood: {
										example: 0.5,
										shortName: SHORT_NAMES.avgConnectionLikelihood || '',
										description: 'avgConnectionLikelihood for this individual',
										optional:true,
									},
									connectionLikelihoodSpread: {
										example: 0.5,
										shortName: SHORT_NAMES.connectionLikelihoodSpread || '',
										description: 'connectionLikelihoodSpread for this individual',
										optional:true,
									},
									[COMPELLING_PROPERTY_NAME]: {
										example: DEFAULT_COMPELLING_VALUE,
										shortName: SHORT_NAMES[COMPELLING_PROPERTY_NAME] || '',
										description: 'When this person speaks to another person, how much does the receiver update their beliefs? 0.5 means the receiver would move their belief to be halfway between their previous belief and the speaker\'s belief',
										max: 1.0,
										min: 0.0,
										step: 0.05,
										optional:true,
									},
									broadcastLikelihood: {
										example: 0.0,
										shortName: SHORT_NAMES.broadcastLikelihood || '',
										description: 'For each time a speaker is selected to present, how likely are they are they to broadcast to multiple people, with any individual with a connection equal to or stronger than the selected connection is communicated with at once?',
										min: 0.0,
										max: 1.0,
										step: 0.05,
										optional: true,
									},
									[OPTIMISM_PROPERTY_NAME]: {
										example: 0.5,
										shortName: SHORT_NAMES[OPTIMISM_PROPERTY_NAME] || '',
										description: 'How optimistic or pessimistic the individual is. 1.0 is extremely optimistic--every value will be at the top of the possible range. 0.0 is extremely pessimistic--every value will be at the bottom of the possible range.',
										min: 0.0,
										max: 1.0,
										step: 0.05,
										optional: true
									},
									[BELIEVES_PROPERTY_NAME]: {
										example: true,
										shortName: SHORT_NAMES[BELIEVES_PROPERTY_NAME] || '',
										description: 'Whether this person believes in the north star or not. If they don\'t believe then they will not be influenced by the effect.',
										optional: true
									},
									[COMMUNICATION_STRATEGY_PROPERTY_NAME]: {
										example: COMMUNICATION_STRATEGY_RANDOM,
										shortName: SHORT_NAMES[COMMUNICATION_STRATEGY_PROPERTY_NAME] || '',
										description: 'The communication strategy the individual will use when deciding which project to communicate about',
										options: [
											{
												value: COMMUNICATION_STRATEGY_RANDOM,
												description: 'A random project',
											},
											{
												value: COMMUNICATION_STRATEGY_MIN,
												description: 'The project the speaker is most pessimistic about'
											},
											{
												value: COMMUNICATION_STRATEGY_MAX,
												description: 'The project the speaker is most optimistic about'
											},
											{
												value: COMMUNICATION_STRATEGY_DISAGREEMENT,
												description: 'The project the speaker and receiver disagree most about'
											}
										],
										optional: true
									},
								},
								description: "An individual",
								optional: true
							}
						],
						shortName: SHORT_NAMES.individuals || '',
						description: "individuals is set to override the computed individuals with the given properties. null values will be ignored, and keys not in the override will be left in place."
					}
				},
				optional: true,
				backfill: true,
				default: true,
				shortName: SHORT_NAMES.collaborators || '',
				description: "Information on the collaborators"
			},
			projects: {
				example: {
					count: {
						example: 4,
						shortName: SHORT_NAMES.count || '',
						description: "How many projects there are"
					},
					maxExtraValue: {
						example: 0.0,
						optional: true,
						backfill: true,
						shortName: SHORT_NAMES.maxExtraValue || '',
						step: 0.05,
						description: "Each project will get between 0.0 and this number randomly set on top of 1.0 for the value"
					},
					maxErrorValue: {
						example: 0.0,
						optional: true,
						backfill: true,
						shortName: SHORT_NAMES.maxErrorValue || '',
						step: 0.05,
						description: 'Each project will get between 0.0 and this number randomly set, which are the "error bars" for the value; its value is considered by collaborators to be somewhere within those values.'
					},
					twiddleValueAmount: {
						example: 0.0,
						shortName: SHORT_NAMES.twiddleValueAmount || '',
						optional: true,
						backfill: true,
						step: 0.01,
						description: "After a value is set for each project, twiddle it up or down by a random amount beteen 0.0 and this number."
					},
					[RANDOM_INDIVIDUAL_PROPERTY_NAME]: {
						example: {
							marked: {
								example: false,
								shortName: SHORT_NAMES.marked || '',
								description: "A marked project shows up distinctively; collaborators, when deciding between two projects that look like the same value, will prefer the marked one.",
								optional: true
							},
							maxExtraValue: {
								example: 0.0,
								shortName: SHORT_NAMES.maxExtraValue || '',
								step: 0.05,
								optional: true,
								description: "Each project will get between 0.0 and this number randomly set on top of 1.0 for the value"
							},
							maxErrorValue: {
								example: 0.0,
								shortName: SHORT_NAMES.maxErrorValue || '',
								step: 0.05,
								optional: true,
								description: 'Each project will get between 0.0 and this number randomly set, which are the "error bars" for the value; its value is considered by collaborators to be somewhere within those values.'
							},
							twiddleValueAmount: {
								example: 0.0,
								shortName: SHORT_NAMES.twiddleValueAmount || '',
								optional: true,
								step: 0.01,
								description: "After a value is set for each project, twiddle it up or down by a random amount beteen 0.0 and this number."
							},
							value: {
								example: 1.0,
								shortName: SHORT_NAMES.value || '',
								step: 0.05,
								description: "Value is the height of the project, in units of 1.0 = width",
								optional: true
							},
							error: {
								example: 0.0,
								shortName: SHORT_NAMES.error || '',
								step: 0.05,
								description: "The error bars for this value; collaborators will consider the true value to be somewhere within value +/- this value",
								optional: true
							}
						},
						shortName: SHORT_NAMES[RANDOM_INDIVIDUAL_PROPERTY_NAME] || '',
						optional:true,
						description: "If provided, each run the individuals overrides will have a random individual provided precisely these overrides"
					},
					individuals: {
						example: [
							{
								example: {
									marked: {
										example: false,
										shortName: SHORT_NAMES.marked || '',
										description: "A marked project shows up distinctively; collaborators, when deciding between two projects that look like the same value, will prefer the marked one.",
										optional: true
									},
									maxExtraValue: {
										example: 0.0,
										shortName: SHORT_NAMES.maxExtraValue || '',
										step: 0.05,
										optional: true,
										description: "Each project will get between 0.0 and this number randomly set on top of 1.0 for the value"
									},
									maxErrorValue: {
										example: 0.0,
										shortName: SHORT_NAMES.maxErrorValue || '',
										step: 0.05,
										optional: true,
										description: 'Each project will get between 0.0 and this number randomly set, which are the "error bars" for the value; its value is considered by collaborators to be somewhere within those values.'
									},
									twiddleValueAmount: {
										example: 0.0,
										shortName: SHORT_NAMES.twiddleValueAmount || '',
										optional: true,
										step: 0.01,
										description: "After a value is set for each project, twiddle it up or down by a random amount beteen 0.0 and this number."
									},
									value: {
										example: 1.0,
										shortName: SHORT_NAMES.value || '',
										step: 0.05,
										description: "Value is the height of the project, in units of 1.0 = width",
										optional: true
									},
									error: {
										example: 0.0,
										shortName: SHORT_NAMES.error || '',
										step: 0.05,
										description: "The error bars for this value; collaborators will consider the true value to be somewhere within value +/- this value",
										optional: true
									}
								},
								shortName: SHORT_NAMES.display || '',
								description: "A specific project",
								optional:true,
							}
						],
						shortName: SHORT_NAMES.individuals || '',
						optional: true,
						backfill: true,
						description: "individuals is set to override the computed individuals with the given properties. null values will be ignored, and keys not in the override will be left in place."
					}
				},
				optional: true,
				backfill: true,
				default: true,
				shortName: SHORT_NAMES.projects || '',
				description: "Information on projects"
			},
			[NORTH_STAR_PROPERTY_NAME]: {
				example: {
					[EMOJI_PROPERTY_NAME]: {
						example: DEFAULT_NORTH_STAR_EMOJI,
						optional: true,
						backfill: true,
						default: true,
						shortName: SHORT_NAMES[EMOJI_PROPERTY_NAME] || '',
						description: "The emoji to render for the north star",
					},
					[OFFSET_TYPE_PROPERTY_NAME]: {
						example: OFFSET_TYPE_MANUAL,
						optional: true,
						backfill: true,
						default: true,
						shortName: SHORT_NAMES[OFFSET_TYPE_PROPERTY_NAME] || '',
						options: [
							{
								value: OFFSET_TYPE_MANUAL,
								description: 'The offset is specifically the value of ' + OFFSET_PROPERTY_NAME
							},
							{
								value: OFFSET_TYPE_RANDOM,
								description: 'The offset is a random value per run, between ' + MIN_OFFSET_PROPERTY_NAME + ' and ' + MAX_OFFSET_PROPERTY_NAME,
							},
							{
								value: OFFSET_TYPE_RANDOM_PROJECT,
								description: 'The offset is a random value per run, between ' + MIN_OFFSET_PROPERTY_NAME + ' and ' + MAX_OFFSET_PROPERTY_NAME + ', but snapped to be precisely above a project',
							},
						]
					},
					[MIN_OFFSET_PROPERTY_NAME]: {
						example: 0.0,
						optional: true,
						backfill: true,
						default: true,
						hide: values => values[OFFSET_TYPE_PROPERTY_NAME] == OFFSET_TYPE_MANUAL,
						shortName: SHORT_NAMES[MIN_OFFSET_PROPERTY_NAME] || '',
						description: 'The lowest random offset to choose if ' + OFFSET_TYPE_PROPERTY_NAME + ' is randomly selected',
						min: 0.0,
						max: 1.0,
						step: 0.05,
					},
					[MAX_OFFSET_PROPERTY_NAME]: {
						example: 1.0,
						optional: true,
						backfill: true,
						default: true,
						hide: values => values[OFFSET_TYPE_PROPERTY_NAME] == OFFSET_TYPE_MANUAL,
						shortName: SHORT_NAMES[MAX_OFFSET_PROPERTY_NAME] || '',
						description: 'The highest random offset to choose if ' + OFFSET_TYPE_PROPERTY_NAME + ' is randomly selected',
						min: 0.0,
						max: 1.0,
						step: 0.05,
					},
					[OFFSET_PROPERTY_NAME]: {
						example: 0.5,
						optional: true,
						backfill: true,
						default: true,
						hide: (values) => values[OFFSET_TYPE_PROPERTY_NAME] != OFFSET_TYPE_MANUAL,
						shortName: SHORT_NAMES[OFFSET_PROPERTY_NAME] || '',
						description: "How far from fully at left to fully at right is the northstar? This value will be used directly if " + OFFSET_TYPE_PROPERTY_NAME + " is " + OFFSET_TYPE_MANUAL + ", otherwise it will be set implicitly.",
						min: 0.0,
						max: 1.0,
						step: 0.05,
					},
					[STRENGTH_PROPERTY_NAME]: {
						example: 0.5,
						optional: true,
						backfill: true,
						default: true,
						shortName: SHORT_NAMES[STRENGTH_PROPERTY_NAME] || '',
						description: "How strong is the north star effect?",
						min: 0.0,
						max: 1.0,
						step: 0.05
					},
					[SPREAD_PROPERTY_NAME]: {
						example: 0.25,
						optional: true,
						backfill: true,
						default: true,
						shortName: SHORT_NAMES[SPREAD_PROPERTY_NAME] || '',
						description: 'How wide is the positive effect of the northstar affect (trading off linearly from the offset position to plus or minus by this amount)',
						min: 0.0,
						max: 1.0,
						step: 0.05,
					},
					[BELIEVABILITY_PROPERTY_NAME]: {
						example: 1.0,
						optional: true,
						backfill: true,
						default: true,
						shortName: SHORT_NAMES[BELIEVABILITY_PROPERTY_NAME] || '',
						description: 'The proportion of collaborators who will believe in this north star (will have their ' + BELIEVES_PROPERTY_NAME + ' set to true).',
						min: 0.0,
						max: 1.0,
						step: 0.05
					}
				},
				shortName: SHORT_NAMES[NORTH_STAR_PROPERTY_NAME] || '',
				description: "Information on an (optional) north star, which people will tend to pick towards",
				optional: true
			}
		};
	}

	override renderer() {
		return new SchellingOrgRenderer();
	}
}

export default SchellingOrgSimulator;

import { LitElement, html, css, svg} from 'lit';
import { property } from 'lit/decorators.js';

const COLLABORATOR_CIRCLE_FACTOR = 7;

// This is a reusable element. It is not connected to the store. You can
// imagine that it could just as well be a third-party element that you
// got from someone else.
class SchellingOrgRenderer extends LitElement {

	@property({ type: Object })
	frame: SchellingOrgSimulationFrame;

	@property({ type: Number })
	width: number;

	@property({ type: Number })
	height: number;

	static override get styles() {
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

			.belief.sender {
				stroke: var(--primary-color);
			}

			.belief.receiver {
				stroke: var(--secondary-color);
			}

			.non-believer {
				opacity: 0.5;
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

	override render() {
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
		return this.frame.projects || [];
	}

	get _connections() {
		if (!this.frame) return [];
		return this.frame.connections || [];
	}

	get _collaborators() {
		if (!this.frame) return [];
		return this.frame.collaborators || [];
	}

	get _communication() {
		if (!this.frame) return false;
		return this.frame.communication;
	}

	get _debug() {
		if (!this.frame) return false;
		return this.frame.display?.debug || false;
	}

	get _disableSelection() {
		if (!this.frame) return false;
		const displayValue = this.frame.display || {};
		return displayValue[DISABLE_SELECTION_PROPERTY_NAME] || false;
	}

	get _lastCommunicatedProject() {
		if (!this.frame) return -1;
		return this.frame[LAST_COMMUNICATED_PROJECT_PROPERTY_NAME];
	}

	get _renderBeliefTicks() {
		if (!this.frame) return false;
		const displayValue = this.frame.display || {};
		const val = displayValue[DISABLE_BELIEFS_PROPERTY_NAME] || false;
		return !val;
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
		return svg`<text x=${x} y=${y} text-anchor='middle' dominant-baseline='middle' font-size='${width}' opacity='${northStar[BELIEVABILITY_PROPERTY_NAME]}'>${northStar[EMOJI_PROPERTY_NAME]}</text>`;
	}

	_collaboratorVerticalLine() {
		return this._communication ? (this.height / 10) * COLLABORATOR_CIRCLE_FACTOR : (this.height / 4) * 3;
	}

	_collaboratorCircleRadius() {
		return this.width / COLLABORATOR_CIRCLE_FACTOR;
	}

	_collaboratorWidth() {
		return this.width / (this.frame.collaborators.length * 2 - 1);
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
		const numCollaborators = this.frame.collaborators.length;
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
		${projectPosition && !this._disableSelection ? svg`<path class='selected-project' d='M ${projectPosition[0]},${projectPosition[1]} L ${x}, ${y}'></path>` : ''}
		<text x=${x} y=${y} text-anchor='middle' dominant-baseline='middle' font-size='${width * 0.8}' class='${collaborator[BELIEVES_PROPERTY_NAME] ? 'believer' : 'non-believer'}'>${collaborator[EMOJI_PROPERTY_NAME]}</text>
		${this._communication ? '' : svg`<path class='wall' d='M ${x + width},${y - width / 2} L ${x + width},${y + width /2}' stroke-width='${width / 10}'></path>`}`;
	}

	_projectWidth() {
		return projectWidth(this.frame.projects.length, this.width);
	}

	//Returns the x, y of the bottom center of the project bar
	_projectPosition(index) {
		if (index == undefined) return null;
		const x = projectX(index, this.frame.projects.length, this.width);
		const y = this.height / 3;
		return [x, y];
	}

	_projectSVG(project) {

		const width = this._projectWidth();
		//Size is so the largest bar goes to the top of the area, or smaller if under 2.0 total size
		const maxVerticalRelativeSize = Math.max(Math.max(...this._projects.map(project => project.value + project.error)), 2.0);

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

		const marked = project.marked;
		const markStartX = errorStartX - (width / 12);
		const markEndX = errorEndX;
		//Deliberately not at center
		const markCenterY = position[1] - (height / 3);
		const markStartY = markCenterY - (height / 12);
		const markEndY = markCenterY + (height / 18);

		const isCurrentProject = project.index == this._lastCommunicatedProject;
		const activeConnections = this._connections.filter(connection => connection.active);
		const senderIndex = activeConnections.map(connection => connection.i)[0];
		const receiverIndexes = Object.fromEntries(activeConnections.map(connection => [connection.j, true]));

		return svg`<rect class='project ${project.selected ? 'selected' : 'not-selected'}' x=${x} y=${y} width=${width} height=${height}></rect>
					${marked ?  svg`<path class='mark' d='M ${markStartX}, ${markStartY} L ${markEndX}, ${markEndY}' stroke-width=${errorStrokeWidth}></path>` : ''}
					${hasError ? svg`<path class='error' d='M ${errorStartX}, ${errorStartY} H ${errorEndX} M ${position[0]}, ${errorStartY} V ${errorEndY} M ${errorStartX}, ${errorEndY} H ${errorEndX}' stroke-width=${errorStrokeWidth}></path>
						${this._renderBeliefTicks ? html`${this._collaborators.map(collaborator => svg`<path class='belief ${isCurrentProject ? (senderIndex == collaborator.index ? 'sender' : (receiverIndexes[collaborator.index] ? 'receiver' : '')) : ''}' d='M ${beliefStartX},${position[1] - verticalScaleFactor * collaborator.beliefs[project.index]} h ${beliefWidth}' stroke-width='${errorStrokeWidth / 2}'></path>`)}` : ''}
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