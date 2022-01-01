export const linearDistribution = (average, spread, rnd = Math.random, clipMin = 0.0, clipMax = 1.0) => {
	return linearMinMaxDistribution(average - spread, average + spread, rnd, clipMin, clipMax);
};

export const linearMinMaxDistribution = (min, max, rnd = Math.random, clipMin = 0.0, clipMax = 1.0) => {
	const result = (max - min) * rnd() + min;
	if (result < clipMin) return clipMin;
	if (result > clipMax) return clipMax;
	return result;
};