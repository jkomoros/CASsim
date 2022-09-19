//Returns [emojiName, emoji] from the set. keyOrRnd can be a function, in which

import {
	EmojiName,
	EmojiInfo,
	EmojiSet,
	KnownEmojiInfo,
	KnownEmojiInfos,
	KnownEmojiSet,
	RandomGenerator
} from './types.js';

import {
	ROTATION_UP,
	ROTATION_DOWN,
	ROTATION_LEFT,
	ROTATION_RIGHT
} from './constants.js';

import {
	RAW_EMOJIS
} from './emoji-constants.js';

//case it will be the source of randomness, or a key to select.
export const pickEmoji = (emojiSet : EmojiSet, keyOrRnd : EmojiName | RandomGenerator) : EmojiInfo=> {
	const emojiKeys = Object.keys(emojiSet) as EmojiName[];
	let key : EmojiName = '';
	if (typeof keyOrRnd == 'function') {
		key = emojiKeys[Math.floor(emojiKeys.length * keyOrRnd())];
	} else {
		key = keyOrRnd;
	}
	return emojiSet[key];
};

export const filteredEmojiSet = (include : (info : KnownEmojiInfo) => boolean, emojis : KnownEmojiInfos = RAW_EMOJIS) : KnownEmojiSet => {
	return makeEmojiSet(emojis.filter(include));
};

const makeEmojiSet = (infos : KnownEmojiInfos) : KnownEmojiSet => Object.fromEntries(infos.map(info => [info.name, info]));

export const EMOJIS = makeEmojiSet(RAW_EMOJIS);

export const PROFESSIONAL_PEOPLE_EMOJIS = filteredEmojiSet(info => info.person?.professional);

export const PEOPLE_EMOJI : EmojiSet = {
	...PROFESSIONAL_PEOPLE_EMOJIS
};

export const GRAZING_FARM_ANIMALS_EMOJIS = filteredEmojiSet(info => info.animal?.grazes && info.animal?.habitat == 'farm');

export const UPWARDS_INSECTS_EMOJIS  = filteredEmojiSet(info => info.animal?.kind == 'insect' && info.direction == ROTATION_UP);

export const LEFTWARDS_INSECT_EMOJIS = filteredEmojiSet(info => info.animal?.kind == 'insect' && info.direction == ROTATION_LEFT);

export const RIGHTWARDS_INSECT_EMOJIS = filteredEmojiSet(info => info.animal?.kind == 'insect' && info.direction == ROTATION_RIGHT);

export const DOWNWARDS_INSECT_EMOJIS = filteredEmojiSet(info => info.animal?.kind == 'insect' && info.direction == ROTATION_DOWN);

export const INSECT_EMOJIS : EmojiSet = {
	...UPWARDS_INSECTS_EMOJIS,
	...LEFTWARDS_INSECT_EMOJIS,
	...RIGHTWARDS_INSECT_EMOJIS,
	...DOWNWARDS_INSECT_EMOJIS
};

export const ANIMAL_EMOJIS = filteredEmojiSet(info => !!info.animal);

//Map of emoji value to info
export const EMOJI_TO_INFO_MAP = Object.fromEntries(RAW_EMOJIS.map(info => [info.emoji, info]));