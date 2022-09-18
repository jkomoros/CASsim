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
			grazes: true
		}
	},
	{
		name: 'water-buffalo',
		emoji: '🐃',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			grazes: true
		}
	},
	{
		name: 'ox',
		emoji: '🐂',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			grazes: true
		}
	},
	{
		name: 'ram',
		emoji: '🐏',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			grazes: true
		}
	},
	{
		name: 'sheep',
		emoji: '🐑',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			grazes: true
		}
	},
	{
		name: 'goat',
		emoji: '🐐',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			grazes: true
		}
	},
	{
		name: 'lady-beetle',
		emoji: '🐞',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'spider',
		emoji: '🕷️',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'butterfly',
		emoji: '🦋',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'beetle',
		emoji: '🪲',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'cockroach',
		emoji: '🪳',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'fly',
		emoji: '🪰',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'worm',
		emoji: '🪱',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'ant',
		emoji: '🐜',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'caterpillar',
		emoji: '🐛',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'honeybee',
		emoji: '🐝',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'cricket',
		emoji: '🦗',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'mosquito',
		emoji: '🦟',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'snail',
		emoji: '🐌',
		direction: ROTATION_RIGHT,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'scorpion',
		emoji: '🦂',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'insect'
		}
	},
	{
		name: 'monkey',
		emoji: '🐒',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'gorilla',
		emoji: '🦍',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'dog',
		emoji: '🐕',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'guide-dog',
		emoji: '🦮',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'service-dog',
		emoji: '🐕‍🦺',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'poodle',
		emoji: '🐩',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'racoon',
		emoji: '🦝',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'cat',
		emoji: '🐈',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'black-cat',
		emoji: '🐈‍⬛',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'tiger',
		emoji: '🐅',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'leopard',
		emoji: '🐆',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'horse',
		emoji: '🐎',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'zebra',
		emoji: '🦓',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'deer',
		emoji: '🦌',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'pig',
		emoji: '🐖',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'camel',
		emoji: '🐪',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'two-hump-camel',
		emoji: '🐫',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'llama',
		emoji: '🦙',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'giraffe',
		emoji: '🦒',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'elephant',
		emoji: '🐘',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'mammoth',
		emoji: '🦣',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'rhinoceros',
		emoji: '🦏',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'hippopotamus',
		emoji: '🦛',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'mouse',
		emoji: '🐁',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'rat',
		emoji: '🐀',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'rabbit',
		emoji: '🐇',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'chipmunk',
		emoji: '🐿️',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'beaver',
		emoji: '🦫',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'hedgehog',
		emoji: '🦔',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'bat',
		emoji: '🦇',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'otter',
		emoji: '🦦',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'skunk',
		emoji: '🦨',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'kangaroo',
		emoji: '🦘',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'badger',
		emoji: '🦡',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'turkey',
		emoji: '🦃',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'rooster',
		emoji: '🐓',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'dove',
		emoji: '🕊️',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'eagle',
		emoji: '🦅',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'duck',
		emoji: '🦆',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'swan',
		emoji: '🦢',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'owl',
		emoji: '🦉',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'dodo',
		emoji: '🦤',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'flamingo',
		emoji: '🦩',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'parrot',
		emoji: '🦜',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'turtle',
		emoji: '🐢',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'reptile'
		}
	},
	{
		name: 'snake',
		emoji: '🐍',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'reptile'
		}
	},
	{
		name: 'sauropod',
		emoji: '🦕',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'reptile'
		}
	},
	{
		name: 't-rex',
		emoji: '🦖',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'reptile'
		}
	},
	{
		name: 'whale',
		emoji: '🐋',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'spouting-whale',
		emoji: '🐳',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'dolphin',
		emoji: '🐬',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'seal',
		emoji: '🦭',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'fish',
		emoji: '🐟',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'fish'
		}
	},
	{
		name: 'tropical-fish',
		emoji: '🐠',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'fish'
		}
	},
	{
		name: 'blowfish',
		emoji: '🐡',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'fish'
		}
	},
	{
		name: 'shark',
		emoji: '🦈',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'fish'
		}
	},
	{
		name: 'squid',
		emoji: '🦑',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'fish'
		}
	},
	{
		name: 'orangutan',
		emoji: '🦧',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'mammal'
		}
	},
	{
		name: 'baby-chick',
		emoji: '🐥',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'peacock',
		emoji: '🦚',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'bird'
		}
	},
	{
		name: 'crocodile',
		emoji: '🐊',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'reptile'
		}
	},
	{
		name: 'octopus',
		emoji: '🐙',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'fish'
		}
	},
	{
		name: 'lizard',
		emoji: '🦎',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'reptile'
		}
	},
	{
		name: 'crab',
		emoji: '🦀',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'fish'
		}
	},
	{
		name: 'lobster',
		emoji: '🦞',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'fish'
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

export const GRAZING_FARM_ANIMALS_EMOJIS = filteredEmojiSet(info => info.animal?.grazes);

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