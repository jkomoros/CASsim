/*eslint-env node*/

const puppeteer = require("puppeteer");
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'screenshots';

//rendevous point with screenshot service. Duplicated in main-view.js
const CURRENT_INDEX_VARIABLE = 'current_index';
const PREVIOUS_MAP_VARIABLE = 'previous_map';
const RENDER_COMPLETE_VARIABLE = 'render_complete';

(async() => {

	const files = fs.readdirSync(SCREENSHOT_DIR);
	for (const file of files) {
		fs.unlinkSync(path.join(SCREENSHOT_DIR, file));
	}
	
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR);
	}

	const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();
	await page.setViewport({
		//The width and height are required but don't matter that much because we use ele.screenshot
		width: 1000,
		height: 1000,
		deviceScaleFactor: 5.0,
	});
	await page.goto('http://localhost:8081', {waitUntil: 'networkidle2'});
	await page.evaluate('document.querySelector("body").style.setProperty("--app-background-color", "transparent")');
	let currentIndex = await page.evaluate('window.' + CURRENT_INDEX_VARIABLE);
	do {
		console.log('Working on state #' + currentIndex);
		const ele = await page.evaluateHandle('document.querySelector("my-app").shadowRoot.querySelector("main-view").shadowRoot.querySelector("map-visualization")');
		await ele.screenshot({path: SCREENSHOT_DIR + '/screenshot_' + currentIndex + '.png', omitBackground:true});

		if (currentIndex == 0) break;

		await page.evaluate('window.' + PREVIOUS_MAP_VARIABLE + '()');
		//Wait for the flag to be raised high after rendering has happened
		await page.waitForFunction('window.' + RENDER_COMPLETE_VARIABLE);
		currentIndex = await page.evaluate('window.' + CURRENT_INDEX_VARIABLE);
	} while(currentIndex >= 0);

	await browser.close();
})();