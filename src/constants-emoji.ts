//Shouldn't be imporeted by anything other than emojis.ts and types.ts

import {
	ROTATION_UP,
	ROTATION_DOWN,
	ROTATION_LEFT,
	ROTATION_RIGHT
} from './constants.js';

import {
	GENERATED_RAW_EMOJIS
} from './constants-emoji.GENERATED.js';

export const RAW_EMOJIS = [
	...GENERATED_RAW_EMOJIS,
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
			habitat: 'forest',
			flies: 'depicted',
		}
	},
	{
		name: 'beetle',
		emoji: '🪲',
		direction: ROTATION_UP,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest',
			flies: 'capable',
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
			habitat: 'forest',
			flies: 'capable',
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
			habitat: 'forest',
			flies: 'depicted'
		}
	},
	{
		name: 'cricket',
		emoji: '🦗',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest',
			flies: 'capable',
		}
	},
	{
		name: 'mosquito',
		emoji: '🦟',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'insect',
			diet: 'herbivore',
			habitat: 'forest',
			flies: 'capable'
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
			nonExistent: 'extinct'
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
			swims: 'capable'
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
			swims: 'capable'
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
			habitat: 'forest',
			flies: 'depicted'
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
			swims: 'capable'
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
			habitat: 'farm',
			flies: 'capable'
		}
	},
	{
		name: 'dove',
		emoji: '🕊️',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'forest',
			flies: 'depicted'
		}
	},
	{
		name: 'eagle',
		emoji: '🦅',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'omnivore',
			habitat: 'forest',
			flies: 'depicted'
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
			swims: 'capable',
			flies: 'capable'
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
			swims: 'capable',
			flies: 'capable'
		}
	},
	{
		name: 'owl',
		emoji: '🦉',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'bird',
			diet: 'omnivore',
			habitat: 'forest',
			flies: 'capable'
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
			nonExistent: 'extinct'
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
			habitat: 'jungle',
			flies: 'capable'
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
			nonExistent: 'extinct'
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
			nonExistent: 'extinct'
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
			swims: 'underwater'
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
			swims: 'underwater'
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
			swims: 'underwater'
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
			swims: 'capable'
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
			swims: 'underwater'
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
			swims: 'underwater'
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
			swims: 'underwater'
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
			swims: 'underwater'
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
			swims: 'underwater'
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
			swims: 'capable'
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
			swims: 'underwater'
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
			swims: 'underwater'
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
			swims: 'underwater'
		}
	},
	{
		name: 'monkey-face',
		emoji: '🐵',
		direction: ROTATION_DOWN,
		alternateOf: 'monkey',
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'jungle',
			face: true
		}
	},
	{
		name: 'dog-face',
		emoji: '🐶',
		direction: ROTATION_DOWN,
		alternateOf: 'dog',
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'house',
			face: true
		}
	},
	{
		name: 'cat-face',
		emoji: '🐱',
		direction: ROTATION_DOWN,
		alternateOf: 'cat',
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'house',
			face: true
		}
	},
	{
		name: 'fox',
		emoji: '🦊',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'forest',
			face: true
		}
	},
	{
		name: 'lion',
		emoji: '🦁',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'savanah',
			face: true
		}
	},
	{
		name: 'tiger-face',
		emoji: '🐯',
		direction: ROTATION_DOWN,
		alternateOf: 'tiger',
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'jungle',
			face: true
		}
	},
	{
		name: 'horse-face',
		emoji: '🐴',
		direction: ROTATION_DOWN,
		alternateOf: 'horse',
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'farm',
			face: true
		}
	},
	{
		name: 'cow-face',
		emoji: '🐮',
		direction: ROTATION_DOWN,
		alternateOf: 'cow',
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'farm',
			face: true
		}
	},
	{
		name: 'pig-face',
		emoji: '🐷',
		direction: ROTATION_DOWN,
		alternateOf: 'pig',
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'farm',
			face: true
		}
	},
	{
		name: 'boar',
		emoji: '🐗',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'forest',
			face: true
		}
	},
	{
		name: 'mouse-face',
		emoji: '🐭',
		direction: ROTATION_DOWN,
		alternateOf: 'mouse',
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'house',
			face: true
		}
	},
	{
		name: 'hamster',
		emoji: '🐹',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'mammal',
			diet: 'omnivore',
			habitat: 'house',
			face: true
		}
	},
	{
		name: 'rabbit-face',
		emoji: '🐰',
		direction: ROTATION_DOWN,
		alternateOf: 'rabbit',
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'house',
			face: true
		}
	},
	{
		name: 'bear',
		emoji: '🐻',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'forest',
			face: true
		}
	},
	{
		name: 'polar-bear',
		emoji: '🐻‍❄️',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'mammal',
			diet: 'carnivore',
			habitat: 'tundra',
			face: true
		}
	},
	{
		name: 'koala',
		emoji: '🐨',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'forest',
			face: true
		}
	},
	{
		name: 'panda',
		emoji: '🐼',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'forest',
			face: true
		}
	},
	{
		name: 'baby-chick-face',
		emoji: '🐤',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'farm',
			face: true
		}
	},
	{
		name: 'bird-face',
		emoji: '🐦',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'bird',
			diet: 'herbivore',
			habitat: 'forest',
			face: true,
			flies: 'capable'
		}
	},
	{
		name: 'penguin',
		emoji: '🐧',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'bird',
			diet: 'carnivore',
			habitat: 'tundra',
			face: true,
			swims: 'capable'
		}
	},
	{
		name: 'frog',
		emoji: '🐸',
		direction: ROTATION_DOWN,
		animal: {
			kind: 'amphibian',
			diet: 'omnivore',
			habitat: 'forest',
			face: true,
			swims: 'capable'
		}
	},
	{
		name: 'unicorn',
		emoji: '🦄',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'forest',
			face: true,
			nonExistent: 'fictional'
		}
	},
	{
		name: 'dragon',
		emoji: '🐉',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'reptile',
			diet: 'carnivore',
			habitat: 'forest',
			nonExistent: 'fictional'
		}
	},
	{
		name: 'dragon-face',
		emoji: '🐲',
		direction: ROTATION_DOWN,
		alternateOf: 'dragon',
		animal: {
			kind: 'reptile',
			diet: 'carnivore',
			habitat: 'forest',
			nonExistent: 'fictional',
			face: true
		}
	},
	{
		name: 'sloth',
		emoji: '🦥',
		direction: ROTATION_LEFT,
		animal: {
			kind: 'mammal',
			diet: 'herbivore',
			habitat: 'jungle',
			hanging: true
		}
	},
	{
		name: 'bouqet',
		emoji: '💐',
		direction: ROTATION_DOWN,
		plant: {
			habitat: 'house',
			kind: 'flower'
		}
	},
	{
		name: 'blossom',
		emoji: '🌼',
		direction: ROTATION_UP,
		plant: {
			habitat: 'garden',
			kind: 'flower'
		}
	},
	{
		name: 'cherry-blossom',
		emoji: '🌸',
		direction: ROTATION_UP,
		alternateOf: 'blossom',
		plant: {
			habitat: 'garden',
			kind: 'flower'
		}
	},
	{
		name: 'white-flower',
		emoji: '💮',
		direction: ROTATION_UP,
		alternateOf: 'blossom',
		plant: {
			habitat: 'garden',
			kind: 'flower'
		}
	},
	{
		name: 'lotus',
		emoji: '🪷',
		direction: ROTATION_UP,
		plant: {
			habitat: 'forest',
			kind: 'flower',
			stem: true
		}
	},
	{
		name: 'rosette',
		emoji: '🏵️',
		direction: ROTATION_UP,
		alternateOf: 'blossom',
		plant: {
			habitat: 'garden',
			kind: 'flower',
		}
	},
	{
		name: 'rose',
		emoji: '🌹',
		direction: ROTATION_UP,
		plant: {
			habitat: 'garden',
			kind: 'flower',
			stem: true
		}
	},
	{
		name: 'wilted-flower',
		emoji: '🌹',
		direction: ROTATION_UP,
		plant: {
			habitat: 'garden',
			kind: 'flower',
			dying: true
		}
	},
	{
		name: 'hibiscus',
		emoji: '🌺',
		direction: ROTATION_UP,
		plant: {
			habitat: 'jungle',
			kind: 'flower'
		}
	},
	{
		name: 'sunflower',
		emoji: '🌻',
		direction: ROTATION_UP,
		plant: {
			habitat: 'farm',
			kind: 'flower',
			stem: true
		}
	},
	{
		name: 'tulip',
		emoji: '🌷',
		direction: ROTATION_UP,
		plant: {
			habitat: 'farm',
			kind: 'flower',
			stem: true
		}
	},
	{
		name: 'seedling',
		emoji: '🌱',
		direction: ROTATION_UP,
		plant: {
			habitat: 'farm',
			kind: 'plant',
			stem: true
		}
	},
	{
		name: 'herb',
		emoji: '🌿',
		direction: ROTATION_UP,
		plant: {
			habitat: 'farm',
			kind: 'plant',
			stem: true
		}
	},
	{
		name: 'shamrock',
		emoji: '☘️',
		direction: ROTATION_UP,
		plant: {
			habitat: 'farm',
			kind: 'plant',
			stem: true
		}
	},
	{
		name: 'four-leaf-clover',
		emoji: '🍀',
		direction: ROTATION_UP,
		alternateOf: 'shamrock',
		plant: {
			habitat: 'farm',
			kind: 'plant',
			stem: true
		}
	},
	{
		name: 'potted-plant',
		emoji: '🪴',
		direction: ROTATION_UP,
		plant: {
			habitat: 'house',
			kind: 'plant',
			stem: true
		}
	},
	{
		name: 'evergreen-tree',
		emoji: '🌲',
		direction: ROTATION_UP,
		plant: {
			habitat: 'forest',
			kind: 'tree',
			stem: true,
		}
	},
	{
		name: 'deciduous-tree',
		emoji: '🌳',
		direction: ROTATION_UP,
		plant: {
			habitat: 'forest',
			kind: 'tree',
			stem: true,
		}
	},
	{
		name: 'palm-tree',
		emoji: '🌴',
		direction: ROTATION_UP,
		plant: {
			habitat: 'desert',
			kind: 'tree',
			stem: true,
		}
	},
	{
		name: 'cactus',
		emoji: '🌵',
		direction: ROTATION_UP,
		plant: {
			habitat: 'desert',
			kind: 'other',
			stem: true
		}
	},
	{
		name: 'rice',
		emoji: '🌾',
		direction: ROTATION_UP,
		plant: {
			habitat: 'farm',
			kind: 'plant',
			stem: true
		}
	},
	{
		name: 'mushroom',
		emoji: '🍄',
		direction: ROTATION_UP,
		plant: {
			habitat: 'forest',
			kind: 'other',
			stem: true
		}
	},
	{
		name: 'house',
		emoji: '🏠',
		direction: ROTATION_DOWN,
		building: 'dwelling'
	},
	{
		name: 'house-abandoned',
		emoji: '🏚️',
		alternateOf: 'house',
		direction: ROTATION_DOWN,
		building: 'dwelling'
	},
	{
		name: 'house-with-garden',
		emoji: '🏡',
		alternateOf: 'house',
		direction: ROTATION_DOWN,
		building: 'dwelling'
	},
	{
		name: 'office-building',
		emoji: '🏢',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'post-office',
		emoji: '🏤',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'post-office-japanese',
		emoji: '🏣',
		alternateOf: 'post-office',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'hospital',
		emoji: '🏥',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'bank',
		emoji: '🏦',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'hotel',
		emoji: '🏨',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'hotel-love',
		emoji: '🏩',
		alternateOf: 'hotel',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'convenience-store',
		emoji: '🏪',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'school',
		emoji: '🏫',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'department-store',
		emoji: '🏬',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'factory',
		emoji: '🏭',
		direction: ROTATION_DOWN,
		building: 'business'
	},
	{
		name: 'castle',
		emoji: '🏰',
		direction: ROTATION_DOWN,
		building: 'special'
	},
	{
		name: 'castle-japanese',
		emoji: '🏯',
		alternateOf: 'castle',
		direction: ROTATION_DOWN,
		building: 'special'
	},
	{
		name: 'church',
		emoji: '⛪',
		direction: ROTATION_DOWN,
		building: 'religion'
	},
	{
		name: 'wedding',
		emoji: '💒',
		alternateOf: 'church',
		direction: ROTATION_DOWN,
		building: 'religion'
	},
	{
		name: 'mosque',
		emoji: '🕌',
		direction: ROTATION_DOWN,
		building: 'religion'
	},
	{
		name: 'hindu-temple',
		emoji: '🛕',
		direction: ROTATION_DOWN,
		building: 'religion'
	},
	{
		name: 'synagogue',
		emoji: '🕍',
		direction: ROTATION_DOWN,
		building: 'religion'
	},
	{
		name: 'tent',
		emoji: '⛺',
		direction: ROTATION_DOWN,
		building: 'special-dwelling'
	},
	{
		name: 'hut',
		emoji: '🛖',
		direction: ROTATION_DOWN,
		building: 'special-dwelling'
	},
	{
		name: 'classical-building',
		emoji: '🏛️',
		direction: ROTATION_DOWN,
		building: 'special'
	},
	{
		name: 'stadium',
		emoji: '🏟️',
		direction: ROTATION_DOWN,
		building: 'special'
	},
	{
		name: 'tokyo-tower',
		emoji: '🗼',
		direction: ROTATION_DOWN,
		building: 'landmark'
	},
	{
		name: 'statue-of-liberty',
		emoji: '🗽',
		direction: ROTATION_DOWN,
		building: 'landmark'
	},
	{
		name: 'locomotive',
		emoji: '🚂',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'tracks',
			trainKind: 'locomotive'
		}
	},
	{
		name: 'high-speed-train',
		emoji: '🚄',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'tracks',
			trainKind: 'locomotive',
			clipped: true
		}
	},
	{
		name: 'bullet-train',
		emoji: '🚅',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'tracks',
			trainKind: 'locomotive',
			clipped: true
		}
	},
	{
		name: 'light-rail',
		emoji: '🚈',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'tracks',
			trainKind: 'locomotive',
			clipped: true
		}
	},
	{
		name: 'monorail',
		emoji: '🚝',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'tracks',
			trainKind: 'locomotive',
			clipped: true
		}
	},
	{
		name: 'train',
		emoji: '🚆',
		direction: ROTATION_DOWN,
		vehicle: {
			surface: 'tracks',
			trainKind: 'locomotive'
		}
	},
	{
		name: 'metro',
		emoji: '🚇',
		direction: ROTATION_DOWN,
		vehicle: {
			surface: 'tracks',
			trainKind: 'locomotive'
		}
	},
	{
		name: 'tram',
		emoji: '🚊',
		direction: ROTATION_DOWN,
		vehicle: {
			surface: 'tracks',
			trainKind: 'locomotive'
		}
	},
	{
		name: 'railway-car',
		emoji: '🚃',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'tracks',
			trainKind: 'train-car'
		}
	},
	{
		name: 'tram-car',
		emoji: '🚋',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'tracks',
			trainKind: 'train-car'
		}
	},
	{
		name: 'bus',
		emoji: '🚌',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'bus'
		}
	},
	{
		name: 'bus-oncoming',
		emoji: '🚍',
		direction: ROTATION_DOWN,
		alternateOf: 'bus',
		vehicle: {
			surface: 'street',
			autoKind: 'bus'
		}
	},
	{
		name: 'trolley-bus',
		emoji: '🚎',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'bus'
		}
	},
	{
		name: 'mini-bus',
		emoji: '🚐',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'bus'
		}
	},
	{
		name: 'ambulance',
		emoji: '🚑',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'emergency'
		}
	},
	{
		name: 'fire-engine',
		emoji: '🚒',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'emergency'
		}
	},
	{
		name: 'police-car',
		emoji: '🚓',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'emergency'
		}
	},
	{
		name: 'police-car-oncoming',
		emoji: '🚔',
		direction: ROTATION_DOWN,
		alternateOf: 'police-car',
		vehicle: {
			surface: 'street',
			autoKind: 'emergency'
		}
	},
	{
		name: 'taxi',
		emoji: '🚕',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'taxi'
		}
	},
	{
		name: 'taxi-oncoming',
		emoji: '🚖',
		direction: ROTATION_DOWN,
		alternateOf: 'taxi',
		vehicle: {
			surface: 'street',
			autoKind: 'taxi'
		}
	},
	{
		name: 'automobile',
		emoji: '🚗',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'car'
		}
	},
	{
		name: 'automobile-oncoming',
		emoji: '🚘',
		direction: ROTATION_DOWN,
		alternateOf: 'automobile',
		vehicle: {
			surface: 'street',
			autoKind: 'car'
		}
	},
	{
		name: 'sport-utility-vehicle',
		emoji: '🚙',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'car'
		}
	},
	{
		name: 'pickup-truck',
		emoji: '🛻',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'car'
		}
	},
	{
		name: 'delivery-truck',
		emoji: '🚚',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'car'
		}
	},
	{
		name: 'articulated-lorry',
		emoji: '🚛',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'car'
		}
	},
	{
		name: 'tractor',
		emoji: '🚜',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'tractor'
		}
	},
	{
		name: 'racing-car',
		emoji: '🏎️',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'racing-car'
		}
	},
	{
		name: 'motorcyle',
		emoji: '🏍️',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			bikeKind: 'cycle'
		}
	},
	{
		name: 'motor-scooter',
		emoji: '🛵',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			bikeKind: 'scooter'
		}
	},
	{
		name: 'auto-rickshaw',
		emoji: '🛺',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			autoKind: 'taxi',
			bikeKind: 'scooter'
		}
	},
	{
		name: 'bicycle',
		emoji: '🚲',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			bikeKind: 'cycle',
			selfPowered: true
		}
	},
	{
		name: 'kick-scooter',
		emoji: '🛴',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'street',
			bikeKind: 'scooter',
			selfPowered: true
		}
	},
	{
		name: 'sailboat',
		emoji: '⛵',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'water',
			selfPowered: true
		}
	},
	{
		name: 'speedboat',
		emoji: '🚤',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'water'
		}
	},
	{
		name: 'motor-boat',
		emoji: '🛥️',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'water'
		}
	},
	{
		name: 'passenger-ship',
		emoji: '🛳️',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'water',
			clipped: true
		}
	},
	{
		name: 'ferry',
		emoji: '⛴️',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'water',
			clipped: true
		}
	},
	{
		name: 'ship',
		emoji: '🚢',
		direction: ROTATION_LEFT,
		vehicle: {
			surface: 'water',
			clipped: true
		}
	},
] as const;