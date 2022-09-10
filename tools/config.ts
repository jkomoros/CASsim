import * as fs from "fs";
import * as path from "path";

const SIMULATORS_DIR = 'src/simulators/';
const DYNAMIC_TYPES_FILE = 'src/types-dynamic.GENERATED.ts';
const DATA_DIRECTORY = 'data';

const generateConfig = () => {
	const simulatorNames = [];
	const datafiles = [];
	for (const simulator of fs.readdirSync(SIMULATORS_DIR)) {
		if (!simulator.endsWith('.ts')) continue;
		if (simulator.endsWith('.d.ts')) continue;
		const filename = path.basename(simulator, '.ts');
		simulatorNames.push(filename);
	}
	for (const file of fs.readdirSync(DATA_DIRECTORY)) {
		const filename = path.basename(file, '.json');
		datafiles.push(filename);
	}
	const data =`export const KNOWN_DATA_FILES = ${JSON.stringify(datafiles, null, '\t').split('"').join("'")};

export type SimulatorType = '' | ${simulatorNames.map(item => '\'' + item + '\'').join(' | ')};

export const KNOWN_SIMULATOR_TYPES : SimulatorType[] = ${JSON.stringify(simulatorNames, null, '\t').split('"').join("'")};`;

	fs.writeFileSync(DYNAMIC_TYPES_FILE, data);
};

(async() => {
	generateConfig();
})();

