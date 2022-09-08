/*eslint-env node*/

const gulp = require('gulp');
const fs = require('fs');
const spawnSync = require('child_process').spawnSync;
const path = require('path');

const makeExecutor = cmdAndArgs => {
	return (cb) => {
		const splitCmd = cmdAndArgs.split(' ');
		const cmd = splitCmd[0];
		const args = splitCmd.slice(1);
		const result = spawnSync(cmd, args, {
			stdio: 'inherit'
		});
		cb(result.error);
	};
};

const SIMULATORS_DIR = 'src/simulators/';
const DYNAMIC_TYPES_FILE = 'src/types-dynamic.ts';
const DATA_DIRECTORY = 'data';

gulp.task('generate-types', (done) => {
	const simulatorNames = [];
	const datafiles = [];
	for (const simulator of fs.readdirSync(SIMULATORS_DIR)) {
		if (!simulator.endsWith('.ts')) continue;
		if (simulator.endsWith('.d.ts')) continue;
		const filename = path.basename(simulator, '.ts');
		simulatorNames.push(filename);
	}
	for (const file of fs.readdirSync(DATA_DIRECTORY)) {
		const filename = path.basename(file, '.json');
		datafiles.push(filename);
	}
	const data =`export const KNOWN_DATA_FILES = ${JSON.stringify(datafiles, null, '\t').split('"').join("'")};

export type SimulatorType = '' | ${simulatorNames.map(item => '\'' + item + '\'').join(' | ')};

export const KNOWN_SIMULATOR_TYPES : SimulatorType[] = ${JSON.stringify(simulatorNames, null, '\t').split('"').join("'")};`;

	fs.writeFileSync(DYNAMIC_TYPES_FILE, data);
	done();

});

const screenshotScript = 'tools/screenshot.ts';

gulp.task('generate', makeExecutor('npx ts-node ' + screenshotScript));
gulp.task('generate:screenshot', makeExecutor('npx ts-node ' + screenshotScript + ' screenshot'));
gulp.task('generate:gif', makeExecutor('npx ts-node ' + screenshotScript + ' gif'));