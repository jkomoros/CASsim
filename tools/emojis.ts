import * as fs from "fs";

import data from './data/emojis.json' assert { type: "json" };

const OUTPUT_FILE = 'src/constants-emoji.GENERATED.ts';

const ROTATION_TYPES = [
	'ROTATION_DOWN',
	'ROTATION_UP',
	'ROTATIION_LEFT',
	'ROTATION_RIGHT'
];

const JSON_REPLACEMENTS = {
	...Object.fromEntries(ROTATION_TYPES.map(typ => ['"' + typ + '"', typ])),
	'\t"': '\t',
	'":': ':',
	'"': '\'',
};

const generateEmojis = () => {
	let output = JSON.stringify(data.emojis, null, '\t');
	
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