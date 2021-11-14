const SchellingOrgSimulator = class {
	static generator() {
		return {};
	}

	static optionsValidator(simOptions) {
		const problems = [];
		if (Object.keys(simOptions).length) problems.push('Doesn\'t currently expect any properties');
		return problems;
	}
};

export default SchellingOrgSimulator;