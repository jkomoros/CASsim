/*eslint-env node*/

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./modules.d.ts" />

import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import GIFEncoder from "gifencoder";
import { glob } from "glob";
import { PNG } from "pngjs";
import { promisify } from 'util';
import {imageSize } from 'image-size';
const sizeOf = promisify(imageSize);

const SCREENSHOT_DIR = 'screenshots';

//rendevous point with screenshot service.
import {
	CURRENT_SIMULATION_INDEX_VARIABLE,
	CURRENT_RUN_INDEX_VARIABLE,
	CURRENT_FRAME_INDEX_VARIABLE,
	CURRENT_SIMULATION_NAME_VARIABLE,
	SETUP_METHOD_VARIABLE,
	PREVIOUS_FRAME_METHOD_VARIABLE,
	RENDER_COMPLETE_VARIABLE
} from '../src/constants.js';

import {
	DEFAULT_FRAME_DELAY,
	DEFAULT_EXTRA_FINAL_FRAME_COUNT,
	DEFAULT_REPEAT
} from '../src/constants.js';
import { PackedRawSimulationConfig, PackedRawSimulationConfigItem } from "../src/types.js";

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

const padInt = (val : number, length : number) : string => {
	let result = val.toString();
	while (result.length < length) {
		result = '0' + result;
	}
	return result;
};

const sanitizeSimulationName = (name : string) : string => {
	//Simulation name are [a-zA-z0-0-_], but '_' is the delimiter for us
	return name.split('_').join('-');
};

const generateScreenshots = async () => {

	const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();
	await page.setViewport({
		//The width and height are required but don't matter that much because we use ele.screenshot
		width: 1000,
		height: 1000,
	});
	await page.goto('http://localhost:8081', {waitUntil: 'networkidle2'});

	//Turn this back on when we can do a live merge of png data with the color in the stream. See #4.
	//await page.evaluate('document.querySelector("body").style.setProperty("--override-app-background-color", "transparent")');

	//Get us to the very last sim, run, frame
	await page.evaluate('window.' + SETUP_METHOD_VARIABLE + '()');

	let currentSimulationIndex = await page.evaluate('window.' + CURRENT_SIMULATION_INDEX_VARIABLE);
	let currentRunIndex = await page.evaluate('window.' + CURRENT_RUN_INDEX_VARIABLE);
	let currentFrameIndex = await page.evaluate('window.' + CURRENT_FRAME_INDEX_VARIABLE);
	let currentSimulationName = await page.evaluate('window.' + CURRENT_SIMULATION_NAME_VARIABLE);
	//We need to know how many digits frame and run might be, so we can pad with that many 0's to verify the right ordering for gif creation.
	//We start out with those numbers as high as they will get.
	const runLength = currentRunIndex.toString().length;
	const frameLength = currentFrameIndex.toString().length;
	do {
		console.log('Working on state #' + currentSimulationName + ' : ' + currentRunIndex + ' : ' + currentFrameIndex);
		const ele : puppeteer.ElementHandle<Element> = await page.evaluateHandle('document.querySelector("my-app").shadowRoot.querySelector("sim-view").shadowRoot.querySelector("frame-visualization")');
		
		const safeSimulationName = sanitizeSimulationName(currentSimulationName);

		//When this logic is updated, also change gifNameForFile
		let path = SCREENSHOT_DIR + '/screenshot_' + safeSimulationName + '_' + padInt(currentRunIndex,runLength) + '_' + padInt(currentFrameIndex, frameLength);
		path += '.png';
		await ele.screenshot({path, omitBackground:true});

		if(currentSimulationIndex == 0 && currentRunIndex == 0 && currentFrameIndex == 0) break;

		await page.evaluate('window.' + PREVIOUS_FRAME_METHOD_VARIABLE + '()');
		//Wait for the flag to be raised high after rendering has happened
		await page.waitForFunction('window.' + RENDER_COMPLETE_VARIABLE);
		currentSimulationIndex = await page.evaluate('window.' + CURRENT_SIMULATION_INDEX_VARIABLE);
		currentRunIndex = await page.evaluate('window.' + CURRENT_RUN_INDEX_VARIABLE);
		currentFrameIndex = await page.evaluate('window.' + CURRENT_FRAME_INDEX_VARIABLE);
		currentSimulationName = await page.evaluate('window.' + CURRENT_SIMULATION_NAME_VARIABLE);
	} while(currentSimulationIndex >= 0 && currentRunIndex >= 0 && currentFrameIndex >= 0);

	await browser.close();
};

const gifNameForFile = (fileName : string) : string => {
	//Needs to be updated every time the logic for filename saving is changed.
	const filenameParts = fileName.split('.');
	if (filenameParts[1].toLowerCase() == 'gif') return '';
	const name = filenameParts[0];
	const pieces = name.split('_');
	return pieces[1];
};

type GifInfo = {
	delay?: number;
	extraFinalFrameCount?: number;
	repeat?: boolean;
	width?: number;
	height?: number;
}

const DEFAULT_GIF_CONFIG : GifInfo = {
	//in ms
	delay: DEFAULT_FRAME_DELAY,
	extraFinalFrameCount: DEFAULT_EXTRA_FINAL_FRAME_COUNT,
	repeat: DEFAULT_REPEAT,
};

//TODO: allow specifying a different file
const CONFIG_DATA_FILE = 'data/default.json';

