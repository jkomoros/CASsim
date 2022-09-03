import {
	AnyAction
} from "redux";

import {
	UPDATE_PAGE,
	UPDATE_OFFLINE,
} from "../actions/app.js";

import {
	AppState
} from '../types.js';

const INITIAL_STATE : AppState = {
	page: "",
	pageExtra: "",
	offline: false,
};

const app = (state : AppState = INITIAL_STATE, action : AnyAction) : AppState => {
	switch (action.type) {
	case UPDATE_PAGE:
		return {
			...state,
			page: action.page,
			pageExtra: action.pageExtra,
		};
	case UPDATE_OFFLINE:
		return {
			...state,
			offline: action.offline
		};
	default:
		return state;
	}
};

export default app;
