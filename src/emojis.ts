//Returns [emojiName, emoji] from the set. keyOrRnd can be a function, in which

import {
	Angle,
	EmojiSet, RandomGenerator
} from './types.js';

//case it will be the source of randomness, or a key to select.
export const pickEmoji = (emojiSet : EmojiSet, keyOrRnd : string | RandomGenerator) : [key : string, emoji : string] => {
	const emojiKeys = Object.keys(emojiSet);
	let key = '';
	if (typeof keyOrRnd == 'function') {
		key = emojiKeys[Math.floor(emojiKeys.length * keyOrRnd())];
	} else {
		key = keyOrRnd;
	}
	return [key, emojiSet[key]];
};

export const PROFESSIONAL_PEOPLE_EMOJIS : EmojiSet = {
	'doctor': '🧑‍⚕️',
	'graduate': '🧑‍🎓',
	'teacher': '🧑‍🏫',
	'judge': '🧑‍⚖️',
	'farmer': '🧑‍🌾',
	'chef': '🧑‍🍳',
	'mechanic': '🧑‍🔧',
	'scientist': '🧑‍🔬',
	'artist': '🧑‍🎨',
	'pilot': '🧑‍✈️',
	'firefighter': '🧑‍🚒',
	'police': '👮',
};

export const PEOPLE_EMOJI : EmojiSet = {
	...PROFESSIONAL_PEOPLE_EMOJIS
};

export const GRAZING_FARM_ANIMALS_EMOJIS : EmojiSet = {
	'cow': '🐄',
	'water-buffalo': '🐃',
	'ox': '🐂',
	'ram': '🐏',
	'sheep': '🐑',
	'goat': '🐐'
};

export const ANIMAL_EMOJIS : EmojiSet = {
	...GRAZING_FARM_ANIMALS_EMOJIS,
};

const FULL_ROTATION : Angle =  Math.PI * 2;

const ROTATION_UP = FULL_ROTATION / 4;

/**
 * A map of rotations for known emojis
 */
export const EMOJI_ROTATION : {[emoji : string] : Angle} = {
	'🐞': ROTATION_UP
};
