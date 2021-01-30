/*eslint-env node*/

const puppeteer = require("puppeteer");

(async() => {
	const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();
	await page.goto('http://localhost:8081');
	await page.screenshot({path: 'screenshot.png'});
	await browser.close();
})();