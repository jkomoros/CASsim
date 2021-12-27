import {
	BaseSimulator
} from '../simulator.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'dice-roll-demo';

class DiceRollDemoSimulator extends BaseSimulator {

	get name() {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	generateFirstFrame() {
		//The default generator will expand this with index and simOptions.
		return {
			busted: false,
			score: 0,
			lastRoll: 0,
			success: false,
		};
	}

	simulationComplete(frame) {
		return frame.success || frame.busted;
	}

	generateFrame(frame, rnd) {
		//We want numbers 1 .. frame.die (inclusive)
		const newRoll = Math.floor(rnd() * frame.simOptions.die) + 1;
		frame.lastRoll = newRoll;
		if (newRoll == frame.simOptions.bust) {
			frame.score = 0;
			frame.busted = true;
			return;
		}
		frame.score += newRoll;
		if (frame.score >= frame.simOptions.targetScore) {
			frame.success = true;
		}
	}

	frameScorer(frame) {
		const finalScore = this.simulationComplete(frame) ? (frame.success ? 1.0 : 0.0) : -1;
		return [finalScore, frame.score];
	}

	scoreConfig() {
		return [
			null,
			{
				id: 'score',
				title: 'Score',
			},
		];
	}

	frameValidator(frame) {
		if (frame.busted === undefined) throw new Error('No busted property');
		if (frame.score === undefined) throw new Error('No score property');
		if (frame.lastRoll === undefined) throw new Error('No last roll property');
		if (frame.success === undefined) throw new Error('No success property');
		return [];
	}
	
	get optionsConfig() {
		return {
			'die': {
				example: 6,
				optional: true,
				default: true,
				shortName: 'd',
				description: 'The maximum number on the die face',
			},
			'targetScore': {
				example: 20,
				optional: true,
				default: true,
				shortName: 'tS',
				description: 'The score we try to hit to win'
			},
			'bust': {
				example: 1,
				optional: true,
				default: true,
				shortName: 'b',
				description: 'The die number that, if it comes up, will bust'
			}
		};
	}

	renderer() {
		return new DiceRollDemoRenderer();
	}
}

export default DiceRollDemoSimulator;

import { BaseRenderer } from '../renderer.js';
import { html, css } from "lit-element";

class DiceRollDemoRenderer extends BaseRenderer {

	static get styles() {
		return [
			BaseRenderer.styles,
			css`
			.busted {
				color: var(--secondary-color);
			}

			.success {
				color: var(--primary-color);
			}
			`
		];
	}

	innerRender() {
		return html`
			${this._safeFrame.busted ? html`<span class='busted'>Busted!</span>` : (this._safeFrame.success ? html`<span class='success'>Success!</span>` : html`<em>Playing...</em>`)}
			<div><span>Score: <strong>${this._safeFrame.score}</strong> / ${this._safeFrame.simOptions.targetScore}</span></div>
			<div><span>Roll: <strong>${this._safeFrame.lastRoll}</strong> / ${this._safeFrame.simOptions.die} </span></div>
		`;
	}

	get _safeFrame() {
		return this.frame || {busted:false, success: false, score: 0, lastRoll: 0};
	}
}

window.customElements.define(SIMULATOR_NAME + "-renderer", DiceRollDemoRenderer);