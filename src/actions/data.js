export const LOAD_DATA = "LOAD_DATA";

export const loadData = (data) => {
	return {
		type: LOAD_DATA,
		data,
	};
};
