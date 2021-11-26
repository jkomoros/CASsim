import { html } from 'lit-element';

import {
	WARNING_ICON,
	HELP_ICON,
} from './my-icons.js';

//if you use help, also print out helpStyles
export const help = (message, isAlert) => {
	return html`<span class='help' title="${message}">${isAlert ? WARNING_ICON : HELP_ICON}</span>`;
};

export const HelpStyles =  html`
	<style>
		.help {
			margin-left:0.0em;
		}

		.help svg {
            position:relative;
            top: 0.2em;
			height:1.0em;
			width:1.0em;
			fill: var(--disabled-color);
		}

        .help:hover svg {
            fill: var(--dark-gray-color);
        }
	</style>
`;