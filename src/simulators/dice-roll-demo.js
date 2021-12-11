import {
	BaseSimulator
} from '../simulator.js';

/*
Sim options shape:

{
	//The largest number the die can be
	die: 6,
	//The score we try to get to see if we win
	targetScore: 20,
	//The number that if the die comes up the round goes bust
	bust: 1,
}

*/

class DiceRollDemoSimulator extends BaseSimulator {

	//Remember that the name must be the same as the filename of this file
	get name() {
		return 'dice-roll-demo';
	}

	_firstFrameGenerator(simOptions) {
		return {
			...simOptions,
			index: 0,
			busted: false,
			score: 0,
			lastRoll: 0,
			success: false,
		};
	}

	_frameSimulationComplete(frame) {
		return frame.success || frame.busted;
	}

	_diceRoll(frame, rnd) {
		//We want numbers 1 .. frame.die (inclusive)
		const newRoll = Math.floor(rnd() * frame.die) + 1;
		frame.lastRoll = newRoll;
		if (newRoll == frame.bust) {
			frame.score = 0;
			frame.busted = true;
			return;
		}
		frame.score += newRoll;
		if (frame.score >= frame.targetScore) {
			frame.success = true;
		}
	}

	generator(frameIndex, previousFrame, simOptions, rnd) {
		if (!previousFrame) return this._firstFrameGenerator(simOptions);
		if (this._frameSimulationComplete(previousFrame)) return null;
		//Note: because this is only a shallow copy, if we were to change any
		//nested values in sub-generators we'd need to also copy them. previousFrame
		//is frozen, which will make it easier to detect when we are erroneously
		//trying to modify it.
		const frame = {...previousFrame, index: frameIndex};
		this._diceRoll(frame, rnd);
		return frame;
	}

	frameScorer(frame) {
		const finalScore = this._frameSimulationComplete(frame) ? (frame.success ? 1.0 : 0.0) : -1;
		return [finalScore, frame.score];
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
				description: 'The maximum number on the die face',
			},
			'targetScore': {
				example: 20,
				description: 'The score we try to hit to win'
			},
			'bust': {
				example: 1,
				description: 'The die number that, if it comes up, will bust'
			}
		};
	}

	renderer() {
		return new DiceRollDemoRenderer();
	}
}

export default DiceRollDemoSimulator;

import { LitElement, html, css} from "lit-element";


class DiceRollDemoRenderer extends LitElement {
	static get properties() {
		return {
			frame: { type: Object },
			width: {type:Number},
			height: {type:Number},
		};
	} 

	static get styles() {
		return [
			css`

			:host {
				width: 100%;
				height: 100%;
				position: relative;
			}

			.container {
				height: 100%;
				width: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				flex-direction: column;
			}

			.busted {
				color: var(--secondary-color);
			}

			.success {
				color: var(--primary-color);
			}
			`
		];
	}

	render() {
		return html`
			<div class='container'>
				${this._safeFrame.busted ? html`<span class='busted'>Busted!</span>` : (this._safeFrame.success ? html`<span class='success'>Success!</span>` : html`<em>Playing...</em>`)}
				<div><span>Score: <strong>${this._safeFrame.score}</strong> / ${this._safeFrame.targetScore}</span></div>
				<div><span>Roll: <strong>${this._safeFrame.lastRoll}</strong> / ${this._safeFrame.die} </span></div>
			</div>
		`;
	}

	get _safeFrame() {
		return this.frame || {busted:false, success: false, score: 0, lastRoll: 0};
	}
}

window.customElements.define("dice-roll-demo-renderer", DiceRollDemoRenderer);