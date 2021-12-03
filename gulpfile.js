/*eslint-env node*/

const gulp = require('gulp');
const fs = require('fs');
const spawnSync = require('child_process').spawnSync;

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

gulp.task('generate-polymer-json', (done) => {
	const polymerTemplate = JSON.parse(fs.readFileSync('polymer.TEMPLATE.json'));
	const files = fs.readdirSync(SIMULATORS_DIR);
	polymerTemplate.fragments = files.map(file => SIMULATORS_DIR + file);
	const blob = JSON.stringify(polymerTemplate, '', '\t');
	fs.writeFileSync('polymer.json', blob);
	done();
});

gulp.task('polymer-build', makeExecutor('polymer build'));

gulp.task('build', gulp.series(
	'generate-polymer-json',
	'polymer-build'
));