const configForGif = (configData : PackedRawSimulationConfigItem[], gifName : string) => {
	for (const config of configData) {
		const safeName = sanitizeSimulationName(config.name || '');
		if (safeName != gifName) continue;
		const gifInfo : GifInfo = {};
		const delay = config.frameDelay;
		if (delay != undefined) gifInfo.delay = delay;
		const extraFinalFrameCount = config.extraFinalFrameCount;
		if (extraFinalFrameCount != undefined) gifInfo.extraFinalFrameCount = extraFinalFrameCount;
		const repeat = config.repeat;
		if (repeat != undefined) gifInfo.repeat = repeat;
		return {...DEFAULT_GIF_CONFIG, ...gifInfo};
	}
	return {...DEFAULT_GIF_CONFIG};
};

//Returns an object with gifNames and the information on each, including: 
// - width
// - height
// - delay
// - repeat
// - extraFinalFrameCount
const gifInfos = async () => {
	const result : {[name : string] : GifInfo} = {};
	const illegalGifs : {[name : string] : true} = {};
	const files = fs.readdirSync(SCREENSHOT_DIR);
	for (const file of files) {
		const gifName = gifNameForFile(file);
		if (!gifName) continue;
		if (illegalGifs[gifName]) continue;
		const dim = await sizeOf(path.join(SCREENSHOT_DIR,file));
		if (!dim) throw new Error('no dimensions');
		const previousDim = result[gifName];
		if (previousDim && (previousDim.height != dim.height || previousDim.width != dim.width)) {
			console.warn(gifName + ' had previous dimensions of [' + previousDim.height + ',' + previousDim.width + '] but dim of [' + dim.height + ',' + dim.width + '] for file ' + file);
			illegalGifs[gifName] = true;
			continue;
		}
		result[gifName] = {height: dim.height || 0, width: dim.width || 0};
	}
	for (const name of Object.keys(illegalGifs)) {
		delete result[name];
	}
	const rawConfigData = fs.readFileSync(CONFIG_DATA_FILE).toString();
	const configData : PackedRawSimulationConfig = JSON.parse(rawConfigData);
	const configs = configData.configs;
	for (const name of Object.keys(result)) {
		result[name] = {...result[name], ...configForGif(configs, name)};
	}
	return result;
};

const frameIsFinalInRound = (firstFileName : string, secondFileName : string) : boolean => {
	if (!secondFileName) return true;
	const firstFile = path.basename(firstFileName, '.png');
	const secondFile = path.basename(secondFileName, '.png');
	const firstFileParts = firstFile.split('_');
	const secondFileParts = secondFile.split('_');
	const firstFileRound = parseInt(firstFileParts[firstFileParts.length - 2]);
	const secondFileRound = parseInt(secondFileParts[secondFileParts.length - 2]);
	if (secondFileRound != firstFileRound) return true;
	return false;
};

const generateGifs = async (infos : {[name : string] : GifInfo}) => {
	for (const [gifName, info] of Object.entries(infos)) {
		console.log("Generating gif " + gifName + " (this could take awhile)");

		//This order has been confirmed to be the correct order in testing, as
		//long as numbers are padded with prefixed 0's (lexicographic ordering)
		const matches : string[] = await glob(path.join(SCREENSHOT_DIR, 'screenshot_' + gifName + '_*_*.png'));

		const normalDelay = info.delay || 0;
		const finalFrameDelay = normalDelay * (info.extraFinalFrameCount || 0);

		const width = info.width || 0;
		const height = info.height || 0;

		const encoder = new GIFEncoder(width, height);
		const stream = encoder.createReadStream().pipe(fs.createWriteStream(path.join(SCREENSHOT_DIR, gifName + '.gif')));
		encoder.start();
		//0 is repeat, -1 is no-repeat
		encoder.setRepeat(info.repeat ? 0 : -1);

		for (const [index, match] of matches.entries()) {
			console.log('Loading png ' + match);
			const nextMatch = index + 1 < matches.length ? matches[index + 1] : '';
			encoder.setDelay(frameIsFinalInRound(match, nextMatch) ? finalFrameDelay : normalDelay);
			const png = PNG.sync.read(fs.readFileSync(match));
			encoder.addFrame(png.data);
			if (index == matches.length - 1) {
				//Also set an extra delay after the last frame to pause before the first item
				encoder.setDelay(frameIsFinalInRound(match, nextMatch) ? finalFrameDelay : normalDelay);
			}
		}
		encoder.finish();

		await new Promise((resolve, reject) => {
			stream.on('finish', resolve);
			stream.on('error', reject);
		});
	}
};

const COMMAND_PNG = 'png';
const COMMAND_GIF = 'gif';
const COMMAND_ALL = 'all';

const DEFAULT_ARGS = {
	[COMMAND_PNG]: true,
	[COMMAND_GIF]: true
};

(async() => {

	let args = Object.fromEntries(process.argv.slice(2).map(item => [item, true]));

	if (Object.keys(args).length == 0 || args[COMMAND_ALL]) {
		args = DEFAULT_ARGS;
	}

	if (args[COMMAND_PNG]) {
		clearScreenshotsDir();
		await generateScreenshots();
	}

	if (args[COMMAND_GIF]) {
		const infos = await gifInfos();
		await generateGifs(infos);
	}
})();