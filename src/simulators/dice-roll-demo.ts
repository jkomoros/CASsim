import {
	BaseSimulator
} from '../simulator.js';

import {
	OptionsConfigMap,
	RandomGenerator,
	ScoreConfigItem,
	SimulationFrame
} from '../types.js';

import {
	SimulatorType
} from '../dynamic-types.js';

//Remember that the name must be the same as the filename of this file
const SIMULATOR_NAME = 'dice-roll-demo';

type DiceRollSimulationFrameExtra = {
	busted: boolean;
	score: number;
	lastRoll: number;
	success: boolean;
}

type DiceRollSimulationOptions = {
	die : number;
	targetScore : number;
	bust : number;
}

interface DiceRollSimulationFrame extends SimulationFrame,  DiceRollSimulationFrameExtra {
	simOptions : DiceRollSimulationOptions;
}

class DiceRollDemoSimulator extends BaseSimulator {

	override get name() : SimulatorType {
		return SIMULATOR_NAME;
	}

	//We use the default generator, which will call generateFirstFrame,
	//simulationComplete, and generateFrame.

	override generateFirstFrame() : DiceRollSimulationFrameExtra {
		//The default generator will expand this with index and simOptions.
		return {
			busted: false,
			score: 0,
			lastRoll: 0,
			success: false,
		};
	}

	override simulationComplete(frame : DiceRollSimulationFrame) : boolean {
		return frame.success || frame.busted;
	}

	override generateFrame(frame : DiceRollSimulationFrame, rnd : RandomGenerator) : void {
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

	override frameScorer(frame : DiceRollSimulationFrame) : [number, number] {
		const finalScore = this.simulationComplete(frame) ? (frame.success ? 1.0 : 0.0) : -1;
		return [finalScore, frame.score];
	}

	override scoreConfig() : [ScoreConfigItem, ScoreConfigItem] {
		return [
			null,
			{
				id: 'score',
				description: 'The total accumulated score so far',
			},
		];
	}

	override frameValidator(frame : DiceRollSimulationFrame) : void {
		if (frame.busted === undefined) throw new Error('No busted property');
		if (frame.score === undefined) throw new Error('No score property');
		if (frame.lastRoll === undefined) throw new Error('No last roll property');
		if (frame.success === undefined) throw new Error('No success property');
		return;
	}
	
	override get optionsConfig() : OptionsConfigMap {
		return {
			'die': {
				example: 6,
				optional: true,
				default: true,
				backfill: true,
				description: 'The maximum number on the die face',
			},
			'targetScore': {
				example: 20,
				optional: true,
				default: true,
				backfill: true,
				description: 'The score we try to hit to win'
			},
			'bust': {
				example: 1,
				optional: true,
				default: true,
				backfill: true,
				description: 'The die number that, if it comes up, will bust'
			}
		};
	}

	override renderer() {
		return new DiceRollDemoRenderer();
	}
}

export default DiceRollDemoSimulator;

import { BaseRenderer } from '../renderer.js';
import { html, css } from 'lit';

class DiceRollDemoRenderer extends BaseRenderer {

	static override get styles() {
		return [
			...BaseRenderer.styles,
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

	override innerRender() {
		return html`
			${this._safeFrame?.busted ? html`<span class='busted'>Busted!</span>` : (this._safeFrame?.success ? html`<span class='success'>Success!</span>` : html`<em>Playing...</em>`)}
			<div><span>Score: <strong>${this._safeFrame?.score}</strong> / ${this._safeFrame?.simOptions?.targetScore}</span></div>
			<div><span>Roll: <strong>${this._safeFrame?.lastRoll}</strong> / ${this._safeFrame?.simOptions?.die} </span></div>
		`;
	}

	get _safeFrame() : DiceRollSimulationFrame {
		return this.frame as DiceRollSimulationFrame;
	}
}

window.customElements.define(SIMULATOR_NAME + "-renderer", DiceRollDemoRenderer);