import {
	prng_alea
} from 'esm-seedrandom';

export const makeSeededRandom = seed => {
	const rnd = prng_alea(seed);
	return () => rnd.quick();
};