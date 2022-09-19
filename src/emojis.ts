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
	return emojiSet[key];
};

const FULL_ROTATION =  Math.PI * 2;

export const ROTATION_UP : Angle = FULL_ROTATION / 4;
export const ROTATION_LEFT : Angle = FULL_ROTATION / 2;
export const ROTATION_DOWN : Angle = FULL_ROTATION  * 3/4;
export const ROTATION_RIGHT : Angle = 0;

const RAW_EMOJIS : EmojiInfo[] = [
	{
		name: 'doctor',
		emoji: '🧑‍⚕️',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'graduate',
		emoji: '🧑‍🎓',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'teacher',
		emoji: '🧑‍🏫',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'judge',
		emoji: '🧑‍⚖️',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'farmer',
		emoji: '🧑‍🌾',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'chef',
		emoji: '🧑‍🍳',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'mechanic',
		emoji: '🧑‍🔧',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'scientist',
		emoji: '🧑‍🔬',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'artist',
		emoji: '🧑‍🎨',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'pilot',
		emoji: '🧑‍✈️',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'firefighter',
		emoji: '🧑‍🚒',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'police',
		emoji: '👮',
		direction: ROTATION_DOWN,
		person: {
			professional: true
		}
	},
	{
		name: 'cow',
		emoji: '🐄',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			habitat: 'farm',
			diet: 'herbivore',
			grazes: true
		}
	},
	{
		name: 'water-buffalo',
		emoji: '🐃',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			habitat: 'farm',
			diet: 'herbivore',
			grazes: true
		}
	},
	{
		name: 'ox',
		emoji: '🐂',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			habitat: 'farm',
			diet: 'herbivore',
			grazes: true
		}
	},
	{
		name: 'ram',
		emoji: '🐏',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			habitat: 'farm',
			diet: 'herbivore',
			grazes: true
		}
	},
	{
		name: 'sheep',
		emoji: '🐑',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			habitat: 'farm',
			diet: 'herbivore',
			grazes: true
		}
	},
	{
		name: 'goat',
		emoji: '🐐',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			habitat: 'farm',
			diet: 'herbivore',
			grazes: true
		}
	},
	{
		name: 'lady-beetle',
		emoji: '🐞',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect',
			diet: 'omnivore',
			habitat: 'forest'
		}
	},
	{
		name: 'spider',
		emoji: '🕷️',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect',
			diet: 'carnivore',
			habitat: 'forest'
		}
	},
	{
		name: 'butterfly',
		emoji: '🦋',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'beetle',
		emoji: '🪲',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'cockroach',
		emoji: '🪳',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'fly',
		emoji: '🪰',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'worm',
		emoji: '🪱',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'ant',
		emoji: '🐜',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'caterpillar',
		emoji: '🐛',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'honeybee',
		emoji: '🐝',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'cricket',
		emoji: '🦗',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'mosquito',
		emoji: '🦟',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'snail',
		emoji: '🐌',
		direction: ROTATION_RIGHT,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'scorpion',
		emoji: '🦂',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'insect',
			diet: 'carnivore',
			habitat: 'desert'
		}
	},
	{
		name: 'monkey',
		emoji: '🐒',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'jungle'
		}
	},
	{
		name: 'gorilla',
		emoji: '🦍',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'jungle'
		}
	},
	{
		name: 'dog',
		emoji: '🐕',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'house'
		}
	},
	{
		name: 'guide-dog',
		emoji: '🦮',
		direction: ROTATION_LEFT,
		alternateOf: 'dog',
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'house'
		}
	},
	{
		name: 'service-dog',
		emoji: '🐕‍🦺',
		direction: ROTATION_LEFT,
		alternateOf: 'dog',
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'house'
		}
	},
	{
		name: 'poodle',
		emoji: '🐩',
		direction: ROTATION_LEFT,
		alternateOf: 'dog',
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'house'
		}
	},
	{
		name: 'racoon',
		emoji: '🦝',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'forest'
		}
	},
	{
		name: 'cat',
		emoji: '🐈',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'house'
		}
	},
	{
		name: 'black-cat',
		emoji: '🐈‍⬛',
		direction: ROTATION_LEFT,
		alternateOf: 'cat',
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'house'
		}
	},
	{
		name: 'tiger',
		emoji: '🐅',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'jungle'
		}
	},
	{
		name: 'leopard',
		emoji: '🐆',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'jungle'
		}
	},
	{
		name: 'horse',
		emoji: '🐎',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'farm'
		}
	},
	{
		name: 'zebra',
		emoji: '🦓',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'savanah'
		}
	},
	{
		name: 'deer',
		emoji: '🦌',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'pig',
		emoji: '🐖',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'farm'
		}
	},
	{
		name: 'camel',
		emoji: '🐪',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'desert'
		}
	},
	{
		name: 'two-hump-camel',
		emoji: '🐫',
		direction: ROTATION_LEFT,
		alternateOf: 'camel',
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'desert'
		}
	},
	{
		name: 'llama',
		emoji: '🦙',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'forest',
			grazes: true
		}
	},
	{
		name: 'giraffe',
		emoji: '🦒',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'savanah'
		}
	},
	{
		name: 'elephant',
		emoji: '🐘',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'savanah'
		}
	},
	{
		name: 'mammoth',
		emoji: '🦣',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'tundra',
			extinct: true
		}
	},
	{
		name: 'rhinoceros',
		emoji: '🦏',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'savanah'
		}
	},
	{
		name: 'hippopotamus',
		emoji: '🦛',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'savanah',
			swims: true
		}
	},
	{
		name: 'mouse',
		emoji: '🐁',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'house'
		}
	},
	{
		name: 'rat',
		emoji: '🐀',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'house'
		}
	},
	{
		name: 'rabbit',
		emoji: '🐇',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'house'
		}
	},
	{
		name: 'chipmunk',
		emoji: '🐿️',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'beaver',
		emoji: '🦫',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'forest',
			swims: true
		}
	},
	{
		name: 'hedgehog',
		emoji: '🦔',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'bat',
		emoji: '🦇',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'forest'
		}
	},
	{
		name: 'otter',
		emoji: '🦦',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'forest',
			swims: true
		}
	},
	{
		name: 'skunk',
		emoji: '🦨',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'kangaroo',
		emoji: '🦘',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'savanah'
		}
	},
	{
		name: 'badger',
		emoji: '🦡',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'forest'
		}
	},
	{
		name: 'turkey',
		emoji: '🦃',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'farm'
		}
	},
	{
		name: 'rooster',
		emoji: '🐓',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'farm'
		}
	},
	{
		name: 'dove',
		emoji: '🕊️',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'forest'
		}
	},
	{
		name: 'eagle',
		emoji: '🦅',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'omnivore',
			habitat: 'forest'
		}
	},
	{
		name: 'duck',
		emoji: '🦆',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'farm',
			swims: true
		}
	},
	{
		name: 'swan',
		emoji: '🦢',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'farm',
			swims: true
		}
	},
	{
		name: 'owl',
		emoji: '🦉',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'omnivore',
			habitat: 'forest'
		}
	},
	{
		name: 'dodo',
		emoji: '🦤',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'forest',
			extinct: true
		}
	},
	{
		name: 'flamingo',
		emoji: '🦩',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'savanah'
		}
	},
	{
		name: 'parrot',
		emoji: '🦜',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'jungle'
		}
	},
	{
		name: 'turtle',
		emoji: '🐢',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'reptile',
			diet: 'herbivore',
			habitat: 'desert'
		}
	},
	{
		name: 'snake',
		emoji: '🐍',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'reptile',
			diet: 'carnivore',
			habitat: 'desert'
		}
	},
	{
		name: 'sauropod',
		emoji: '🦕',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'reptile',
			diet: 'herbivore',
			habitat: 'jungle',
			extinct: true
		}
	},
	{
		name: 't-rex',
		emoji: '🦖',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'reptile',
			diet: 'carnivore',
			habitat: 'jungle',
			extinct: true
		}
	},
	{
		name: 'whale',
		emoji: '🐋',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'ocean',
			swims: true,
			underwater: true
		}
	},
	{
		name: 'spouting-whale',
		emoji: '🐳',
		direction: ROTATION_LEFT,
		alternateOf: 'whale',
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'ocean',
			swims: true,
			underwater: true
		}
	},
	{
		name: 'dolphin',
		emoji: '🐬',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'ocean',
			swims: true,
			underwater: true
		}
	},
	{
		name: 'seal',
		emoji: '🦭',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'ocean',
			swims: true
		}
	},
	{
		name: 'fish',
		emoji: '🐟',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'fish',
			diet: 'herbivore',
			habitat: 'ocean',
			swims: true,
			underwater: true
		}
	},
	{
		name: 'tropical-fish',
		emoji: '🐠',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'fish',
			diet: 'herbivore',
			habitat: 'ocean',
			swims: true,
			underwater: true
		}
	},
	{
		name: 'blowfish',
		emoji: '🐡',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'fish',
			diet: 'herbivore',
			habitat: 'ocean',
			swims: true,
			underwater: true
		}
	},
	{
		name: 'shark',
		emoji: '🦈',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'fish',
			diet: 'carnivore',
			habitat: 'ocean',
			swims: true,
			underwater: true
		}
	},
	{
		name: 'squid',
		emoji: '🦑',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'fish',
			diet: 'carnivore',
			habitat: 'ocean',
			swims: true,
			underwater: true
		}
	},
	{
		name: 'orangutan',
		emoji: '🦧',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'jungle'
		}
	},
	{
		name: 'baby-chick',
		emoji: '🐥',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'farm'
		}
	},
	{
		name: 'peacock',
		emoji: '🦚',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'savanah'
		}
	},
	{
		name: 'crocodile',
		emoji: '🐊',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'reptile',
			diet: 'carnivore',
			habitat: 'savanah',
			swims: true
		}
	},
	{
		name: 'octopus',
		emoji: '🐙',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'fish',
			diet: 'carnivore',
			habitat: 'ocean',
			swims: true,
			underwater: true
		}
	},
	{
		name: 'lizard',
		emoji: '🦎',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'reptile',
			diet: 'carnivore',
			habitat: 'desert'
		}
	},
	{
		name: 'crab',
		emoji: '🦀',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'fish',
			diet: 'carnivore',
			habitat: 'ocean',
			underwater: true
		}
	},
	{
		name: 'lobster',
		emoji: '🦞',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'fish',
			diet: 'carnivore',
			habitat: 'ocean',
			underwater: true
		}
	},
];

export const filteredEmojiSet = (include : (info : EmojiInfo) => boolean, emojis : EmojiInfo[] = RAW_EMOJIS) : EmojiSet => {
	return makeEmojiSet(emojis.filter(include));
};

const makeEmojiSet = (infos : EmojiInfo[]) : EmojiSet => Object.fromEntries(infos.map(info => [info.name, info]));

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