import { css } from 'lit-element';

export const SharedStyles = css`
	:host {
		display: block;
		box-sizing: border-box;
	}

	[hidden] {
		display:none !important;
	}

	label, span.label {
		font-size: 0.8em;
		color: var(--dark-gray-color);
	}

	details {
		color: var(--dark-gray-color);
	}
`;
