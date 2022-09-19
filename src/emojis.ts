//Returns [emojiName, emoji] from the set. keyOrRnd can be a function, in which

import {
	EmojiName,
	EmojiInfo,
	EmojiSet,
	KnownEmojiInfo,
	KnownEmojiInfos,
	KnownEmojiSet,
	RandomGenerator,
	KnownEmojiName
} from './types.js';

import {
	TypedObject
} from './typed-object.js';

import {
	ROTATION_UP,
	ROTATION_DOWN,
	ROTATION_LEFT,
	ROTATION_RIGHT
} from './constants.js';

import {
	RAW_EMOJIS
} from './constants-emoji.js';

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

/**
 * Returns a set like set, but only the first instance of any alternate set
 * included. An alternate set is the set of emojis that have a given name, or
 * have that name in their alternateOf property. If you want not to have the
 * *first encountered* of an alternate set, but the base name in the first
 * place, just filter for !info.alternateOf with filteredEmojiSet.
 * @param set - The input set to return a subset of
 * @returns A set like set but with only the first of each alternate set
 * included
 */
export const noAlternatesEmojiSet = (set : KnownEmojiSet) : KnownEmojiSet => {
	const seenItems : {[name in KnownEmojiName]+?: true} = {};
	const result : KnownEmojiSet = {};
	for (const [key, value] of TypedObject.entries(set)) {
		if (value.alternateOf) {
			if (seenItems[value.alternateOf]) continue;
			result[key] = value;
			seenItems[value.alternateOf] = true;
		} else {
			//If we're the main item, it's possible the non-canoical is included
			//already.
			if (seenItems[key]) continue;
			result[key] = value;
			seenItems[key] = true;
		}
	}
	return result;
};

const makeEmojiSet = (infos : KnownEmojiInfos) : KnownEmojiSet => Object.fromEntries(infos.map(info => [info.name, info]));

export const EMOJIS = makeEmojiSet(RAW_EMOJIS);

export const PROFESSIONAL_PEOPLE_EMOJIS = filteredEmojiSet(info => info.person?.professional && !info.person?.gender && !info.person?.skinTone && info.person?.frame == 'torso');

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