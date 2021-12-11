import { css } from 'lit-element';

export const SharedStyles = css`
	:host {
		display: block;
		box-sizing: border-box;
	}

	[hidden] {
		display:none !important;
	}

	label, .label {
		font-size: 0.8em;
		color: var(--dark-gray-color);
		line-height: 1.1em;
	}

	details {
		color: var(--dark-gray-color);
	}
`;
