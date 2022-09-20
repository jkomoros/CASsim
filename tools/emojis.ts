import * as fs from "fs";

import {
	TypedObject
} from "../src/typed-object.js";

import {
	Angle,
	EmojiInfo
} from "../src/types.js";

const ROTATION_TYPES = [
	'ROTATION_DOWN',
	'ROTATION_UP',
	'ROTATIION_LEFT',
	'ROTATION_RIGHT'
] as const;

type ManualAngle<Type> = {
	[Property in keyof Type]: Type[Property] extends Angle ? typeof ROTATION_TYPES : Type[Property]
};

type InputEmojiInfo = ManualAngle<EmojiInfo>;

import data from './data/emojis.json' assert { type: "json" };

const OUTPUT_FILE = 'src/constants-emoji.GENERATED.ts';

const JSON_REPLACEMENTS = {
	...Object.fromEntries(ROTATION_TYPES.map(typ => ['"' + typ + '"', typ])),
	'\t"': '\t',
	'":': ':',
	'"': '\'',
};

const GENDERS = {
	'': {
		sign: '', 
		default: '🧑'
	},
	'female': {
		sign: '♀️', 
		default: '👩'
	},
	'male': {
		sign: '♂️', 
		default: '👨'
	}
} as const;

const ALT_BASES : {[base : string] : {male : string, female : string}} = {
	'person-old': {
		male: '👴',
		female: '👵',
	},
	'person-child': {
		male: '👦',
		female: '👧',
	},
	'person-baby': {
		male: '',
		female: ''
	}
};

const SKIN_TONES = {
	'': '',
	'dark': '🏿',
	'medium-dark': '🏾',
	'medium': '🏽',
	'medium-light': '🏼',
	'light': '🏻'
} as const;

const HAIR_TYPES = {
	'': '',
	//NOTE: blond is NOT handled here, but rather enumerated in
	//tools/data/emoji.json. It's a special base type not based on PERSON,
	//similar to police officer.
	'red': '🦰',
	'white': '🦳',
	'curly': '🦱',
	'bald': '🦲'
} as const;

const ZERO_WIDTH_JOINER = '‍';
const PERSON = '🧑';

const generateEmojis = () => {
	const emojis = (data.emojis as unknown) as InputEmojiInfo[];

	const expandedEmojis = emojis.map(info => {
		const result = [info];
		if (!info.person) return result;
		for (const [genderName, genderSymbol] of TypedObject.entries(GENDERS)) {
			for (const [skinToneName, skinToneSymbol] of TypedObject.entries(SKIN_TONES)) {
				for (const [hairName, hairSymbol] of TypedObject.entries(HAIR_TYPES)) {
					if (info.emoji != PERSON && hairName) continue;
					if (!genderName && !skinToneName && !hairName) continue;
					const newInfo = {...info, person: {...info.person}};
					newInfo.name = info.name + (hairName ? '-' + hairName + '-hair' : '') + (skinToneName ? '-' + skinToneName + '-skin' : '') + (genderName ? '-' + genderName : '');
					//TODO: should the skin tones for non-neutral gender use the default skin tone of their gender as the base?
					newInfo.alternateOf = info.name;
					/*
						There are two types of gendered emoji:
						1) BaseEmoji + {SkinTone}? + ZWJ + {MaleSign, FemaleSign}
						2) {Person, Man, Woman} + {SkinTone}? + (ZWJ + Object)?
						2a) {AltPerson, AltMan, AltWoman} + {SkinTone}?

						Confusingly, the first type's baseEmoji can be for example police officer or blond person (!).
						The third type is mainly used for person-old and sub-types.

						We can do string operations on them, as documented in
						https://medium.com/@gerinjacob/did-you-know-we-could-do-string-operations-on-emojis-in-javascript-63f2feff966e
					*/
					if (info.emoji.includes(PERSON)) {
						//Type 2
						newInfo.emoji = info.emoji.replace(PERSON, genderSymbol.default + skinToneSymbol + (hairSymbol ? ZERO_WIDTH_JOINER + hairSymbol : ''));
					} else if(ALT_BASES[info.name]) {
						//Type 2a
						if (genderName) {
							newInfo.emoji = genderName == 'male' ? ALT_BASES[info.name].male : ALT_BASES[info.name].female;
						}
						//Some options, like 'persion-baby' only have non-gendered versions.
						if (!newInfo.emoji) continue;
						newInfo.emoji += skinToneSymbol;
					} else {
						//Type 1
						newInfo.emoji = info.emoji + skinToneSymbol + (genderSymbol.sign ? ZERO_WIDTH_JOINER + genderSymbol.sign : '');
					}
					
					if (genderName) newInfo.person.gender = genderName;
					if (skinToneName) newInfo.person.skinTone = skinToneName;
					if (hairName) newInfo.person.hair = hairName;
					result.push(newInfo);
				}
			}
		}
		return result;
	}).flat();

	let output = JSON.stringify(expandedEmojis, null, '\t');
	
	for (const [find, replace] of Object.entries(JSON_REPLACEMENTS)) {
		output = output.split(find).join(replace);
	}

	const rotationTypesToInclude = ROTATION_TYPES.filter(typ => output.includes(typ));

	const fileContents = `//Generated via \`npm run generate:internal:emojis\`

import {
	${rotationTypesToInclude.join(',\n\t')}
} from './constants.js';

export const GENERATED_RAW_EMOJIS = ${output} as const;`;
	fs.writeFileSync(OUTPUT_FILE, fileContents);
};


(async() => {
	generateEmojis();
})();