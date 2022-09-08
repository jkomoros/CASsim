import {
	OptionsPath, OptionValue
} from './types.js';

export type DialogShouldCloseEvent = CustomEvent<null>;

export const makeDialogShouldCloseEvent = () : DialogShouldCloseEvent => {
	return new CustomEvent('dialog-should-close', {composed: true, detail: null});
};

type MultiSelectedChangedEventDetail = {
	[key : string] : true;
};

export type MultiSelectChangedEvent = CustomEvent<MultiSelectedChangedEventDetail>;

export const makeMultiSelectChangedEvent = (changed : {[key : string] : true}) : MultiSelectChangedEvent => {
	return new CustomEvent('changed', {composed: true, detail: changed});
};

type UndoClickedEventDetail = {
	path: OptionsPath
}

export type UndoClickedEvent = CustomEvent<UndoClickedEventDetail>;

export const makeUndoClickedEvent = (path : OptionsPath): UndoClickedEvent => {
	return new CustomEvent('undo-clicked', {composed: true, detail: {path}});
};

type OptionChangedEventDetail = {
	path: OptionsPath,
	value: OptionValue
};

export type OptionChangedEvent = CustomEvent<OptionChangedEventDetail>;

export const makeOptionChangedEvent = (path : OptionsPath, value: OptionValue) : OptionChangedEvent => {
	return new CustomEvent('option-changed', {composed: true, detail: {path, value}});
};

type RunClickedEventDetail = {
	index: number;
};

export type RunClickedEvent = CustomEvent<RunClickedEventDetail>;

export const makeRunClickedEvent = (index: number) : RunClickedEvent => {
	return new CustomEvent('run-clicked', {composed: true, detail: {index}});
};

type PathToggledEventDetail = {
	path: OptionsPath;
	open: boolean;
};

export type PathToggledEvent = CustomEvent<PathToggledEventDetail>;

export const makePathToggledEvent = (path : OptionsPath, open: boolean) : PathToggledEvent => {
	return new CustomEvent('path-toggled', {composed: true, detail: {path, open}});
};