export const LOAD_DATA = "LOAD_DATA";
export const UPDATE_INDEX = 'UPDATE_INDEX';

export const loadData = (data) => {
	return {
		type: LOAD_DATA,
		data,
	};
};

export const updateIndex = (index) => {
	return {
		type: UPDATE_INDEX,
		index,
	};
};
