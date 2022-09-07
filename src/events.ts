
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