/*eslint-env node*/

const puppeteer = require("puppeteer");
const fs = require('fs');

const SCREENSHOT_DIR = 'screenshots';

(async() => {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR);
	}

	const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();
	await page.goto('http://localhost:8081');
	await page.screenshot({path: SCREENSHOT_DIR + '/screenshot.png'});
	await browser.close();
})();