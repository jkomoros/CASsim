export const UPDATE_PAGE = "UPDATE_PAGE";
export const UPDATE_OFFLINE = "UPDATE_OFFLINE";

import {
	AnyAction
} from 'redux';

import {
	selectPage,
	selectPageExtra,
	selectCurrentSimulationName,
	selectFilename,
	selectDataIsFullyLoaded
} from '../selectors.js';

import {
	AppActionCreator
} from '../store.js';

//if silent is true, then just passively updates the URL to reflect what it should be.
export const navigatePathTo : AppActionCreator = (path, silent) => (dispatch) => {
	//If we're already pointed there, no need to navigate
	if ('/' + path === window.location.pathname) return;
	//Don't replace search or hash if they exist. If htey don't exist, these
	//will be '', but if they do exist they will have the '?' and '#' prepended.
	path = path + window.location.search + window.location.hash;
	if (silent) {
		window.history.replaceState({}, '', path);
		return;
	}
	window.history.pushState({}, '', path);
	dispatch(navigate(path));
};

export const canonicalizePath : AppActionCreator = () => (dispatch ,getState) => {

	const state = getState();

	//We don't have the necessary information to canonicalize until we have all data loaded
	if (!selectDataIsFullyLoaded(state)) return;
	const page = selectPage(state);
	const pageExtra = selectPageExtra(state);

	const path = [page];
	
	if (page != 'sim') {
		path.push(pageExtra);
	} else {
		const filename = selectFilename(state);
		const simulationName = selectCurrentSimulationName(state);
		path.push(filename, simulationName, '');
	}

	dispatch(navigatePathTo(path.join('/'), true));
};

export const navigate : AppActionCreator = (path) => (dispatch) => {
	// Extract the page name from path.
	const page = path === "/" ? "sim" : path.slice(1);

	// Any other info you might want to extract from the path (like page type),
	// you can do here
	dispatch(loadPage(page));
};

const loadPage : AppActionCreator = (location) => (dispatch) => {

	const pieces = location.split('/');

	let page = pieces[0];
	const pageExtra = pieces.length < 2 ? '' : pieces.slice(1).join('/');

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

const updatePage = (page : string, pageExtra : string) : AnyAction => {
	return {
		type: UPDATE_PAGE,
		page,
		pageExtra,
	};
};

export const updateOffline : AppActionCreator = (offline) => (dispatch) => {
	dispatch({
		type: UPDATE_OFFLINE,
		offline
	});
};