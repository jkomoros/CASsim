export const UPDATE_PAGE = "UPDATE_PAGE";
export const UPDATE_OFFLINE = "UPDATE_OFFLINE";
export const OPEN_SNACKBAR = "OPEN_SNACKBAR";
export const CLOSE_SNACKBAR = "CLOSE_SNACKBAR";

import {
	selectPage,
	selectPageExtra,
	selectCurrentSimulationName,
	selectFilename
} from '../selectors.js';

//if silent is true, then just passively updates the URL to reflect what it should be.
export const navigatePathTo = (path, silent) => (dispatch) => {
	//If we're already pointed there, no need to navigate
	if ('/' + path === window.location.pathname) return;
	if (silent) {
		window.history.replaceState({}, '', path);
		return;
	}
	window.history.pushState({}, '', path);
	dispatch(navigate(path));
};

export const canonicalizePath = () => (dispatch ,getState) => {
	const state = getState();
	const page = selectPage(state);
	const pageExtra = selectPageExtra(state);

	let path = [page];
	
	if (page != 'sim') {
		path.push(pageExtra);
	} else {
		const filename = selectFilename(state);
		const simulationName = selectCurrentSimulationName(state);
		path.push(filename, simulationName, '');
	}

	dispatch(navigatePathTo(path.join('/'), true));
};

export const navigate = (path) => (dispatch) => {
	// Extract the page name from path.
	const page = path === "/" ? "sim" : path.slice(1);

	// Any other info you might want to extract from the path (like page type),
	// you can do here
	dispatch(loadPage(page));
};

const loadPage = (location) => (dispatch) => {

	const pieces = location.split('/');

	let page = pieces[0];
	let pageExtra = pieces.length < 2 ? '' : pieces.slice(1).join('/');

	switch(page) {
	case "sim":
		import("../components/sim-view.js");
		break;
	default:
		page = "view404";
		import("../components/my-view404.js");
	}

	dispatch(updatePage(page, pageExtra));
};

const updatePage = (page, pageExtra) => {
	return {
		type: UPDATE_PAGE,
		page,
		pageExtra,
	};
};

let snackbarTimer;

export const showSnackbar = () => (dispatch) => {
	dispatch({
		type: OPEN_SNACKBAR
	});
	window.clearTimeout(snackbarTimer);
	snackbarTimer = window.setTimeout(() =>
		dispatch({ type: CLOSE_SNACKBAR }), 3000);
};

export const updateOffline = (offline) => (dispatch, getState) => {
	// Show the snackbar only if offline status changes.
	if (offline !== getState().app.offline) {
		dispatch(showSnackbar());
	}
	dispatch({
		type: UPDATE_OFFLINE,
		offline
	});
};

export const updateLayout = (wide) => () => {
	console.log(`The window changed to a ${wide ? "wide" : "narrow"} layout`);
};
