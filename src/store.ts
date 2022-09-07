import {
	createStore,
	compose,
	applyMiddleware,
	combineReducers,
	StoreEnhancer,
	Reducer,
	AnyAction,
	ActionCreator
} from 'redux';

import thunk, { ThunkAction, ThunkDispatch, ThunkMiddleware } from 'redux-thunk';
import { lazyReducerEnhancer } from "pwa-helpers/lazy-reducer-enhancer.js";

import app from "./reducers/app.js";

import {
	RootState
} from './types.js';

declare global {
	interface Window {
		process?: object;
		DEBUG_STORE: object;
		__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
	}
  }

// Sets up a Chrome extension for time travel debugging.
// See https://github.com/zalmoxisus/redux-devtools-extension for more information.
const devCompose: <Ext0, Ext1, StateExt0, StateExt1>(
	f1: StoreEnhancer<Ext0, StateExt0>, f2: StoreEnhancer<Ext1, StateExt1>
  ) => StoreEnhancer<Ext0 & Ext1, StateExt0 & StateExt1> =
	window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// Initializes the Redux store with a lazyReducerEnhancer (so that you can
// lazily add reducers after the store has been created) and redux-thunk (so
// that you can dispatch async actions). See the "Redux and state management"
// section of the wiki for more details:
// https://github.com/Polymer/pwa-starter-kit/wiki/4.-Redux-and-state-management
export const store = createStore(
	state => state as Reducer<RootState,AnyAction>,
	devCompose(
		lazyReducerEnhancer(combineReducers),
		applyMiddleware(thunk as ThunkMiddleware<RootState, AnyAction>))
);

// Initially loaded reducers.
store.addReducers({
	app
});

export type ThunkResult = ThunkAction<void, RootState, undefined, AnyAction>;

export type AppActionCreator = ActionCreator<ThunkResult>;

export type AppThunkDispatch = ThunkDispatch<RootState, undefined, AnyAction>;

export type AppGetState = () => RootState;
