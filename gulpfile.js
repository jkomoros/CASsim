/*eslint-env node*/

const gulp = require('gulp');
const fs = require('fs');

const SIMULATORS_DIR = 'src/simulators/';

gulp.task('generate-polymer-json', (done) => {
	const polymerTemplate = JSON.parse(fs.readFileSync('polymer.TEMPLATE.json'));
	const files = fs.readdirSync(SIMULATORS_DIR);
	polymerTemplate.fragments = files.map(file => SIMULATORS_DIR + file);
	const blob = JSON.stringify(polymerTemplate, '', '\t');
	fs.writeFileSync('polymer.json', blob);
	done();
});
