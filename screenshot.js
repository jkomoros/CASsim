/*eslint-env node*/

const puppeteer = require("puppeteer");
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'screenshots';

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
	await page.goto('http://localhost:8081', {waitUntil: 'networkidle2'});
	await page.evaluate('document.querySelector("body").style.setProperty("--app-background-color", "transparent")');
	const ele =await page.evaluateHandle('document.querySelector("my-app").shadowRoot.querySelector("main-view").shadowRoot.querySelector("map-visualization")');
	await ele.screenshot({path: SCREENSHOT_DIR + '/screenshot.png', omitBackground:true});
	await browser.close();
})();