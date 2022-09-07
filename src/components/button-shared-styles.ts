import { css, html, TemplateResult } from 'lit';
import { HELP_ICON } from './my-icons.js';

//if you use help, also make sure to include ButtonSharedStyles
export const help = (message : string, disabled = false) : TemplateResult => {
	return html`<button class='small help' title="${message}" .disabled=${disabled}>${HELP_ICON}</button>`;
};

export const ButtonSharedStyles = css`
		button {
			font-size: inherit;
			vertical-align: middle;
			color: var(--app-light-text-color);
			background: var(--app-primary-color);
			padding: 0.5em;
			box-shadow: 0 2px 2px var(--shadow-color);
			border: none;
			cursor: pointer;
			margin: 0.5em;
			position: relative;
			overflow: hidden;
			transition: background-color var(--transition-fade), color var(--transition-fade), box-shadow var(--transition-fade);
		}

		button.help {
			cursor:default;
		}

		button.round {
			border-radius:50%;
			height: 2.75em;
			width: 2.75em;
		}

		button svg {
			fill: var(--app-light-text-color);
		}

		button:hover {
			filter: brightness(0.9);
		}

		button.small:disabled:hover {
			filter: none;
		}

		button.small {
			background:transparent;
			padding: 0;
			margin:0;
			box-shadow: none;
			font-size: 1.0em;
			font-style: italic;
			color: var(--dark-gray-color);
		}

		button.small:disabled svg {
			fill: var(--disabled-color);
		}

		button.small svg {
			fill: var(--dark-gray-color);
			height:1.0em;
			width:1.0em;
		}

		button.small:disabled:hover svg {
			fill: var(--disabled-color);
		}

		button.small:hover svg {
			fill: var(--disabled-color);
		}
`;
