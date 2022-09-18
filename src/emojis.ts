//Returns [emojiName, emoji] from the set. keyOrRnd can be a function, in which

import {
	Angle,
	EmojiInfo,
	EmojiSet,
	RandomGenerator
} from './types.js';

//case it will be the source of randomness, or a key to select.
export const pickEmoji = (emojiSet : EmojiSet, keyOrRnd : string | RandomGenerator) : EmojiInfo=> {
	const emojiKeys = Object.keys(emojiSet);
	let key = '';
	if (typeof keyOrRnd == 'function') {
		key = emojiKeys[Math.floor(emojiKeys.length * keyOrRnd())];
	} else {
		key = keyOrRnd;
	}
	return {
		name: key, 
		emoji: emojiSet[key],
		direction: EMOJI_ROTATION[emojiSet[key]]
	};
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

//TODO: break these into smaller semantic collections
export const LEFTWARDS_GENERIC_ANIMAL_EMOJIS : EmojiSet = {
	'monkey': '🐒',
	'gorilla': '🦍',
	'dog': '🐕',
	'guide-dog': '🦮',
	'service-dog': '🐕‍🦺',
	'poodle': '🐩',
	'racoon': '🦝',
	'cat': '🐈',
	'black-cat': '🐈‍⬛',
	'tiger': '🐅',
	'leopard': '🐆',
	'horse': '🐎',
	'zebra': '🦓',
	'deer': '🦌',
	'pig': '🐖',
	'camel': '🐪',
	'two-hump-camel': '🐫',
	'llama': '🦙',
	'giraffe': '🦒',
	'elephant': '🐘',
	'mammoth': '🦣',
	'rhinoceros': '🦏',
	'hippopotamus': '🦛',
	'mouse': '🐁',
	'rat': '🐀',
	'rabbit': '🐇',
	'chipmunk': '🐿️',
	'beaver': '🦫',
	'hedgehog': '🦔',
	'bat': '🦇',
	'otter': '🦦',
	'skunk': '🦨',
	'kangaroo': '🦘',
	'badger': '🦡',
	'turkey': '🦃',
	'rooster': '🐓',
	'dove': '🕊️',
	'eagle': '🦅',
	'duck': '🦆',
	'swan': '🦢',
	'owl': '🦉',
	'dodo': '🦤',
	'flamingo': '🦩',
	'parrot': '🦜',
	'turtle': '🐢',
	'snake': '🐍',
	'sauropod': '🦕',
	't-rex': '🦖',
	'whale': '🐋',
	'spouting-whale': '🐳',
	'dolphin': '🐬',
	'seal': '🦭',
	'fish': '🐟',
	'tropical-fish': '🐠',
	'blowfish': '🐡',
	'shark': '🦈',
	'squid': '🦑'
};

export const DOWNWARDS_GENERIC_ANIMAL_EMOJIS : EmojiSet = {
	'orangutan': '🦧',
	'baby-chick': '🐥',
	'peacock': '🦚',
	'crocodile': '🐊',
	'octopus': '🐙'
};

export const UPWARDS_GENERIC_ANIMAL_EMOJIS : EmojiSet = {
	'lizard': '🦎',
	'crab': '🦀',
	'lobster': '🦞'
};

export const GENERIC_ANIMAL_EMOJIS : EmojiSet = {
	...LEFTWARDS_GENERIC_ANIMAL_EMOJIS,
	...DOWNWARDS_GENERIC_ANIMAL_EMOJIS,
	...UPWARDS_GENERIC_ANIMAL_EMOJIS
};

export const ANIMAL_EMOJIS : EmojiSet = {
	...GRAZING_FARM_ANIMALS_EMOJIS,
	...INSECT_EMOJIS,
	...LEFTWARDS_GENERIC_ANIMAL_EMOJIS
};

const FULL_ROTATION =  Math.PI * 2;

export const ROTATION_UP : Angle = FULL_ROTATION / 4;
export const ROTATION_LEFT : Angle = FULL_ROTATION / 2;
export const ROTATION_DOWN : Angle = FULL_ROTATION  * 3/4;
export const ROTATION_RIGHT : Angle = 0;

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
	...emojiDirection(ROTATION_LEFT, GRAZING_FARM_ANIMALS_EMOJIS),
	...emojiDirection(ROTATION_LEFT, LEFTWARDS_GENERIC_ANIMAL_EMOJIS),
	...emojiDirection(ROTATION_DOWN, DOWNWARDS_GENERIC_ANIMAL_EMOJIS),
	...emojiDirection(ROTATION_UP, UPWARDS_GENERIC_ANIMAL_EMOJIS)
};
