
export type DialogShouldCloseEvent = CustomEvent<null>;

export const makeDialogShouldCloseEvent = () : DialogShouldCloseEvent => {
	return new CustomEvent('dialog-should-close', {composed: true, detail: null});
};