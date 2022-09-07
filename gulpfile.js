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
const DYNAMIC_TYPES_FILE = 'src/dynamic-types.ts';
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
	const data =`export const KNOWN_DATA_FILES = ${JSON.stringify(datafiles, null, '\t')};

export type SimulatorType = '' | ${simulatorNames.map(item => '\'' + item + '\'').join(' | ')};

export const KNOWN_SIMULATOR_NAMES : SimulatorType[] = ${JSON.stringify(simulatorNames, null, '\t')};`;

	fs.writeFileSync(DYNAMIC_TYPES_FILE, data);
	done();

});


gulp.task('generate', makeExecutor('node screenshot.js'));
gulp.task('generate:screenshot', makeExecutor('node screenshot.js screenshot'));
gulp.task('generate:gif', makeExecutor('node screenshot.js gif'));