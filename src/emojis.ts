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

export const UPWARDS_INSECTS_EMOJIS : EmojiSet = {
	'lady-beetle': '🐞',
	'spider': '🕷️',
	'butteryfly': '🦋',
	'beetle': '🪲',
	'cockroach': '🪳',
	'fly': '🪰',
	'worm': '🪱'
};

export const LEFTWARDS_INSECT_EMOJIS : EmojiSet = {
	'ant': '🐜',
	'caterpillar': '🐛',
	'honeybee': '🐝',
	'cricket': '🦗',
	'mosquito': '🦟',
};

export const RIGHTWARDS_INSECT_EMOJIS : EmojiSet = {
	'snail': '🐌',
};

export const DOWNWARDS_INSECT_EMOJIS : EmojiSet = {
	'scorpion': '🦂'
};

export const INSECT_EMOJIS : EmojiSet = {
	...UPWARDS_INSECTS_EMOJIS,
	...LEFTWARDS_INSECT_EMOJIS,
	...RIGHTWARDS_INSECT_EMOJIS,
	...DOWNWARDS_INSECT_EMOJIS
};

export const ANIMAL_EMOJIS : EmojiSet = {
	...GRAZING_FARM_ANIMALS_EMOJIS,
	...INSECT_EMOJIS
};

const FULL_ROTATION =  Math.PI * 2;

const ROTATION_UP = FULL_ROTATION / 4;
const ROTATION_LEFT = FULL_ROTATION / 2;
const ROTATION_DOWN = FULL_ROTATION  * 3/4;
const ROTATION_RIGHT = 0;

const emojiDirection = (direction: Angle, emojis : EmojiSet) : {[emoji : string] : Angle} => {
	return Object.fromEntries(Object.values(emojis).map(emoji => [emoji, direction]));
};

/**
 * A map of rotations for known emojis
 */
export const EMOJI_ROTATION : {[emoji : string] : Angle} = {
	...emojiDirection(ROTATION_UP, UPWARDS_INSECTS_EMOJIS),
	...emojiDirection(ROTATION_LEFT, LEFTWARDS_INSECT_EMOJIS),
	...emojiDirection(ROTATION_RIGHT, RIGHTWARDS_INSECT_EMOJIS),
	...emojiDirection(ROTATION_DOWN, DOWNWARDS_INSECT_EMOJIS),
	...emojiDirection(ROTATION_DOWN, PEOPLE_EMOJI),
	...emojiDirection(ROTATION_LEFT, GRAZING_FARM_ANIMALS_EMOJIS)
};
