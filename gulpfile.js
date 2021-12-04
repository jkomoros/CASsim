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
const LISTINGS_JSON_PATH = 'src/listings.json';
//Also in actions/data.js
const DATA_DIRECTORY = 'data';

gulp.task('generate-listings-json', (done) => {
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

gulp.task('generate-polymer-json', (done) => {
	const polymerTemplate = JSON.parse(fs.readFileSync('polymer.TEMPLATE.json'));
	const files = fs.readdirSync(SIMULATORS_DIR);
	polymerTemplate.fragments = files.map(file => SIMULATORS_DIR + file);
	const blob = JSON.stringify(polymerTemplate, '', '\t');
	fs.writeFileSync('polymer.json', blob);
	done();
});

gulp.task('polymer-build', makeExecutor('polymer build'));

gulp.task('firebase-deploy', makeExecutor('firebase deploy'));

gulp.task('generate-json', gulp.series(
	'generate-polymer-json',
	'generate-listings-json'
));

gulp.task('build', gulp.series(
	'generate-json',
	'polymer-build'
));

gulp.task('deploy', gulp.series(
	'build',
	'firebase-deploy'
));
