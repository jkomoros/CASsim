export const LOAD_DATA = 'LOAD_DATA';

export const fetchData = () => async (getState, dispatch) => {
	
	const res = await fetch('/map_data.json');

	const data = await res.json();

	dispatch({
		type: LOAD_DATA,
		data,
	})
}
