import {
	DIALOG_TYPE_ADD_FIELD
} from './actions/data.js';

import {
	DialogType,
	DialogTypeAddFieldExtras,
	OptionsPath,
	OptionValue
} from './types.js';

// Typed event classes
export class DialogShouldCloseEvent extends CustomEvent<null> {
	constructor() {
		super('dialog-should-close', { composed: true, detail: null });
	}
}

export const makeDialogShouldCloseEvent = () : DialogShouldCloseEvent => {
	return new DialogShouldCloseEvent();
};

type MultiSelectedChangedEventDetail = {
	[key : string] : true;
};

export class MultiSelectChangedEvent extends CustomEvent<MultiSelectedChangedEventDetail> {
	constructor(changed: MultiSelectedChangedEventDetail) {
		super('changed', { composed: true, detail: changed });
	}
}

export const makeMultiSelectChangedEvent = (changed : {[key : string] : true}) : MultiSelectChangedEvent => {
	return new MultiSelectChangedEvent(changed);
};

type UndoClickedEventDetail = {
	path: OptionsPath
}

export class UndoClickedEvent extends CustomEvent<UndoClickedEventDetail> {
	constructor(path: OptionsPath) {
		super('undo-clicked', { composed: true, detail: { path } });
	}
}

export const makeUndoClickedEvent = (path : OptionsPath): UndoClickedEvent => {
	return new UndoClickedEvent(path);
};

type OptionChangedEventDetail = {
	path: OptionsPath,
	value: OptionValue
};

export class OptionChangedEvent extends CustomEvent<OptionChangedEventDetail> {
	constructor(path: OptionsPath, value: OptionValue) {
		super('option-changed', { composed: true, detail: { path, value } });
	}
}

export const makeOptionChangedEvent = (path : OptionsPath, value: OptionValue) : OptionChangedEvent => {
	return new OptionChangedEvent(path, value);
};

type RunClickedEventDetail = {
	index: number;
};

export class RunClickedEvent extends CustomEvent<RunClickedEventDetail> {
	constructor(index: number) {
		super('run-clicked', { composed: true, detail: { index } });
	}
}

export const makeRunClickedEvent = (index: number) : RunClickedEvent => {
	return new RunClickedEvent(index);
};

type PathToggledEventDetail = {
	path: OptionsPath;
	open: boolean;
};

export class PathToggledEvent extends CustomEvent<PathToggledEventDetail> {
	constructor(path: OptionsPath, open: boolean) {
		super('path-toggled', { composed: true, detail: { path, open } });
	}
}

export const makePathToggledEvent = (path : OptionsPath, open: boolean) : PathToggledEvent => {
	return new PathToggledEvent(path, open);
};

type AddFieldDialogEventDetail = {
	type : DialogType;
	extras: DialogTypeAddFieldExtras;
}

type OpenDialogEventDetail = AddFieldDialogEventDetail;

export class OpenDialogEvent extends CustomEvent<OpenDialogEventDetail> {
	constructor(type: DialogType, extras: DialogTypeAddFieldExtras) {
		super('open-dialog', { composed: true, detail: { type, extras } });
	}
}

export const makeOpenDialogAddFieldEvent = (extras: DialogTypeAddFieldExtras) : OpenDialogEvent => {
	return new OpenDialogEvent(DIALOG_TYPE_ADD_FIELD, extras);
};

type AgentClickedEventDetail = {
	agentID: string | null;
	x: number;
	y: number;
};

export class AgentClickedEvent extends CustomEvent<AgentClickedEventDetail> {
	constructor(agentID: string | null, x: number, y: number) {
		super('agent-clicked', { composed: true, bubbles: true, detail: { agentID, x, y } });
	}
}

type InteractionSelectedEventDetail = {
	type: string;
};

export class InteractionSelectedEvent extends CustomEvent<InteractionSelectedEventDetail> {
	constructor(type: string) {
		super('interaction-selected', { composed: true, bubbles: true, detail: { type } });
	}
}

export class UndoInteractionEvent extends CustomEvent<null> {
	constructor() {
		super('undo-interaction', { composed: true, bubbles: true, detail: null });
	}
}

export class RedoInteractionEvent extends CustomEvent<null> {
	constructor() {
		super('redo-interaction', { composed: true, bubbles: true, detail: null });
	}
}

// Global event map for type-safe event handling
declare global {
	interface HTMLElementEventMap {
		'dialog-should-close': DialogShouldCloseEvent;
		'changed': MultiSelectChangedEvent;
		'undo-clicked': UndoClickedEvent;
		'option-changed': OptionChangedEvent;
		'run-clicked': RunClickedEvent;
		'path-toggled': PathToggledEvent;
		'open-dialog': OpenDialogEvent;
		'agent-clicked': AgentClickedEvent;
		'interaction-selected': InteractionSelectedEvent;
		'undo-interaction': UndoInteractionEvent;
		'redo-interaction': RedoInteractionEvent;
	}
}
