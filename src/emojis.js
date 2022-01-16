//Returns [emojiName, emoji] from the set. keyOrRnd can be a function, in which
//case it will be the source of randomness, or a key to select.
export const pickEmoji = (emojiSet, keyOrRnd) => {
	const emojiKeys = Object.keys(emojiSet);
	let key = keyOrRnd;
	if (typeof keyOrRnd == 'function') key = emojiKeys[Math.floor(emojiKeys.length * keyOrRnd())];
	return [key, emojiSet[key]];
};

export const PROFESSIONAL_PEOPLE_EMOJIS = {
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

export const PEOPLE_EMOJIS = {
	...PROFESSIONAL_PEOPLE_EMOJIS
};

export const GRAZING_FARM_ANIMALS_EMOJIS = {
	'cow': '🐄',
	'water-buffalo': '🐃',
	'ox': '🐂',
	'ram': '🐏',
	'sheep': '🐑',
	'goat': '🐐'
};

export const ANIMAL_EMOJIS = {
	...GRAZING_FARM_ANIMALS_EMOJIS,
};
