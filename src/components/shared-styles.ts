import { css } from 'lit';

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

	summary label {
		font-weight:bold;
	}

	label.subtle {
		font-weight: normal;
	}

	details {
		color: var(--dark-gray-color);
	}
`;
