/*eslint-env node*/

const puppeteer = require("puppeteer");
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));

const SCREENSHOT_DIR = 'screenshots';

//rendevous point with screenshot service. Duplicated in main-view.js
const CURRENT_INDEX_VARIABLE = 'current_index';
const PREVIOUS_MAP_VARIABLE = 'previous_map';
const RENDER_COMPLETE_VARIABLE = 'render_complete';
const GIF_NAME_VARIABLE = 'gif_name';

const clearScreenshotsDir = () => {
	if (fs.existsSync(SCREENSHOT_DIR)) {
		const files = fs.readdirSync(SCREENSHOT_DIR);
		for (const file of files) {
			fs.unlinkSync(path.join(SCREENSHOT_DIR, file));
		}
	} else {
		fs.mkdirSync(SCREENSHOT_DIR);
	}
};

const generateScreenshots = async () => {

	const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();
	await page.setViewport({
		//The width and height are required but don't matter that much because we use ele.screenshot
		width: 1000,
		height: 1000,
		deviceScaleFactor: 2.0,
	});
	await page.goto('http://localhost:8081', {waitUntil: 'networkidle2'});
	await page.evaluate('document.querySelector("body").style.setProperty("--app-background-color", "transparent")');
	let currentIndex = await page.evaluate('window.' + CURRENT_INDEX_VARIABLE);
	let gifName = await page.evaluate('window.' + GIF_NAME_VARIABLE);
	do {
		console.log('Working on state #' + currentIndex);
		const ele = await page.evaluateHandle('document.querySelector("my-app").shadowRoot.querySelector("main-view").shadowRoot.querySelector("map-visualization")');
		//When this logic is updated, also change gifNameForFile
		let path = SCREENSHOT_DIR + '/screenshot_' + currentIndex;
		if (gifName !== undefined) {
			path += '_gif_' + (gifName || 'default');
		}
		path += '.png';
		await ele.screenshot({path, omitBackground:true});

		if (currentIndex == 0) break;

		await page.evaluate('window.' + PREVIOUS_MAP_VARIABLE + '()');
		//Wait for the flag to be raised high after rendering has happened
		await page.waitForFunction('window.' + RENDER_COMPLETE_VARIABLE);
		currentIndex = await page.evaluate('window.' + CURRENT_INDEX_VARIABLE);
		gifName = await page.evaluate('window.' + GIF_NAME_VARIABLE);
	} while(currentIndex >= 0);

	await browser.close();
};

const gifNameForFile = (fileName) => {
	//Needs to be updated every time the logic for filename saving is changed.
	if (!fileName.includes('gif')) return '';
	const name = fileName.split('.')[0];
	const pieces = name.split('_');
	return pieces[3];
};

//Returns an object with gifNames, and the dimensions of the pngs for each gif collection.
const gifDimensions = async () => {
	const result = {};
	const illegalGifs = {};
	const files = fs.readdirSync(SCREENSHOT_DIR);
	for (const file of files) {
		const gifName = gifNameForFile(file);
		if (!gifName) continue;
		if (illegalGifs[gifName]) continue;
		const dim = await sizeOf(path.join(SCREENSHOT_DIR,file));
		const previousDim = result[gifName];
		if (previousDim && (previousDim.height != dim.height || previousDim.width != dim.width)) {
			console.warn(gifName + ' had previous dimensions of [' + previousDim.height + ',' + previousDim.width + '] but dim of [' + dim.height + ',' + dim.width + '] for file ' + file);
			illegalGifs[gifName] = true;
			continue;
		}
		result[gifName] = dim;
	}
	for (const name of Object.keys(illegalGifs)) {
		delete result[name];
	}
	return result;
};

(async() => {
	clearScreenshotsDir();
	await generateScreenshots();

	const dim = await gifDimensions();
	console.log(dim);
})();