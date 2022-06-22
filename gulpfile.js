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
//Also in actions/data.js
const LISTINGS_JSON_PATH = 'src/listings.json';
const DATA_DIRECTORY = 'data';

gulp.task('generate-json', (done) => {
	const simulatorNames = [];
	const datafiles = [];
	for (const simulator of fs.readdirSync(SIMULATORS_DIR)) {
		const filename = path.basename(simulator, '.js');
		simulatorNames.push(filename);
	}
	for (const file of fs.readdirSync(DATA_DIRECTORY)) {
		const filename = path.basename(file, '.json');
		datafiles.push(filename);
	}
	const result = {
		simulatorNames,
		datafiles
	};

	const blob = JSON.stringify(result, '', '\t');
	fs.writeFileSync(LISTINGS_JSON_PATH, blob);
	done();

});


gulp.task('generate', makeExecutor('node screenshot.js'));
gulp.task('generate:screenshot', makeExecutor('node screenshot.js screenshot'));
gulp.task('generate:gif', makeExecutor('node screenshot.js gif'));