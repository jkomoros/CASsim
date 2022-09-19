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
	'male': ['♂️', '👨'],
	'female': ['♀️', '👩']
} as const;

const ZERO_WIDTH_JOINER = '‍';
const PERSON = '🧑';

const generateEmojis = () => {
	const emojis = (data.emojis as unknown) as InputEmojiInfo[];

	const expandedEmojis = emojis.map(info => {
		const result = [info];
		if (!info.person) return result;
		for (const [genderName, genderSymbol] of TypedObject.entries(GENDERS)) {
			const newInfo = {...info, person: {...info.person}};
			newInfo.name = info.name + '-' + genderName;
			newInfo.alternateOf = info.name;
			/*
				There are two types of gendered emoji:
				1) BaseEmoji + ZWJ + {MaleSign, FemaleSign}
				2) {Person, Man, Woman} + ZWJ + Object

				We can do string operations on them, as documented in
				https://medium.com/@gerinjacob/did-you-know-we-could-do-string-operations-on-emojis-in-javascript-63f2feff966e
			*/
			if (info.emoji.includes(PERSON)) {
				newInfo.emoji = info.emoji.replace(PERSON, genderSymbol[1]);
			} else {
				newInfo.emoji = info.emoji + ZERO_WIDTH_JOINER + genderSymbol[0];
			}
			
			newInfo.person.gender = genderName;
			result.push(newInfo);
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